import os
import glob
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, f1_score, precision_score, recall_score, average_precision_score

ENHANCED_FEATURE_COLS = [
    'ip_burst_velocity', 'ip_req_count_2m', 'ip_auth_fail_2m',
    'ip_rate_limit_2m', 'ip_server_error_2m', 'ip_error_rate_2m',
    'global_5xx_density_5m', 'ip_session_churn',
    'session_ip_switch', 'session_loc_switch', 'session_ua_switch',
    'status_severity', 'is_post_auth_fail', 'is_delete_off_peak', 'is_bot_ua'
]

BASELINE_FEATURE_COLS = [
    'ip_req_count_2m', 'ip_error_rate_2m', 'session_ip_switch', 
    'session_loc_switch', 'session_ua_switch', 'status_severity', 
    'is_post', 'is_delete', 'is_bot_ua', 'is_off_peak'
]

# =====================================================================
# 1. BASELINE FEATURE EXTRACTION
# =====================================================================
def compute_ip_rolling_stats(df: pd.DataFrame, window_sec: int = 120):
    """
    Robust sliding-window computation using searchsorted and prefix sums.
    Handles duplicate timestamps seamlessly across all pandas versions.
    """
    n = len(df)
    req_counts = np.zeros(n, dtype=float)
    auth_fails = np.zeros(n, dtype=float)
    rate_limits = np.zeros(n, dtype=float)
    server_errors = np.zeros(n, dtype=float)
    all_errors = np.zeros(n, dtype=float)

    ts_values = df['Timestamp'].values
    status_values = df['Status_Code'].values
    window_delta = np.timedelta64(window_sec, 's')

    is_auth = np.isin(status_values, [401, 403]).astype(int)
    is_rate = (status_values == 429).astype(int)
    is_srv = (status_values >= 500).astype(int)
    is_err = (status_values >= 400).astype(int)

    # Group row indices by IP
    for ip, indices in df.groupby('IP_Address').indices.items():
        sub_ts = ts_values[indices]
        m = len(sub_ts)
        
        left_idx = np.searchsorted(sub_ts, sub_ts - window_delta, side='left')
        right_idx = np.arange(1, m + 1)
        
        req_counts[indices] = right_idx - left_idx
        
        cs_auth = np.insert(np.cumsum(is_auth[indices]), 0, 0)
        auth_fails[indices] = cs_auth[right_idx] - cs_auth[left_idx]
        
        cs_rate = np.insert(np.cumsum(is_rate[indices]), 0, 0)
        rate_limits[indices] = cs_rate[right_idx] - cs_rate[left_idx]
        
        cs_srv = np.insert(np.cumsum(is_srv[indices]), 0, 0)
        server_errors[indices] = cs_srv[right_idx] - cs_srv[left_idx]
        
        cs_err = np.insert(np.cumsum(is_err[indices]), 0, 0)
        all_errors[indices] = cs_err[right_idx] - cs_err[left_idx]

    return req_counts, auth_fails, rate_limits, server_errors, all_errors

# =====================================================================
# 1. BASELINE FEATURE EXTRACTION
# =====================================================================
def extract_features_baseline(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df = df.sort_values('Timestamp').reset_index(drop=True)
    
    req_cnt, _, _, _, err_cnt = compute_ip_rolling_stats(df, window_sec=120)
    df['ip_req_count_2m'] = req_cnt
    df['ip_error_count_2m'] = err_cnt
    df['ip_error_rate_2m'] = df['ip_error_count_2m'] / (df['ip_req_count_2m'] + 1e-5)

    # Session Integrity
    session_ips = df.groupby('Session_ID')['IP_Address'].transform('nunique')
    session_locs = df.groupby('Session_ID')['Location'].transform('nunique')
    session_uas = df.groupby('Session_ID')['User_Agent'].transform('nunique')
    
    df['session_ip_switch'] = (session_ips > 1).astype(int)
    df['session_loc_switch'] = (session_locs > 1).astype(int)
    df['session_ua_switch'] = (session_uas > 1).astype(int)

    status_severity_map = {200: 0.0, 201: 0.0, 204: 0.0, 301: 0.1, 400: 0.3, 401: 0.7, 403: 0.8, 404: 0.2, 429: 0.9, 500: 1.0, 502: 1.0, 503: 1.0}
    df['status_severity'] = df['Status_Code'].map(lambda x: status_severity_map.get(x, 0.5))
    
    df['is_post'] = (df['Request_Type'] == 'POST').astype(int)
    df['is_delete'] = (df['Request_Type'] == 'DELETE').astype(int)
    
    bot_uas = ['Python-urllib', 'curl', 'Scrapy', 'HeadlessChrome', 'Bot']
    df['is_bot_ua'] = df['User_Agent'].isin(bot_uas).astype(int)
    
    df['hour'] = df['Timestamp'].dt.hour
    df['is_off_peak'] = df['hour'].apply(lambda h: 1 if (h < 6 or h > 22) else 0)

    return df

# =====================================================================
# 2. ENHANCED FEATURE EXTRACTION (High-Fidelity Behavioral Signals)
# =====================================================================
def extract_features_enhanced(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['Timestamp'] = pd.to_datetime(df['Timestamp'])
    df = df.sort_values('Timestamp').reset_index(drop=True)
    
    # 1. Inter-Arrival Time per IP
    df['prev_ip_time'] = df.groupby('IP_Address')['Timestamp'].shift(1)
    df['ip_inter_arrival_sec'] = (df['Timestamp'] - df['prev_ip_time']).dt.total_seconds().fillna(60.0)
    df['ip_burst_velocity'] = np.clip(1.0 / (df['ip_inter_arrival_sec'] + 0.1), 0, 10.0)

    # 2. Rolling behavioral statistics
    req_cnt, auth_fails, rate_limits, srv_errors, _ = compute_ip_rolling_stats(df, window_sec=120)
    df['ip_req_count_2m'] = req_cnt
    df['ip_auth_fail_2m'] = auth_fails
    df['ip_rate_limit_2m'] = rate_limits
    df['ip_server_error_2m'] = srv_errors
    df['ip_error_rate_2m'] = (df['ip_auth_fail_2m'] + df['ip_rate_limit_2m'] + df['ip_server_error_2m']) / (df['ip_req_count_2m'] + 1e-5)
    
    # Global 5xx density (300 seconds window)
    ts_values = df['Timestamp'].values
    g_srv = (df['Status_Code'].values >= 500).astype(int)
    g_left = np.searchsorted(ts_values, ts_values - np.timedelta64(300, 's'), side='left')
    g_right = np.arange(1, len(ts_values) + 1)
    g_cs = np.insert(np.cumsum(g_srv), 0, 0)
    df['global_5xx_density_5m'] = (g_cs[g_right] - g_cs[g_left]) / (g_right - g_left + 1e-5)

    # 3. Session Churn per IP
    df['ip_session_churn'] = df.groupby('IP_Address')['Session_ID'].transform('nunique')

    # 4. Session Hijacking / Impossible Travel Signals
    session_ips = df.groupby('Session_ID')['IP_Address'].transform('nunique')
    session_locs = df.groupby('Session_ID')['Location'].transform('nunique')
    session_uas = df.groupby('Session_ID')['User_Agent'].transform('nunique')
    
    df['session_ip_switch'] = (session_ips > 1).astype(int)
    df['session_loc_switch'] = (session_locs > 1).astype(int)
    df['session_ua_switch'] = (session_uas > 1).astype(int)

    # 5. Status Code Severity & Method Interactions
    status_severity_map = {
        200: 0.0, 201: 0.0, 204: 0.0, 301: 0.1, 
        400: 0.3, 401: 0.8, 403: 0.85, 404: 0.25, 
        429: 0.95, 500: 1.0, 502: 1.0, 503: 1.0
    }
    df['status_severity'] = df['Status_Code'].map(lambda x: status_severity_map.get(x, 0.5))
    
    df['is_post_auth_fail'] = ((df['Request_Type'] == 'POST') & (df['Status_Code'].isin([401, 403]))).astype(int)
    df['is_delete_off_peak'] = ((df['Request_Type'] == 'DELETE') & (df['Timestamp'].dt.hour.isin([0, 1, 2, 3, 4, 5, 23]))).astype(int)
    
    bot_uas = ['Python-urllib', 'curl', 'Scrapy', 'HeadlessChrome', 'Bot']
    df['is_bot_ua'] = df['User_Agent'].isin(bot_uas).astype(int)

    return df

# =====================================================================
# 3. MODEL TRAINING & SCORING PIPELINE
# =====================================================================
def evaluate_model(y_true, y_pred, y_score):
    return {
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall": recall_score(y_true, y_pred, zero_division=0),
        "f1_score": f1_score(y_true, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_true, y_score),
        "pr_auc": average_precision_score(y_true, y_score)
    }

def run_detector_pipeline(
    df: pd.DataFrame, 
    algorithm: str = "isolation_forest", 
    use_enhanced: bool = True, 
    contamination: float = 0.075
):
    """
    Fits selected unsupervised anomaly detection model on behavioral features.
    Supported algorithms: 'isolation_forest', 'one_class_svm', 'local_outlier_factor'
    """
    if use_enhanced:
        df_feat = extract_features_enhanced(df)
        feature_cols = ENHANCED_FEATURE_COLS
    else:
        df_feat = extract_features_baseline(df)
        feature_cols = BASELINE_FEATURE_COLS

    X = df_feat[feature_cols].fillna(0)
    scaler = RobustScaler()
    X_scaled = scaler.fit_transform(X)
    
    if algorithm == "one_class_svm":
        model = OneClassSVM(
            nu=contamination,
            kernel='rbf',
            gamma='scale'
        )
    elif algorithm == "local_outlier_factor":
        model = LocalOutlierFactor(
            n_neighbors=25,
            contamination=contamination,
            novelty=True
        )
    else:
        # Default: Isolation Forest (300 trees)
        model = IsolationForest(
            n_estimators=300,
            contamination=contamination,
            random_state=42,
            max_samples='auto',
            n_jobs=-1
        )
    
    preds = model.fit_predict(X_scaled)
    df_feat['predicted_anomaly'] = (preds == -1).astype(int)
    
    # Compute normalized anomaly scores (0.0 = Normal, 1.0 = Max Outlier)
    if hasattr(model, "score_samples"):
        raw_scores = model.score_samples(X_scaled)
        norm_scores = (raw_scores.max() - raw_scores) / (raw_scores.max() - raw_scores.min() + 1e-5)
    elif hasattr(model, "decision_function"):
        raw_scores = model.decision_function(X_scaled)
        norm_scores = (raw_scores.max() - raw_scores) / (raw_scores.max() - raw_scores.min() + 1e-5)
    else:
        norm_scores = df_feat['predicted_anomaly'].astype(float)

    df_feat['anomaly_score'] = np.round(norm_scores, 4)
    df_feat['flag_reason'] = df_feat.apply(derive_reasons, axis=1)
    
    return df_feat, model, scaler, feature_cols

def derive_reasons(row):
    reasons = []
    if row.get('session_loc_switch', 0) == 1:
        reasons.append("Impossible Travel / Session Hijacking (Multi-location session)")
    if row.get('ip_burst_velocity', 0) > 2.0 or row.get('ip_req_count_2m', 0) > 15:
        reasons.append(f"High-velocity request burst ({int(row.get('ip_req_count_2m', 0))} reqs/2m)")
    if row.get('ip_rate_limit_2m', 0) > 2 or row.get('Status_Code') == 429:
        reasons.append("Rate-limit violation (HTTP 429 Too Many Requests)")
    if row.get('is_post_auth_fail', 0) == 1 or row.get('ip_auth_fail_2m', 0) > 3:
        reasons.append("Repeated authentication failure (401/403 brute force)")
    if row.get('Status_Code') in [500, 502, 503] or row.get('global_5xx_density_5m', 0) > 0.3:
        reasons.append(f"System service outage / 5xx error cascade ({row.get('Status_Code')})")
    if row.get('is_delete_off_peak', 0) == 1:
        reasons.append("Off-peak mass DELETE operation")
    if row.get('is_bot_ua', 0) == 1:
        reasons.append(f"Automated tool signature ({row.get('User_Agent')})")

    return " | ".join(reasons) if reasons else "Statistical behavioral deviation"

# =====================================================================
# 4. SAVE & LOAD MODEL BUNDLE (Model + Scaler + Feature Schema)
# =====================================================================
def save_model(
    model, 
    scaler, 
    feature_cols, 
    output_path="backend/models/isolation_forest.joblib",
    model_name="Isolation Forest (300 Trees)",
    algorithm="isolation_forest"
):
    """
    Persists the trained model, fitted scaler, and feature list into a single joblib bundle.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bundle = {
        "model": model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "model_name": model_name,
        "algorithm": algorithm,
        "version": "1.0.0"
    }
    joblib.dump(bundle, output_path)
    print(f" Saved trained {model_name} model bundle to: '{output_path}'")

def list_available_models(models_dir=None):
    """
    Scans models/ directory for all saved .joblib models.
    """
    if not models_dir:
        candidates = [
            os.path.join(os.path.dirname(__file__), "../models"),
            "backend/models",
            "models"
        ]
        models_dir = next((p for p in candidates if os.path.exists(p)), "backend/models")

    pattern = os.path.join(models_dir, "*.joblib")
    files = glob.glob(pattern)
    
    models = []
    for f in files:
        filename = os.path.basename(f)
        try:
            bundle = joblib.load(f)
            name = bundle.get("model_name", filename.replace(".joblib", "").replace("_", " ").title())
            algo = bundle.get("algorithm", "unsupervised_ml")
        except Exception:
            name = filename.replace(".joblib", "").replace("_", " ").title()
            algo = "unsupervised_ml"

        models.append({
            "id": filename,
            "filename": filename,
            "name": name,
            "algorithm": algo,
            "file_path": f
        })

    # Default fallback entry if models folder is empty
    if not models:
        models.append({
            "id": "isolation_forest.joblib",
            "filename": "isolation_forest.joblib",
            "name": "Isolation Forest (300 Trees)",
            "algorithm": "isolation_forest",
            "file_path": os.path.join(models_dir, "isolation_forest.joblib")
        })

    return models

def load_model(model_path="backend/models/isolation_forest.joblib"):
    """
    Loads the saved model bundle, searching candidate paths or training on-the-fly if missing.
    """
    candidates = [
        model_path,
        os.path.join(os.path.dirname(__file__), f"../models/{os.path.basename(model_path)}"),
        os.path.join(os.path.dirname(__file__), "../models/isolation_forest.joblib"),
        os.path.join(os.path.dirname(__file__), "../../backend/models/isolation_forest.joblib"),
        "backend/models/isolation_forest.joblib",
        "models/isolation_forest.joblib"
    ]
    resolved_path = next((p for p in candidates if os.path.exists(p)), None)
    
    if not resolved_path:
        ds_candidates = [
            os.path.join(os.path.dirname(__file__), "../dataset/dataset.csv"),
            "backend/dataset/dataset.csv",
            "dataset.csv"
        ]
        ds_path = next((p for p in ds_candidates if os.path.exists(p)), None)
        if ds_path:
            print(f"[Detector] ℹ️ Model bundle not found. Auto-training on '{ds_path}'...")
            train_df = pd.read_csv(ds_path)
            _, model, scaler, feat_cols = run_detector_pipeline(train_df, use_enhanced=True)
            save_path = os.path.join(os.path.dirname(__file__), "../models/isolation_forest.joblib")
            save_model(model, scaler, feat_cols, output_path=save_path)
            return model, scaler, feat_cols
        else:
            raise FileNotFoundError(f"Neither model bundle nor training dataset could be found.")

    bundle = joblib.load(resolved_path)
    return bundle["model"], bundle["scaler"], bundle["feature_cols"]

def predict_logs(df: pd.DataFrame, model_path="backend/models/isolation_forest.joblib"):
    """
    Takes raw logs, extracts features, loads the saved model bundle, and returns predictions.
    """
    model, scaler, feature_cols = load_model(model_path)
    df_feat = extract_features_enhanced(df)
    
    X = df_feat[feature_cols].fillna(0)
    X_scaled = scaler.transform(X)
    
    preds = model.predict(X_scaled)
    df_feat['predicted_anomaly'] = (preds == -1).astype(int)
    
    if hasattr(model, "score_samples"):
        raw_scores = model.score_samples(X_scaled)
        norm_scores = (raw_scores.max() - raw_scores) / (raw_scores.max() - raw_scores.min() + 1e-5)
    elif hasattr(model, "decision_function"):
        raw_scores = model.decision_function(X_scaled)
        norm_scores = (raw_scores.max() - raw_scores) / (raw_scores.max() - raw_scores.min() + 1e-5)
    else:
        norm_scores = df_feat['predicted_anomaly'].astype(float)

    df_feat['anomaly_score'] = np.round(norm_scores, 4)
    df_feat['flag_reason'] = df_feat.apply(derive_reasons, axis=1)
    
    return df_feat

# =====================================================================
# 5. MAIN EXECUTION & BENCHMARK
# =====================================================================
if __name__ == "__main__":
    import sys
    
    # 1. Check command line argument if provided
    if len(sys.argv) > 1:
        dataset_path = sys.argv[1]
    else:
        # 2. Search common candidate locations
        candidate_paths = [
            os.path.join(os.path.dirname(__file__), "../dataset/dataset.csv"),
            r"C:\Users\student\Documents\Digiplus\backend\dataset\dataset.csv",
            "backend/dataset/dataset.csv",
            "dataset.csv"
        ]
        dataset_path = next((p for p in candidate_paths if os.path.exists(p)), candidate_paths[0])
    
    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
        print("\n" + "="*75)
        print("          ISOLATION FOREST PERFORMANCE BENCHMARK & EXPORT")
        print("="*75)
        
        # 1. Baseline Run
        df_base, _, _, _ = run_detector_pipeline(df, use_enhanced=False)
        m_base = evaluate_model(df['Anomaly'], df_base['predicted_anomaly'], df_base['anomaly_score'])
        
        # 2. Enhanced Run
        df_enh, model_enh, scaler_enh, feat_cols_enh = run_detector_pipeline(df, use_enhanced=True)
        m_enh = evaluate_model(df['Anomaly'], df_enh['predicted_anomaly'], df_enh['anomaly_score'])
        
        print(f"{'Metric':<24} | {'Baseline Model':<16} | {'Enhanced Model':<16} | {'Improvement':<12}")
        print("-" * 75)
        for metric, name in [
            ('f1_score', 'F1-Score'),
            ('roc_auc', 'ROC-AUC Score'),
            ('pr_auc', 'PR-AUC (Avg Precision)'),
            ('precision', 'Precision'),
            ('recall', 'Recall')
        ]:
            b_val = m_base[metric]
            e_val = m_enh[metric]
            diff = (e_val - b_val) * 100
            diff_str = f"+{diff:.2f}%" if diff >= 0 else f"{diff:.2f}%"
            print(f"{name:<24} | {b_val:<16.4f} | {e_val:<16.4f} | {diff_str:<12}")
        print("="*75 + "\n")
        
        # 1. Save Enhanced Isolation Forest bundle
        if_path = os.path.join(os.path.dirname(__file__), "../models/isolation_forest.joblib")
        save_model(model_enh, scaler_enh, feat_cols_enh, output_path=if_path, model_name="Isolation Forest (300 Trees)", algorithm="isolation_forest")
        
        # 2. Train & Save One-Class SVM model bundle
        _, model_svm, scaler_svm, feat_cols_svm = run_detector_pipeline(df, algorithm="one_class_svm", use_enhanced=True)
        svm_path = os.path.join(os.path.dirname(__file__), "../models/one_class_svm.joblib")
        save_model(model_svm, scaler_svm, feat_cols_svm, output_path=svm_path, model_name="One-Class SVM (Kernel RBF)", algorithm="one_class_svm")

        # 3. Train & Save Baseline Isolation Forest bundle
        _, model_base, scaler_base, feat_cols_base = run_detector_pipeline(df, use_enhanced=False)
        base_path = os.path.join(os.path.dirname(__file__), "../models/baseline_model.joblib")
        save_model(model_base, scaler_base, feat_cols_base, output_path=base_path, model_name="Baseline Detector (4 Features)", algorithm="isolation_forest")

        # Save enriched detected dataset for backend / frontend
        output_csv = os.path.join(os.path.dirname(__file__), "../models/detected_logs.csv")
        df_enh.to_csv(output_csv, index=False)
        print(f" Saved detected logs to: '{output_csv}'\n")
    else:
        print(f"Dataset not found at '{dataset_path}'. Please run 'python generate_dataset.py' first.")
