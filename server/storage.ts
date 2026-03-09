import { db } from "./db";
import {
  schedules, reports, feedbacks,
  type Schedule, type InsertSchedule,
  type Report, type InsertReport,
  type Feedback, type InsertFeedback,
  type DeleteReportRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getSchedules(dayOfWeek?: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getReports(bossType?: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(id: number, req: DeleteReportRequest): Promise<boolean>;
  getFeedbacks(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
}

export class DatabaseStorage implements IStorage {
  async getSchedules(dayOfWeek?: number): Promise<Schedule[]> {
    if (dayOfWeek !== undefined) {
      return await db.select().from(schedules).where(eq(schedules.dayOfWeek, dayOfWeek));
    }
    return await db.select().from(schedules);
  }
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [created] = await db.insert(schedules).values(schedule).returning();
    return created;
  }
  async getReports(bossType?: string): Promise<Report[]> {
    if (bossType !== undefined) {
      return await db.select().from(reports).where(eq(reports.bossType, bossType)).orderBy(desc(reports.appearanceTime));
    }
    return await db.select().from(reports).orderBy(desc(reports.appearanceTime));
  }
  async createReport(report: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }
  async deleteReport(id: number, req: DeleteReportRequest): Promise<boolean> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    if (!report) return false;
    if (report.token !== req.token || report.reporterName !== req.reporterName) {
      throw new Error("Unauthorized");
    }
    await db.delete(reports).where(eq(reports.id, id));
    return true;
  }
  async getFeedbacks(): Promise<Feedback[]> {
    return await db.select().from(feedbacks).orderBy(desc(feedbacks.createdAt));
  }
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [created] = await db.insert(feedbacks).values(feedback).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
