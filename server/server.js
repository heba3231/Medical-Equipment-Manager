// server.js
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dns from "node:dns";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import AISearchService from './AISearchService.js';
import setupAISearchRoutes from './AISearchRoutes.js';
import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

// Force Google DNS (لحل مشاكل Atlas)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CORS Configuration — يدعم عدة Origins (Render + محلي)
// ============================================================
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
];

// CLIENT_URL ممكن يكون قيمة واحدة أو عدة قيم مفصولة بفاصلة
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // اسمح بدون origin (Postman, curl, same-origin requests)
    if (!origin) return callback(null, true);

    // اسمح لأي origin إذا كان مطابق للقائمة
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // اسمح لأي *.onrender.com (اختياري — احذفيه لو بدك أكثر تقييداً)
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================================
// JWT & MongoDB Config
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here_medical_equipment_system_2024";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://admin:admin@cluster0.4ascplg.mongodb.net/?appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true";

console.log('🔌 MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

const client = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 1,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000,
});

// ============================================================
// Connection State
// ============================================================
let db = null;
let isConnecting = false;

let equipmentCollection;
let staffCollection;
let adminCollection;
let deptEquipmentCollection;
let deptListsCollection;
let otSurgeriesCollection;
let otSetsCollection;
let checklistsCollection;
let otCustomListsCollection;
let otCustomEquipmentCollection;
let otDepartmentsCollection;

// ============================================================
// Ensure Connection
// ============================================================
async function ensureConnection() {
  if (db) return true;

  if (isConnecting) {
    let waited = 0;
    while (isConnecting && waited < 10000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }
    return !!db;
  }

  isConnecting = true;
  try {
    await client.connect();
    db = client.db("medical_equipment");

    equipmentCollection = db.collection("equipment");
    staffCollection = db.collection("staff");
    adminCollection = db.collection("admin");
    deptEquipmentCollection = db.collection("dept_equipment");
    deptListsCollection = db.collection("dept_lists");
    otSurgeriesCollection = db.collection("ot_surgeries");
    otSetsCollection = db.collection("ot_sets");
    checklistsCollection = db.collection("checklists");
    otCustomListsCollection = db.collection("ot_custom_lists");
    otCustomEquipmentCollection = db.collection("ot_custom_equipment");
    otDepartmentsCollection = db.collection("ot_departments");

    // Indexes
    const indexTasks = [
      () => equipmentCollection.createIndex({ category: 1 }),
      () => equipmentCollection.createIndex({ code: 1 }),
      () => deptEquipmentCollection.createIndex({ deptCode: 1, listId: 1 }),
      () => deptListsCollection.createIndex({ deptCode: 1 }),
      () => otSurgeriesCollection.createIndex({ name: 1 }),
      () => otSetsCollection.createIndex({ surgeryId: 1 }),
      () => checklistsCollection.createIndex({ listId: 1 }),
      () => checklistsCollection.createIndex({ submittedAt: -1 }),
      () => otCustomListsCollection.createIndex({ deptCode: 1 }),
      () => otCustomListsCollection.createIndex({ roomId: 1 }),
      () => otCustomListsCollection.createIndex({ id: 1 }),
      () => otCustomEquipmentCollection.createIndex({ listId: 1 }),
      () => otCustomEquipmentCollection.createIndex({ id: 1 }),
      () => otDepartmentsCollection.createIndex({ id: 1 }, { unique: true }),
    ];
    for (const task of indexTasks) {
      try { await task(); } catch (e) {
        console.warn("⚠️ Index creation warning:", e.message);
      }
    }

    // Default admin
    let existingAdmin = await adminCollection.findOne({ staff_no: "host3487539" });
    if (!existingAdmin) {
      existingAdmin = await adminCollection.findOne({ staffNumber: "host3487539" });
    }

    if (!existingAdmin) {
      console.log("⚠️ Admin not found! Creating default admin...");
      const hashedPassword = await bcrypt.hash("123456", 10);
      await adminCollection.insertOne({
        name: "System Administrator",
        staff_no: "host3487539",
        password: hashedPassword,
        role: "super_admin",
        email: "admin@example.com",
        department: "IT Administration",
        isActive: true,
        lastLogin: null,
        createdAt: new Date()
      });
      console.log("✅ Default admin created");
    } else {
      console.log("✅ Admin exists:", existingAdmin.name);
    }

    await seedDefaultDepartments();

    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    db = null;
    return false;
  } finally {
    isConnecting = false;
  }
}

// ============================================================
// Seed Default OT Departments (مرة وحدة فقط)
// ============================================================
async function seedDefaultDepartments() {
  try {
    // ✅ نستخدم flag عشان ما نعيد الإنشاء حتى لو حذف المستخدم قسم
    const settingsColl = db.collection("settings");
    const flag = await settingsColl.findOne({ key: "departments_seeded_v1" });
    if (flag) {
      console.log("ℹ️ Default departments already seeded, skipping");
      return;
    }

    const defaults = [
      { id: "dept_women", name: "Women & Maternity", description: "Obstetrics and Gynecology Department" },
      { id: "dept_surgery", name: "General Surgery", description: "General Surgery Department" },
      { id: "dept_ortho", name: "Orthopedics", description: "Orthopedic Surgery Department" },
      { id: "dept_ent", name: "E.N.T", description: "Ear, Nose and Throat Department" },
      { id: "dept_cardiac", name: "Cardiac Surgery", description: "Cardiac Surgery Department" },
      { id: "dept_pediatric", name: "Pediatric Surgery", description: "Pediatric Surgery Department" },
    ];

    let created = 0;
    for (const dept of defaults) {
      const existing = await otDepartmentsCollection.findOne({ id: dept.id });
      if (!existing) {
        await otDepartmentsCollection.insertOne({
          ...dept,
          isDefault: true,
          createdAt: new Date()
        });
        created++;
      }
    }

    await settingsColl.insertOne({
      key: "departments_seeded_v1",
      at: new Date(),
      created
    });

    console.log(`✅ Seeded ${created} default OT departments (one-time)`);
  } catch (err) {
    console.error("⚠️ Error seeding OT departments:", err.message);
  }
}

// ============================================================
// DB Middleware (قبل أي /api route)
// ============================================================
app.use('/api', async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const ok = await ensureConnection();
  if (!ok) {
    return res.status(503).json({
      success: false,
      message: "قاعدة البيانات غير متاحة مؤقتاً، الرجاء المحاولة مرة أخرى.",
    });
  }
  next();
});

// ============================================================
// Keep-Alive Ping
// ============================================================
setInterval(async () => {
  if (!db) {
    await ensureConnection();
    return;
  }
  try {
    await db.command({ ping: 1 });
  } catch (err) {
    console.warn("⏰ Ping failed, will reconnect:", err.message);
    db = null;
  }
}, 60000);

// ============================================================
// Initial Connect
// ============================================================
ensureConnection();

// ============================================================
// AI Search Routes
// ============================================================
try {
  setupAISearchRoutes(app);
} catch (e) {
  console.warn("⚠️ AI Search routes not loaded:", e.message);
}

// ============================================================
// HEALTH CHECK (مهم جداً للتشخيص على Render)
// ============================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "🚀 Medical Equipment API is running",
    service: "backend",
    dbConnected: !!db,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({
        success: false,
        dbConnected: false,
        message: "DB not connected",
      });
    }
    await db.command({ ping: 1 });
    const [listsCount, equipmentCount, departmentsCount, checklistsCount] = await Promise.all([
      otCustomListsCollection.countDocuments(),
      otCustomEquipmentCollection.countDocuments(),
      otDepartmentsCollection.countDocuments(),
      checklistsCollection.countDocuments(),
    ]);
    res.json({
      success: true,
      dbConnected: true,
      timestamp: new Date().toISOString(),
      counts: {
        otCustomLists: listsCount,
        otCustomEquipment: equipmentCount,
        otDepartments: departmentsCount,
        checklists: checklistsCount,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// CUSTOM DEPARTMENTS (in-memory legacy)
// ============================================================
let customDepartments = [];

app.get("/api/custom-departments", (req, res) => {
  res.json({ success: true, data: customDepartments });
});

app.post("/api/custom-departments", (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }
    const newDept = {
      _id: Date.now().toString(),
      name: name.trim(),
      description: description?.trim() || "Equipment Management",
      path: `/${name.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'custom'}`,
      createdAt: new Date().toISOString()
    };
    if (customDepartments.find(d => d.name.toLowerCase() === newDept.name.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Department name already exists" });
    }
    customDepartments.push(newDept);
    res.status(201).json({ success: true, data: newDept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/custom-departments/:id", (req, res) => {
  try {
    const id = req.params.id;
    const initialLength = customDepartments.length;
    customDepartments = customDepartments.filter(dept => dept._id !== id);
    if (customDepartments.length === initialLength) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// OT DEPARTMENTS ROUTES (MongoDB)
// ============================================================
app.get("/api/ot-departments", async (req, res) => {
  try {
    const depts = await otDepartmentsCollection
      .find({})
      .sort({ createdAt: 1 })
      .toArray();
    res.json({ success: true, data: depts });
  } catch (err) {
    console.error("❌ Error fetching OT departments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/ot-departments", async (req, res) => {
  try {
    const { id, name, description } = req.body;
    console.log(`📥 POST /api/ot-departments`, { id, name });

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "name is required" });
    }

    const deptId = id || `dept_${Date.now()}`;

    const existing = await otDepartmentsCollection.findOne({ id: deptId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Department already exists" });
    }

    const newDept = {
      id: deptId,
      name: name.trim(),
      description: description?.trim() || "",
      isDefault: false,
      createdAt: new Date()
    };

    await otDepartmentsCollection.insertOne(newDept);
    console.log(`✅ OT Department created: ${name} (id=${deptId})`);
    res.status(201).json({ success: true, data: newDept });
  } catch (err) {
    console.error("❌ Error creating OT department:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/ot-departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    console.log(`📥 PUT /api/ot-departments/${id}`, { name });

    const result = await otDepartmentsCollection.updateOne(
      { id },
      { $set: {
        name: name?.trim() || "",
        description: description?.trim() || "",
        updatedAt: new Date()
      } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    console.log(`✅ OT Department updated: ${id}`);
    res.json({ success: true, message: "Department updated" });
  } catch (err) {
    console.error("❌ Error updating OT department:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/ot-departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 DELETE /api/ot-departments/${id}`);

    const result = await otDepartmentsCollection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const lists = await otCustomListsCollection.find({ deptCode: id }).toArray();
    for (const list of lists) {
      await otCustomEquipmentCollection.deleteMany({ listId: list.id });
    }
    const listsResult = await otCustomListsCollection.deleteMany({ deptCode: id });

    console.log(`✅ OT Department deleted: ${id} (+${listsResult.deletedCount} lists)`);
    res.json({ success: true, message: "Department and related data deleted" });
  } catch (err) {
    console.error("❌ Error deleting OT department:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// STAFF ROUTES
// ============================================================
app.post("/api/staff/register", async (req, res) => {
  try {
    const { name, staffNumber, password, confirmPassword, phone, department } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const existingUser = await staffCollection.findOne({ staffNumber });
    if (existingUser) {
      return res.status(400).json({ message: "Staff number already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = {
      name, staffNumber,
      password: hashedPassword,
      department: department || "General",
      phone: phone || "",
      role: "staff",
      isActive: true,
      lastLogin: null,
      createdAt: new Date()
    };
    const result = await staffCollection.insertOne(newStaff);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: result.insertedId,
        name: newStaff.name,
        staffNumber: newStaff.staffNumber,
        role: newStaff.role,
        department: newStaff.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
});

app.post("/api/staff/login", async (req, res) => {
  try {
    const { staffNumber, password } = req.body;
    const user = await staffCollection.findOne({ staffNumber });
    if (!user) {
      return res.status(401).json({ message: "Invalid staff number or password" });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid staff number or password" });
    }
    await staffCollection.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
    const token = jwt.sign(
      { id: user._id, staffNumber: user.staffNumber, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        staffNumber: user.staffNumber,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
});

app.get("/api/staff", async (req, res) => {
  try {
    const staff = await staffCollection.find({}).toArray();
    const safeStaff = staff.map(s => { const { password, ...rest } = s; return rest; });
    res.json({ success: true, data: safeStaff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/staff/:id", async (req, res) => {
  try {
    const staff = await staffCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    const { password, ...safeStaff } = staff;
    res.json({ success: true, data: safeStaff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/staff/:id", async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    const result = await staffCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ message: "Staff not found" });
    res.json({ success: true, message: "Staff updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/staff/:id", async (req, res) => {
  try {
    const result = await staffCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Staff not found" });
    res.json({ success: true, message: "Staff deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================
app.post('/api/admin/login', async (req, res) => {
  const { name, staff_no, password } = req.body;
  console.log("🔐 Admin login attempt - Name:", name, "Staff No:", staff_no);

  try {
    const admin = await adminCollection.findOne({
      $or: [
        { staff_no: staff_no },
        { staffNumber: staff_no },
        { staffNo: staff_no },
        { employeeId: staff_no }
      ]
    });

    if (!admin) {
      return res.status(401).json({ success: false, message: "❌ Staff number not found" });
    }

    if (admin.isActive === false) {
      return res.status(401).json({ success: false, message: "❌ Account is deactivated" });
    }

    let isPasswordValid = false;
    if (admin.password && (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'))) {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      isPasswordValid = (admin.password === password);
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await adminCollection.updateOne(
          { _id: admin._id },
          { $set: { password: hashedPassword } }
        );
        console.log("✅ Password upgraded to hashed");
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "❌ Incorrect password" });
    }

    await adminCollection.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    const adminStaffNo = admin.staff_no || admin.staffNumber || admin.staffNo || staff_no;
    const token = jwt.sign(
      {
        id: admin._id,
        staff_no: adminStaffNo,
        role: admin.role || "admin",
        name: name || admin.name
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "✅ Login successful",
      token,
      admin: {
        id: admin._id,
        name: name || admin.name,
        staff_no: adminStaffNo,
        role: admin.role || "admin",
        email: admin.email || "",
        department: admin.department || "Administration"
      }
    });

  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const verifyAdminToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

app.get('/api/admin/profile', verifyAdminToken, async (req, res) => {
  try {
    const admin = await adminCollection.findOne({ _id: new ObjectId(req.admin.id) });
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    res.json({
      success: true,
      admin: {
        id: admin._id,
        name: admin.name,
        staff_no: admin.staff_no || admin.staffNumber,
        role: admin.role,
        email: admin.email,
        department: admin.department,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/all', verifyAdminToken, async (req, res) => {
  try {
    const admins = await adminCollection.find({}).toArray();
    const safeAdmins = admins.map(a => {
      const { password, ...rest } = a;
      return rest;
    });
    res.json({ success: true, data: safeAdmins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// EQUIPMENT ROUTES (Legacy)
// ============================================================
app.get("/api/equipment", async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) query.category = category;
    const items = await equipmentCollection.find(query).toArray();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/equipment/:id", async (req, res) => {
  try {
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!equipment) return res.status(404).json({ success: false, message: "Equipment not found" });
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/equipment", async (req, res) => {
  try {
    const newItem = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    if (!newItem.name || !newItem.code || !newItem.category) {
      return res.status(400).json({ success: false, message: "Missing required fields: name, code, category" });
    }
    const result = await equipmentCollection.insertOne(newItem);
    res.status(201).json({ success: true, message: "Equipment added", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/equipment/:id", async (req, res) => {
  try {
    const updatedData = { ...req.body, updatedAt: new Date() };
    const result = await equipmentCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedData }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Equipment not found" });
    res.json({ success: true, message: "Equipment updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/equipment/:id", async (req, res) => {
  try {
    const result = await equipmentCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Equipment not found" });
    res.json({ success: true, message: "Equipment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DEPARTMENT LISTS ROUTES
// ============================================================
app.get("/api/dept-lists/:deptCode", async (req, res) => {
  try {
    const { deptCode } = req.params;
    const lists = await deptListsCollection
      .find({ deptCode })
      .sort({ createdAt: 1 })
      .toArray();
    res.json({ success: true, data: lists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/dept-lists", async (req, res) => {
  try {
    const { deptCode, name, description } = req.body;
    if (!deptCode || !name) {
      return res.status(400).json({ success: false, message: "deptCode and name are required" });
    }
    const newList = {
      deptCode,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date()
    };
    const result = await deptListsCollection.insertOne(newList);
    res.status(201).json({ success: true, data: { ...newList, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/dept-lists/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await deptListsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name: name.trim(), description: description?.trim() || "", updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "List not found" });
    res.json({ success: true, message: "List updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/dept-lists/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await deptListsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "List not found" });
    await deptEquipmentCollection.deleteMany({ listId: id });
    res.json({ success: true, message: "List and its equipment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DEPARTMENT EQUIPMENT ROUTES
// ============================================================
app.get("/api/dept-equipment/list/:listId", async (req, res) => {
  try {
    const { listId } = req.params;
    const items = await deptEquipmentCollection
      .find({ listId })
      .sort({ createdAt: 1 })
      .toArray();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/dept-equipment/:deptCode/:listId", async (req, res) => {
  try {
    const { deptCode, listId } = req.params;
    const items = await deptEquipmentCollection
      .find({ deptCode, listId })
      .sort({ createdAt: 1 })
      .toArray();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/dept-equipment", async (req, res) => {
  try {
    const { deptCode, listId, name, code, quantity, status, notes, image } = req.body;
    if (!deptCode || !listId || !name || !code) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const newItem = {
      deptCode, listId, name, code,
      quantity: parseInt(quantity) || 0,
      status: status || "Available",
      notes: notes || "",
      image: image || null,
      createdAt: new Date(),
      createdBy: "admin"
    };
    const result = await deptEquipmentCollection.insertOne(newItem);
    res.status(201).json({ success: true, message: "Equipment added", data: { ...newItem, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/dept-equipment/:id", async (req, res) => {
  try {
    const { name, code, quantity, status, notes, image } = req.body;
    const updatedData = {
      name, code,
      quantity: parseInt(quantity) || 0,
      status: status || "Available",
      notes: notes || "",
      image: image || null,
      updatedAt: new Date()
    };
    const result = await deptEquipmentCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedData }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Equipment not found" });
    res.json({ success: true, message: "Equipment updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/dept-equipment/:id", async (req, res) => {
  try {
    const result = await deptEquipmentCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Equipment not found" });
    res.json({ success: true, message: "Equipment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// CHECKLIST ROUTES
// ============================================================
app.get('/api/checklist/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const checklist = await checklistsCollection
      .find({ listId })
      .sort({ submittedAt: -1 })
      .limit(1)
      .toArray();
    const result = checklist.length > 0 ? checklist[0] : null;
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/checklist/save', async (req, res) => {
  try {
    const {
      listId, deptCode, listName, submitted, submittedAt, submittedBy, userRole, expiryDate,
      availableQuantities, damagedQuantities, missingQuantities, checkedItems, damagedItems
    } = req.body;

    let equipmentList = [];
    let itemsFromDept = await deptEquipmentCollection.find({ listId }).toArray();
    if (itemsFromDept.length > 0) {
      equipmentList = itemsFromDept;
    } else {
      equipmentList = await otCustomEquipmentCollection.find({ listId }).toArray();
    }

    let totalItems = equipmentList.length;
    let checkedCount = 0;
    let missingCount = 0;
    let damagedCount = 0;

    const finalAvailable = {};
    const finalDamaged = {};
    const finalMissing = {};

    equipmentList.forEach(item => {
      const itemId = item.id || item._id.toString();
      const totalQty = item.quantity || 0;

      let avail = 0, damaged = 0, missing = 0;

      if (availableQuantities && availableQuantities[itemId] !== undefined) {
        avail = availableQuantities[itemId] || 0;
        damaged = (damagedQuantities && damagedQuantities[itemId]) || 0;
        missing = (missingQuantities && missingQuantities[itemId]) || 0;
      } else {
        const isChecked = (checkedItems && checkedItems[itemId]) || false;
        const isDamaged = (damagedItems && damagedItems[itemId]) || false;
        if (isChecked) {
          avail = totalQty;
        } else {
          damaged = isDamaged ? totalQty : 0;
          missing = isDamaged ? 0 : totalQty;
        }
      }

      finalAvailable[itemId] = avail;
      finalDamaged[itemId] = damaged;
      finalMissing[itemId] = missing;

      if (avail > 0) checkedCount++;
      if (missing > 0) missingCount++;
      if (damaged > 0) damagedCount++;
    });

    const newChecklist = {
      listId, deptCode, listName,
      submitted: submitted || false,
      submittedAt: submittedAt || new Date().toISOString(),
      submittedBy: submittedBy || 'Staff',
      userRole: userRole || 'staff',
      totalItems, checkedCount, missingCount, damagedCount,
      expiryDate: expiryDate || null,
      availableQuantities: finalAvailable,
      damagedQuantities: finalDamaged,
      missingQuantities: finalMissing,
      checkedItems: Object.keys(finalAvailable).reduce((acc, key) => { acc[key] = finalAvailable[key] > 0; return acc; }, {}),
      damagedItems: Object.keys(finalDamaged).reduce((acc, key) => { if (finalDamaged[key] > 0) acc[key] = finalDamaged[key]; return acc; }, {}),
      createdAt: new Date()
    };

    const result = await checklistsCollection.insertOne(newChecklist);
    console.log(`✅ Checklist saved: ${result.insertedId}`);
    res.json({ success: true, data: { ...newChecklist, _id: result.insertedId } });
  } catch (error) {
    console.error('❌ Error saving checklist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/checklists', async (req, res) => {
  try {
    const checklists = await checklistsCollection
      .find({ submitted: true })
      .sort({ submittedAt: -1 })
      .toArray();

    for (let checklist of checklists) {
      const equipmentItems = await deptEquipmentCollection
        .find({ listId: checklist.listId })
        .toArray();
      if (equipmentItems.length === 0) {
        checklist.equipmentDetails = await otCustomEquipmentCollection
          .find({ listId: checklist.listId })
          .toArray();
      } else {
        checklist.equipmentDetails = equipmentItems;
      }
    }

    res.json({ success: true, data: checklists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// OT CUSTOM LISTS ROUTES
// ============================================================
app.get('/api/ot-custom-lists', async (req, res) => {
  try {
    const { roomId, deptCode } = req.query;
    let query = {};

    if (roomId) query.roomId = roomId;
    if (deptCode) query.deptCode = deptCode;

    const lists = await otCustomListsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    for (let list of lists) {
      list.equipment = await otCustomEquipmentCollection
        .find({ listId: list.id })
        .toArray();
    }

    console.log(`✅ Found ${lists.length} custom lists (deptCode=${deptCode || 'all'})`);
    res.json({ success: true, data: lists });
  } catch (error) {
    console.error('❌ Error fetching custom lists:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ot-custom-lists', async (req, res) => {
  try {
    const { id, name, description, deptCode, roomId, createdBy, image } = req.body;

    console.log(`📥 POST /api/ot-custom-lists`, { id, name, deptCode });

    if (!id || !name) {
      return res.status(400).json({ success: false, message: "id and name are required" });
    }

    const existing = await otCustomListsCollection.findOne({ id });
    if (existing) {
      console.warn(`⚠️ List with id ${id} already exists — updating`);
      await otCustomListsCollection.updateOne(
        { id },
        { $set: {
          name: name.trim(),
          description: description?.trim() || "",
          deptCode: deptCode || "General",
          roomId: roomId || null,
          image: image || existing.image || null,
          updatedAt: new Date(),
        } }
      );
      const updated = await otCustomListsCollection.findOne({ id });
      return res.json({ success: true, data: updated, updated: true });
    }

    const newList = {
      id,
      name: name.trim(),
      description: description?.trim() || "",
      deptCode: deptCode || "General",
      roomId: roomId || null,
      image: image || null,
      equipment: [],
      createdBy: createdBy || "Admin",
      createdAt: new Date()
    };

    const result = await otCustomListsCollection.insertOne(newList);
    console.log(`✅ Custom list created: ${name} (id=${id})`);
    res.json({ success: true, data: { ...newList, _id: result.insertedId } });
  } catch (error) {
    console.error('❌ Error creating custom list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/ot-custom-lists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, deptCode, roomId, image } = req.body;

    console.log(`📥 PUT /api/ot-custom-lists/${id}`, { name, deptCode });

    const updatedList = {
      name: name?.trim() || "",
      description: description?.trim() || "",
      deptCode: deptCode || "General",
      roomId: roomId || null,
      updatedAt: new Date()
    };

    if (image !== undefined) {
      updatedList.image = image;
    }

    const result = await otCustomListsCollection.updateOne(
      { id },
      { $set: updatedList }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "List not found" });
    }

    console.log(`✅ Custom list updated: ${id}`);
    res.json({ success: true, message: "List updated", modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('❌ Error updating custom list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/ot-custom-lists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 DELETE /api/ot-custom-lists/${id}`);

    const result = await otCustomListsCollection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "List not found" });
    }

    const eqResult = await otCustomEquipmentCollection.deleteMany({ listId: id });
    console.log(`✅ Custom list deleted: ${id} (+${eqResult.deletedCount} equipment)`);
    res.json({ success: true, message: "List deleted" });
  } catch (error) {
    console.error('❌ Error deleting custom list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// OT CUSTOM EQUIPMENT ROUTES
// ============================================================
app.get('/api/ot-custom-equipment/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const equipment = await otCustomEquipmentCollection
      .find({ listId })
      .sort({ createdAt: 1 })
      .toArray();
    res.json({ success: true, data: equipment });
  } catch (error) {
    console.error('❌ Error fetching custom equipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ot-custom-equipment', async (req, res) => {
  try {
    const { id, listId, name, code, quantity, status, image } = req.body;

    console.log(`📥 POST /api/ot-custom-equipment`, { id, listId, name });

    if (!id || !listId || !name || !code) {
      return res.status(400).json({ success: false, message: "id, listId, name, and code are required" });
    }

    const existing = await otCustomEquipmentCollection.findOne({ id });
    if (existing) {
      return res.json({ success: true, data: existing, alreadyExists: true });
    }

    const newEquipment = {
      id,
      listId,
      name: name.trim(),
      code: code.trim(),
      quantity: parseInt(quantity) || 1,
      status: status || "Available",
      image: image || null,
      createdAt: new Date()
    };

    const result = await otCustomEquipmentCollection.insertOne(newEquipment);
    console.log(`✅ Custom equipment added: ${name} → list ${listId}`);
    res.json({ success: true, data: { ...newEquipment, _id: result.insertedId } });
  } catch (error) {
    console.error('❌ Error adding custom equipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/ot-custom-equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, quantity, status, image } = req.body;

    const updatedEquipment = {
      name: name.trim(),
      code: code.trim(),
      quantity: parseInt(quantity) || 1,
      status: status || "Available",
      image: image || null,
      updatedAt: new Date()
    };

    const result = await otCustomEquipmentCollection.updateOne(
      { id },
      { $set: updatedEquipment }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }

    console.log(`✅ Custom equipment updated: ${name}`);
    res.json({ success: true, message: "Equipment updated" });
  } catch (error) {
    console.error('❌ Error updating custom equipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/ot-custom-equipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await otCustomEquipmentCollection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Equipment not found" });
    }
    console.log(`✅ Custom equipment deleted: ${id}`);
    res.json({ success: true, message: "Equipment deleted" });
  } catch (error) {
    console.error('❌ Error deleting custom equipment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// OT SURGERY/SET ROUTES
// ============================================================
app.get("/api/ot/surgeries", async (req, res) => {
  try {
    const surgeries = await otSurgeriesCollection.find({}).sort({ createdAt: 1 }).toArray();
    res.json({ success: true, data: surgeries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/ot/surgeries", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Surgery name is required" });
    }
    const newSurgery = {
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date()
    };
    const result = await otSurgeriesCollection.insertOne(newSurgery);
    res.status(201).json({ success: true, data: { ...newSurgery, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/ot/surgeries/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await otSurgeriesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name: name.trim(), description: description?.trim() || "", updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Surgery not found" });
    res.json({ success: true, message: "Surgery updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/ot/surgeries/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await otSurgeriesCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Surgery not found" });

    const sets = await otSetsCollection.find({ surgeryId: id }).toArray();
    for (const set of sets) {
      await deptEquipmentCollection.deleteMany({ listId: set._id.toString() });
    }
    await otSetsCollection.deleteMany({ surgeryId: id });

    res.json({ success: true, message: "Surgery and related data deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/ot/sets/:surgeryId", async (req, res) => {
  try {
    const { surgeryId } = req.params;
    const sets = await otSetsCollection.find({ surgeryId }).sort({ createdAt: 1 }).toArray();
    res.json({ success: true, data: sets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/ot/sets", async (req, res) => {
  try {
    const { surgeryId, name, description } = req.body;
    if (!surgeryId || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: "surgeryId and name are required" });
    }
    const newSet = {
      surgeryId,
      name: name.trim(),
      description: description?.trim() || "",
      createdAt: new Date()
    };
    const result = await otSetsCollection.insertOne(newSet);
    res.status(201).json({ success: true, data: { ...newSet, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/ot/sets/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await otSetsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name: name.trim(), description: description?.trim() || "", updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Set not found" });
    res.json({ success: true, message: "Set updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/ot/sets/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await otSetsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Set not found" });

    await deptEquipmentCollection.deleteMany({ listId: id });

    res.json({ success: true, message: "Set and its equipment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/ot/equipment/:setId", async (req, res) => {
  try {
    const { setId } = req.params;
    const equipment = await deptEquipmentCollection
      .find({ listId: setId })
      .sort({ createdAt: 1 })
      .toArray();
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/ot/equipment", async (req, res) => {
  try {
    const { setId, name, code, quantity, status, notes, image } = req.body;
    if (!setId || !name || !code) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const setInfo = await otSetsCollection.findOne({ _id: new ObjectId(setId) });
    const surgeryInfo = setInfo ? await otSurgeriesCollection.findOne({ _id: new ObjectId(setInfo.surgeryId) }) : null;

    const newEquipment = {
      deptCode: "OT",
      listId: setId,
      name: name.trim(),
      code: code.trim(),
      quantity: parseInt(quantity) || 0,
      status: status || "Available",
      notes: notes || "",
      image: image || null,
      surgeryType: surgeryInfo?.name || "",
      setType: setInfo?.name || "",
      createdAt: new Date(),
      createdBy: "admin"
    };
    const result = await deptEquipmentCollection.insertOne(newEquipment);
    res.status(201).json({ success: true, message: "Equipment added", data: { ...newEquipment, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/ot/equipment/:id", async (req, res) => {
  try {
    const { name, code, quantity, status, notes, image } = req.body;
    const updatedData = {
      name: name.trim(),
      code: code.trim(),
      quantity: parseInt(quantity) || 0,
      status: status || "Available",
      notes: notes || "",
      image: image || null,
      updatedAt: new Date()
    };
    const result = await deptEquipmentCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedData }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Equipment not found" });
    res.json({ success: true, message: "Equipment updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/ot/equipment/:id", async (req, res) => {
  try {
    const result = await deptEquipmentCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Equipment not found" });
    res.json({ success: true, message: "Equipment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// DEBUG ROUTES
// ============================================================
app.get('/api/test/admins', async (req, res) => {
  try {
    const collectionsList = await db.listCollections().toArray();
    const collectionNames = collectionsList.map(c => c.name);
    let admin = await adminCollection.findOne({ staff_no: "host3487539" });
    if (!admin) admin = await adminCollection.findOne({ staffNumber: "host3487539" });
    res.json({
      success: true,
      availableCollections: collectionNames,
      adminFound: admin ? { name: admin.name, staff_no: admin.staff_no || admin.staffNumber, role: admin.role } : null,
      message: admin ? "✅ Admin found!" : "❌ No admin found"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/debug/admin-structure', async (req, res) => {
  try {
    const allAdmins = await adminCollection.find({}).toArray();
    res.json({
      success: true,
      totalAdmins: allAdmins.length,
      adminData: allAdmins.map(admin => ({
        id: admin._id,
        name: admin.name,
        availableFields: Object.keys(admin),
        fullData: admin
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Debug: صفحات وبيانات للتحقق من نفس المصدر
app.get('/api/debug/info', async (req, res) => {
  res.json({
    success: true,
    service: "backend",
    mongodbDatabase: "medical_equipment",
    mongoUriHost: MONGODB_URI.match(/@([^/?]+)/)?.[1] || 'unknown',
    allowedOrigins,
    nodeEnv: process.env.NODE_ENV || 'development',
    renderServiceName: process.env.RENDER_SERVICE_NAME || null,
    renderExternalUrl: process.env.RENDER_EXTERNAL_URL || null,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// PDF GENERATION ROUTE
// ============================================================
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { content, filename } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    res.json({
      success: true,
      message: 'PDF generated successfully',
      filename: filename || 'document.pdf'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
});

// ============================================================
// IMAGE PROXY ROUTE
// ============================================================
app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }

    console.log(`📡 Fetching image: ${imageUrl}`);

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'Failed to fetch image' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error('❌ Image proxy error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// OPTIONAL: SERVE FRONTEND BUILD (إذا Frontend + Backend في نفس Service)
// ============================================================
const buildPath = path.join(__dirname, 'build');
const hasBuild = fs.existsSync(path.join(buildPath, 'index.html'));

if (hasBuild) {
  console.log('📦 Serving frontend build from:', buildPath);
  app.use(express.static(buildPath));

  // ⚠️ مهم: لا نستخدم '*' في Express 5 — نستخدم regex
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  console.log('ℹ️ No frontend build found (API-only mode)');
}

// ============================================================
// ERROR HANDLER (يجب أن يكون الأخير)
// ============================================================
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// ============================================================
// SERVER START
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`👑 Admin: staff_no=host3487539, password=123456`);
  console.log(`📦 OT Departments API:  /api/ot-departments`);
  console.log(`📋 OT Custom Lists API: /api/ot-custom-lists`);
  console.log(`🔧 OT Custom Equip API: /api/ot-custom-equipment`);
  console.log(`✅ Health Check:        /api/health`);
  console.log(`🔍 Debug Info:          /api/debug/info`);
  console.log(`🌐 Allowed origins:     ${allowedOrigins.join(', ')}`);
  console.log(`📦 Serving frontend:    ${hasBuild ? 'YES' : 'NO'}`);
  console.log('═══════════════════════════════════════════════════════');
});