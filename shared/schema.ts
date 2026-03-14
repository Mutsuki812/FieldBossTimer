import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const timeList = pgTable("time_list", {
  id: serial("id").primaryKey(),
  week: integer("week").notNull(), // 0-6 (0 is Sunday)
  gishikiTime: text("gishiki_time").notNull(), // "HH:MM" 可疑的儀式
  gishiki: text("gishiki").notNull(), // 位置
  shiraoTime: text("shirao_time").notNull(), // "HH:MM" 白青野王
  shirao: text("shirao").notNull(), // 位置
  sengenTime: text("sengen_time").notNull(), // "HH:MM" 仙幻島野王
  sengen: text("sengen").notNull(), // 位置
});

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
export const insertTimeListSchema = createInsertSchema(timeList).omit({ id: true });
export const insertScheduleSchema = createInsertSchema(schedules);
export const insertReportSchema = createInsertSchema(reports, {
  appearanceTime: z.coerce.date(),
}).omit({ id: true, createdAt: true });
export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({ id: true, createdAt: true });

export type TimeList = typeof timeList.$inferSelect;
export type InsertTimeList = z.infer<typeof insertTimeListSchema>;

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
