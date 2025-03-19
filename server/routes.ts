import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scanWebsite } from "./scanner";
import { urlInputSchema, type InsertScan } from "@shared/schema";
import { isSafeUrl } from "../client/src/lib/validators";
import { setupAuth } from "./auth";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia"
});

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
    const ip = req.ip || 'unknown-ip';
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
      
      const { url, isMultiPage, scanDepth } = parseResult.data;
      
      // Check if URL is safe to scan
      if (!isSafeUrl(url)) {
        return res.status(400).json({
          message: "For security reasons, we cannot scan local or private network URLs.",
        });
      }
      
      // Check if user is authenticated
      const userId = req.isAuthenticated() ? (req.user as Express.User).id : null;
      const isPaid = req.isAuthenticated() && userId !== null;
      
      // Validate if multi-page scanning is allowed for this user
      if (isMultiPage && !isPaid) {
        return res.status(403).json({
          message: "Multi-page scanning is a premium feature. Please log in to use this feature.",
          requiresAuth: true
        });
      }
      
      // Validate scan depth for premium users
      if (isMultiPage && isPaid && scanDepth > 3) {
        // Premium users can scan up to 10 pages, but we need to make sure they're authenticated
        if (!req.isAuthenticated()) {
          return res.status(401).json({
            message: "Authentication required for deep scanning.",
            requiresAuth: true
          });
        }
      } else if (isMultiPage && !isPaid && scanDepth > 1) {
        // Free users can only scan 1 page
        return res.status(403).json({
          message: "Deep scanning is a premium feature. Please log in to scan multiple pages.",
          requiresAuth: true
        });
      }
      
      // Perform the scan with the appropriate parameters
      const finalScanDepth = isPaid ? scanDepth : 1;
      const finalIsMultiPage = isPaid ? isMultiPage : false;
      
      // Execute the scan with appropriate parameters
      const scanResult = await scanWebsite(url, finalIsMultiPage, finalScanDepth);
      
      // Save the scan result to storage
      const scanData: InsertScan = {
        url,
        score: scanResult.score,
        passedChecks: scanResult.passedChecks,
        issueCount: scanResult.issueCount,
        violations: scanResult.violations,
        userId,
        isPaid,
        isMultiPage: finalIsMultiPage,
        scanDepth: finalScanDepth,
        pagesScanned: scanResult.pagesScanned
      };
      
      // Store the scan in the database
      const savedScan = await storage.createScan(scanData);
      
      // Return the results
      return res.status(200).json({
        ...scanResult,
        scanId: savedScan.id,
        isPremiumFeature: isMultiPage && scanDepth > 1
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

  // Create a Stripe Checkout Session for subscription
  app.post("/api/create-checkout-session", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = req.user as Express.User;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              recurring: {
                interval: "month"
              },
              product_data: {
                name: "WCAG Pro Subscription",
                description: "Unlimited accessibility scans with multi-page support"
              },
              unit_amount: 1999, // $19.99 per month
            },
            quantity: 1,
          },
        ],
        success_url: `${req.protocol}://${req.get("host")}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/subscription/cancel`,
        customer_email: user.email,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Error creating checkout session" });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/webhooks", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (!sig || !endpointSecret) {
        throw new Error("Missing Stripe webhook signature or secret");
      }
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        endpointSecret
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send("Webhook Error");
    }

    try {
      // Handle subscription lifecycle events
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.customer_email) {
            const user = await storage.getUserByUsername(session.customer_email);
            if (user) {
              await storage.updateSubscription(
                user.id,
                session.customer as string,
                "active",
                null // No end date for active subscriptions
              );
            }
          }
          break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          if (subscription.customer) {
            const customerId = typeof subscription.customer === "string" 
              ? subscription.customer 
              : subscription.customer.id;
            
            const status = subscription.status === "active" ? "active" : "canceled";
            const endsAt = subscription.status === "active"
              ? null
              : new Date(subscription.current_period_end * 1000);

            // Update all users with this customer ID
            const user = await storage.getUser(Number(subscription.metadata.userId));
            if (user) {
              await storage.updateSubscription(
                user.id,
                customerId,
                status,
                endsAt
              );
            }
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ message: "Error processing webhook" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
