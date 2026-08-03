import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { MongoClient, Db } from 'mongodb';

import {
  initialStats,
  initialPerformanceTrend,
  initialStudents,
  initialTeachers,
  initialAssessments,
  initialNotices,
  initialNotifications,
} from './src/data/mockData.js';
import { Student, Teacher, Assessment, Notice, StudentMark, SystemNotification, SchoolStats } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS & Vercel serverless route normalization middleware
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? '' : '/') + req.url;
  }
  next();
});


// Disk Persistence Configuration Path
const CONFIG_FILE_PATH = path.join(process.cwd(), 'mongo_config.json');

function saveMongoConfig(uri: string): void {
  try {
    const data = JSON.stringify({ MONGODB_URI: uri }, null, 2);
    fs.writeFileSync(CONFIG_FILE_PATH, data, 'utf-8');
    console.log('[MongoConfig] Persisted MONGODB_URI to mongo_config.json on disk.');
  } catch (err) {
    console.error('[MongoConfig] Error writing to mongo_config.json:', err);
  }
}

function loadMongoConfig(): string | null {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.MONGODB_URI === 'string' && parsed.MONGODB_URI.trim()) {
        return parsed.MONGODB_URI.trim();
      }
    }
  } catch (err) {
    console.error('[MongoConfig] Error reading mongo_config.json:', err);
  }
  return null;
}

// In-Memory Fallback State
interface UserAccount {
  id: string;
  email: string;
  password: string;
  userName: string;
  userType: 'principal' | 'teacher';
  designation?: string;
  department?: string;
  photoUrl?: string;
  phone?: string;
  resetCode?: string;
  resetCodeExpires?: number;
  resetApproved?: boolean;
}

const initialUsers: UserAccount[] = [];

let memoryUsers: UserAccount[] = [];
let memoryStats: SchoolStats = {
  totalStudents: 0,
  studentGrowthPercentage: 0,
  totalTeachers: 0,
  activeTeachers: 0,
  passPercentage: 0,
  passPercentageTier: 'No Data',
  criticalAlerts: 0,
  campusName: 'Punjab Daanish School & Center of Excellence',
  principalName: '',
  principalEmail: '',
};
let memoryPerformanceTrend: any[] = [];
let memoryStudents: Student[] = [];
let memoryTeachers: Teacher[] = [];
let memoryAssessments: Assessment[] = [];
let memoryNotices: Notice[] = [];
let memoryNotifications: SystemNotification[] = [];
let memorySettings = {
  campusName: 'Punjab Daanish School & Center of Excellence',
  principalName: '',
  principalEmail: '',
  grades: ["6th","7th","8th","9th","10th","11th","12th"],
  sections: ["Section A", "Section B","Section C"],
  departments: ["English","General Science","Mathematics","Urdu","Chemistry","Physics"],
  houses: ["Chenab", "Ravi", "Jhelum", "Indus", "Jinnah", "Liaquat"],
  academicYear: '2024-2025',
  targetBenchmark: 80,
};

// MongoDB Client setup
let dbClient: MongoClient | null = null;
let mongoDb: Db | null = null;

async function connectAndActivateMongo(mongoUri: string) {
  const uri = mongoUri.trim();
  if (!uri) throw new Error('MongoDB URI cannot be empty');

  // Close existing client if active
  if (dbClient) {
    try {
      await dbClient.close();
    } catch (e) {
      console.error('Error closing previous MongoDB client:', e);
    }
    dbClient = null;
    mongoDb = null;
  }

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 30000,
    retryWrites: true,
  });
  await client.connect();
  const db = client.db('daanish_schools_db');
  await db.admin().ping();

  dbClient = client;
  mongoDb = db;
  process.env.MONGODB_URI = uri;

  // Persist URI to mongo_config.json
  saveMongoConfig(uri);

  // Sync existing MongoDB records into memory state without injecting mock data
  try {
    memoryStudents = (await mongoDb.collection('students').find({}).toArray()) as unknown as Student[];
    memoryTeachers = (await mongoDb.collection('teachers').find({}).toArray()) as unknown as Teacher[];
    memoryAssessments = (await mongoDb.collection('assessments').find({}).toArray()) as unknown as Assessment[];
    memoryNotices = (await mongoDb.collection('notices').find({}).toArray()) as unknown as Notice[];
    memoryNotifications = (await mongoDb.collection('notifications').find({}).toArray()) as unknown as SystemNotification[];
    const usersInDb = (await mongoDb.collection('users').find({}).toArray()) as unknown as UserAccount[];
    if (Array.isArray(usersInDb)) {
      memoryUsers = usersInDb;
    }
    const savedSettings = await mongoDb.collection('settings').findOne({});
    if (savedSettings) {
      if (savedSettings.campusName) memorySettings.campusName = savedSettings.campusName;
      if (savedSettings.principalName) memorySettings.principalName = savedSettings.principalName;
      if (savedSettings.principalEmail) memorySettings.principalEmail = savedSettings.principalEmail;
      if (Array.isArray(savedSettings.grades) && savedSettings.grades.length > 0) memorySettings.grades = savedSettings.grades;
      if (Array.isArray(savedSettings.sections) && savedSettings.sections.length > 0) memorySettings.sections = savedSettings.sections;
      if (Array.isArray(savedSettings.departments) && savedSettings.departments.length > 0) memorySettings.departments = savedSettings.departments;
      if (Array.isArray(savedSettings.houses) && savedSettings.houses.length > 0) memorySettings.houses = savedSettings.houses;
      if (typeof savedSettings.targetBenchmark === 'number') memorySettings.targetBenchmark = savedSettings.targetBenchmark;
    }
  } catch (e) {
    console.error('Error syncing existing MongoDB records to memory:', e);
  }

  const counts = {
    students: await mongoDb.collection('students').countDocuments(),
    teachers: await mongoDb.collection('teachers').countDocuments(),
    assessments: await mongoDb.collection('assessments').countDocuments(),
    notices: await mongoDb.collection('notices').countDocuments(),
  };

  return { dbName: db.databaseName, counts };
}

async function getMongoDb(): Promise<Db | null> {
  if (mongoDb) {
    try {
      await mongoDb.admin().ping();
      return mongoDb;
    } catch (e: any) {
      console.warn('[getMongoDb] Active MongoDB connection ping failed. Resetting client and auto-reconnecting...', e?.message || e);
      mongoDb = null;
      if (dbClient) {
        try {
          await dbClient.close();
        } catch (err) {}
        dbClient = null;
      }
    }
  }

  const savedUri = process.env.MONGODB_URI || loadMongoConfig();
  if (savedUri && savedUri.trim()) {
    try {
      console.log('[getMongoDb] Restoring connection using stored MongoDB URI...');
      await connectAndActivateMongo(savedUri);
      return mongoDb;
    } catch (err: any) {
      console.error('[getMongoDb] Auto-reconnection failed:', err?.message || err);
    }
  }

  return null;
}

async function initMongoDB() {
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.trim() === '') {
    mongoUri = loadMongoConfig() || '';
  }
  if (mongoUri && mongoUri.trim() !== '') {
    try {
      await connectAndActivateMongo(mongoUri);
      console.log('[InitMongoDB] Successfully connected and initialized MongoDB.');
    } catch (err) {
      console.error('Failed to connect to MongoDB on startup, falling back to local storage:', err);
      mongoDb = null;
    }
  }
}

if (!process.env.VERCEL) {
  initMongoDB().catch((err) => console.error(err));
}


// Helper lazy Gemini setup
function getGeminiClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey && customApiKey.trim().length > 0) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Connect & Activate MongoDB URI (All future operations persist to this database)
app.post('/api/db/connect-mongo', async (req: Request, res: Response) => {
  const { mongoUri } = req.body;
  if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.trim()) {
    return res.status(400).json({ success: false, error: 'Valid MongoDB connection URI required.' });
  }

  try {
    const result = await connectAndActivateMongo(mongoUri);
    res.json({
      success: true,
      message: `Successfully connected & switched to active MongoDB database "${result.dbName}"! All future records will be saved to this database.`,
      dbName: result.dbName,
      counts: result.counts,
      isConnected: true,
    });
  } catch (err: any) {
    console.error('MongoDB connection failed:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to connect to MongoDB cluster with provided URI.',
    });
  }
});

// Test/Connect MongoDB URI Endpoint
app.post('/api/db/test-mongo', async (req: Request, res: Response) => {
  const { mongoUri } = req.body;
  if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.trim()) {
    return res.status(400).json({ success: false, error: 'Valid MongoDB connection URI required.' });
  }

  try {
    const result = await connectAndActivateMongo(mongoUri);
    res.json({
      success: true,
      message: `Connected and set as active MongoDB database "${result.dbName}"! All new records will now save directly to this cluster.`,
      dbName: result.dbName,
      counts: result.counts,
      isConnected: true,
    });
  } catch (err: any) {
    console.error('MongoDB connection test failed:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to connect to MongoDB cluster with provided URI.',
    });
  }
});

// Get MongoDB Status Endpoint (Performs live admin ping verification & auto-reconnect via getMongoDb())
app.get('/api/db/status', async (_req: Request, res: Response) => {
  let isConnected = false;
  let dbName = null;
  let counts = null;

  const db = await getMongoDb();
  if (db) {
    try {
      isConnected = true;
      dbName = db.databaseName;
      counts = {
        students: await db.collection('students').countDocuments(),
        teachers: await db.collection('teachers').countDocuments(),
        assessments: await db.collection('assessments').countDocuments(),
      };
    } catch (e: any) {
      console.error('MongoDB live status check failed:', e?.message || e);
      isConnected = false;
    }
  }

  res.json({ isConnected, dbName, counts });
});

// Disconnect MongoDB Endpoint
app.post('/api/db/disconnect', async (_req: Request, res: Response) => {
  if (dbClient) {
    try {
      await dbClient.close();
    } catch (e) {}
    dbClient = null;
  }
  mongoDb = null;
  process.env.MONGODB_URI = '';
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      fs.unlinkSync(CONFIG_FILE_PATH);
    }
  } catch (e) {}
  res.json({ success: true, message: 'MongoDB cluster disconnected. Switched to local memory mode.' });
});

// Reconnect MongoDB Endpoint
app.post('/api/db/reconnect', async (req: Request, res: Response) => {
  const mongoUri = req.body?.mongoUri || process.env.MONGODB_URI || loadMongoConfig();
  if (!mongoUri || typeof mongoUri !== 'string' || !mongoUri.trim()) {
    return res.status(400).json({
      success: false,
      error: 'No MongoDB URI configured. Please provide a connection string in Settings > Database Configuration.',
    });
  }

  try {
    const result = await connectAndActivateMongo(mongoUri);
    res.json({
      success: true,
      message: `Successfully connected & activated MongoDB database "${result.dbName}"!`,
      dbName: result.dbName,
      counts: result.counts,
      isConnected: true,
    });
  } catch (err: any) {
    console.error('MongoDB reconnection failed:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to reconnect to MongoDB Atlas cluster. Please check IP whitelist and connection credentials.',
    });
  }
});

// ================= AUTHENTICATION & USER MANAGEMENT API =================

// 1. User Login Endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Password is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  let userList = memoryUsers;
  const db = await getMongoDb();
  if (db) {
    try {
      const dbUsers = (await db.collection('users').find({}).toArray()) as unknown as UserAccount[];
      if (Array.isArray(dbUsers)) userList = dbUsers;
    } catch (e) {}
  }

  // Search registered accounts
  let found = userList.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    return res.status(401).json({
      success: false,
      error: `No account registered with email address "${email}". Please register an account or ask your Principal.`,
    });
  }

  if (found.password !== cleanPassword) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password entered. Please try again.',
    });
  }

  res.json({
    success: true,
    message: 'Login successful!',
    user: {
      isLoggedIn: true,
      userType: found.userType,
      userName: found.userName,
      userEmail: found.email,
      avatarUrl: found.photoUrl,
      designation: found.designation,
    },
  });
});

// Update User Profile Endpoint
app.put('/api/auth/profile', async (req: Request, res: Response) => {
  const { userType, userName, userEmail, oldEmail, phone, avatarUrl, department, designation, newPassword } = req.body;

  if (!userName || !userEmail) {
    return res.status(400).json({ success: false, error: 'User name and email address are required.' });
  }

  const lookupEmail = (oldEmail || userEmail).trim().toLowerCase();
  const cleanEmail = userEmail.trim().toLowerCase();
  const cleanName = userName.trim();

  let user = memoryUsers.find((u) => u.email.toLowerCase() === lookupEmail || u.email.toLowerCase() === cleanEmail);

  if (user) {
    user.userName = cleanName;
    user.email = cleanEmail;
    if (phone) user.phone = phone;
    if (avatarUrl) user.photoUrl = avatarUrl;
    if (department) user.department = department;
    if (designation) user.designation = designation;
    if (newPassword && newPassword.trim()) user.password = newPassword.trim();
  } else {
    user = {
      id: 'usr-' + Date.now(),
      userName: cleanName,
      email: cleanEmail,
      userType: userType || 'teacher',
      phone,
      photoUrl: avatarUrl,
      department,
      designation,
      password: newPassword ? newPassword.trim() : 'teacher123',
    };
    memoryUsers.push(user);
  }

  const db = await getMongoDb();
  if (db) {
    await db.collection('users').updateOne(
      { $or: [{ email: lookupEmail }, { email: cleanEmail }] },
      { $set: user },
      { upsert: true }
    );
  }

  // If updating a Principal profile, also sync settings
  if (userType === 'principal') {
    memorySettings.principalName = cleanName;
    memorySettings.principalEmail = cleanEmail;
    if (db) {
      await db.collection('settings').updateOne({}, { $set: { principalName: cleanName, principalEmail: cleanEmail } }, { upsert: true });
    }
  }

  // If updating a Teacher profile, also sync corresponding teacher record
  if (userType === 'teacher') {
    const tchIdx = memoryTeachers.findIndex(
      (t) => t.email.toLowerCase() === lookupEmail || t.email.toLowerCase() === cleanEmail || t.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (tchIdx !== -1) {
      memoryTeachers[tchIdx].name = cleanName;
      memoryTeachers[tchIdx].email = cleanEmail;
      if (phone) memoryTeachers[tchIdx].phone = phone;
      if (avatarUrl) memoryTeachers[tchIdx].photoUrl = avatarUrl;
      if (department) memoryTeachers[tchIdx].department = department;
      if (designation) memoryTeachers[tchIdx].designation = designation;

      if (db) {
        await db.collection('teachers').updateOne(
          { id: memoryTeachers[tchIdx].id },
          { $set: { name: cleanName, email: cleanEmail, phone, photoUrl: avatarUrl, department, designation } }
        );
      }
    }
  }

  res.json({
    success: true,
    message: 'Profile updated successfully!',
    user: {
      isLoggedIn: true,
      userType: user.userType,
      userName: user.userName,
      userEmail: user.email,
      avatarUrl: user.photoUrl,
      designation: user.designation,
    },
  });
});

// Check if Principal exists in DB or memory
app.get('/api/auth/principal-exists', async (_req: Request, res: Response) => {
  let userList = memoryUsers;
  const db = await getMongoDb();
  if (db) {
    try {
      const dbUsers = (await db.collection('users').find({}).toArray()) as unknown as UserAccount[];
      if (Array.isArray(dbUsers)) userList = dbUsers;
    } catch (e) {}
  }

  const principal = userList.find((u) => u.userType === 'principal');
  res.json({
    hasPrincipal: !!principal,
    principalName: principal ? principal.userName : (memorySettings.principalName || null),
    principalEmail: principal ? principal.email : (memorySettings.principalEmail || null),
  });
});

// Register Principal (Initial System Setup)
app.post('/api/auth/register-principal', async (req: Request, res: Response) => {
  const { userName, userEmail, password, campusName, designation } = req.body;

  if (!userName || !userEmail || !password) {
    return res.status(400).json({ success: false, error: 'Principal name, email address, and password are required.' });
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  const cleanName = userName.trim();
  const cleanPassword = password.trim();

  let userList = memoryUsers;
  const db = await getMongoDb();
  if (db) {
    try {
      const dbUsers = (await db.collection('users').find({}).toArray()) as unknown as UserAccount[];
      if (Array.isArray(dbUsers)) userList = dbUsers;
    } catch (e) {}
  }

  const existingPrincipal = userList.find((u) => u.userType === 'principal');
  if (existingPrincipal) {
    return res.status(400).json({ success: false, error: 'A Principal account is already registered on this system.' });
  }

  const newPrincipal: UserAccount = {
    id: `usr-principal-${Date.now()}`,
    email: cleanEmail,
    password: cleanPassword,
    userName: cleanName,
    userType: 'principal',
    designation: designation || 'Principal / Administrator',
    department: 'Administration',
  };

  memoryUsers.push(newPrincipal);
  memorySettings.principalName = cleanName;
  memorySettings.principalEmail = cleanEmail;
  if (campusName && campusName.trim()) {
    memorySettings.campusName = campusName.trim();
  }

  if (db) {
    try {
      await db.collection('users').insertOne(newPrincipal);
      await db.collection('settings').updateOne({}, { $set: memorySettings }, { upsert: true });
    } catch (e) {
      console.error('Error inserting principal into MongoDB:', e);
    }
  }

  res.json({
    success: true,
    message: `Principal account for ${cleanName} created successfully!`,
    user: {
      isLoggedIn: true,
      userType: 'principal',
      userName: cleanName,
      userEmail: cleanEmail,
      designation: newPrincipal.designation,
    },
  });
});

// 3. Register User Endpoint (Admin Managed)

// 4. Register New User Endpoint (Principal can register new Principal or Teacher)
app.post('/api/auth/register-user', async (req: Request, res: Response) => {
  const { userName, userEmail, userType, password, designation, department } = req.body;

  if (!userName || !userEmail || !password) {
    return res.status(400).json({ success: false, error: 'Full name, email address, and password are required.' });
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  const cleanName = userName.trim();
  const role = userType === 'principal' ? 'principal' : 'teacher';
  const cleanPassword = password.trim();

  let userList = memoryUsers;
  const db = await getMongoDb();
  if (db) {
    try {
      const dbUsers = (await db.collection('users').find({}).toArray()) as unknown as UserAccount[];
      if (dbUsers && dbUsers.length > 0) userList = dbUsers;
    } catch (e) {}
  }

  const existing = userList.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ success: false, error: `An account with email "${cleanEmail}" is already registered.` });
  }

  const newUser: UserAccount = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    password: cleanPassword,
    userName: cleanName,
    userType: role,
    designation: designation || (role === 'principal' ? 'Principal / Administrator' : 'Lecturer'),
    department: department || (role === 'principal' ? 'Administration' : 'Academic Faculty'),
  };

  memoryUsers.push(newUser);

  if (role === 'teacher') {
    const teacherExists = memoryTeachers.some(
      (t) => t.email.toLowerCase() === cleanEmail || t.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (!teacherExists) {
      const newTeacher: Teacher = {
        id: `tch-${Date.now()}`,
        employeeId: `DS-2024-${Math.floor(100 + Math.random() * 900)}`,
        name: cleanName,
        designation: designation || 'Lecturer',
        department: department || 'Academic Faculty',
        qualification: 'M.A. / M.Sc.',
        experienceYears: 5,
        joiningDate: new Date().toISOString().split('T')[0],
        email: cleanEmail,
        phone: '+92 300 0000000',
        photoUrl: 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        status: 'Active',
        peerRating: 4.8,
        workshopsCount: 3,
        classesTaught: [],
      };
      memoryTeachers.push(newTeacher);
      if (db) {
        try {
          await db.collection('teachers').insertOne(newTeacher);
        } catch (e) {}
      }
    }
  } else if (role === 'principal') {
    memorySettings.principalName = cleanName;
    memorySettings.principalEmail = cleanEmail;
    if (db) {
      try {
        const { _id, ...cleanSettings } = memorySettings as any;
        await db.collection('settings').updateOne({}, { $set: cleanSettings }, { upsert: true });
      } catch (e) {}
    }
  }

  if (db) {
    try {
      await db.collection('users').insertOne(newUser);
    } catch (e) {}
  }

  res.json({
    success: true,
    message: `Registered ${cleanName} (${role.toUpperCase()}) successfully! Email: ${cleanEmail}`,
    user: newUser,
  });
});

// 5. Update User Credentials
app.put('/api/auth/update-credentials', async (req: Request, res: Response) => {
  const { currentEmail, newEmail, newPassword, newName } = req.body;

  if (!currentEmail) {
    return res.status(400).json({ success: false, error: 'Current email address is required.' });
  }

  const cleanCurrentEmail = currentEmail.trim().toLowerCase();
  const cleanNewEmail = (newEmail || currentEmail).trim().toLowerCase();
  const cleanName = newName ? newName.trim() : undefined;
  const cleanPassword = newPassword ? newPassword.trim() : undefined;

  let memIdx = memoryUsers.findIndex((u) => u.email.toLowerCase() === cleanCurrentEmail);
  let userObj: UserAccount;

  if (memIdx >= 0) {
    userObj = memoryUsers[memIdx];
    if (cleanNewEmail) userObj.email = cleanNewEmail;
    if (cleanName) userObj.userName = cleanName;
    if (cleanPassword) userObj.password = cleanPassword;
  } else {
    userObj = {
      id: `usr-${Date.now()}`,
      email: cleanNewEmail,
      password: cleanPassword || 'principal123',
      userName: cleanName || memorySettings.principalName,
      userType: 'principal',
    };
    memoryUsers.push(userObj);
  }

  if (cleanCurrentEmail === memorySettings.principalEmail.toLowerCase() || userObj.userType === 'principal') {
    if (cleanName) memorySettings.principalName = cleanName;
    if (cleanNewEmail) memorySettings.principalEmail = cleanNewEmail;
  }

  const db = await getMongoDb();
  if (db) {
    try {
      const updatePayload: any = {};
      if (cleanNewEmail) updatePayload.email = cleanNewEmail;
      if (cleanName) updatePayload.userName = cleanName;
      if (cleanPassword) updatePayload.password = cleanPassword;

      await db.collection('users').updateOne(
        { email: { $regex: new RegExp(`^${cleanCurrentEmail}$`, 'i') } },
        { $set: updatePayload },
        { upsert: true }
      );

      const { _id, ...cleanSettings } = memorySettings as any;
      await db.collection('settings').updateOne({}, { $set: cleanSettings }, { upsert: true });
    } catch (e) {}
  }

  res.json({
    success: true,
    message: 'User credentials updated successfully!',
    userEmail: cleanNewEmail,
    userName: cleanName || userObj.userName,
  });
});

// 6. Get All Registered Users
app.get('/api/auth/users', async (_req: Request, res: Response) => {
  let userList = memoryUsers;
  const db = await getMongoDb();
  if (db) {
    try {
      const dbUsers = (await db.collection('users').find({}).toArray()) as unknown as UserAccount[];
      if (dbUsers && dbUsers.length > 0) userList = dbUsers;
    } catch (e) {}
  }
  const sanitized = userList.map((u) => ({
    id: u.id,
    email: u.email,
    userName: u.userName,
    userType: u.userType,
    designation: u.designation,
    department: u.department,
  }));
  res.json(sanitized);
});

// ================= API ENDPOINTS =================

// 1. Stats & Performance
app.get('/api/stats', async (_req: Request, res: Response) => {
  let currentStudents = memoryStudents;
  let currentTeachers = memoryTeachers;
  let currentAssessments = memoryAssessments;

  const db = await getMongoDb();
  if (db) {
    try {
      currentStudents = (await db.collection('students').find({}).toArray()) as unknown as Student[];
      currentTeachers = (await db.collection('teachers').find({}).toArray()) as unknown as Teacher[];
      currentAssessments = (await db.collection('assessments').find({}).toArray()) as unknown as Assessment[];
    } catch (err) {
      console.error('MongoDB query error for stats:', err);
    }
  }

  const totalStudents = currentStudents.length;
  const totalTeachers = currentTeachers.length;
  const activeTeachers = currentTeachers.filter((t) => t.status === 'Active').length;

  // Calculate real overall pass percentage accurately from published assessment marks
  const publishedAsmsWithMarks = currentAssessments.filter(
    (a) => a.status === 'Published' && a.marks && a.marks.length > 0
  );

  let passPercentage = 0;
  if (publishedAsmsWithMarks.length > 0) {
    let totalObtained = 0;
    let totalMax = 0;
    publishedAsmsWithMarks.forEach((asm) => {
      asm.marks?.forEach((m) => {
        totalObtained += m.marksObtained || 0;
        totalMax += m.maxMarks || asm.maxMarks || 100;
      });
    });
    if (totalMax > 0) {
      passPercentage = Number(((totalObtained / totalMax) * 100).toFixed(1));
    }
  } else if (totalStudents > 0) {
    const totalEntryMarks = currentStudents.reduce((acc, s) => acc + (s.entryTestMarks || 0), 0);
    passPercentage = Number((totalEntryMarks / totalStudents).toFixed(1));
  }

  // Calculate real critical alerts count (students with entryTestMarks < 60)
  const criticalAlerts = currentStudents.filter(
    (s) => (s.entryTestMarks !== undefined ? s.entryTestMarks < 60 : false)
  ).length;

  if (db) {
    try {
      const savedSettings = await db.collection('settings').findOne({});
      if (savedSettings) {
        if (savedSettings.campusName) memorySettings.campusName = savedSettings.campusName;
        if (savedSettings.principalName) memorySettings.principalName = savedSettings.principalName;
        if (savedSettings.principalEmail) memorySettings.principalEmail = savedSettings.principalEmail;
      }
    } catch (e) {}
  }

  const realStats: SchoolStats = {
    totalStudents,
    totalTeachers,
    activeTeachers,
    passPercentage,
    passPercentageTier:
      passPercentage >= 90
        ? 'National Top 1%'
        : passPercentage >= 80
        ? 'Excellence Distinction'
        : passPercentage >= 60
        ? 'Standard Performance'
        : passPercentage > 0
        ? 'Needs Improvement'
        : 'Zero / Unassessed',
    criticalAlerts,
    studentGrowthPercentage: totalStudents > 0 ? Number(((totalStudents / 10) * 10).toFixed(1)) : 0,
    campusName: memorySettings.campusName,
    principalName: memorySettings.principalName,
    principalEmail: memorySettings.principalEmail,
    targetBenchmark: memorySettings.targetBenchmark || 80,
  };

  res.json(realStats);
});

// Portal Settings API
app.get('/api/settings', async (_req: Request, res: Response) => {
  const db = await getMongoDb();
  if (db) {
    try {
      const saved = await db.collection('settings').findOne({});
      if (saved) return res.json(saved);
    } catch (e) {}
  }
  res.json(memorySettings);
});

app.put('/api/settings', async (req: Request, res: Response) => {
  const { campusName, principalName, principalEmail, grades, sections, departments, houses, academicYear, targetBenchmark } = req.body;
  if (campusName !== undefined) memorySettings.campusName = campusName;
  if (principalName !== undefined) memorySettings.principalName = principalName;
  if (principalEmail !== undefined) memorySettings.principalEmail = principalEmail;
  if (Array.isArray(grades)) memorySettings.grades = grades;
  if (Array.isArray(sections)) memorySettings.sections = sections;
  if (Array.isArray(departments)) memorySettings.departments = departments;
  if (Array.isArray(houses)) memorySettings.houses = houses;
  if (academicYear !== undefined) memorySettings.academicYear = academicYear;
  if (targetBenchmark !== undefined && typeof Number(targetBenchmark) === 'number') {
    memorySettings.targetBenchmark = Number(targetBenchmark);
  }

  const db = await getMongoDb();
  if (db) {
    try {
      const { _id, ...cleanSettings } = memorySettings as any;
      await db.collection('settings').updateOne(
        {},
        { $set: cleanSettings },
        { upsert: true }
      );
    } catch (e) {}
  }

  res.json({ success: true, settings: memorySettings });
});

app.get('/api/performance-trend', async (_req: Request, res: Response) => {
  let currentStudents = memoryStudents;
  let currentAssessments = memoryAssessments;

  const db = await getMongoDb();
  if (db) {
    try {
      currentStudents = (await db.collection('students').find({}).toArray()) as unknown as Student[];
      currentAssessments = (await db.collection('assessments').find({}).toArray()) as unknown as Assessment[];
    } catch (e) {}
  }

  // Calculate real pass rates grouped by Grade level (8th, 9th, 10th, 11th, 12th)
  const gradesList = ['8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade'];

  const trend = gradesList.map((grd) => {
    const gradeKey = grd.replace(' Grade', '');
    const gradeStudents = currentStudents.filter((s) => s.grade.toLowerCase().includes(gradeKey.toLowerCase()));
    const gradeAsms = currentAssessments.filter(
      (a) => a.grade.toLowerCase().includes(gradeKey.toLowerCase()) && a.status === 'Published' && a.marks && a.marks.length > 0
    );

    let passRate = 0;
    if (gradeAsms.length > 0) {
      let totalObtained = 0;
      let totalMax = 0;
      gradeAsms.forEach((a) => {
        a.marks?.forEach((m) => {
          totalObtained += m.marksObtained || 0;
          totalMax += m.maxMarks || a.maxMarks || 100;
        });
      });
      if (totalMax > 0) {
        passRate = Math.round((totalObtained / totalMax) * 100);
      }
    } else if (gradeStudents.length > 0) {
      const avgEntry = gradeStudents.reduce((acc, s) => acc + (s.entryTestMarks || 0), 0) / gradeStudents.length;
      passRate = Math.round(avgEntry);
    }

    return {
      year: grd,
      passRate,
      targetRate: 90,
      studentCount: gradeStudents.length,
    };
  });

  res.json(trend);
});

// 2. Students API
app.get('/api/students', async (req: Request, res: Response) => {
  const { grade, section, search, page, limit } = req.query;
  const isPaginated = page !== undefined || limit !== undefined;

  const pageNum = Math.max(1, parseInt((page as string) || '1', 10));
  const limitNum = Math.max(1, parseInt((limit as string) || '12', 10));

  const db = await getMongoDb();
  if (db) {
    const query: any = {};
    if (grade && grade !== 'All') query.grade = grade;
    if (section && section !== 'All') query.section = section;
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { rollNo: { $regex: search as string, $options: 'i' } },
        { guardianName: { $regex: search as string, $options: 'i' } },
      ];
    }

    if (isPaginated) {
      const total = await db.collection('students').countDocuments(query);
      const totalPages = Math.ceil(total / limitNum) || 1;
      const students = (await db
        .collection('students')
        .find(query)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .toArray()) as unknown as Student[];

      return res.json({
        students,
        total,
        page: pageNum,
        totalPages,
        hasMore: pageNum < totalPages,
      });
    } else {
      const result = (await db.collection('students').find(query).toArray()) as unknown as Student[];
      return res.json(result);
    }
  } else {
    let filtered = memoryStudents;
    if (grade && grade !== 'All') filtered = filtered.filter((s) => s.grade === grade);
    if (section && section !== 'All') filtered = filtered.filter((s) => s.section === section);
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.guardianName.toLowerCase().includes(q)
      );
    }

    if (isPaginated) {
      const total = filtered.length;
      const totalPages = Math.ceil(total / limitNum) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      const students = filtered.slice(startIndex, startIndex + limitNum);

      return res.json({
        students,
        total,
        page: pageNum,
        totalPages,
        hasMore: pageNum < totalPages,
      });
    } else {
      return res.json(filtered);
    }
  }
});

// Lookup by Roll Number (e.g. PDS-2024-089)
app.get('/api/students/roll/:rollNo', async (req: Request, res: Response) => {
  const rollNo = req.params.rollNo.toUpperCase().trim();
  let student: Student | undefined;

  const db = await getMongoDb();
  if (db) {
    student = (await db
      .collection('students')
      .findOne({ rollNo: { $regex: `^${rollNo}$`, $options: 'i' } })) as unknown as Student;
  } else {
    student = memoryStudents.find((s) => s.rollNo.toUpperCase() === rollNo);
  }

  if (!student) {
    return res.status(404).json({ error: `No student record found for roll number: ${rollNo}` });
  }

  let allAssessments: Assessment[] = [];
  if (db) {
    try {
      allAssessments = (await db.collection('assessments').find({}).toArray()) as unknown as Assessment[];
    } catch (e) {}
  } else {
    allAssessments = memoryAssessments;
  }

  const studentMarks = allAssessments
    .filter((a) => a.marks && a.marks.some((m) => m.studentRoll?.toUpperCase() === rollNo || m.studentId === student?.id))
    .map((a) => {
      const mark = a.marks?.find((m) => m.studentRoll?.toUpperCase() === rollNo || m.studentId === student?.id);
      return {
        assessmentTitle: a.title,
        subject: a.subject,
        grade: a.grade,
        testDate: a.testDate,
        maxMarks: a.maxMarks,
        marksObtained: mark?.marksObtained || 0,
        percentage: mark?.percentage || (a.maxMarks ? Math.round(((mark?.marksObtained || 0) / a.maxMarks) * 100) : 0),
        letterGrade: mark?.grade || 'N/A',
        remarks: mark?.remarks || '',
      };
    });

  res.json({
    ...student,
    assessmentResults: studentMarks,
  });
});

async function getNextRollNumber(): Promise<string> {
  let allStudents: Student[] = memoryStudents;
  const db = await getMongoDb();
  if (db) {
    try {
      allStudents = (await db.collection('students').find({}).toArray()) as unknown as Student[];
    } catch (e) {}
  }
  let maxRoll = 0;
  for (const s of allStudents) {
    if (!s.rollNo) continue;
    const nums = s.rollNo.match(/\d+/g);
    if (nums && nums.length > 0) {
      const lastNum = parseInt(nums[nums.length - 1], 10);
      if (!isNaN(lastNum) && lastNum > maxRoll) {
        maxRoll = lastNum;
      }
    }
  }
  return String(maxRoll + 1);
}

app.get('/api/students/next-roll', async (_req: Request, res: Response) => {
  const nextRoll = await getNextRollNumber();
  res.json({ nextRollNo: nextRoll });
});

app.get('/api/students/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  let student: Student | undefined;

  const db = await getMongoDb();
  if (db) {
    student = (await db.collection('students').findOne({ id })) as unknown as Student;
  } else {
    student = memoryStudents.find((s) => s.id === id);
  }

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
});

app.put('/api/students/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const updates = req.body;

  const db = await getMongoDb();
  let existing: Student | undefined;
  if (db) {
    existing = (await db.collection('students').findOne({ id })) as unknown as Student;
  } else {
    existing = memoryStudents.find((s) => s.id === id);
  }

  if (!existing) {
    return res.status(404).json({ error: 'Student record not found' });
  }

  const updatedStudent: Student = {
    ...existing,
    ...updates,
    id, // Ensure id is preserved
  };

  if (db) {
    const { _id, ...cleanStudent } = updatedStudent as any;
    await db.collection('students').updateOne({ id }, { $set: cleanStudent });
  } else {
    const idx = memoryStudents.findIndex((s) => s.id === id);
    if (idx !== -1) {
      memoryStudents[idx] = updatedStudent;
    }
  }

  res.json(updatedStudent);
});

app.post('/api/students', async (req: Request, res: Response) => {
  const assignedRoll = req.body.rollNo && !req.body.rollNo.startsWith('PDS-') ? req.body.rollNo : await getNextRollNumber();

  const newStudent: Student = {
    id: 'std-' + Date.now(),
    rollNo: assignedRoll,
    name: req.body.name,
    guardianName: req.body.guardianName || 'Guardian',
    dob: req.body.dob || '2008-01-01',
    gender: req.body.gender || 'Male',
    grade: req.body.grade || '10th',
    section: req.body.section || 'Section A',
    house: req.body.house || 'Chenab',
    enrollmentDate: req.body.enrollmentDate || new Date().toISOString().split('T')[0],
    photoUrl: req.body.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    entryTestMarks: Number(req.body.entryTestMarks) || 85,
    meritPoints: 100,
    status: 'Active',
    address: req.body.address || 'Punjab Daanish School Campus',
    contactPhone: req.body.contactPhone || '+92 300 0000000',
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection('students').insertOne(newStudent);
    await db.collection('stats').updateOne({}, { $inc: { totalStudents: 1 } });
  } else {
    memoryStudents.unshift(newStudent);
    memoryStats.totalStudents += 1;
  }

  res.status(201).json(newStudent);
});

// Bulk student registration
app.post('/api/students/bulk', async (req: Request, res: Response) => {
  const studentsList: Partial<Student>[] = req.body.students || [];
  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    return res.status(400).json({ error: 'Invalid students list' });
  }

  const startRollNum = parseInt(await getNextRollNumber(), 10) || 1;

  const created: Student[] = studentsList.map((s, idx) => ({
    id: 'std-' + Date.now() + '-' + idx,
    rollNo: s.rollNo && !s.rollNo.startsWith('PDS-') ? s.rollNo : String(startRollNum + idx),
    name: s.name || 'Enrolled Student',
    guardianName: s.guardianName || 'Guardian',
    dob: s.dob || '2008-01-01',
    gender: s.gender || 'Male',
    grade: s.grade || '10th',
    section: s.section || 'Section A',
    house: s.house || 'Ravi',
    enrollmentDate: new Date().toISOString().split('T')[0],
    photoUrl: s.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    entryTestMarks: s.entryTestMarks || 85,
    meritPoints: 100,
    status: 'Active',
    address: s.address || 'Punjab Daanish School Residence',
  }));

  const db = await getMongoDb();
  if (db) {
    await db.collection('students').insertMany(created);
    await db.collection('stats').updateOne({}, { $inc: { totalStudents: created.length } });
  } else {
    memoryStudents.unshift(...created);
    memoryStats.totalStudents += created.length;
  }

  res.status(201).json({ count: created.length, students: created });
});

// Delete Student
app.delete('/api/students/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const db = await getMongoDb();
  if (db) {
    await db.collection('students').deleteOne({ id });
    await db.collection('stats').updateOne({}, { $inc: { totalStudents: -1 } });
  } else {
    memoryStudents = memoryStudents.filter((s) => s.id !== id);
    memoryStats.totalStudents = Math.max(0, memoryStats.totalStudents - 1);
  }
  res.json({ success: true, id });
});

// Promote students across academic years & remove 12th Grade records upon Principal Permission
app.post('/api/students/promote', async (req: Request, res: Response) => {
  const { principalAuthorized, selectedGrades } = req.body;

  if (!principalAuthorized) {
    return res.status(403).json({ error: 'Principal permission and authorization is strictly required for annual class promotion.' });
  }

  let graduatedCount = 0;
  let promotedCount = 0;
  let newTotal = 0;

  // Grade sequence helper
  const sortGradeNum = (g: string) => {
    const num = parseInt(g.replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // If specific grades were selected, use them; otherwise default to all standard grades
  const targetGradesList: string[] = Array.isArray(selectedGrades) && selectedGrades.length > 0
    ? selectedGrades
    : ['12th', '11th', '10th', '9th', '8th', '7th', '6th'];

  // Sort descending by grade number (e.g., 12th, 11th, 10th...) to prevent double promotions
  targetGradesList.sort((a, b) => sortGradeNum(b) - sortGradeNum(a));

  const db = await getMongoDb();
  if (db) {
    for (const g of targetGradesList) {
      const num = sortGradeNum(g);
      if (num === 12 || g.toLowerCase().includes('12')) {
        // Graduate
        const deleteRes = await db.collection('students').deleteMany({
          grade: { $regex: new RegExp(`^${g}`, 'i') }
        });
        graduatedCount += deleteRes.deletedCount || 0;
      } else if (num > 0 && num < 12) {
        // Promote to next level
        const nextGrade = `${num + 1}th`;
        const promoteRes = await db.collection('students').updateMany(
          { grade: { $regex: new RegExp(`^${g}`, 'i') } },
          { $set: { grade: nextGrade } }
        );
        promotedCount += promoteRes.modifiedCount || 0;
      }
    }

    newTotal = await db.collection('students').countDocuments({});
    await db.collection('stats').updateOne({}, { $set: { totalStudents: newTotal } });
  } else {
    // Memory fallback
    targetGradesList.forEach((g) => {
      const num = sortGradeNum(g);
      if (num === 12 || g.toLowerCase().includes('12')) {
        const toGraduate = memoryStudents.filter((s) => s.grade?.toLowerCase().trim() === g.toLowerCase().trim());
        graduatedCount += toGraduate.length;
        memoryStudents = memoryStudents.filter((s) => s.grade?.toLowerCase().trim() !== g.toLowerCase().trim());
      } else if (num > 0 && num < 12) {
        const nextGrade = `${num + 1}th`;
        memoryStudents.forEach((s) => {
          if (s.grade?.toLowerCase().trim() === g.toLowerCase().trim()) {
            s.grade = nextGrade;
            promotedCount++;
          }
        });
      }
    });

    memoryStats.totalStudents = memoryStudents.length;
    newTotal = memoryStudents.length;
  }

  res.json({
    success: true,
    message: `Academic promotion completed successfully. ${graduatedCount} graduating students processed. ${promotedCount} students promoted to the next grade level.`,
    graduatedCount,
    promotedCount,
    newTotal,
  });
});

// 3. Faculty / Teachers API
app.get('/api/faculty', async (req: Request, res: Response) => {
  const { department, search } = req.query;
  let result = memoryTeachers;

  const db = await getMongoDb();
  if (db) {
    const query: any = {};
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { designation: { $regex: search as string, $options: 'i' } },
        { employeeId: { $regex: search as string, $options: 'i' } },
      ];
    }
    result = (await db.collection('teachers').find(query).toArray()) as unknown as Teacher[];
  } else {
    if (department) result = result.filter((t) => t.department === department);
    if (search) {
      const q = (search as string).toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.designation.toLowerCase().includes(q) ||
          t.employeeId.toLowerCase().includes(q)
      );
    }
  }

  const seenIds = new Set<string>();
  const uniqueResult = result.filter((t) => {
    if (!t.id || seenIds.has(t.id)) return false;
    seenIds.add(t.id);
    return true;
  });

  res.json(uniqueResult);
});

app.get('/api/faculty/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  let teacher: Teacher | undefined;

  const db = await getMongoDb();
  if (db) {
    teacher = (await db.collection('teachers').findOne({ id })) as unknown as Teacher;
  } else {
    teacher = memoryTeachers.find((t) => t.id === id || t.employeeId === id);
  }

  if (!teacher) {
    return res.status(404).json({ error: 'Faculty member not found' });
  }
  res.json(teacher);
});

app.post('/api/faculty', async (req: Request, res: Response) => {
  const reqEmail = (req.body.email || '').toLowerCase().trim();
  const reqName = (req.body.name || '').toLowerCase().trim();

  const existing = memoryTeachers.find(
    (t) => (reqEmail && t.email.toLowerCase() === reqEmail) || (reqName && t.name.toLowerCase() === reqName)
  );

  if (existing) {
    return res.status(200).json(existing);
  }

  const newTeacher: Teacher = {
    id: 'tch-' + Date.now(),
    employeeId: req.body.employeeId || `DS-2024-${Math.floor(100 + Math.random() * 900)}`,
    name: req.body.name,
    designation: req.body.designation || 'Lecturer',
    department: req.body.department || 'Department of Science',
    qualification: req.body.qualification || 'M.Sc.',
    experienceYears: Number(req.body.experienceYears) || 5,
    joiningDate: req.body.joiningDate || new Date().toISOString().split('T')[0],
    email: req.body.email || 'teacher@daanish.edu.pk',
    phone: req.body.phone || '+92 300 0000000',
    photoUrl: req.body.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    status: 'Active',
    peerRating: 4.8,
    workshopsCount: 8,
    classesTaught: req.body.classesTaught || [],
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection('teachers').insertOne(newTeacher);
    await db.collection('stats').updateOne({}, { $inc: { totalTeachers: 1, activeTeachers: 1 } });
  } else {
    memoryTeachers.unshift(newTeacher);
    memoryStats.totalTeachers += 1;
    memoryStats.activeTeachers += 1;
  }

  res.status(201).json(newTeacher);
});

app.post('/api/faculty/bulk', async (req: Request, res: Response) => {
  const bulkList: Partial<Teacher>[] = req.body.teachers || [];
  if (!Array.isArray(bulkList) || bulkList.length === 0) {
    return res.status(400).json({ error: 'No teacher records provided' });
  }

  const created: Teacher[] = bulkList.map((t, idx) => {
    const cleanName = (t.name || `Faculty ${idx + 1}`).trim();
    const cleanEmail = (t.email || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@daanish.edu.pk`).trim();
    return {
      id: 'tch-' + Date.now() + '-' + idx,
      employeeId: t.employeeId || `DS-2024-${Math.floor(100 + Math.random() * 900)}`,
      name: cleanName,
      designation: t.designation || 'Lecturer',
      department: t.department || 'Sciences',
      qualification: t.qualification || 'M.Sc.',
      experienceYears: Number(t.experienceYears) || 5,
      joiningDate: t.joiningDate || new Date().toISOString().split('T')[0],
      email: cleanEmail,
      phone: t.phone || '+92 300 1234567',
      photoUrl: t.photoUrl || 'https://images.unsplash.com/photo-1569292316763-0b667e9e960c?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      status: 'Active',
      peerRating: 4.8,
      workshopsCount: 6,
      classesTaught: [],
    };
  });

  const db = await getMongoDb();
  if (db) {
    await db.collection('teachers').insertMany(created);
    await db.collection('stats').updateOne({}, { $inc: { totalTeachers: created.length, activeTeachers: created.length } });
  } else {
    memoryTeachers.unshift(...created);
    memoryStats.totalTeachers += created.length;
    memoryStats.activeTeachers += created.length;
  }

  // Register user auth accounts for each teacher
  for (const tch of created) {
    const existingUser = memoryUsers.find((u) => u.email.toLowerCase() === tch.email.toLowerCase());
    if (!existingUser) {
      const newUser: UserAccount = {
        id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        userName: tch.name,
        email: tch.email,
        userType: 'teacher' as const,
        password: 'teacher123',
        department: tch.department,
        designation: tch.designation,
      };
      memoryUsers.push(newUser);
      if (db) {
        await db.collection('users').updateOne(
          { email: tch.email.toLowerCase() },
          { $set: newUser },
          { upsert: true }
        );
      }
    }
  }

  res.status(201).json({ count: created.length, teachers: created });
});

app.put('/api/faculty/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const updates = req.body;

  const db = await getMongoDb();
  let teacher = memoryTeachers.find((t) => t.id === id);
  if (db) {
    const doc = await db.collection('teachers').findOne({ id });
    if (doc) teacher = doc as unknown as Teacher;
  }

  if (!teacher) {
    return res.status(404).json({ error: 'Faculty member not found' });
  }

  const updatedTeacher = { ...teacher, ...updates, id };

  if (db) {
    const { _id, ...cleanDoc } = updatedTeacher as any;
    await db.collection('teachers').updateOne({ id }, { $set: cleanDoc });
  } else {
    const idx = memoryTeachers.findIndex((t) => t.id === id);
    if (idx !== -1) {
      memoryTeachers[idx] = updatedTeacher;
    }
  }

  res.json({ success: true, teacher: updatedTeacher });
});

app.delete('/api/faculty/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const db = await getMongoDb();
  if (db) {
    await db.collection('teachers').deleteOne({ id });
    await db.collection('stats').updateOne({}, { $inc: { totalTeachers: -1, activeTeachers: -1 } });
  } else {
    memoryTeachers = memoryTeachers.filter((t) => t.id !== id);
    memoryStats.totalTeachers = Math.max(0, memoryStats.totalTeachers - 1);
    memoryStats.activeTeachers = Math.max(0, memoryStats.activeTeachers - 1);
  }
  res.json({ success: true, id });
});

// Update faculty assigned classes and Class In-Charge status
app.put('/api/faculty/:id/classes', async (req: Request, res: Response) => {
  const id = req.params.id;
  const classesTaught = req.body.classesTaught || [];
  const classInChargeOf = req.body.classInChargeOf;

  const updateFields: any = { classesTaught };
  if (classInChargeOf !== undefined) {
    updateFields.classInChargeOf = classInChargeOf;
  }

  const db = await getMongoDb();
  if (db) {
    await db.collection('teachers').updateOne(
      { $or: [{ id }, { employeeId: id }] },
      { $set: updateFields }
    );
  } else {
    const idx = memoryTeachers.findIndex((t) => t.id === id || t.employeeId === id);
    if (idx !== -1) {
      memoryTeachers[idx].classesTaught = classesTaught;
      if (classInChargeOf !== undefined) {
        memoryTeachers[idx].classInChargeOf = classInChargeOf;
      }
    }
  }

  res.json({ success: true, id, classesTaught, classInChargeOf });
});

// Test custom MongoDB connection endpoint
app.post('/api/db/test-mongo', async (req: Request, res: Response) => {
  const { mongoUri } = req.body;
  if (!mongoUri || typeof mongoUri !== 'string') {
    return res.status(400).json({ success: false, error: 'MongoDB URI is required.' });
  }
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    return res.status(400).json({ success: false, error: 'Invalid URI scheme. Must start with mongodb:// or mongodb+srv://' });
  }
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    await client.db().command({ ping: 1 });
    await client.close();
    return res.json({ success: true, message: 'Successfully connected and pinged MongoDB cluster!' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Could not connect to MongoDB cluster.' });
  }
});

// 4. Assessments & Results API
app.get('/api/assessments', async (_req: Request, res: Response) => {
  const db = await getMongoDb();
  if (db) {
    const list = await db.collection('assessments').find({}).toArray();
    return res.json(list);
  }
  res.json(memoryAssessments);
});

app.post('/api/assessments', async (req: Request, res: Response) => {
  const newAssessment: Assessment = {
    id: 'asm-' + Date.now(),
    title: req.body.title || 'New Class Assessment',
    grade: req.body.grade || '10th',
    section: req.body.section || 'Section A',
    subject: req.body.subject || 'Mathematics',
    testDate: req.body.testDate || new Date().toISOString().split('T')[0],
    maxMarks: Number(req.body.maxMarks) || 100,
    status: 'Draft',
    classAverage: 0,
    passRate: 100,
    marks: [],
    createdBy: req.body.createdBy || '',
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection('assessments').insertOne(newAssessment);
  } else {
    memoryAssessments.unshift(newAssessment);
  }

  res.status(201).json(newAssessment);
});

app.delete('/api/assessments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getMongoDb();
  if (db) {
    await db.collection('assessments').deleteOne({ id });
  }
  memoryAssessments = memoryAssessments.filter((a) => a.id !== id);
  res.json({ success: true, message: 'Assessment deleted successfully' });
});

app.put('/api/assessments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const db = await getMongoDb();
  let asm = memoryAssessments.find((a) => a.id === id);
  if (db) {
    const doc = await db.collection('assessments').findOne({ id });
    if (doc) asm = doc as unknown as Assessment;
  }

  if (!asm) {
    return res.status(404).json({ error: 'Assessment not found' });
  }

  const updatedAsm = { ...asm, ...updates, id };

  if (db) {
    const { _id, ...cleanDoc } = updatedAsm as any;
    await db.collection('assessments').updateOne({ id }, { $set: cleanDoc });
  } else {
    const idx = memoryAssessments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      memoryAssessments[idx] = updatedAsm;
    }
  }

  res.json({ success: true, assessment: updatedAsm });
});

app.post('/api/assessments/:id/marks', async (req: Request, res: Response) => {
  const { id } = req.params;
  const marksList: StudentMark[] = req.body.marks || [];

  const db = await getMongoDb();
  let asm = memoryAssessments.find((a) => a.id === id);
  if (db) {
    const doc = await db.collection('assessments').findOne({ id });
    if (doc) asm = doc as unknown as Assessment;
  }

  if (!asm) {
    return res.status(404).json({ error: 'Assessment not found' });
  }

  const validMarks = marksList.filter((m) => typeof m.marksObtained === 'number');
  const totalMaxMarks = validMarks.reduce((acc, m) => acc + (m.maxMarks || asm!.maxMarks || 100), 0);
  const totalObtainedMarks = validMarks.reduce((acc, m) => acc + (m.marksObtained || 0), 0);

  const avg = totalMaxMarks > 0
    ? Math.round((totalObtainedMarks / totalMaxMarks) * 100)
    : 0;

  const passedCount = validMarks.filter((m) => ((m.marksObtained || 0) / (m.maxMarks || asm!.maxMarks || 100)) >= 0.4).length;
  const passRate = validMarks.length > 0 ? Math.round((passedCount / validMarks.length) * 100) : 0;

  asm.marks = marksList;
  asm.status = 'Published';
  asm.classAverage = avg;
  asm.passRate = passRate;

  if (db) {
    await db.collection('assessments').updateOne({ id }, { $set: { marks: marksList, status: 'Published', classAverage: avg, passRate } });
  }

  res.json({ success: true, assessment: asm });
});

// 5. Notices
app.get('/api/notices', async (_req: Request, res: Response) => {
  const db = await getMongoDb();
  if (db) {
    const list = await db.collection('notices').find({}).toArray();
    return res.json(list);
  }
  res.json(memoryNotices);
});

// 6. Inter-Role Notifications API (Teacher <-> Principal)
app.get('/api/notifications', async (req: Request, res: Response) => {
  const { role, userEmail } = req.query;
  let list = memoryNotifications;

  const db = await getMongoDb();
  if (db) {
    try {
      const query: any = {};
      if (role) {
        query.$or = [
          { targetRole: role },
          { targetRole: 'all' },
          { senderEmail: userEmail },
        ];
      }
      list = (await db.collection('notifications').find(query).toArray()) as unknown as SystemNotification[];
    } catch (e) {
      list = memoryNotifications;
    }
  } else {
    if (role) {
      list = list.filter(
        (n) => n.targetRole === role || n.targetRole === 'all' || n.senderEmail === userEmail
      );
    }
  }

  res.json(list);
});

app.post('/api/notifications', async (req: Request, res: Response) => {
  const { senderRole, senderName, senderEmail, targetRole, targetEmail, title, message, priority, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const newNotif: SystemNotification = {
    id: 'notif-' + Date.now(),
    senderRole: senderRole || 'teacher',
    senderName: senderName || 'Faculty Member',
    senderEmail: senderEmail || 'faculty@daanish.edu.pk',
    targetRole: targetRole || 'principal',
    targetEmail,
    title,
    message,
    timestamp: 'Just now',
    priority: priority || 'Normal',
    isRead: false,
    type: type || 'inter-role',
  };

  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('notifications').insertOne(newNotif);
    } catch (e) {
      console.error('MongoDB insert notification error:', e);
    }
  }
  memoryNotifications.unshift(newNotif);

  res.status(201).json(newNotif);
});

app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('notifications').updateOne({ id }, { $set: { isRead: true } });
    } catch (e) {}
  }
  const found = memoryNotifications.find((n) => n.id === id);
  if (found) found.isRead = true;

  res.json({ success: true, id });
});

app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = await getMongoDb();
  if (db) {
    try {
      await db.collection('notifications').deleteOne({ id });
    } catch (e) {}
  }
  memoryNotifications = memoryNotifications.filter((n) => n.id !== id);

  res.json({ success: true, id });
});

// 6. AI Insights (Powered by Gemini API)

// Test Custom Gemini API Key
app.post('/api/ai/test-key', async (req: Request, res: Response) => {
  const { customApiKey } = req.body;
  const gemini = getGeminiClient(customApiKey);
  if (!gemini) {
    return res.status(400).json({ success: false, error: 'No valid Gemini API key provided.' });
  }

  try {
    const response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Reply with strictly: "OK: Gemini API Key verified successfully."',
    });

    res.json({ success: true, message: response.text || 'Key verified!' });
  } catch (err: any) {
    console.error('Gemini Key verification error:', err);
    res.status(400).json({ success: false, error: err.message || 'API key validation failed.' });
  }
});

// Student Academic Report Insights
app.post('/api/ai/report-insights', async (req: Request, res: Response) => {
  const { studentName, rollNo, grade, entryTestMarks, marks, customApiKey } = req.body;

  const gemini = getGeminiClient(customApiKey);
  if (!gemini) {
    return res.json({
      insight: `# 1. Executive Academic Appraisal\n` +
        `Student **${studentName || 'Arshad Nadeem'}** (${rollNo || 'PDS-2024-089'}) demonstrates exemplary dedication with an Entry Test Score of **${entryTestMarks || 94} / 100** in ${grade || '10th Grade'}. Their academic discipline reflects Punjab Daanish Schools' vision of meritocracy.\n\n` +
        `# 2. Core Strengths & Key Focus Areas\n` +
        `- **STEM Mastery**: Demonstrates superior analytical problem-solving in Mathematics and Advanced Science modules.\n` +
        `- **Classroom Leadership**: Active participant in peer-tutoring circles and daily science laboratory practicals.\n` +
        `- **Academic Merit**: High entry test foundation supporting accelerated board examination preparation.\n\n` +
        `# 3. Actionable Board Exam Strategy\n` +
        `- **Targeted Revision**: Focus on past 5-year BISE Matriculation board papers for Physics and Mathematics.\n` +
        `- **Time Allocation**: Devote 2 hours daily to numerical problem solving and chemical reaction diagram practice.\n` +
        `- **Faculty Guidance**: Engage in weekly teacher mentorship sessions prior to final mock examinations.`,
      isAiGenerated: false,
    });
  }

  try {
    const prompt = `You are the Principal AI Academic Advisor for Punjab Daanish Schools & Center of Excellence.
Generate a formal, beautifully structured academic appraisal report in Markdown format for student ${studentName} (Roll No: ${rollNo}, Grade: ${grade}).
Details:
- Entry Test Score: ${entryTestMarks || 85} / 100
- Subject Marks: ${JSON.stringify(marks || [])}

Format the output strictly with markdown headers:
# 1. Executive Academic Appraisal
(2-3 concise sentences evaluating performance)

# 2. Core Strengths & Key Focus Areas
(3-4 bullet points highlighting strengths with bold lead-ins)

# 3. Actionable Board Exam Strategy
(3 bullet points with practical study guidance)

Keep tone inspiring, professional, and aligned with Punjab Daanish Schools' mission of academic excellence.`;

    const response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({
      insight: response.text,
      isAiGenerated: true,
    });
  } catch (err: any) {
    console.error('Gemini API error:', err);
    res.status(500).json({ error: 'AI analysis service temporarily unavailable.' });
  }
});

// Class Result Sheet AI Insights
app.post('/api/ai/class-insights', async (req: Request, res: Response) => {
  const { title, subject, grade, section, classAverage, passRate, maxMarks, marks, customApiKey } = req.body;

  const gemini = getGeminiClient(customApiKey);
  if (!gemini) {
    return res.json({
      insight: `# 1. Class Performance Breakdown\n` +
        `Evaluation for **${title || 'Assessment'}** (${subject || 'Subject'} - ${grade || '10th Grade'} ${section || 'Section A'}):\n` +
        `- **Class Average**: ${classAverage || 85}% (Out of ${maxMarks || 100} marks)\n` +
        `- **Pass Percentage**: ${passRate || 92}% showing overall healthy retention.\n\n` +
        `# 2. Weakest Learning Competencies & Remedial Strategy\n` +
        `- **Identified Gap**: Students struggle with complex word problems and theoretical derivations.\n` +
        `- **Remedial Action**: Schedule 2 special morning tutorial classes focusing on step-by-step problem solving.\n\n` +
        `# 3. Faculty Recommendation for Board Prep\n` +
        `- Conduct weekly timed mock tests to improve speed and board answer presentation.`,
      isAiGenerated: false,
    });
  }

  try {
    const prompt = `You are the Senior Pedagogy & Assessment AI Specialist for Punjab Daanish Schools & Center of Excellence.
Analyze this class examination sheet for subject: ${subject}, Grade: ${grade}, Section: ${section}, Assessment Title: "${title}".
Class Metrics:
- Class Average Score: ${classAverage}%
- Overall Pass Rate: ${passRate}%
- Maximum Marks: ${maxMarks}
- Total Evaluated Students: ${Array.isArray(marks) ? marks.length : 'Multiple'}

Format output in clean Markdown with headers:
# 1. Class Performance Breakdown
(Executive summary of class scores and distribution)

# 2. Weakest Learning Competencies & Remedial Strategy
(2-3 targeted actions for underperforming students)

# 3. Faculty Recommendation for Board Prep
(2 actionable guidelines for the subject teacher to boost board exam pass rates)

Keep tone academic, authoritative, and helpful.`;

    const response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    res.json({
      insight: response.text,
      isAiGenerated: true,
    });
  } catch (err: any) {
    console.error('Gemini Class Insights Error:', err);
    res.status(500).json({ error: 'Failed to generate class insights.' });
  }
});


// AI Portal Copilot Assistant
app.post('/api/ai/copilot', async (req: Request, res: Response) => {
  const { message, userRole, context, customApiKey } = req.body;

  const gemini = getGeminiClient(customApiKey);
  if (!gemini) {
    return res.json({
      reply: `### Punjab Daanish Schools AI Academic Copilot\n\n` +
        `Thank you for your query: "${message || 'How can I improve student results?'}"\n\n` +
        `Here is guidance aligned with Punjab Daanish Schools & Center of Excellence standards:\n` +
        `1. **BISE Exam Alignment**: Focus on topic-wise past paper practice for Physics, Chemistry, Mathematics, and Biology.\n` +
        `2. **Remedial Mentorship**: Utilize house masters and evening prep sessions to support students scoring below 60%.\n` +
        `3. **Continuous Assessment**: Conduct bi-weekly unit quizzes with immediate answer sheet discussions.`,
      isAiGenerated: false,
    });
  }

  try {
    const roleTitle = userRole === 'principal' ? 'Campus Principal' : userRole === 'teacher' ? 'Faculty Teacher' : 'Daanish Scholar Student';
    const systemPrompt = `You are the Official AI Academic Copilot for Punjab Daanish Schools & Center of Excellence.
You are assisting a user with role: ${roleTitle}.
Context: ${context || 'General Campus & Academic Operations'}

User Question/Prompt: "${message}"

Provide a structured, helpful, precise answer in Markdown format with bullet points, bold key terms, and actionable educational steps. Keep tone academic, encouraging, and authoritative.`;

    const response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: systemPrompt,
    });

    res.json({
      reply: response.text,
      isAiGenerated: true,
    });
  } catch (err: any) {
    console.error('Gemini Copilot Error:', err);
    res.status(500).json({ error: 'Copilot service encountered an issue.' });
  }
});





// ================= VITE & PRODUCTION MIDDLEWARE =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Punjab Daanish Schools Portal server running on http://localhost:${PORT}`);
    });
  }
}


export default app;

if (!process.env.VERCEL) {
  startServer();
}

