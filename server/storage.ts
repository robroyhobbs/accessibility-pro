import { users, scans, type User, type InsertUser, type Scan, type InsertScan } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc } from "drizzle-orm";
import pg from "pg";
const { Pool } = pg;
import connectPgSimple from "connect-pg-simple";
import * as dotenv from "dotenv";

dotenv.config();

const MemoryStore = createMemoryStore(session);
const PgSessionStore = connectPgSimple(session);

// Database connection setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle
const db = drizzle(pool);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  // Scan operations
  getScan(id: number): Promise<Scan | undefined>;
  getUserScans(userId: number): Promise<Scan[]>;
  createScan(scan: InsertScan): Promise<Scan>;
  getLatestScans(limit: number): Promise<Scan[]>;
  
  // Subscription operations
  updateSubscription(
    userId: number, 
    stripeCustomerId: string, 
    subscriptionStatus: string,
    subscriptionEndsAt: Date | null
  ): Promise<User>;
  
  // Session store for authentication
  sessionStore: session.Store;
  
  // Database setup (for initializing tables)
  setupDatabase(): Promise<void>;
}

export class PostgresStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSessionStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  async setupDatabase(): Promise<void> {
    try {
      // Create session table for authentication
      await pool.query(`
        CREATE TABLE IF NOT EXISTS session (
          sid VARCHAR(255) PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
      `);
      
      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Create scans table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS scans (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL,
          score INTEGER NOT NULL,
          "passedChecks" INTEGER NOT NULL,
          "issueCount" INTEGER NOT NULL,
          violations JSONB NOT NULL,
          "userId" INTEGER REFERENCES users(id),
          "isPaid" BOOLEAN DEFAULT FALSE,
          "isMultiPage" BOOLEAN DEFAULT FALSE,
          "scanDepth" INTEGER DEFAULT 1,
          "pagesScanned" JSONB DEFAULT '[]',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log("Database setup completed");
    } catch (error) {
      console.error("Error setting up database:", error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async updateSubscription(
    userId: number,
    stripeCustomerId: string,
    subscriptionStatus: string,
    subscriptionEndsAt: Date | null
  ): Promise<User> {
    return this.updateUser(userId, {
      stripeCustomerId,
      subscriptionStatus,
      subscriptionEndsAt
    });
  }
  
  async getScan(id: number): Promise<Scan | undefined> {
    const result = await db.select().from(scans).where(eq(scans.id, id));
    return result[0];
  }
  
  async getUserScans(userId: number): Promise<Scan[]> {
    const result = await db
      .select()
      .from(scans)
      .where(eq(scans.userId, userId))
      .orderBy(desc(scans.createdAt));
    return result;
  }
  
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const result = await db.insert(scans).values(insertScan).returning();
    return result[0];
  }
  
  async getLatestScans(limit: number): Promise<Scan[]> {
    const result = await db
      .select()
      .from(scans)
      .orderBy(desc(scans.createdAt))
      .limit(limit);
    return result;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scans: Map<number, Scan>;
  private userIdCounter: number;
  private scanIdCounter: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
    this.userIdCounter = 1;
    this.scanIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }

  async setupDatabase(): Promise<void> {
    // No setup needed for in-memory storage
    console.log("Using in-memory storage (no database setup required)");
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      stripeCustomerId: null,
      subscriptionStatus: "free",
      subscriptionEndsAt: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User ${id} not found`);
    }
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateSubscription(
    userId: number,
    stripeCustomerId: string,
    subscriptionStatus: string,
    subscriptionEndsAt: Date | null
  ): Promise<User> {
    return this.updateUser(userId, {
      stripeCustomerId,
      subscriptionStatus,
      subscriptionEndsAt
    });
  }
  
  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }
  
  async getUserScans(userId: number): Promise<Scan[]> {
    return Array.from(this.scans.values())
      .filter(scan => scan.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.scanIdCounter++;
    const userId = insertScan.userId ?? null;
    const scan: Scan = {
      ...insertScan,
      id,
      userId,
      isPaid: insertScan.isPaid ?? false,
      isMultiPage: insertScan.isMultiPage ?? false,
      scanDepth: insertScan.scanDepth ?? 1,
      pagesScanned: insertScan.pagesScanned ?? [],
      createdAt: new Date()
    };
    this.scans.set(id, scan);
    return scan;
  }
  
  async getLatestScans(limit: number): Promise<Scan[]> {
    return Array.from(this.scans.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

// Choose storage implementation based on environment
// If DATABASE_URL is available, use PostgreSQL, otherwise use in-memory storage
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
