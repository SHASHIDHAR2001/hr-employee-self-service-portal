#!/usr/bin/env python3
"""
Database Initialization Script
Adds sample leave types and initial data for the HR portal
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import LeaveType
from config import settings

def init_database():
    """Initialize database with sample data"""
    
    # Create database engine
    engine = create_engine(settings.DATABASE_URL, echo=True)
    
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if leave types already exist
        existing_leave_types = db.query(LeaveType).count()
        if existing_leave_types > 0:
            print(f"✓ Database already has {existing_leave_types} leave types")
            return
        
        # Add default leave types
        print("Adding default leave types...")
        leave_types = [
            LeaveType(
                name="Casual Leave",
                max_days=12,
                carry_forward=True,
                description="For personal reasons, family functions, or other casual purposes"
            ),
            LeaveType(
                name="Sick Leave",
                max_days=10,
                carry_forward=False,
                description="For medical reasons or illness"
            ),
            LeaveType(
                name="Earned Leave",
                max_days=20,
                carry_forward=True,
                description="Annual leave earned through continuous service"
            ),
            LeaveType(
                name="Maternity Leave",
                max_days=180,
                carry_forward=False,
                description="For expecting mothers"
            ),
            LeaveType(
                name="Paternity Leave",
                max_days=15,
                carry_forward=False,
                description="For new fathers"
            ),
            LeaveType(
                name="Compensatory Off",
                max_days=12,
                carry_forward=False,
                description="Compensation for working on weekends or holidays"
            ),
        ]
        
        db.add_all(leave_types)
        db.commit()
        print(f"✓ Added {len(leave_types)} leave types successfully")
        
        # Display added leave types
        print("\nLeave Types Added:")
        print("-" * 60)
        for lt in leave_types:
            print(f"  • {lt.name}: {lt.max_days} days (Carry Forward: {lt.carry_forward})")
        print("-" * 60)
        
        print("\n✓ Database initialization completed successfully!")
        print("\nNext steps:")
        print("1. Run the server: python main.py")
        print("2. Login via Replit Auth")
        print("3. Start using the HR portal")
        
    except Exception as e:
        print(f"✗ Error during initialization: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("HR Portal - Database Initialization")
    print("=" * 60)
    print()
    init_database()
