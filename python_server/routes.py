from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
import os

from database import get_db
from storage import DatabaseStorage
from auth import get_user_id
from openai_service import ask_hr_assistant, process_document_for_vectorization, DocumentContext
from object_storage import ObjectStorageService
from models import (
    InsertLeaveSchema, InsertAttendanceSchema, InsertHrDocumentSchema,
    InsertAiConversationSchema, UpsertUserSchema
)

router = APIRouter(prefix="/api")

object_storage = ObjectStorageService()

@router.get("/auth/user")
async def get_auth_user(request: Request, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    user = storage.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "profileImageUrl": user.profile_image_url,
        "employeeId": user.employee_id,
        "department": user.department,
        "designation": user.designation,
        "joiningDate": str(user.joining_date) if user.joining_date else None,
    }

@router.get("/dashboard/stats")
async def get_dashboard_stats(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    leave_balances = storage.get_leave_balances(user_id, current_year)
    leaves = storage.get_user_leaves(user_id)
    attendance_records = storage.get_attendance_records(user_id, current_month, current_year)
    
    total_leaves_used = sum(balance.used_days or 0 for balance in leave_balances)
    total_leaves_remaining = sum(balance.total_days - (balance.used_days or 0) for balance in leave_balances)
    
    present_days = len([r for r in attendance_records if r.status in ['present', 'wfh']])
    total_working_days = len(attendance_records)
    attendance_rate = (present_days / total_working_days * 100) if total_working_days > 0 else 0.0
    
    pending_leaves = len([leave for leave in leaves if leave.status == 'pending'])
    
    return {
        "leavesUsed": total_leaves_used,
        "leavesRemaining": total_leaves_remaining,
        "attendanceRate": round(attendance_rate, 1),
        "pendingRequests": pending_leaves,
        "leaveBalances": [
            {
                "type": balance.leave_type_id,
                "used": balance.used_days or 0,
                "total": balance.total_days,
                "remaining": balance.total_days - (balance.used_days or 0)
            }
            for balance in leave_balances
        ]
    }

@router.get("/leave-types")
async def get_leave_types(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    leave_types = storage.get_leave_types()
    return [
        {
            "id": lt.id,
            "name": lt.name,
            "maxDays": lt.max_days,
            "carryForward": lt.carry_forward
        }
        for lt in leave_types
    ]

@router.get("/leave-balances")
async def get_leave_balances(year: Optional[int] = None, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    year = year or datetime.now().year
    balances = storage.get_leave_balances(user_id, year)
    return [
        {
            "id": b.id,
            "userId": b.user_id,
            "leaveTypeId": b.leave_type_id,
            "totalDays": b.total_days,
            "usedDays": b.used_days,
            "year": b.year
        }
        for b in balances
    ]

@router.post("/leaves")
async def create_leave(leave_data: InsertLeaveSchema, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    
    leave_data.user_id = user_id
    
    from_date = datetime.strptime(leave_data.from_date, "%Y-%m-%d").date()
    to_date = datetime.strptime(leave_data.to_date, "%Y-%m-%d").date()
    days_diff = (to_date - from_date).days + 1
    
    leave_data.days = str(days_diff)
    
    leave = storage.create_leave(leave_data)
    
    return {
        "id": leave.id,
        "userId": leave.user_id,
        "leaveTypeId": leave.leave_type_id,
        "fromDate": str(leave.from_date),
        "toDate": str(leave.to_date),
        "days": float(leave.days),
        "reason": leave.reason,
        "status": leave.status,
        "contactNumber": leave.contact_number,
        "attachmentPath": leave.attachment_path,
    }

@router.get("/leaves")
async def get_leaves(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    leaves = storage.get_user_leaves(user_id)
    return [
        {
            "id": leave.id,
            "userId": leave.user_id,
            "leaveTypeId": leave.leave_type_id,
            "fromDate": str(leave.from_date),
            "toDate": str(leave.to_date),
            "days": float(leave.days),
            "reason": leave.reason,
            "status": leave.status,
            "contactNumber": leave.contact_number,
            "attachmentPath": leave.attachment_path,
            "appliedAt": leave.applied_at.isoformat() if leave.applied_at else None,
        }
        for leave in leaves
    ]

@router.put("/leaves/{leave_id}")
async def update_leave(leave_id: str, updates: dict, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    updated_leave = storage.update_leave(leave_id, updates)
    return {
        "id": updated_leave.id,
        "userId": updated_leave.user_id,
        "status": updated_leave.status,
    }

@router.delete("/leaves/{leave_id}")
async def delete_leave(leave_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    storage.delete_leave(leave_id)
    return {"message": "Leave deleted successfully"}

@router.get("/attendance")
async def get_attendance(month: Optional[int] = None, year: Optional[int] = None, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    
    month = month or datetime.now().month
    year = year or datetime.now().year
    
    records = storage.get_attendance_records(user_id, month, year)
    
    stats = {
        "present": len([r for r in records if r.status == 'present']),
        "absent": len([r for r in records if r.status == 'absent']),
        "leave": len([r for r in records if r.status == 'leave']),
        "wfh": len([r for r in records if r.status == 'wfh'])
    }
    
    return {
        "records": [
            {
                "id": r.id,
                "userId": r.user_id,
                "date": str(r.date),
                "status": r.status,
                "checkIn": r.check_in.isoformat() if r.check_in else None,
                "checkOut": r.check_out.isoformat() if r.check_out else None,
                "workingHours": float(r.working_hours) if r.working_hours else None,
            }
            for r in records
        ],
        "stats": stats
    }

@router.get("/attendance/absent-dates")
async def get_absent_dates(days: int = 7, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    absent_dates = storage.get_absent_dates(user_id, days)
    return [
        {
            "id": r.id,
            "date": str(r.date),
            "status": r.status,
        }
        for r in absent_dates
    ]

@router.post("/attendance/regularize")
async def regularize_attendance(
    date: str = Form(...),
    status: str = Form(...),
    reason: str = Form(...),
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    storage = DatabaseStorage(db)
    
    record_data = InsertAttendanceSchema(
        userId=user_id,
        date=date,
        status=status,
        regularizationReason=reason,
        regularizedAt=datetime.now()
    )
    
    record = storage.create_attendance_record(record_data)
    
    return {
        "id": record.id,
        "userId": record.user_id,
        "date": str(record.date),
        "status": record.status,
    }

@router.get("/salary-slips")
async def get_salary_slips(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    slips = storage.get_salary_slips(user_id)
    return [
        {
            "id": slip.id,
            "userId": slip.user_id,
            "month": slip.month,
            "year": slip.year,
            "basicSalary": float(slip.basic_salary),
            "allowances": slip.allowances,
            "deductions": slip.deductions,
            "grossSalary": float(slip.gross_salary),
            "netSalary": float(slip.net_salary),
            "paymentDate": str(slip.payment_date) if slip.payment_date else None,
            "filePath": slip.file_path,
        }
        for slip in slips
    ]

@router.get("/salary-slips/{month}/{year}")
async def get_salary_slip(month: int, year: int, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    slip = storage.get_salary_slip(user_id, month, year)
    
    if not slip:
        raise HTTPException(status_code=404, detail="Salary slip not found")
    
    return {
        "id": slip.id,
        "userId": slip.user_id,
        "month": slip.month,
        "year": slip.year,
        "basicSalary": float(slip.basic_salary),
        "allowances": slip.allowances,
        "deductions": slip.deductions,
        "grossSalary": float(slip.gross_salary),
        "netSalary": float(slip.net_salary),
        "paymentDate": str(slip.payment_date) if slip.payment_date else None,
        "filePath": slip.file_path,
    }

@router.get("/hr-documents")
async def get_hr_documents(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    documents = storage.get_hr_documents()
    return [
        {
            "id": doc.id,
            "name": doc.name,
            "category": doc.category,
            "filePath": doc.file_path,
            "fileSize": doc.file_size,
            "mimeType": doc.mime_type,
            "uploadedBy": doc.uploaded_by,
            "isActive": doc.is_active,
            "vectorCount": doc.vector_count,
            "createdAt": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in documents
    ]

@router.post("/hr-documents/upload")
async def upload_hr_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    storage = DatabaseStorage(db)
    
    import aiofiles
    import tempfile
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_file:
        temp_path = temp_file.name
        content = await file.read()
        temp_file.write(content)
    
    try:
        with open(temp_path, 'r', encoding='utf-8', errors='ignore') as f:
            file_content = f.read()
    except Exception:
        file_content = ""
    
    chunks = await process_document_for_vectorization(file_content, file.filename)
    
    document_data = InsertHrDocumentSchema(
        name=file.filename,
        category=category,
        filePath=temp_path,
        fileSize=file.size,
        mimeType=file.content_type,
        uploadedBy=user_id,
        vectorCount=len(chunks),
        processedAt=datetime.now()
    )
    
    document = storage.create_hr_document(document_data)
    
    return {
        "id": document.id,
        "name": document.name,
        "category": document.category,
        "filePath": document.file_path,
        "vectorCount": document.vector_count,
    }

@router.delete("/hr-documents/{document_id}")
async def delete_hr_document(document_id: str, user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    storage.delete_hr_document(document_id)
    return {"message": "Document deleted successfully"}

@router.post("/ai/ask")
async def ask_ai_assistant(
    question: str = Form(...),
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db)
):
    storage = DatabaseStorage(db)
    
    if not question or not question.strip():
        raise HTTPException(status_code=400, detail="Question is required")
    
    documents = storage.get_hr_documents()
    
    document_context = [
        DocumentContext(
            name=doc.name,
            content=f"HR Policy document: {doc.name}. Category: {doc.category}. This document contains company policies and procedures.",
            category=doc.category
        )
        for doc in documents
    ]
    
    result = await ask_hr_assistant(question, document_context)
    
    conversation_data = InsertAiConversationSchema(
        userId=user_id,
        question=question,
        answer=result["answer"],
        documentsUsed=result["documentsUsed"]
    )
    
    storage.create_ai_conversation(conversation_data)
    
    return {
        "answer": result["answer"],
        "documentsUsed": result["documentsUsed"]
    }

@router.get("/ai/conversations")
async def get_ai_conversations(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    storage = DatabaseStorage(db)
    conversations = storage.get_user_conversations(user_id)
    return [
        {
            "id": conv.id,
            "userId": conv.user_id,
            "question": conv.question,
            "answer": conv.answer,
            "documentsUsed": conv.documents_used,
            "createdAt": conv.created_at.isoformat() if conv.created_at else None,
        }
        for conv in conversations
    ]
