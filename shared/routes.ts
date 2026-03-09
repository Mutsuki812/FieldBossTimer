import { z } from 'zod';
import { insertScheduleSchema, insertReportSchema, insertFeedbackSchema, schedules, reports, feedbacks } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  schedules: {
    list: {
      method: 'GET' as const,
      path: '/api/schedules' as const,
      input: z.object({ dayOfWeek: z.coerce.number().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof schedules.$inferSelect>()) },
    },
  },
  reports: {
    list: {
      method: 'GET' as const,
      path: '/api/reports' as const,
      input: z.object({ bossType: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof reports.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reports' as const,
      input: insertReportSchema,
      responses: { 201: z.custom<typeof reports.$inferSelect>(), 400: errorSchemas.validation },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reports/:id' as const,
      input: z.object({ token: z.string(), reporterName: z.string() }),
      responses: { 204: z.void(), 401: errorSchemas.unauthorized, 404: errorSchemas.notFound },
    },
  },
  feedbacks: {
    list: {
      method: 'GET' as const,
      path: '/api/feedbacks' as const,
      responses: { 200: z.array(z.custom<typeof feedbacks.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/feedbacks' as const,
      input: insertFeedbackSchema,
      responses: { 201: z.custom<typeof feedbacks.$inferSelect>(), 400: errorSchemas.validation },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
