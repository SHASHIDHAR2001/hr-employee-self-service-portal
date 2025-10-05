import {
  users,
  leaves,
  leaveTypes,
  leaveBalances,
  attendanceRecords,
  salarySlips,
  hrDocuments,
  aiConversations,
  type User,
  type UpsertUser,
  type Leave,
  type InsertLeave,
  type LeaveType,
  type LeaveBalance,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type SalarySlip,
  type HrDocument,
  type InsertHrDocument,
  type AiConversation,
  type InsertAiConversation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Leave operations
  getLeaveTypes(): Promise<LeaveType[]>;
  getLeaveBalances(userId: string, year: number): Promise<LeaveBalance[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  getUserLeaves(userId: string): Promise<Leave[]>;
  updateLeave(id: string, updates: Partial<Leave>): Promise<Leave>;
  deleteLeave(id: string): Promise<void>;

  // Attendance operations
  getAttendanceRecords(userId: string, month: number, year: number): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord>;
  getAbsentDates(userId: string, days: number): Promise<AttendanceRecord[]>;

  // Salary operations
  getSalarySlips(userId: string): Promise<SalarySlip[]>;
  getSalarySlip(userId: string, month: number, year: number): Promise<SalarySlip | undefined>;

  // HR Document operations
  createHrDocument(document: InsertHrDocument): Promise<HrDocument>;
  getHrDocuments(): Promise<HrDocument[]>;
  updateHrDocument(id: string, updates: Partial<HrDocument>): Promise<HrDocument>;
  deleteHrDocument(id: string): Promise<void>;

  // AI Conversation operations
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  getUserConversations(userId: string): Promise<AiConversation[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    return await db.select().from(leaveTypes);
  }

  async getLeaveBalances(userId: string, year: number): Promise<LeaveBalance[]> {
    return await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.userId, userId), eq(leaveBalances.year, year)));
  }

  async createLeave(leave: InsertLeave): Promise<Leave> {
    const [newLeave] = await db
      .insert(leaves)
      .values(leave)
      .returning();
    return newLeave;
  }

  async getUserLeaves(userId: string): Promise<Leave[]> {
    return await db
      .select()
      .from(leaves)
      .where(eq(leaves.userId, userId))
      .orderBy(desc(leaves.appliedAt));
  }

  async updateLeave(id: string, updates: Partial<Leave>): Promise<Leave> {
    const [updatedLeave] = await db
      .update(leaves)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leaves.id, id))
      .returning();
    return updatedLeave;
  }

  async deleteLeave(id: string): Promise<void> {
    await db.delete(leaves).where(eq(leaves.id, id));
  }

  async getAttendanceRecords(userId: string, month: number, year: number): Promise<AttendanceRecord[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.userId, userId),
          gte(attendanceRecords.date, startDate.toISOString().split('T')[0]),
          lte(attendanceRecords.date, endDate.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(attendanceRecords.date));
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [newRecord] = await db
      .insert(attendanceRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const [updatedRecord] = await db
      .update(attendanceRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(attendanceRecords.id, id))
      .returning();
    return updatedRecord;
  }

  async getAbsentDates(userId: string, days: number): Promise<AttendanceRecord[]> {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    
    return await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.userId, userId),
          eq(attendanceRecords.status, 'absent'),
          gte(attendanceRecords.date, pastDate.toISOString().split('T')[0])
        )
      )
      .orderBy(desc(attendanceRecords.date));
  }

  async getSalarySlips(userId: string): Promise<SalarySlip[]> {
    return await db
      .select()
      .from(salarySlips)
      .where(eq(salarySlips.userId, userId))
      .orderBy(desc(salarySlips.year), desc(salarySlips.month));
  }

  async getSalarySlip(userId: string, month: number, year: number): Promise<SalarySlip | undefined> {
    const [slip] = await db
      .select()
      .from(salarySlips)
      .where(
        and(
          eq(salarySlips.userId, userId),
          eq(salarySlips.month, month),
          eq(salarySlips.year, year)
        )
      );
    return slip;
  }

  async createHrDocument(document: InsertHrDocument): Promise<HrDocument> {
    const [newDocument] = await db
      .insert(hrDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async getHrDocuments(): Promise<HrDocument[]> {
    return await db
      .select()
      .from(hrDocuments)
      .where(eq(hrDocuments.isActive, true))
      .orderBy(desc(hrDocuments.createdAt));
  }

  async updateHrDocument(id: string, updates: Partial<HrDocument>): Promise<HrDocument> {
    const [updatedDocument] = await db
      .update(hrDocuments)
      .set(updates)
      .where(eq(hrDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteHrDocument(id: string): Promise<void> {
    await db.update(hrDocuments)
      .set({ isActive: false })
      .where(eq(hrDocuments.id, id));
  }

  async createAiConversation(conversation: InsertAiConversation): Promise<AiConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<AiConversation[]> {
    return await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.createdAt))
      .limit(50);
  }
}

export const storage = new DatabaseStorage();
