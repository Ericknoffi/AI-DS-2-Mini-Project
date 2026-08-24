import csv
import random
from datetime import datetime, timedelta

def generate_log_dataset(
    output_filepath="dataset.csv",
    total_logs=5000,
    start_time=datetime(2023, 1, 1, 0, 0, 0),
    seed=42
):
    """
    Generates a realistic sequence-based log dataset containing both normal traffic
    and specifically structured multi-step anomaly attack patterns.
    
    Schema:
    Timestamp, IP_Address, Request_Type, Status_Code, User_Agent, Session_ID, Location, Anomaly, Anomaly_Type
    """
    random.seed(seed)

    locations = [
        "United States", "United Kingdom", "Germany", "France", "Japan",
        "India", "Brazil", "Canada", "Australia", "Singapore", "Netherlands"
    ]
    
    user_agents_normal = ["Chrome", "Safari", "Firefox", "Edge", "Opera"]
    
    # Pool of regular user IPs and their home locations
    normal_ip_pool = [
        (f"192.168.1.{i}", random.choice(locations)) for i in range(10, 80)
    ] + [
        (f"10.0.0.{i}", random.choice(locations)) for i in range(10, 60)
    ] + [
        (f"172.16.{random.randint(1, 20)}.{random.randint(1, 250)}", random.choice(locations)) for _ in range(50)
    ] + [
        (f"203.0.113.{random.randint(1, 250)}", random.choice(locations)) for _ in range(40)
    ]

    all_logs = []
    current_time = start_time
    
    # We will generate background normal traffic intermixed with distinct temporal anomaly events.
    # Target distribution: ~92% normal (~4600 logs) and ~8% anomalies (~400 logs across 5 scenarios)
    
    # -------------------------------------------------------------
    # 1. GENERATE BACKGROUND NORMAL TRAFFIC SESSIONS
    # -------------------------------------------------------------
    # Each normal session has: consistent IP, Location, and User-Agent, realistic 15-45s delays
    normal_logs = []
    normal_time = start_time
    session_counter = 1000
    
    target_normal_count = int(total_logs * 0.92)
    
    while len(normal_logs) < target_normal_count:
        session_counter += 1
        sid = session_counter
        ip, loc = random.choice(normal_ip_pool)
        ua = random.choice(user_agents_normal)
        
        # Session duration: 4 to 12 requests
        session_length = random.randint(4, 12)
        sess_time = normal_time + timedelta(seconds=random.randint(5, 60))
        
        for req_idx in range(session_length):
            if req_idx > 0:
                # Realistic gap between user clicks: 10 to 45 seconds
                sess_time += timedelta(seconds=random.randint(10, 45))
            
            # Method distribution for regular users
            r = random.random()
            if r < 0.72:
                method = "GET"
                status = random.choices([200, 301, 404, 500], weights=[88, 7, 4, 1])[0]
            elif r < 0.88:
                method = "POST"
                status = random.choices([200, 201, 400, 500], weights=[80, 14, 4, 2])[0]
            elif r < 0.96:
                method = "PUT"
                status = random.choices([200, 204, 400, 500], weights=[85, 10, 4, 1])[0]
            else:
                method = "DELETE"
                status = random.choices([200, 204, 403], weights=[82, 14, 4])[0]

            normal_logs.append({
                "Timestamp": sess_time,
                "IP_Address": ip,
                "Request_Type": method,
                "Status_Code": status,
                "User_Agent": ua,
                "Session_ID": sid,
                "Location": loc,
                "Anomaly": 0,
                "Anomaly_Type": "normal"
            })
            
        normal_time = sess_time

    # Calculate overall timespan to inject anomalies at realistic relative time milestones
    start_ts = normal_logs[0]["Timestamp"]
    end_ts = normal_logs[-1]["Timestamp"]
    total_span = (end_ts - start_ts).total_seconds()

    anomaly_logs = []

    # -------------------------------------------------------------
    # 2. INJECT ANOMALY 1: Credential Stuffing / Auth Brute Force
    # Single IP, Python-urllib, rapid POST bursts (1-2s gap), 401/403 status, rapid session churn
    # -------------------------------------------------------------
    cs_start = start_ts + timedelta(seconds=total_span * 0.15)
    cs_ip = "194.26.29.112"
    cs_loc = "Russia"
    cs_ua = "Python-urllib"
    cs_time = cs_start
    
    for i in range(80):
        cs_time += timedelta(seconds=random.randint(1, 2))
        # Attacker rotates fake session IDs rapidly or has no valid session
        fake_sid = 9000 + (i // 2)
        status = random.choices([401, 403, 429, 200], weights=[75, 18, 5, 2])[0]
        anomaly_logs.append({
            "Timestamp": cs_time,
            "IP_Address": cs_ip,
            "Request_Type": "POST",
            "Status_Code": status,
            "User_Agent": cs_ua,
            "Session_ID": fake_sid,
            "Location": cs_loc,
            "Anomaly": 1,
            "Anomaly_Type": "credential_stuffing"
        })

    # -------------------------------------------------------------
    # 3. INJECT ANOMALY 2: DDoS / Scraper Bot High-Velocity Burst
    # 0 to 1 sec intervals, 429 Too Many Requests, 503 Overload, single Bot UA
    # -------------------------------------------------------------
    ddos_start = start_ts + timedelta(seconds=total_span * 0.35)
    ddos_ip = "185.220.101.5"
    ddos_loc = "China"
    ddos_ua = "Scrapy"
    ddos_time = ddos_start
    ddos_sid = 7712

    for _ in range(120):
        ddos_time += timedelta(milliseconds=random.randint(100, 800))
        status = random.choices([429, 503, 403, 200], weights=[60, 25, 10, 5])[0]
        anomaly_logs.append({
            "Timestamp": ddos_time,
            "IP_Address": ddos_ip,
            "Request_Type": "GET",
            "Status_Code": status,
            "User_Agent": ddos_ua,
            "Session_ID": ddos_sid,
            "Location": ddos_loc,
            "Anomaly": 1,
            "Anomaly_Type": "ddos_bot_scraping"
        })

    # -------------------------------------------------------------
    # 4. INJECT ANOMALY 3: Cascading Microservice Outage (System-wide 500/502/503)
    # Multiple normal user IPs hitting 500/502/503 during a 10-minute database crash
    # -------------------------------------------------------------
    outage_start = start_ts + timedelta(seconds=total_span * 0.55)
    outage_time = outage_start

    for _ in range(80):
        outage_time += timedelta(seconds=random.randint(1, 6))
        ip, loc = random.choice(normal_ip_pool)
        ua = random.choice(user_agents_normal)
        status = random.choices([500, 502, 503], weights=[65, 20, 15])[0]
        method = random.choice(["POST", "PUT", "GET"])
        anomaly_logs.append({
            "Timestamp": outage_time,
            "IP_Address": ip,
            "Request_Type": method,
            "Status_Code": status,
            "User_Agent": ua,
            "Session_ID": random.randint(1100, 1400),
            "Location": loc,
            "Anomaly": 1,
            "Anomaly_Type": "cascading_service_outage"
        })

    # -------------------------------------------------------------
    # 5. INJECT ANOMALY 4: Off-Peak Mass Data Deletion / Exfiltration
    # Single rogue IP/session firing continuous DELETE requests at 3 AM with curl
    # -------------------------------------------------------------
    del_start = start_ts + timedelta(seconds=total_span * 0.75)
    del_ip = "45.154.255.89"
    del_loc = "Brazil"
    del_ua = "curl"
    del_time = del_start
    del_sid = 8844

    for _ in range(50):
        del_time += timedelta(seconds=random.randint(1, 3))
        status = random.choices([200, 204, 403, 500], weights=[50, 30, 15, 5])[0]
        anomaly_logs.append({
            "Timestamp": del_time,
            "IP_Address": del_ip,
            "Request_Type": "DELETE",
            "Status_Code": status,
            "User_Agent": del_ua,
            "Session_ID": del_sid,
            "Location": del_loc,
            "Anomaly": 1,
            "Anomaly_Type": "data_exfiltration_deletion"
        })

    # -------------------------------------------------------------
    # 6. INJECT ANOMALY 5: Impossible Travel & Session Hijacking Sequence
    # Legitimate session in US (Chrome) -> 30s later -> Nigeria (HeadlessChrome, new IP, rapid 401/403)
    # -------------------------------------------------------------
    hijack_start = start_ts + timedelta(seconds=total_span * 0.90)
    hijacked_sid = 5566
    
    # 1. Legitimate user requests in US (Marked normal)
    legit_time = hijack_start
    for _ in range(3):
        legit_time += timedelta(seconds=random.randint(15, 25))
        normal_logs.append({
            "Timestamp": legit_time,
            "IP_Address": "198.51.100.44",
            "Request_Type": "GET",
            "Status_Code": 200,
            "User_Agent": "Chrome",
            "Session_ID": hijacked_sid,
            "Location": "United States",
            "Anomaly": 0,
            "Anomaly_Type": "normal"
        })
    
    # 2. Attacker in Nigeria hijacks the same Session_ID 30 seconds later (Marked anomaly)
    hijack_attacker_time = legit_time + timedelta(seconds=30)
    for _ in range(40):
        hijack_attacker_time += timedelta(seconds=random.randint(1, 3))
        status = random.choices([401, 403, 404, 200], weights=[45, 35, 15, 5])[0]
        anomaly_logs.append({
            "Timestamp": hijack_attacker_time,
            "IP_Address": "102.89.23.6", # Nigerian IP
            "Request_Type": random.choice(["POST", "GET", "PUT"]),
            "Status_Code": status,
            "User_Agent": "HeadlessChrome",
            "Session_ID": hijacked_sid, # SAME SESSION ID!
            "Location": "Nigeria",
            "Anomaly": 1,
            "Anomaly_Type": "impossible_travel_hijack"
        })

    # -------------------------------------------------------------
    # 7. COMBINE, SORT CHRONOLOGICALLY, AND TRIM TO EXACT TOTAL
    # -------------------------------------------------------------
    combined = normal_logs + anomaly_logs
    combined.sort(key=lambda x: x["Timestamp"])
    
    # Trim to exact requested count
    final_logs = combined[:total_logs]

    # Format timestamp as string
    for log in final_logs:
        log["Timestamp"] = log["Timestamp"].strftime("%Y-%m-%d %H:%M:%S")

    # Write to CSV
    fieldnames = [
        "Timestamp", "IP_Address", "Request_Type", "Status_Code",
        "User_Agent", "Session_ID", "Location", "Anomaly", "Anomaly_Type"
    ]
    with open(output_filepath, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(final_logs)

    # Print distribution stats
    type_counts = {}
    anomaly_count = 0
    for log in final_logs:
        atype = log["Anomaly_Type"]
        type_counts[atype] = type_counts.get(atype, 0) + 1
        if log["Anomaly"] == 1:
            anomaly_count += 1

    print("\n" + "="*60)
    print(f" DATASET GENERATION SUMMARY: '{output_filepath}'")
    print("="*60)
    print(f"Total Log Records: {len(final_logs)}")
    print(f"Normal Entries:    {len(final_logs) - anomaly_count} ({(len(final_logs) - anomaly_count)/len(final_logs)*100:.1f}%)")
    print(f"Anomalous Entries: {anomaly_count} ({anomaly_count/len(final_logs)*100:.1f}%)")
    print("-" * 60)
    print("Breakdown by Scenario:")
    for k, v in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  • {k:<28}: {v:>5} logs ({v/len(final_logs)*100:>4.1f}%)")
    print("="*60 + "\n")

    return final_logs

if __name__ == "__main__":
    generate_log_dataset("dataset.csv", total_logs=5000)
