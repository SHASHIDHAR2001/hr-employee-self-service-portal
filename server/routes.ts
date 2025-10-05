import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService } from "./objectStorage";
import { askHRAssistant, processDocumentForVectorization } from "./openai";
import { insertLeaveSchema, insertAttendanceSchema, insertHrDocumentSchema, insertAiConversationSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const [leaveBalances, leaves, attendanceRecords] = await Promise.all([
        storage.getLeaveBalances(userId, currentYear),
        storage.getUserLeaves(userId),
        storage.getAttendanceRecords(userId, currentMonth, currentYear)
      ]);

      const totalLeavesUsed = leaveBalances.reduce((sum, balance) => sum + balance.usedDays, 0);
      const totalLeavesRemaining = leaveBalances.reduce((sum, balance) => sum + (balance.totalDays - balance.usedDays), 0);
      
      const presentDays = attendanceRecords.filter(record => record.status === 'present' || record.status === 'wfh').length;
      const totalWorkingDays = attendanceRecords.length;
      const attendanceRate = totalWorkingDays > 0 ? (presentDays / totalWorkingDays * 100).toFixed(1) : "0.0";

      const pendingLeaves = leaves.filter(leave => leave.status === 'pending').length;

      res.json({
        leavesUsed: totalLeavesUsed,
        leavesRemaining: totalLeavesRemaining,
        attendanceRate: parseFloat(attendanceRate),
        pendingRequests: pendingLeaves,
        leaveBalances: leaveBalances.map(balance => ({
          type: balance.leaveTypeId,
          used: balance.usedDays,
          total: balance.totalDays,
          remaining: balance.totalDays - balance.usedDays
        }))
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Leave management routes
  app.get('/api/leave-types', isAuthenticated, async (req, res) => {
    try {
      const leaveTypes = await storage.getLeaveTypes();
      res.json(leaveTypes);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      res.status(500).json({ message: "Failed to fetch leave types" });
    }
  });

  app.get('/api/leave-balances', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const balances = await storage.getLeaveBalances(userId, year);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching leave balances:", error);
      res.status(500).json({ message: "Failed to fetch leave balances" });
    }
  });

  app.post('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leaveData = insertLeaveSchema.parse({ ...req.body, userId });
      
      // Calculate days between dates
      const fromDate = new Date(leaveData.fromDate);
      const toDate = new Date(leaveData.toDate);
      const timeDiff = toDate.getTime() - fromDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      const leave = await storage.createLeave({
        ...leaveData,
        days: daysDiff.toString()
      });
      
      res.json(leave);
    } catch (error) {
      console.error("Error creating leave:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid leave data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create leave request" });
      }
    }
  });

  app.get('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leaves = await storage.getUserLeaves(userId);
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      res.status(500).json({ message: "Failed to fetch leaves" });
    }
  });

  app.put('/api/leaves/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedLeave = await storage.updateLeave(id, updates);
      res.json(updatedLeave);
    } catch (error) {
      console.error("Error updating leave:", error);
      res.status(500).json({ message: "Failed to update leave" });
    }
  });

  app.delete('/api/leaves/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLeave(id);
      res.json({ message: "Leave deleted successfully" });
    } catch (error) {
      console.error("Error deleting leave:", error);
      res.status(500).json({ message: "Failed to delete leave" });
    }
  });

  // Attendance routes
  app.get('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      const records = await storage.getAttendanceRecords(userId, month, year);
      
      // Calculate stats
      const stats = {
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        leave: records.filter(r => r.status === 'leave').length,
        wfh: records.filter(r => r.status === 'wfh').length
      };
      
      res.json({ records, stats });
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.get('/api/attendance/absent-dates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 7;
      const absentDates = await storage.getAbsentDates(userId, days);
      res.json(absentDates);
    } catch (error) {
      console.error("Error fetching absent dates:", error);
      res.status(500).json({ message: "Failed to fetch absent dates" });
    }
  });

  app.post('/api/attendance/regularize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date, status, reason } = req.body;
      
      const record = await storage.createAttendanceRecord({
        userId,
        date,
        status,
        regularizationReason: reason,
        regularizedAt: new Date()
      });
      
      res.json(record);
    } catch (error) {
      console.error("Error regularizing attendance:", error);
      res.status(500).json({ message: "Failed to regularize attendance" });
    }
  });

  // Salary slip routes
  app.get('/api/salary-slips', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const slips = await storage.getSalarySlips(userId);
      res.json(slips);
    } catch (error) {
      console.error("Error fetching salary slips:", error);
      res.status(500).json({ message: "Failed to fetch salary slips" });
    }
  });

  app.get('/api/salary-slips/:month/:year', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month, year } = req.params;
      const slip = await storage.getSalarySlip(userId, parseInt(month), parseInt(year));
      
      if (!slip) {
        return res.status(404).json({ message: "Salary slip not found" });
      }
      
      res.json(slip);
    } catch (error) {
      console.error("Error fetching salary slip:", error);
      res.status(500).json({ message: "Failed to fetch salary slip" });
    }
  });

  // HR Documents routes
  app.get('/api/hr-documents', isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getHrDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching HR documents:", error);
      res.status(500).json({ message: "Failed to fetch HR documents" });
    }
  });

  app.post('/api/hr-documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const { category } = req.body;

      // Read file content for processing
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Process document for vectorization
      const chunks = await processDocumentForVectorization(fileContent, req.file.originalname);

      const document = await storage.createHrDocument({
        name: req.file.originalname,
        category: category || 'general',
        filePath: filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: userId,
        vectorCount: chunks.length,
        processedAt: new Date()
      });

      res.json(document);
    } catch (error) {
      console.error("Error uploading HR document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete('/api/hr-documents/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteHrDocument(id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting HR document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/ask', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { question } = req.body;

      if (!question?.trim()) {
        return res.status(400).json({ message: "Question is required" });
      }

      // Get HR documents for context
      const documents = await storage.getHrDocuments();
      
      // Simulate document content (in real implementation, you'd extract text from files)
      const documentContext = documents.map(doc => ({
        name: doc.name,
        content: `HR Policy document: ${doc.name}. Category: ${doc.category}. This document contains company policies and procedures.`,
        category: doc.category
      }));

      const { answer, documentsUsed } = await askHRAssistant(question, documentContext);

      // Save conversation
      await storage.createAiConversation({
        userId,
        question,
        answer,
        documentsUsed
      });

      res.json({ answer, documentsUsed });
    } catch (error) {
      console.error("Error processing AI question:", error);
      res.status(500).json({ message: "Failed to process your question. Please try again." });
    }
  });

  app.get('/api/ai/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
