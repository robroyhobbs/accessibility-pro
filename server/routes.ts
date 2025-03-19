import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scanWebsite } from "./scanner";
import { urlInputSchema, type InsertScan } from "@shared/schema";
import { isSafeUrl } from "../client/src/lib/validators";
import { setupAuth } from "./auth";

// Middleware to ensure user is authenticated
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  // Rate limiting middleware
  const rateLimits = new Map<string, { count: number, resetTime: number }>();
  
  const rateLimit = (req: Request, res: Response, next: NextFunction) => {
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
  app.post("/api/scan", rateLimit, async (req: Request, res: Response) => {
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
      
      // Check if user is authenticated
      const userId = req.isAuthenticated() ? (req.user as Express.User).id : null;
      const isPaid = req.body.isPaid === true && userId !== null;
      
      // Perform the scan
      const scanResult = await scanWebsite(url);
      
      // Save the scan result to storage
      const scanData: InsertScan = {
        url,
        score: scanResult.score,
        passedChecks: scanResult.passedChecks,
        issueCount: scanResult.issueCount,
        violations: scanResult.violations,
        userId,
        isPaid
      };
      
      // Store the scan in the database
      const savedScan = await storage.createScan(scanData);
      
      // Return the results
      return res.status(200).json({
        ...scanResult,
        scanId: savedScan.id
      });
    } catch (error: any) {
      // Handle timeout error specifically
      if (error.message && error.message.includes('timeout')) {
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
  
  // Get recent scans (for demo/public view)
  app.get("/api/scans/recent", async (req: Request, res: Response) => {
    try {
      const recentScans = await storage.getLatestScans(10); // Get 10 most recent scans
      return res.status(200).json(recentScans);
    } catch (error) {
      console.error("Error fetching recent scans:", error);
      return res.status(500).json({
        message: "An error occurred while fetching recent scans."
      });
    }
  });
  
  // Get a specific scan by ID
  app.get("/api/scans/:id", async (req: Request, res: Response) => {
    try {
      const scanId = parseInt(req.params.id);
      
      if (isNaN(scanId)) {
        return res.status(400).json({
          message: "Invalid scan ID. Please provide a valid numeric ID."
        });
      }
      
      const scan = await storage.getScan(scanId);
      
      if (!scan) {
        return res.status(404).json({
          message: "Scan not found. The requested scan does not exist."
        });
      }
      
      // If the scan belongs to a user, ensure the requester is authorized
      if (scan.userId !== null && req.isAuthenticated()) {
        if (scan.userId !== (req.user as Express.User).id) {
          return res.status(403).json({
            message: "You do not have permission to access this scan."
          });
        }
      }
      
      return res.status(200).json(scan);
    } catch (error) {
      console.error("Error fetching scan:", error);
      return res.status(500).json({
        message: "An error occurred while fetching the scan."
      });
    }
  });

  // Get all scans for the authenticated user
  app.get("/api/user/scans", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as Express.User).id;
      const userScans = await storage.getUserScans(userId);
      return res.status(200).json(userScans);
    } catch (error) {
      console.error("Error fetching user scans:", error);
      return res.status(500).json({
        message: "An error occurred while fetching your scans."
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
