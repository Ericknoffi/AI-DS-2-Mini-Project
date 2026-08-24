from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from datetime import datetime
from database import Base

class LogEntryModel(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String(50), index=True)
    ip_address = Column(String(50), index=True)
    request_type = Column(String(10), index=True) # GET, POST, DELETE, etc.
    status_code = Column(Integer, index=True)
    user_agent = Column(String(100))
    session_id = Column(String(50), index=True)
    location = Column(String(100))
    
    # Model Detection Results
    predicted_anomaly = Column(Integer, default=0, index=True) # 0: Normal, 1: Anomaly
    anomaly_score = Column(Float, default=0.0)
    flag_reason = Column(Text, nullable=True)
    
    # AI Explanation & Root Cause
    ai_summary = Column(Text, nullable=True)
    ai_root_cause = Column(Text, nullable=True)
    ai_remediation = Column(Text, nullable=True)
    ai_severity = Column(String(20), default="NORMAL")
