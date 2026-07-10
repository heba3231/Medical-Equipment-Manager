import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dns from "node:dns";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AISearchService from './AISearchService.js';
import setupAISearchRoutes from './AISearchRoutes.js';
// Force Node.js to use Google DNS to fix Atlas connection issues
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
setupAISearchRoutes(app);

// JWT Secret
const JWT_SECRET = "your_secret_key_here_medical_equipment_system_2024";

const MONGODB_UR = process.env.MONGODB_URI || "mongodb+srv://admin:admin@cluster0.4ascplg.mongodb.net/?appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true";
//const uri = "mongodb+srv://admin:admin@cluster0.4ascplg.mongodb.net/?appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true";
const client = new MongoClient(MONGODB_UR);

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

async function connectToMongoDB() {
  try {
    await client.connect();
    const db = client.db("medical_equipment");

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

    // Indexes
    await equipmentCollection.createIndex({ category: 1 });
    await equipmentCollection.createIndex({ code: 1 });
    await deptEquipmentCollection.createIndex({ deptCode: 1, listId: 1 });
    await deptListsCollection.createIndex({ deptCode: 1 });
    await otSurgeriesCollection.createIndex({ name: 1 });
    await otSetsCollection.createIndex({ surgeryId: 1 });
    await checklistsCollection.createIndex({ listId: 1 });
    await otCustomListsCollection.createIndex({ deptCode: 1 });
    await otCustomListsCollection.createIndex({ roomId: 1 });
    await otCustomEquipmentCollection.createIndex({ listId: 1 });

    const collections = await db.listCollections().toArray();
    console.log("📚 Available collections:", collections.map(c => c.name));

    // Create default admin if not exists
    let existingAdmin = await adminCollection.findOne({ staff_no: "host3487539" });
    if (!existingAdmin) {
      existingAdmin = await adminCollection.findOne({ staffNumber: "host3487539" });
    }

    if (!existingAdmin) {
      console.log("⚠️ Admin not found! Creating default admin...");
      
      // ✅ استخدام bcrypt لتشفير كلمة المرور
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
      console.log("✅ Default admin created successfully");
    } else {
      console.log("✅ Admin already exists:", existingAdmin.name);
    }

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.log("❌ MongoDB connection error:", error.message);
  }
}

connectToMongoDB();

// ==================== CUSTOM DEPARTMENTS ROUTES ====================
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
    res.json({ success: true, message: "Department deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== STAFF ROUTES ====================

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

// ==================== ADMIN ROUTES ====================

app.post('/api/admin/login', async (req, res) => {
  const { name, staff_no, password } = req.body;
  console.log("🔐 Admin login attempt - Name:", name, "Staff No:", staff_no);
  
  try {
    // ✅ البحث عن الأدمن برقم الموظف فقط (بدون الاسم)
    const admin = await adminCollection.findOne({
      $or: [
        { staff_no: staff_no },
        { staffNumber: staff_no },
        { staffNo: staff_no },
        { employeeId: staff_no }
      ]
    });
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: "❌ Staff number not found" 
      });
    }
    
    if (admin.isActive === false) {
      return res.status(401).json({ 
        success: false, 
        message: "❌ Account is deactivated" 
      });
    }
    
    // مقارنة كلمة المرور
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
        console.log("✅ Password upgraded to hashed version");
      }
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "❌ Incorrect password" 
      });
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
        name: name || admin.name // ✅ استخدام الاسم المدخل من المستخدم
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    // ✅ إرجاع الاسم المدخل من المستخدم
    res.json({
      success: true,
      message: "✅ Login successful",
      token,
      admin: {
        id: admin._id,
        name: name || admin.name, // ✅ استخدام الاسم المدخل
        staff_no: adminStaffNo,
        role: admin.role || "admin",
        email: admin.email || "",
        department: admin.department || "Administration"
      }
    });
    
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
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

// ==================== EQUIPMENT ROUTES (القديم - للتوافق) ====================

app.get("/", (req, res) => {
  res.send("🚀 Server & MongoDB are working!");
});

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

// ==================== DEPARTMENT LISTS ROUTES ====================

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

// ==================== DEPARTMENT EQUIPMENT ROUTES ====================

app.get("/api/dept-equipment/list/:listId", async (req, res) => {
  try {
    const { listId } = req.params;
    console.log(`📡 Fetching equipment for list: ${listId}`);
    
    const items = await deptEquipmentCollection
      .find({ listId })
      .sort({ createdAt: 1 })
      .toArray();
    
    console.log(`✅ Found ${items.length} equipment items`);
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('❌ Error fetching equipment:', err);
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
      return res.status(400).json({ success: false, message: "Missing required fields: deptCode, listId, name, code" });
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

// ==================== CHECKLIST ROUTES ====================

app.get('/api/checklist/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    console.log(`📡 Fetching saved checklist for: ${listId}`);
    
    const checklist = await checklistsCollection.findOne({ listId });
    console.log(`✅ Checklist found: ${checklist ? 'Yes' : 'No'}`);
    
    res.json({ success: true, data: checklist || null });
  } catch (error) {
    console.error('❌ Error fetching checklist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/checklist/save', async (req, res) => {
  try {
    const { listId, deptCode, listName, checkedItems, submitted, submittedAt, submittedBy, userRole } = req.body;
    
    console.log(`📤 Saving checklist for: ${listId}`);
    console.log(`   Submitted: ${submitted}, By: ${submittedBy}`);
    
    const result = await checklistsCollection.updateOne(
      { listId },
      { 
        $set: {
          listId,
          deptCode,
          listName,
          checkedItems,
          submitted: submitted || false,
          submittedAt: submittedAt || new Date().toISOString(),
          submittedBy: submittedBy || 'Staff',
          userRole: userRole || 'staff',
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`✅ Checklist saved successfully`);
    res.json({ success: true, data: { listId, submitted } });
  } catch (error) {
    console.error('❌ Error saving checklist:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/checklist/confirmed/all', async (req, res) => {
  try {
    console.log(`📡 Fetching all confirmed checklists`);
    
    const checklists = await checklistsCollection
      .find({ submitted: true })
      .sort({ submittedAt: -1 })
      .toArray();
    
    for (let checklist of checklists) {
      const equipmentItems = await deptEquipmentCollection
        .find({ listId: checklist.listId })
        .toArray();
      checklist.equipmentDetails = equipmentItems;
    }
    
    console.log(`✅ Found ${checklists.length} confirmed checklists`);
    res.json({ success: true, data: checklists });
  } catch (error) {
    console.error('❌ Error fetching confirmed checklists:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== OT CUSTOM LISTS ROUTES ====================

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
      const equipment = await otCustomEquipmentCollection
        .find({ listId: list.id })
        .toArray();
      list.equipment = equipment;
    }
    
    console.log(`✅ Found ${lists.length} custom lists`);
    res.json({ success: true, data: lists });
  } catch (error) {
    console.error('❌ Error fetching custom lists:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ot-custom-lists', async (req, res) => {
  try {
    const { id, name, description, deptCode, roomId, createdBy, image } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ success: false, message: "id and name are required" });
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
    console.log(`✅ Custom list created: ${name}`);
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
    
    const updatedList = {
      name: name.trim(),
      description: description?.trim() || "",
      deptCode: deptCode || "General",
      roomId: roomId || null,
      updatedAt: new Date()
    };
    
    if (image) {
      updatedList.image = image;
    }
    
    const result = await otCustomListsCollection.updateOne(
      { id },
      { $set: updatedList }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "List not found" });
    }
    
    console.log(`✅ Custom list updated: ${name}`);
    res.json({ success: true, message: "List updated" });
  } catch (error) {
    console.error('❌ Error updating custom list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/ot-custom-lists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await otCustomListsCollection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "List not found" });
    }
    
    await otCustomEquipmentCollection.deleteMany({ listId: id });
    
    console.log(`✅ Custom list deleted: ${id}`);
    res.json({ success: true, message: "List deleted" });
  } catch (error) {
    console.error('❌ Error deleting custom list:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    
    if (!id || !listId || !name || !code) {
      return res.status(400).json({ success: false, message: "id, listId, name, and code are required" });
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
    console.log(`✅ Custom equipment added: ${name} to list ${listId}`);
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

// ==================== OT DEPARTMENT ROUTES ====================

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
    
    res.json({ success: true, message: "Surgery and all related data deleted" });
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
      return res.status(400).json({ success: false, message: "Missing required fields: setId, name, code" });
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

// ==================== TEST & DEBUG ROUTES ====================

app.get('/api/test/admins', async (req, res) => {
  try {
    const db = client.db("medical_equipment");
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    const adminCollectionTest = db.collection("admin");
    let admin = await adminCollectionTest.findOne({ staff_no: "host3487539" });
    if (!admin) admin = await adminCollectionTest.findOne({ staffNumber: "host3487539" });
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
    const db = client.db("medical_equipment");
    const allAdmins = await db.collection("admin").find({}).toArray();
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

// ==================== PDF GENERATION ROUTE ====================

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { content, filename } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
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

// ==================== IMAGE PROXY ROUTE ====================

app.get('/api/image-proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image URL is required' });
    }
    
    console.log(`📡 Fetching image from: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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

// ==================== SERVER START ====================
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`👑 Admin credentials: staff_no=host3487539, password=123456`);
  console.log(`📦 Dept Lists API:      /api/dept-lists/:deptCode`);
  console.log(`📦 Dept Equipment API:  /api/dept-equipment/:deptCode/:listId`);
  console.log(`📋 Checklist API:       /api/checklist/:listId`);
  console.log(`✅ Checklist Save API:  /api/checklist/save`);
  console.log(`🆕 OT Surgeries API:    /api/ot/surgeries`);
  console.log(`🆕 OT Sets API:         /api/ot/sets/:surgeryId`);
  console.log(`🆕 OT Equipment API:    /api/ot/equipment/:setId`);
  console.log(`📋 OT Custom Lists API: /api/ot-custom-lists`);
  console.log(`🔧 OT Custom Equip API: /api/ot-custom-equipment`);
  console.log(`🤖 AI Search API:       /api/ai-search/instrument?name=...`);
  console.log(`🔧 Debug: /api/test/admins | /api/debug/admin-structure`);
});