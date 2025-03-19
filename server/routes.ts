import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scanWebsite } from "./scanner";
import { urlInputSchema } from "@shared/schema";
import { isSafeUrl } from "../client/src/lib/validators";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting middleware
  const rateLimits = new Map<string, { count: number, resetTime: number }>();
  
  const rateLimit = (req: any, res: any, next: any) => {
    const ip = req.ip;
    const now = Date.now();
    const FREE_SCANS_PER_DAY = 3;
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, { count: 1, resetTime: now + DAY_IN_MS });
      return next();
    }
    
    const userLimit = rateLimits.get(ip)!;
    
    // Reset counter if day has passed
    if (now > userLimit.resetTime) {
      rateLimits.set(ip, { count: 1, resetTime: now + DAY_IN_MS });
      return next();
    }
    
    // Check if user has exceeded limit
    if (userLimit.count >= FREE_SCANS_PER_DAY) {
      return res.status(429).json({
        message: "Rate limit exceeded. Free tier allows 3 scans per day."
      });
    }
    
    // Increment counter
    userLimit.count++;
    rateLimits.set(ip, userLimit);
    next();
  };
  
  // Endpoint to scan a website
  app.post("/api/scan", rateLimit, async (req, res) => {
    try {
      // Validate URL
      const parseResult = urlInputSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid URL. Please provide a valid http or https URL.",
        });
      }
      
      const { url } = parseResult.data;
      
      // Check if URL is safe to scan
      if (!isSafeUrl(url)) {
        return res.status(400).json({
          message: "For security reasons, we cannot scan local or private network URLs.",
        });
      }
      
      // Perform the scan
      const scanResult = await scanWebsite(url);
      
      // Return the results
      return res.status(200).json(scanResult);
    } catch (error: any) {
      // Handle timeout error specifically
      if (error.message.includes('timeout')) {
        return res.status(504).json({
          message: "Scan timed out. The website might be too complex or slow to respond.",
        });
      }
      
      console.error("Scan error:", error);
      return res.status(500).json({
        message: "An error occurred while scanning the website.",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
