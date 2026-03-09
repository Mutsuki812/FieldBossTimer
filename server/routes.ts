import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.schedules.list.path, async (req, res) => {
    const dayOfWeek = req.query.dayOfWeek ? Number(req.query.dayOfWeek) : undefined;
    const items = await storage.getSchedules(dayOfWeek);
    res.json(items);
  });

  app.get(api.reports.list.path, async (req, res) => {
    const bossType = req.query.bossType ? String(req.query.bossType) : undefined;
    const items = await storage.getReports(bossType);
    res.json(items);
  });

  app.post(api.reports.create.path, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);
      const report = await storage.createReport(input);
      res.status(201).json(report);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.reports.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.reports.delete.input.parse(req.body);
      const success = await storage.deleteReport(id, input);
      if (!success) {
        return res.status(404).json({ message: "Not found" });
      }
      res.status(204).end();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (err instanceof Error && err.message === "Unauthorized") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.feedbacks.list.path, async (req, res) => {
    const items = await storage.getFeedbacks();
    res.json(items);
  });

  app.post(api.feedbacks.create.path, async (req, res) => {
    try {
      const input = api.feedbacks.create.input.parse(req.body);
      const feedback = await storage.createFeedback(input);
      res.status(201).json(feedback);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Seed data once
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const schedules = await storage.getSchedules();
  if (schedules.length === 0) {
    const bosses = ['suspicious_ritual', 'baiqing', 'xianhuan'];
    const locations = ['白青山脈', '仙幻島', '水月平原', '大漠'];
    
    // Create some fake schedules for each day of the week
    for (let day = 0; day <= 6; day++) {
      for (const boss of bosses) {
        await storage.createSchedule({
          dayOfWeek: day,
          bossType: boss,
          appearanceTime: "10:00",
          location: locations[Math.floor(Math.random() * locations.length)]
        });
        await storage.createSchedule({
          dayOfWeek: day,
          bossType: boss,
          appearanceTime: "16:00",
          location: locations[Math.floor(Math.random() * locations.length)]
        });
        await storage.createSchedule({
          dayOfWeek: day,
          bossType: boss,
          appearanceTime: "22:00",
          location: locations[Math.floor(Math.random() * locations.length)]
        });
      }
    }
  }
}
