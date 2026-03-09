import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (0 is Sunday)
  bossType: text("boss_type").notNull(), // 'suspicious_ritual', 'baiqing', 'xianhuan'
  appearanceTime: text("appearance_time").notNull(), // "HH:MM"
  location: text("location").notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  bossType: text("boss_type").notNull(),
  appearanceTime: timestamp("appearance_time").notNull(),
  appearanceMethod: text("appearance_method").notNull(), // 'system', 'thunder', 'unsure'
  reporterName: text("reporter_name").notNull(),
  token: text("token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'schedule_error', 'general'
  content: text("content").notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types and Schemas
export const insertScheduleSchema = createInsertSchema(schedules);
export const insertReportSchema = createInsertSchema(reports, {
  appearanceTime: z.coerce.date(),
}).omit({ id: true, createdAt: true });
export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({ id: true, createdAt: true });

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type DeleteReportRequest = {
  token: string;
  reporterName: string;
};
