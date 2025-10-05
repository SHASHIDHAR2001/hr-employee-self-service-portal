from sqlalchemy import Column, String, Integer, Text, Boolean, Date, DateTime, DECIMAL, ForeignKey, Index, ARRAY, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal

Base = declarative_base()

class Session(Base):
    __tablename__ = "sessions"
    
    sid = Column(String, primary_key=True)
    sess = Column(JSON, nullable=False)
    expire = Column(DateTime, nullable=False)
    
    __table_args__ = (
        Index('IDX_session_expire', 'expire'),
    )

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    email = Column(String, unique=True)
    first_name = Column("first_name", String)
    last_name = Column("last_name", String)
    profile_image_url = Column("profile_image_url", String)
    employee_id = Column("employee_id", String, unique=True)
    department = Column(String)
    designation = Column(String)
    joining_date = Column("joining_date", Date)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)
    updated_at = Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LeaveType(Base):
    __tablename__ = "leave_types"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String, nullable=False)
    max_days = Column("max_days", Integer, nullable=False)
    carry_forward = Column("carry_forward", Boolean, default=False)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)

class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    leave_type_id = Column("leave_type_id", String, ForeignKey("leave_types.id"), nullable=False)
    total_days = Column("total_days", Integer, nullable=False)
    used_days = Column("used_days", Integer, default=0)
    year = Column(Integer, nullable=False)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)
    updated_at = Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Leave(Base):
    __tablename__ = "leaves"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    leave_type_id = Column("leave_type_id", String, ForeignKey("leave_types.id"), nullable=False)
    from_date = Column("from_date", Date, nullable=False)
    to_date = Column("to_date", Date, nullable=False)
    days = Column(DECIMAL(precision=3, scale=1), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending")
    contact_number = Column("contact_number", String)
    attachment_path = Column("attachment_path", String)
    applied_at = Column("applied_at", DateTime, default=datetime.utcnow)
    reviewed_at = Column("reviewed_at", DateTime)
    reviewed_by = Column("reviewed_by", String, ForeignKey("users.id"))
    review_comments = Column("review_comments", Text)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)
    updated_at = Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False)
    check_in = Column("check_in", DateTime)
    check_out = Column("check_out", DateTime)
    working_hours = Column("working_hours", DECIMAL(precision=4, scale=2))
    regularized_at = Column("regularized_at", DateTime)
    regularization_reason = Column("regularization_reason", Text)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)
    updated_at = Column("updated_at", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SalarySlip(Base):
    __tablename__ = "salary_slips"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    basic_salary = Column("basic_salary", DECIMAL(precision=10, scale=2), nullable=False)
    allowances = Column(JSON)
    deductions = Column(JSON)
    gross_salary = Column("gross_salary", DECIMAL(precision=10, scale=2), nullable=False)
    net_salary = Column("net_salary", DECIMAL(precision=10, scale=2), nullable=False)
    payment_date = Column("payment_date", Date)
    file_path = Column("file_path", String)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)

class HrDocument(Base):
    __tablename__ = "hr_documents"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    file_path = Column("file_path", String, nullable=False)
    file_size = Column("file_size", Integer)
    mime_type = Column("mime_type", String)
    uploaded_by = Column("uploaded_by", String, ForeignKey("users.id"), nullable=False)
    is_active = Column("is_active", Boolean, default=True)
    vector_count = Column("vector_count", Integer, default=0)
    processed_at = Column("processed_at", DateTime)
    created_at = Column("created_at", DateTime, default=datetime.utcnow)

class AiConversation(Base):
    __tablename__ = "ai_conversations"
    
    id = Column(String, primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column("user_id", String, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    documents_used = Column("documents_used", ARRAY(Text))
    created_at = Column("created_at", DateTime, default=datetime.utcnow)


class UpsertUserSchema(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = Field(None, alias="firstName")
    last_name: Optional[str] = Field(None, alias="lastName")
    profile_image_url: Optional[str] = Field(None, alias="profileImageUrl")
    employee_id: Optional[str] = Field(None, alias="employeeId")
    department: Optional[str] = None
    designation: Optional[str] = None
    joining_date: Optional[str] = Field(None, alias="joiningDate")
    
    class Config:
        populate_by_name = True

class InsertLeaveSchema(BaseModel):
    user_id: Optional[str] = Field(None, alias="userId")
    leave_type_id: str = Field(..., alias="leaveTypeId")
    from_date: str = Field(..., alias="fromDate")
    to_date: str = Field(..., alias="toDate")
    reason: str
    contact_number: Optional[str] = Field(None, alias="contactNumber")
    attachment_path: Optional[str] = Field(None, alias="attachmentPath")
    days: Optional[str] = None
    status: Optional[str] = "pending"
    
    class Config:
        populate_by_name = True

class InsertAttendanceSchema(BaseModel):
    user_id: str = Field(..., alias="userId")
    date: str
    status: str
    check_in: Optional[datetime] = Field(None, alias="checkIn")
    check_out: Optional[datetime] = Field(None, alias="checkOut")
    working_hours: Optional[Decimal] = Field(None, alias="workingHours")
    regularized_at: Optional[datetime] = Field(None, alias="regularizedAt")
    regularization_reason: Optional[str] = Field(None, alias="regularizationReason")
    
    class Config:
        populate_by_name = True

class InsertHrDocumentSchema(BaseModel):
    name: str
    category: str
    file_path: str = Field(..., alias="filePath")
    file_size: Optional[int] = Field(None, alias="fileSize")
    mime_type: Optional[str] = Field(None, alias="mimeType")
    uploaded_by: str = Field(..., alias="uploadedBy")
    is_active: Optional[bool] = Field(True, alias="isActive")
    vector_count: Optional[int] = Field(0, alias="vectorCount")
    processed_at: Optional[datetime] = Field(None, alias="processedAt")
    
    class Config:
        populate_by_name = True

class InsertAiConversationSchema(BaseModel):
    user_id: str = Field(..., alias="userId")
    question: str
    answer: str
    documents_used: Optional[List[str]] = Field(None, alias="documentsUsed")
    
    class Config:
        populate_by_name = True
