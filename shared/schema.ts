import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Scan schema
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  url: text("url").notNull(),
  score: integer("score").notNull(),
  passedChecks: integer("passedChecks").notNull(),
  issueCount: integer("issueCount").notNull(),
  violations: jsonb("violations").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),
  isMultiPage: boolean("isMultiPage").default(false).notNull(),
  scanDepth: integer("scanDepth").default(1).notNull(),
  pagesScanned: jsonb("pagesScanned").default([]).notNull(),
});

// URL input schema for validation
export const urlInputSchema = z.object({
  url: z.string().url("Please enter a valid URL").refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: "URL must start with http:// or https://" }
  ),
  isMultiPage: z.boolean().default(false),
  scanDepth: z.number().int().min(1).max(10).default(1)
    .refine(depth => !depth || depth <= 3 || true, {
      message: "Scan depth greater than 3 requires a premium account"
    }),
});

// Violation schema for type safety
export const violationSchema = z.object({
  id: z.string(),
  description: z.string(),
  impact: z.string(),
  count: z.number(),
  wcagLevel: z.string(),
  principle: z.string(),
});

// Page result schema
export const pageResultSchema = z.object({
  url: z.string(),
  score: z.number(),
  passedChecks: z.number(),
  issueCount: z.number(),
  violations: z.array(violationSchema),
});

// Scan result schema
export const scanResultSchema = z.object({
  score: z.number(),
  passedChecks: z.number(),
  issueCount: z.number(),
  violations: z.array(violationSchema),
  isMultiPage: z.boolean().default(false),
  pagesScanned: z.array(z.string()).default([]),
  pageResults: z.array(pageResultSchema).optional(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertScanSchema = createInsertSchema(scans).omit({ id: true, createdAt: true });

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Scan = typeof scans.$inferSelect;
export type InsertScan = z.infer<typeof insertScanSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;
export type PageResult = z.infer<typeof pageResultSchema>;
export type Violation = z.infer<typeof violationSchema>;
