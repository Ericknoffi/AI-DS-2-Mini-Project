import os
import json
import re
from typing import Dict, Any, List, Optional
import pandas as pd
from dotenv import load_dotenv

# Robust .env loader supporting UTF-8, UTF-8-BOM, UTF-16, and standard formats
env_candidates = [
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../.env"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../backend/.env"),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../.env"),
    os.path.abspath(".env")
]

for p in env_candidates:
    if os.path.exists(p):
        load_dotenv(dotenv_path=p, override=True)
        # Also parse directly with multiple encodings in case of Windows Notepad BOM
        for enc in ['utf-8', 'utf-8-sig', 'utf-16', 'utf-16-le', 'latin-1']:
            try:
                with open(p, 'r', encoding=enc) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            k, v = line.split('=', 1)
                            os.environ[k.strip()] = v.strip().strip("'").strip('"')
                break
            except Exception:
                continue
        break

# =====================================================================
# 1. LLM PROMPT TEMPLATES & CLIENT INITIALIZATION
# =====================================================================
def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        for k, v in os.environ.items():
            if "GEMINI" in k.upper() and len(v.strip()) > 10:
                api_key = v
                break
    
    if not api_key or len(api_key.strip()) < 10:
        print(f"[AI Engine] ℹ️ GEMINI_API_KEY not configured. Using intelligent offline heuristic engine.")
        return None

    api_key = api_key.strip().strip("'").strip('"')
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        # Try candidate models in order of speed and capability
        candidates = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"]
        for m_name in candidates:
            try:
                model = genai.GenerativeModel(m_name)
                print(f"[AI Engine] ✔ Gemini Client configured with '{m_name}' (API Key: {api_key[:6]}...{api_key[-4:]})")
                return model
            except Exception:
                continue
                
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception as e:
        print(f"[AI Engine] ❌ Gemini initialization error: {e}")
        return None

def clean_json_response(raw_text: str) -> dict:
    """
    Extracts and parses JSON from LLM output, handling markdown fences.
    """
    try:
        # Match ```json ... ``` or extract outermost JSON object
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
        
        # Fallback to direct json.loads
        return json.loads(raw_text.strip())
    except Exception:
        # If regex/json fails, attempt bracket isolation
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(raw_text[start:end+1])
            except Exception:
                pass
        return None

# =====================================================================
# 2. LOCAL INTELLIGENT RULE-ASSISTED FALLBACK EXPLAINER
# =====================================================================
def generate_fallback_explanation(log: dict) -> dict:
    """
    High-fidelity heuristic explanation when LLM API key is not available or offline.
    """
    reason = str(log.get('flag_reason', ''))
    status = int(log.get('Status_Code', 200) or 200)
    method = str(log.get('Request_Type', 'GET'))
    ip = str(log.get('IP_Address', 'Unknown'))
    ua = str(log.get('User_Agent', 'Unknown'))
    session_id = str(log.get('Session_ID', 'N/A'))
    loc = str(log.get('Location', 'Unknown'))
    score = float(log.get('anomaly_score', 0.0) or 0.0)

    if "Impossible Travel" in reason or "session_loc_switch" in reason or "Multi-location" in reason:
        return {
            "summary": f"Session #{session_id} was active in multiple distinct geographic locations ({loc}) in an impossibly short timeframe.",
            "root_cause": "Session token hijacking, stolen bearer token, or active credential reuse across disparate networks.",
            "remediation_steps": [
                f"Immediately invalidate Session #{session_id} and revoke active auth tokens.",
                "Enforce IP/Device fingerprint binding on active sessions.",
                f"Audit all recent requests originated from IP {ip}."
            ],
            "severity_assessment": "CRITICAL",
            "provider": "Rule-Assisted Engine (Offline Fallback)"
        }
    elif "High-velocity" in reason or "Rate-limit" in reason or status == 429:
        return {
            "summary": f"IP {ip} triggered an abnormal burst of {method} requests, exceeding normal rate thresholds and triggering HTTP {status}.",
            "root_cause": "Automated data scraping, content crawling, or Layer-7 volumetric Denial of Service (DoS) probing.",
            "remediation_steps": [
                f"Apply temporary IP rate-limiting or firewall block on IP {ip}.",
                "Implement CAPTCHA/Challenge (e.g. Cloudflare Turnstile) on high-frequency endpoints.",
                "Review edge WAF policies for automated scraping signatures."
            ],
            "severity_assessment": "HIGH",
            "provider": "Rule-Assisted Engine (Offline Fallback)"
        }
    elif "Repeated authentication failure" in reason or (method == "POST" and status in [401, 403]):
        return {
            "summary": f"Repeated unauthorized authentication attempts (HTTP {status}) detected from IP {ip} using '{ua}'.",
            "root_cause": "Credential stuffing attack or automated brute-force password guessing against login endpoints.",
            "remediation_steps": [
                f"Temporarily lock accounts targeted by IP {ip}.",
                "Enforce multi-factor authentication (MFA) and exponential backoff on failed logins.",
                "Blacklist known malicious IP addresses at the API gateway."
            ],
            "severity_assessment": "CRITICAL",
            "provider": "Rule-Assisted Engine (Offline Fallback)"
        }
    elif status >= 500 or "outage" in reason.lower() or "5xx" in reason.lower():
        return {
            "summary": f"Server failure HTTP {status} recorded on {method} request from IP {ip}.",
            "root_cause": "Downstream microservice crash, database connection pool exhaustion, or unhandled 5xx exception.",
            "remediation_steps": [
                "Inspect microservice logs and backend database telemetry for connection spikes.",
                "Verify upstream load balancer health checks and failover instances.",
                "Deploy circuit breaker pattern to prevent cascading timeouts across dependent services."
            ],
            "severity_assessment": "HIGH",
            "provider": "Rule-Assisted Engine (Offline Fallback)"
        }
    elif "Off-peak mass DELETE" in reason or method == "DELETE":
        return {
            "summary": f"Abnormal volume of DELETE operations executed during off-peak hours by {ua} ({ip}).",
            "root_cause": "Unauthorized mass data deletion attempt, rogue administrative script, or compromised internal API token.",
            "remediation_steps": [
                "Audit user permissions and verify if DELETE action was authenticated/authorized.",
                "Inspect database change-data-capture (CDC) logs to assess deleted data records.",
                "Require step-up MFA or dual-approval for destructive batch operations."
            ],
            "severity_assessment": "CRITICAL",
            "provider": "Rule-Assisted Engine (Offline Fallback)"
        }
    else:
        return {
            "summary": f"Algorithmic model flagged statistical deviation (Score: {score:.2f}) from normal behavioral baseline.",
            "root_cause": f"Unusual combination of client agent '{ua}', status {status}, and traffic velocity.",
            "remediation_steps": [
                f"Monitor IP {ip} for recurring abnormal behavior.",
                "Review API endpoint validation schemas."
            ],
            "severity_assessment": "MEDIUM",
            "provider": "Rule-Assisted Engine (Offline Fallback)"
        }

# =====================================================================
# 3. CORE EXPLANATION FUNCTION
# =====================================================================
def explain_log_entry(log_record: dict, context_logs: Optional[List[dict]] = None) -> dict:
    """
    Generates AI-powered explanation and root-cause analysis for a single flagged log.
    Uses Gemini LLM if API key is present; otherwise seamlessly uses rule fallback.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        for k, v in os.environ.items():
            if "GEMINI" in k.upper() and len(v.strip()) > 10:
                api_key = v
                break

    if not api_key or len(api_key.strip()) < 10:
        return generate_fallback_explanation(log_record)

    prompt = f"""
You are an expert Cybersecurity Incident Responder and Site Reliability Engineer (SRE).
Our algorithmic anomaly detection model (Isolation Forest) flagged the following log entry as ANOMALOUS.

ANOMALOUS LOG DETAILS:
- Timestamp: {log_record.get('Timestamp')}
- IP Address: {log_record.get('IP_Address')}
- Request Type: {log_record.get('Request_Type')}
- Status Code: {log_record.get('Status_Code')}
- User Agent: {log_record.get('User_Agent')}
- Session ID: {log_record.get('Session_ID')}
- Location: {log_record.get('Location')}
- Isolation Forest Anomaly Score: {log_record.get('anomaly_score')} / 1.0 (Higher = more severe)
- Model Algorithmic Reason: {log_record.get('flag_reason')}

CONTEXT:
Explain why this entry is anomalous based strictly on the algorithmic detector's findings.
Respond ONLY with valid JSON strictly conforming to this schema:
{{
  "summary": "1-2 sentence plain-English explanation of what happened.",
  "root_cause": "The most likely underlying technical or security root cause.",
  "remediation_steps": [
    "Step 1: Immediate mitigation action",
    "Step 2: Verification or investigation step",
    "Step 3: Permanent prevention fix"
  ],
  "severity_assessment": "LOW | MEDIUM | HIGH | CRITICAL"
}}
"""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key.strip())

        # Determine available models dynamically
        candidate_models = []
        try:
            for m in genai.list_models():
                if 'generateContent' in getattr(m, 'supported_generation_methods', []):
                    candidate_models.append(m.name)
        except Exception:
            pass

        if not candidate_models:
            candidate_models = [
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro-latest", 
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-pro",
                "models/gemini-1.5-flash",
                "models/gemini-pro"
            ]

        for model_name in candidate_models:
            try:
                model_identifier = model_name.replace("models/", "")
                print(f"[AI Engine] 🚀 Prompting Gemini model '{model_identifier}'...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                parsed = clean_json_response(response.text)
                if parsed and "summary" in parsed and "root_cause" in parsed:
                    print(f"[AI Engine] ✔ Live response received from Google Gemini ({model_identifier})!")
                    parsed["provider"] = f"Google Gemini ({model_identifier})"
                    return parsed
            except Exception as model_err:
                print(f"[AI Engine] ⚠️ '{model_name}' skipped: {model_err}")
                continue

    except Exception as e:
        print(f"[AI Engine] ❌ Gemini API call error: {e}")

    return generate_fallback_explanation(log_record)

def explain_anomalies_dataframe(df_detected: pd.DataFrame, max_llm_calls: int = 15) -> pd.DataFrame:
    """
    Takes detected DataFrame, explains all flagged anomalies, and enriches DataFrame with AI fields.
    """
    df = df_detected.copy()
    
    summaries = []
    root_causes = []
    remediations = []
    severities = []
    
    llm_calls = 0
    for idx, row in df.iterrows():
        if row.get('predicted_anomaly') == 1:
            log_dict = row.to_dict()
            # Generate explanation
            explanation = explain_log_entry(log_dict)
            llm_calls += 1
            
            summaries.append(explanation.get('summary', ''))
            root_causes.append(explanation.get('root_cause', ''))
            remediations.append(" \n• ".join(explanation.get('remediation_steps', [])))
            severities.append(explanation.get('severity_assessment', 'MEDIUM'))
        else:
            summaries.append("")
            root_causes.append("")
            remediations.append("")
            severities.append("NORMAL")
            
    df['ai_summary'] = summaries
    df['ai_root_cause'] = root_causes
    df['ai_remediation'] = remediations
    df['ai_severity'] = severities
    
    return df

if __name__ == "__main__":
    print("\n" + "="*70)
    print("           TESTING AI SRE DIAGNOSTIC ENGINE")
    print("="*70)
    
    # Test sample flagged log
    sample_log = {
        "Timestamp": "2023-01-01 00:04:30",
        "IP_Address": "102.89.23.6",
        "Request_Type": "POST",
        "Status_Code": 403,
        "User_Agent": "HeadlessChrome",
        "Session_ID": "5566",
        "Location": "Nigeria",
        "anomaly_score": 0.94,
        "flag_reason": "Impossible Travel / Session Hijacking (Multi-location session)"
    }
    
    print(f"Ingesting Flagged Anomaly:\n  IP: {sample_log['IP_Address']} | Session #{sample_log['Session_ID']} ({sample_log['Location']}) | Status: {sample_log['Status_Code']}")
    print(f"  Score: {sample_log['anomaly_score']} | Reason: {sample_log['flag_reason']}")
    print("-" * 70)
    print("Generating AI Analysis...")
    
    result = explain_log_entry(sample_log)
    
    print(f"\n✔ Provider: {result.get('provider', 'AI Explainer')}")
    print(f"✔ Severity: {result.get('severity_assessment', 'HIGH')}")
    print(f"\n[WHAT HAPPENED (PLAIN-ENGLISH)]\n{result.get('summary')}")
    print(f"\n[PROBABLE ROOT CAUSE]\n{result.get('root_cause')}")
    print("\n[RECOMMENDED REMEDIATION PLAYBOOK]")
    for i, step in enumerate(result.get('remediation_steps', []), 1):
        print(f"  {i}. {step}")
    print("="*70 + "\n")

