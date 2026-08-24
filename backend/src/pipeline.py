import os
import sys
import pandas as pd
from datetime import datetime

# Add current directory to path if needed
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from detector import predict_logs, load_model, run_detector_pipeline, save_model
from explainer import explain_log_entry, explain_anomalies_dataframe

def process_uploaded_csv(
    csv_file_path: str,
    model_path: str = None,
    output_report_path: str = None,
    explain_all_anomalies: bool = True
) -> pd.DataFrame:
    """
    End-to-End Pipeline:
    1. Loads the uploaded CSV log file with validation.
    2. Loads the saved Isolation Forest model bundle.
    3. Detects anomalies and computes anomaly scores & flag reasons.
    4. Passes flagged anomalies to the AI explainer for root cause & remediation playbook.
    5. Saves and returns the enriched diagnostic DataFrame.
    """
    if model_path is None:
        model_path = os.path.join(current_dir, "../models/isolation_forest.joblib")
        
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"Input log file not found at: '{csv_file_path}'")

    print("\n" + "="*70)
    print(f"🚀 INGESTING & ANALYZING LOG FILE: {os.path.basename(csv_file_path)}")
    print("="*70)
    
    # 1. Read & Validate CSV
    try:
        df = pd.read_csv(csv_file_path)
    except Exception as e:
        raise ValueError(f"Failed to parse CSV file: {e}")
        
    if df.empty:
        raise ValueError("Uploaded CSV file is empty.")

    required_columns = ["Timestamp", "IP_Address", "Request_Type", "Status_Code"]
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise ValueError(f"Missing mandatory columns in uploaded CSV: {missing}")

    # Fill optional columns if missing
    if "User_Agent" not in df.columns:
        df["User_Agent"] = "Unknown"
    if "Session_ID" not in df.columns:
        df["Session_ID"] = 1000
    if "Location" not in df.columns:
        df["Location"] = "Unknown"

    print(f"✔ Successfully loaded {len(df)} log records.")

    # 2. Check or train model
    if not os.path.exists(model_path):
        print(f"⚠️ Saved model not found at '{model_path}'. Training fresh model on baseline...")
        df_enh, model_enh, scaler_enh, feat_cols_enh = run_detector_pipeline(df, use_enhanced=True)
        save_model(model_enh, scaler_enh, feat_cols_enh, output_path=model_path)
        detected_df = df_enh
    else:
        print(f"✔ Loading pre-trained model bundle from: '{model_path}'")
        detected_df = predict_logs(df, model_path=model_path)

    anomaly_count = int(detected_df['predicted_anomaly'].sum())
    anomaly_pct = (anomaly_count / len(detected_df)) * 100
    print(f"✔ Anomaly Detection complete: {anomaly_count} flagged ({anomaly_pct:.1f}%).")

    # 3. AI Explanation & Root Cause Analysis
    if explain_all_anomalies and anomaly_count > 0:
        print(f"🤖 Generating AI Root Cause & Remediation analysis for flagged logs...")
        analyzed_df = explain_anomalies_dataframe(detected_df)
    else:
        analyzed_df = detected_df

    # 4. Save output report if requested
    if output_report_path:
        os.makedirs(os.path.dirname(output_report_path), exist_ok=True)
        analyzed_df.to_csv(output_report_path, index=False)
        print(f"✔ Diagnostic report saved to: '{output_report_path}'")

    print("="*70 + "\n")
    return analyzed_df

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run Log Anomaly Detection & AI Explanation Pipeline")
    parser.add_argument("--csv", type=str, default="dataset.csv", help="Path to input CSV file")
    parser.add_argument("--out", type=str, default="backend/models/analyzed_logs.csv", help="Path to output report CSV")
    args = parser.parse_args()

    # Resolve relative paths
    csv_in = args.csv
    if not os.path.exists(csv_in):
        candidates = [
            os.path.join(current_dir, "../dataset/dataset.csv"),
            os.path.join(current_dir, "../../backend/dataset/dataset.csv"),
            os.path.join(current_dir, "../../dataset.csv")
        ]
        csv_in = next((c for c in candidates if os.path.exists(c)), args.csv)

    try:
        report_df = process_uploaded_csv(csv_in, output_report_path=args.out)
        
        # Display sample flagged anomalies with AI explanations
        anomalies = report_df[report_df['predicted_anomaly'] == 1]
        if not anomalies.empty:
            print("\n" + "#"*70)
            print(" SAMPLE FLAGGED LOGS WITH AI DIAGNOSTICS:")
            print("#"*70)
            for idx, row in anomalies.head(3).iterrows():
                print(f"\n[Log #{idx+1}] {row['Timestamp']} | IP: {row['IP_Address']} | {row['Request_Type']} {row['Status_Code']}")
                print(f"  • Score:        {row['anomaly_score']:.2f} / 1.0")
                print(f"  • Flag Reason:  {row['flag_reason']}")
                if 'ai_summary' in row and row['ai_summary']:
                    print(f"  • AI Summary:   {row['ai_summary']}")
                    print(f"  • Root Cause:   {row['ai_root_cause']}")
                    print(f"  • Remediation:\n• {row['ai_remediation']}")
                print("-" * 70)
    except Exception as e:
        print(f"❌ Error during execution: {e}")
