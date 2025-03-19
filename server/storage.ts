import { users, type User, type InsertUser, type Scan, type InsertScan, type ScanResult } from "@shared/schema";

// Storage interface with CRUD methods for users and scans
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Scan operations
  getScan(id: number): Promise<Scan | undefined>;
  getUserScans(userId: number): Promise<Scan[]>;
  createScan(scan: InsertScan): Promise<Scan>;
  getLatestScans(limit: number): Promise<Scan[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scans: Map<number, Scan>;
  private userIdCounter: number;
  private scanIdCounter: number;

  constructor() {
    this.users = new Map();
    this.scans = new Map();
    this.userIdCounter = 1;
    this.scanIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Scan operations
  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }
  
  async getUserScans(userId: number): Promise<Scan[]> {
    return Array.from(this.scans.values())
      .filter(scan => scan.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by most recent
  }
  
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = this.scanIdCounter++;
    // Ensure userId is not undefined
    const userId = insertScan.userId ?? null;
    const scan: Scan = {
      ...insertScan,
      id,
      userId,
      isPaid: insertScan.isPaid ?? false,  // Default to false if not provided
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

export const storage = new MemStorage();
