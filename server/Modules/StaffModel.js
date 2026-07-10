// StaffModel.js - هذا الملف للتوثيق فقط
// بما أننا نستخدم MongoDB Driver مباشرة، هذا الملف يوضح هيكل البيانات

/*
 * هيكل بيانات الموظف (Staff) في قاعدة البيانات
 * collection name: "staff"
 */

const StaffSchema = {
  // معلومات أساسية
  name: {
    type: "string",
    required: true,
    description: "الاسم الكامل للموظف"
  },
  email: {
    type: "string",
    required: true,
    unique: true,
    description: "البريد الإلكتروني (يستخدم لتسجيل الدخول)"
  },
  password: {
    type: "string",
    required: true,
    description: "كلمة المرور (مشفرة باستخدام bcrypt)"
  },
  
  // معلومات وظيفية
  role: {
    type: "string",
    enum: ["staff", "admin"],
    default: "staff",
    description: "صلاحية المستخدم (staff = موظف عادي، admin = مدير)"
  },
  department: {
    type: "string",
    enum: ["Surgery", "ICU", "Emergency", "Laboratory", "Pharmacy", "Radiology", "Administration", "General"],
    default: "General",
    description: "القسم الذي يعمل فيه الموظف"
  },
  phone: {
    type: "string",
    required: false,
    description: "رقم الهاتف (اختياري)"
  },
  
  // حالة الحساب
  isActive: {
    type: "boolean",
    default: true,
    description: "هل الحساب نشط؟ (false = معطل)"
  },
  lastLogin: {
    type: "date",
    default: null,
    description: "آخر تاريخ تسجيل دخول"
  },
  
  // تواريخ النظام
  createdAt: {
    type: "date",
    default: "new Date()",
    description: "تاريخ إنشاء الحساب"
  },
  updatedAt: {
    type: "date",
    default: null,
    description: "تاريخ آخر تحديث"
  }
};

/*
 * مثال لبيانات موظف في قاعدة البيانات:
 * 
 * {
 *   "_id": ObjectId("65a1b2c3d4e5f67890123456"),
 *   "name": "Ahmed Mohamed",
 *   "email": "ahmed@hospital.com",
 *   "password": "$2a$10$xyz... (مشفرة)",
 *   "role": "admin",
 *   "department": "Administration",
 *   "phone": "+966512345678",
 *   "isActive": true,
 *   "lastLogin": ISODate("2024-01-15T10:30:00Z"),
 *   "createdAt": ISODate("2024-01-01T08:00:00Z"),
 *   "updatedAt": ISODate("2024-01-15T10:30:00Z")
 * }
 */

export default StaffSchema;