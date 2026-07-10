const mongoose = require("mongoose");

// Define the schema for medical equipment
const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Equipment name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    code: {
        type: String,
        required: [true, "Equipment code is required"],
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        enum: {
            values: ["Surgery", "ICU", "Laboratory", "Pharmacy", "Radiology", "Emergency", "Other"],
            message: "{VALUE} is not a valid category"
        }
    },
    model: {
        type: String,
        trim: true,
        default: "N/A"
    },
    manufacturer: {
        type: String,
        trim: true,
        default: "Unknown"
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [0, "Quantity cannot be negative"],
        default: 0
    },
    unitPrice: {
        type: Number,
        min: [0, "Price cannot be negative"],
        default: 0
    },
    location: {
        type: String,
        trim: true,
        default: "Main Warehouse"
    },
    status: {
        type: String,
        enum: ["Available", "In Use", "Under Maintenance", "Retired"],
        default: "Available"
    },
    image: {
        type: String,
        default: null
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    lastMaintenance: {
        type: Date,
        default: Date.now
    },
    warrantyExpiry: {
        type: Date
    },
    serialNumber: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    notes: {
        type: String,
        maxlength: [500, "Notes cannot exceed 500 characters"]
    },
    
    // ============================================
    // 🆕 حقول جديدة لدعم نظام OT (ثلاثة مستويات)
    // ============================================
    
    // القسم الرئيسي (مثل: OT, A/E, ANC...)
    deptCode: {
        type: String,
        default: "",
        index: true
    },
    
    // ID القائمة (مثل: ID نوع العملية أو ID الـ Set)
    listId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true
    },
    
    // اسم نوع العملية (مثل: Orthopedic Surgery)
    surgeryType: {
        type: String,
        default: ""
    },
    
    // اسم الـ Set (مثل: Knee Surgery Set)
    setType: {
        type: String,
        default: ""
    },
    
    // مستوى المعدة (1=قسم, 2=نوع عملية, 3=Set)
    level: {
        type: Number,
        default: 3,
        enum: [1, 2, 3]
    },
    
    // ID الأب (للتنقل بين المستويات)
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true
    },
    
    createdBy: {
        type: String,
        default: "System"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for total value
equipmentSchema.virtual('totalValue').get(function() {
    return this.quantity * this.unitPrice;
});

// Indexes
equipmentSchema.index({ name: 1 });
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ code: 1 });
equipmentSchema.index({ deptCode: 1, listId: 1 }); // ✅ فهرس جديد للـ OT
equipmentSchema.index({ surgeryType: 1 });
equipmentSchema.index({ setType: 1 });

// Middleware
equipmentSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Static methods
equipmentSchema.statics.getByCategory = function(category) {
    return this.find({ category: category });
};

equipmentSchema.statics.getByCode = function(code) {
    return this.findOne({ code: code });
};

// 🆕 Static methods لـ OT system
equipmentSchema.statics.getBySetId = function(setId) {
    return this.find({ listId: setId, level: 3 });
};

equipmentSchema.statics.getBySurgeryType = function(surgeryType) {
    return this.find({ surgeryType: surgeryType });
};

// Instance methods
equipmentSchema.methods.markUnderMaintenance = function() {
    this.status = "Under Maintenance";
    this.lastMaintenance = Date.now();
    return this.save();
};

const Equipment = mongoose.model("Equipment", equipmentSchema);

module.exports = Equipment;