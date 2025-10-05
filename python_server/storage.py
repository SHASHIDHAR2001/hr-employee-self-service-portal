from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, asc, extract
from typing import List, Optional
from datetime import datetime, timedelta
from models import (
    User, Leave, LeaveType, LeaveBalance, AttendanceRecord, SalarySlip,
    HrDocument, AiConversation, UpsertUserSchema, InsertLeaveSchema,
    InsertAttendanceSchema, InsertHrDocumentSchema, InsertAiConversationSchema
)

class DatabaseStorage:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()
    
    def upsert_user(self, user_data: UpsertUserSchema) -> User:
        user_dict = user_data.model_dump(exclude_none=True, by_alias=False)
        
        existing_user = self.db.query(User).filter(User.id == user_data.id).first() if user_data.id else None
        
        if existing_user:
            for key, value in user_dict.items():
                if key != 'id':
                    setattr(existing_user, key, value)
            existing_user.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing_user)
            return existing_user
        else:
            new_user = User(**user_dict)
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            return new_user
    
    def get_leave_types(self) -> List[LeaveType]:
        return self.db.query(LeaveType).all()
    
    def get_leave_balances(self, user_id: str, year: int) -> List[LeaveBalance]:
        return self.db.query(LeaveBalance).filter(
            and_(LeaveBalance.user_id == user_id, LeaveBalance.year == year)
        ).all()
    
    def create_leave(self, leave_data: InsertLeaveSchema) -> Leave:
        leave_dict = leave_data.model_dump(exclude_none=True, by_alias=False)
        new_leave = Leave(**leave_dict)
        self.db.add(new_leave)
        self.db.commit()
        self.db.refresh(new_leave)
        return new_leave
    
    def get_user_leaves(self, user_id: str) -> List[Leave]:
        return self.db.query(Leave).filter(Leave.user_id == user_id).order_by(desc(Leave.created_at)).all()
    
    def update_leave(self, leave_id: str, updates: dict) -> Leave:
        leave = self.db.query(Leave).filter(Leave.id == leave_id).first()
        if not leave:
            raise ValueError(f"Leave with id {leave_id} not found")
        
        for key, value in updates.items():
            if hasattr(leave, key):
                setattr(leave, key, value)
        
        leave.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(leave)
        return leave
    
    def delete_leave(self, leave_id: str):
        leave = self.db.query(Leave).filter(Leave.id == leave_id).first()
        if leave:
            self.db.delete(leave)
            self.db.commit()
    
    def get_attendance_records(self, user_id: str, month: int, year: int) -> List[AttendanceRecord]:
        return self.db.query(AttendanceRecord).filter(
            and_(
                AttendanceRecord.user_id == user_id,
                extract('month', AttendanceRecord.date) == month,
                extract('year', AttendanceRecord.date) == year
            )
        ).order_by(asc(AttendanceRecord.date)).all()
    
    def create_attendance_record(self, record_data: InsertAttendanceSchema) -> AttendanceRecord:
        record_dict = record_data.model_dump(exclude_none=True, by_alias=False)
        new_record = AttendanceRecord(**record_dict)
        self.db.add(new_record)
        self.db.commit()
        self.db.refresh(new_record)
        return new_record
    
    def update_attendance_record(self, record_id: str, updates: dict) -> AttendanceRecord:
        record = self.db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
        if not record:
            raise ValueError(f"Attendance record with id {record_id} not found")
        
        for key, value in updates.items():
            if hasattr(record, key):
                setattr(record, key, value)
        
        record.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(record)
        return record
    
    def get_absent_dates(self, user_id: str, days: int) -> List[AttendanceRecord]:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return self.db.query(AttendanceRecord).filter(
            and_(
                AttendanceRecord.user_id == user_id,
                AttendanceRecord.status == 'absent',
                AttendanceRecord.date >= cutoff_date.date()
            )
        ).order_by(desc(AttendanceRecord.date)).all()
    
    def get_salary_slips(self, user_id: str) -> List[SalarySlip]:
        return self.db.query(SalarySlip).filter(
            SalarySlip.user_id == user_id
        ).order_by(desc(SalarySlip.year), desc(SalarySlip.month)).all()
    
    def get_salary_slip(self, user_id: str, month: int, year: int) -> Optional[SalarySlip]:
        return self.db.query(SalarySlip).filter(
            and_(
                SalarySlip.user_id == user_id,
                SalarySlip.month == month,
                SalarySlip.year == year
            )
        ).first()
    
    def create_hr_document(self, document_data: InsertHrDocumentSchema) -> HrDocument:
        document_dict = document_data.model_dump(exclude_none=True, by_alias=False)
        new_document = HrDocument(**document_dict)
        self.db.add(new_document)
        self.db.commit()
        self.db.refresh(new_document)
        return new_document
    
    def get_hr_documents(self) -> List[HrDocument]:
        return self.db.query(HrDocument).filter(
            HrDocument.is_active == True
        ).order_by(desc(HrDocument.created_at)).all()
    
    def update_hr_document(self, document_id: str, updates: dict) -> HrDocument:
        document = self.db.query(HrDocument).filter(HrDocument.id == document_id).first()
        if not document:
            raise ValueError(f"HR document with id {document_id} not found")
        
        for key, value in updates.items():
            if hasattr(document, key):
                setattr(document, key, value)
        
        self.db.commit()
        self.db.refresh(document)
        return document
    
    def delete_hr_document(self, document_id: str):
        document = self.db.query(HrDocument).filter(HrDocument.id == document_id).first()
        if document:
            document.is_active = False
            self.db.commit()
    
    def create_ai_conversation(self, conversation_data: InsertAiConversationSchema) -> AiConversation:
        conversation_dict = conversation_data.model_dump(exclude_none=True, by_alias=False)
        new_conversation = AiConversation(**conversation_dict)
        self.db.add(new_conversation)
        self.db.commit()
        self.db.refresh(new_conversation)
        return new_conversation
    
    def get_user_conversations(self, user_id: str) -> List[AiConversation]:
        return self.db.query(AiConversation).filter(
            AiConversation.user_id == user_id
        ).order_by(desc(AiConversation.created_at)).limit(50).all()
