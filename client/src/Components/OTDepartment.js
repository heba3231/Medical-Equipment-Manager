// Components/OTDepartment.js
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from 'qrcode.react';

// ✅ Hook للاستجابة
function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}

// ============================================================
// ✅ API_BASE
// ============================================================
const API_BASE =
  process.env.REACT_APP_API_URL ||
  `${window.location.origin}/api`;

if (typeof window !== 'undefined') {
  window.__API_BASE__ = API_BASE;
  console.log('🔍 API_BASE =', API_BASE);
}

// ============================================================
// ✅ ضغط الصور
// ============================================================
function compressImage(file, maxDimension = 500, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

// ============================================================
// ✅ API Helper
// ============================================================
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // not JSON
  }

  if (!response.ok) {
    const err = new Error(data?.message || `HTTP ${response.status} ${response.statusText}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  if (data && data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function OTDepartment() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

  // ========== CHECK FOR SIMPLE VIEW ==========
  const queryParams = new URLSearchParams(location.search);
  const isSimpleView = queryParams.get("view") === "simple";
  const qrDeptCode = queryParams.get("deptCode");
  const qrListId = queryParams.get("listId");

  // ========== STATE ==========
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const [newDept, setNewDept] = useState({ name: "", description: "" });
  const [editingDeptId, setEditingDeptId] = useState(null);

  const [lists, setLists] = useState({});
  const [newList, setNewList] = useState({ name: "", description: "" });
  const [editingListId, setEditingListId] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState(qrDeptCode || null);
  const [selectedListId, setSelectedListId] = useState(qrListId || null);

  const [equipment, setEquipment] = useState({});
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    code: "",
    quantity: 1,
    image: null
  });
  const [editingEquipId, setEditingEquipId] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageModal, setImageModal] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const [showQRModal, setShowQRModal] = useState(false);
  const [serverIP, setServerIP] = useState(window.location.hostname);

  const [checkMode, setCheckMode] = useState(false);
  const [checkData, setCheckData] = useState({});
  const [checkMeta, setCheckMeta] = useState({ technician: "", startedAt: null });
  const [checkListImage, setCheckListImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);

  // ✅ Refs لحفظ القيم الحالية دون إعادة تشغيل Polling
  const selectedDeptIdRef = useRef(selectedDeptId);
  const selectedListIdRef = useRef(selectedListId);
  const checkModeRef = useRef(checkMode);

  useEffect(() => { selectedDeptIdRef.current = selectedDeptId; }, [selectedDeptId]);
  useEffect(() => { selectedListIdRef.current = selectedListId; }, [selectedListId]);
  useEffect(() => { checkModeRef.current = checkMode; }, [checkMode]);

  const { width } = useWindowSize();
  const isMobile = width < 768;
  const isTablet = width < 1024 && width >= 768;

  // ========== SVG ICONS ==========
  const Icons = {
    hospital: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
        <path d="M9 3v4M15 3v4M9 11h2M13 11h2M9 15h2M13 15h2" />
      </svg>
    ),
    list: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
    equipment: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    add: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    edit: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    delete: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    ),
    cancel: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    camera: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    upload: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    imagePlaceholder: () => (
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    loading: () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    admin: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    staff: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    qty: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="12" y1="8" x2="12" y2="16" />
      </svg>
    ),
    search: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    empty: () => (
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    eye: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    back: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    ),
    bell: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    chevronDown: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    barcode: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 5v14M7 5v14M11 5v10M15 5v14M19 5v10M21 5v14" />
      </svg>
    ),
    calendar: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    wrench: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004d32" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    checkCircle: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    warnTriangle: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    questionCircle: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 2-3 4" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    printer: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    ),
    sendCheck: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    refresh: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
    close: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  };

  // ========== GET SERVER IP FOR QR ==========
  useEffect(() => {
    const currentHostname = window.location.hostname;
    if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
      setServerIP('192.168.8.93');
    } else {
      setServerIP(currentHostname);
    }
  }, []);

  // ========== LOAD DATA ==========
  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (qrListId && qrDeptCode) {
      setSelectedDeptId(qrDeptCode);
      setSelectedListId(qrListId);
      fetchEquipment(qrListId);
    }
  }, [qrListId, qrDeptCode]);

  // ============================================================
  // ✅ loadDepartments — تحميل متوازي (أسرع 10-20 مرة)
  // ============================================================
  const loadDepartments = async () => {
    try {
      setLoading(true);
      setServerError(null);

      const t0 = Date.now();

      // 1. اجلب الأقسام
      const deptsData = await apiFetch(`${API_BASE}/ot-departments?_t=${Date.now()}`);
      const depts = deptsData.data || [];
      setDepartments(depts);
      console.log(`📥 ${depts.length} departments loaded in ${Date.now() - t0}ms`);

      if (depts.length === 0) {
        setLoading(false);
        return;
      }

      // 2. اجلب لستات كل الأقسام بالتوازي
      const results = await Promise.all(
        depts.map(dept =>
          apiFetch(`${API_BASE}/ot-custom-lists?deptCode=${encodeURIComponent(dept.id)}&_t=${Date.now()}`)
            .then(d => ({ deptId: dept.id, lists: d.data || [] }))
            .catch(err => {
              console.warn(`⚠️ Failed to fetch lists for ${dept.id}:`, err.message);
              return { deptId: dept.id, lists: [] };
            })
        )
      );

      // 3. ابنِ state من النتائج
      const newLists = {};
      const newEquipment = {};

      for (const { deptId, lists } of results) {
        newLists[deptId] = lists;
        for (const list of lists) {
          newEquipment[list.id] = list.equipment || [];
        }
      }

      setLists(newLists);
      setEquipment(newEquipment);
      console.log(`📥 Total ${Object.values(newLists).flat().length} lists loaded in ${Date.now() - t0}ms`);
    } catch (err) {
      console.error("❌ loadDepartments error:", err.message);
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ✅ fetchLists — بدون طلب إضافي للمعدات
  // ============================================================
  const fetchLists = async (deptId) => {
    try {
      const data = await apiFetch(
        `${API_BASE}/ot-custom-lists?deptCode=${encodeURIComponent(deptId)}&_t=${Date.now()}`
      );

      if (data.success) {
        const listsArr = data.data || [];
        setLists(prev => ({ ...prev, [deptId]: listsArr }));

        const equipMap = {};
        for (const list of listsArr) {
          if (list.equipment) equipMap[list.id] = list.equipment;
        }
        if (Object.keys(equipMap).length > 0) {
          setEquipment(prev => ({ ...prev, ...equipMap }));
        }

        console.log(`📥 fetchLists [${deptId}]: ${listsArr.length} lists`);
      }
    } catch (err) {
      console.error("❌ fetchLists error for", deptId, ":", err.message);
      setLists(prev => ({ ...prev, [deptId]: prev[deptId] || [] }));
    }
  };

  // ============================================================
  // ✅ fetchEquipment — للتحديث اليدوي فقط
  // ============================================================
  const fetchEquipment = async (listId) => {
    try {
      const data = await apiFetch(
        `${API_BASE}/ot-custom-equipment/${encodeURIComponent(listId)}?_t=${Date.now()}`
      );
      console.log(`📥 fetchEquipment [${listId}]: ${data.data?.length || 0} items`);

      if (data.success) {
        setEquipment(prev => ({ ...prev, [listId]: data.data || [] }));
      }
    } catch (err) {
      console.error("❌ fetchEquipment error:", err.message);
    }
  };

  // ============================================================
  // ✅✅✅ POLLING — آمن (لا يمسح البيانات عند فشل جزئي)
  // ============================================================
  useEffect(() => {
    let isRefreshing = false;

    const refreshAll = async () => {
      // تجاهل إذا التبويب مخفي
      if (document.visibilityState !== 'visible') return;
      // تجاهل إذا في وسط تحديث سابق
      if (isRefreshing) return;
      // تجاهل إذا المستخدم في وضع الفحص
      if (checkModeRef.current) return;

      isRefreshing = true;

      try {
        // 1. اجلب الأقسام
        const deptsData = await apiFetch(
          `${API_BASE}/ot-departments?_t=${Date.now()}`
        );
        const depts = deptsData.data || [];

        // ✅ لا تمسح الأقسام إذا رجعت فاضية فجأة (خطأ شبكة مؤقت)
        if (depts.length === 0) {
          console.warn('⚠️ Poll returned empty departments — skipping update');
          return;
        }

        // 2. اجلب اللستات بالتوازي — مع علامة ok للنجاح
        const results = await Promise.all(
          depts.map(dept =>
            apiFetch(
              `${API_BASE}/ot-custom-lists?deptCode=${encodeURIComponent(dept.id)}&_t=${Date.now()}`
            )
              .then(d => ({ deptId: dept.id, lists: d.data || [], ok: true }))
              .catch(err => {
                console.warn(`⚠️ Poll fetch failed for ${dept.id}:`, err.message);
                return { deptId: dept.id, lists: null, ok: false };
              })
          )
        );

        // 3. حدّث الأقسام
        setDepartments(depts);

        // 4. حدّث اللستات — فقط للأقسام التي نجح جلبها (احتفظ بالقديمة عند الفشل)
        setLists(prev => {
          const next = { ...prev };
          for (const { deptId, lists, ok } of results) {
            if (ok && lists !== null) {
              next[deptId] = lists;
            }
            // إذا فشل، احتفظ بالقيمة القديمة (لا تمسح)
          }
          return next;
        });

        // 5. حدّث المعدات — بنفس المنطق + الحفاظ على العناصر optimistic
        setEquipment(prev => {
          const merged = { ...prev };
          for (const { lists, ok } of results) {
            if (!ok || lists === null) continue;
            for (const list of lists) {
              const serverItems = list.equipment || [];
              const serverIds = new Set(serverItems.map(i => i.id));
              // احتفظ بالعناصر التي لم يصلها السيرفر بعد
              const optimisticItems = (prev[list.id] || []).filter(
                i => i._optimistic && !serverIds.has(i.id)
              );
              merged[list.id] = [...serverItems, ...optimisticItems];
            }
          }
          return merged;
        });

        console.log('🔄 Polled sync completed');
      } catch (err) {
        console.warn('⚠️ Poll refresh failed:', err.message);
      } finally {
        isRefreshing = false;
      }
    };

    // ✅ Polling كل 5 ثوانٍ
    const pollInterval = setInterval(refreshAll, 5000);

    // ✅ تحديث فوري عند رجوع التبويب أو focus النافذة
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page focused — refreshing...');
        refreshAll();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // ← مرة واحدة فقط

  // ============================================================
  // ✅ DEPARTMENT CRUD
  // ============================================================
  const handleAddDept = async () => {
    if (!newDept.name.trim()) return alert("Please enter department name");

    setSaving(true);
    try {
      if (editingDeptId) {
        await apiFetch(`${API_BASE}/ot-departments/${editingDeptId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newDept.name.trim(),
            description: newDept.description.trim()
          })
        });
        setEditingDeptId(null);
      } else {
        const deptId = `dept_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await apiFetch(`${API_BASE}/ot-departments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: deptId,
            name: newDept.name.trim(),
            description: newDept.description.trim()
          })
        });
      }

      await loadDepartments();
      setNewDept({ name: "", description: "" });
    } catch (err) {
      console.error("❌ handleAddDept:", err);
      alert("❌ فشل حفظ القسم: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setNewDept({ name: dept.name, description: dept.description || "" });
  };

  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"? All lists and equipment will be deleted!`)) return;

    try {
      await apiFetch(`${API_BASE}/ot-departments/${id}`, { method: "DELETE" });

      setDepartments(prev => prev.filter(d => d.id !== id));
      setLists(prev => { const c = { ...prev }; delete c[id]; return c; });

      if (selectedDeptId === id) setSelectedDeptId(null);
      if (selectedListId) setSelectedListId(null);

      await loadDepartments();
    } catch (err) {
      console.error("❌ handleDeleteDept:", err);
      alert("❌ فشل حذف القسم: " + err.message);
    }
  };

  // ============================================================
  // ✅ LIST CRUD
  // ============================================================
  const handleAddList = async () => {
    if (!newList.name.trim()) return alert("Please enter list name");
    if (!selectedDeptId) return alert("Please select a department first");

    setSaving(true);
    try {
      const listData = {
        id: editingListId || `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: newList.name.trim(),
        description: newList.description.trim() || "",
        deptCode: selectedDeptId,
        roomId: null,
        createdBy: localStorage.getItem("userName") || "Admin"
      };

      console.log('📤 POST list:', listData);

      const url = editingListId
        ? `${API_BASE}/ot-custom-lists/${editingListId}`
        : `${API_BASE}/ot-custom-lists`;
      const method = editingListId ? "PUT" : "POST";

      const data = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData)
      });

      if (!data.success) throw new Error(data.message || "Unknown error");

      await fetchLists(selectedDeptId);

      setNewList({ name: "", description: "" });
      setEditingListId(null);
    } catch (err) {
      console.error("❌ handleAddList:", err);
      alert("❌ فشل حفظ اللستة: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditList = (list) => {
    setEditingListId(list.id);
    setNewList({ name: list.name, description: list.description || "" });
  };

  const handleDeleteList = async (listId, name) => {
    if (!window.confirm(`Delete list "${name}"? All equipment will be deleted!`)) return;

    try {
      const data = await apiFetch(`${API_BASE}/ot-custom-lists/${listId}`, {
        method: "DELETE"
      });

      if (!data.success) throw new Error(data.message || "Delete failed");

      await fetchLists(selectedDeptId);

      setEquipment(prev => {
        const copy = { ...prev };
        delete copy[listId];
        return copy;
      });

      if (selectedListId === listId) setSelectedListId(null);
    } catch (err) {
      console.error("❌ handleDeleteList:", err);
      alert("❌ فشل حذف اللستة: " + err.message);
    }
  };

  // ============================================================
  // ✅ EQUIPMENT CRUD — مع Optimistic Update
  // ============================================================
  const handleAddEquipment = async () => {
    if (!newEquipment.name.trim() || !newEquipment.code.trim()) {
      return alert("Please enter equipment name and code");
    }
    if (!selectedListId) return alert("Please select a list first");

    // ✅ 1. أضف فوراً للـ state (optimistic)
    const tempId = `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimisticItem = {
      id: editingEquipId || tempId,
      listId: selectedListId,
      name: newEquipment.name.trim(),
      code: newEquipment.code.trim(),
      quantity: parseInt(newEquipment.quantity) || 1,
      status: 'Available',
      image: newEquipment.image || null,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    const isEditing = !!editingEquipId;
    const savedName = optimisticItem.name;
    const savedCode = optimisticItem.code;
    const savedQty = optimisticItem.quantity;
    const savedImg = optimisticItem.image;
    const savedListId = selectedListId;

    if (!isEditing) {
      setEquipment(prev => ({
        ...prev,
        [savedListId]: [...(prev[savedListId] || []), optimisticItem]
      }));
    } else {
      setEquipment(prev => ({
        ...prev,
        [savedListId]: (prev[savedListId] || []).map(item =>
          item.id === editingEquipId ? { ...item, ...optimisticItem, _optimistic: true } : item
        )
      }));
    }

    resetEquipmentForm();

    // ✅ 2. أرسل للسيرفر
    setSaving(true);
    try {
      const equipData = {
        id: editingEquipId || tempId,
        listId: savedListId,
        name: savedName,
        code: savedCode,
        quantity: savedQty,
        image: savedImg,
      };

      const url = isEditing
        ? `${API_BASE}/ot-custom-equipment/${editingEquipId}`
        : `${API_BASE}/ot-custom-equipment`;
      const method = isEditing ? "PUT" : "POST";

      let data;
      try {
        data = await apiFetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(equipData)
        });
      } catch (err) {
        if (err.status === 409 || err.data?.alreadyExists) {
          console.warn('⚠️ ID collision, retrying with new ID');
          equipData.id = `eq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          data = await apiFetch(`${API_BASE}/ot-custom-equipment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(equipData)
          });
        } else {
          throw err;
        }
      }

      if (!data.success) throw new Error(data.message || "Unknown error");

      // ✅ 3. استبدل الـ optimistic element — مع Fallback defensive
      setEquipment(prev => ({
        ...prev,
        [savedListId]: (prev[savedListId] || []).map(item => {
          const matches = item.id === tempId || (isEditing && item.id === editingEquipId);
          if (!matches) return item;

          // ✅ استخدم data.data إن وُجد، وإلا optimisticItem كـ fallback
          const finalData = (data.data && data.data.id)
            ? data.data
            : { ...optimisticItem };

          return {
            ...finalData,
            _optimistic: false,
            id: finalData.id || item.id,
            listId: finalData.listId || savedListId,
          };
        })
      }));

      console.log(`✅ ${savedName} saved`);
    } catch (err) {
      console.error("❌ handleAddEquipment:", err);

      setEquipment(prev => ({
        ...prev,
        [savedListId]: (prev[savedListId] || []).filter(item => !item._optimistic)
      }));

      alert("❌ فشل حفظ المعدة: " + err.message);

      setNewEquipment({
        name: savedName,
        code: savedCode,
        quantity: savedQty,
        image: savedImg
      });
      setImagePreview(savedImg);
    } finally {
      setSaving(false);
    }
  };

  const handleEditEquipment = (item) => {
    setEditingEquipId(item.id);
    setNewEquipment({
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      image: item.image || null
    });
    setImagePreview(item.image || null);
  };

  const handleDeleteEquipment = async (id, name) => {
    if (!id) {
      alert("❌ هذه المعدة قديمة ولا يمكن حذفها — يرجى حذفها من MongoDB");
      return;
    }

    if (!window.confirm(`Delete equipment "${name}"?`)) return;

    const currentListId = selectedListId;
    const backup = (equipment[currentListId] || []).find(item => item.id === id);

    setEquipment(prev => ({
      ...prev,
      [currentListId]: (prev[currentListId] || []).filter(item => item.id !== id)
    }));

    console.log(`📤 DELETE equipment: ${id}`);

    try {
      const url = `${API_BASE}/ot-custom-equipment/${encodeURIComponent(id)}`;
      const response = await fetch(url, {
        method: "DELETE",
        cache: 'no-store',
      });

      const data = await response.json().catch(() => null);
      console.log('📥 Delete response:', response.status, data);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || `HTTP ${response.status}`);
      }

      console.log(`✅ Equipment deleted: ${id}`);
    } catch (err) {
      console.error("❌ Delete failed, restoring:", err);

      if (backup) {
        setEquipment(prev => ({
          ...prev,
          [currentListId]: [...(prev[currentListId] || []), backup]
        }));
      }

      alert("❌ فشل حذف المعدة: " + err.message);
    }
  };

  const resetEquipmentForm = () => {
    setNewEquipment({ name: "", code: "", quantity: 1, image: null });
    setImagePreview(null);
    setEditingEquipId(null);
  };

  // ============================================================
  // ✅ IMAGE HANDLING
  // ============================================================
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ الصورة كبيرة! الحد الأقصى 5MB قبل الضغط");
      return;
    }

    try {
      const compressed = await compressImage(file, 500, 0.7);
      console.log(`📷 Image compressed: ${file.size} bytes → ${compressed.length} chars`);

      setImagePreview(compressed);
      setNewEquipment(prev => ({ ...prev, image: compressed }));
    } catch (err) {
      alert("❌ فشل معالجة الصورة: " + err.message);
    }
  };

  const handleCapturePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = handleImageChange;
    input.click();
  };

  // ========== QR CODE URL ==========
  const getQRUrl = () => {
    const currentPort = window.location.port ? `:${window.location.port}` : "";
    return `${window.location.protocol}//${serverIP}${currentPort}${window.location.pathname}?view=simple&deptCode=${selectedDeptId}&listId=${selectedListId}`;
  };

  // ========== COMPUTED VALUES ==========
  const currentLists = selectedDeptId ? lists[selectedDeptId] || [] : [];
  const currentEquipment = selectedListId ? equipment[selectedListId] || [] : [];
  const selectedListObj = currentLists.find(l => l.id === selectedListId) || null;
  const selectedListName = selectedListObj?.name || "";
  const selectedDeptName = departments.find(d => d.id === selectedDeptId)?.name || "";

  // ========== SEARCH & SORT ==========
  const filteredAndSortedEquipment = useMemo(() => {
    let result = [...currentEquipment];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'quantity':
        result.sort((a, b) => a.quantity - b.quantity);
        break;
      default:
        break;
    }

    return result;
  }, [currentEquipment, searchTerm, sortBy]);

  // ========== CHECK LOGIC ==========
  const startCheck = () => {
    if (!selectedListId) return alert("Please select a list first");
    const initial = {};
    currentEquipment.forEach(item => {
      initial[item.id] = {
        present: item.quantity,
        damaged: false,
        damagedQuantity: 0,
        note: ""
      };
    });
    setCheckData(initial);

    const userName = localStorage.getItem("userName") ||
                     localStorage.getItem("adminName") ||
                     "Technician";

    setCheckMeta({
      technician: userName,
      startedAt: new Date()
    });
    const today = new Date();
    today.setMonth(today.getMonth() + 6);
    setExpiryDate(today);

    setCheckListImage(selectedListObj?.image || null);
    setCheckMode(true);
  };

  const updateCheckPresent = (itemId, delta, maxQty) => {
    setCheckData(prev => {
      const current = prev[itemId] || { present: 0, damaged: false, damagedQuantity: 0, note: "" };
      const nextPresent = Math.max(0, Math.min(maxQty, current.present + delta));
      return { ...prev, [itemId]: { ...current, present: nextPresent } };
    });
  };

  const toggleCheckDamaged = (itemId) => {
    setCheckData(prev => {
      const current = prev[itemId] || { present: 0, damaged: false, damagedQuantity: 0, note: "" };
      const newDamaged = !current.damaged;
      const newDamagedQuantity = newDamaged ? (current.damagedQuantity || 0) : 0;
      const finalDamagedQuantity = newDamaged ? Math.min(newDamagedQuantity, current.present) : 0;
      return { ...prev, [itemId]: { ...current, damaged: newDamaged, damagedQuantity: finalDamagedQuantity } };
    });
  };

  const updateDamagedQuantity = (itemId, value) => {
    setCheckData(prev => {
      const current = prev[itemId] || { present: 0, damaged: false, damagedQuantity: 0, note: "" };
      let newVal = parseInt(value) || 0;
      newVal = Math.min(newVal, current.present);
      const finalVal = current.damaged ? newVal : 0;
      return { ...prev, [itemId]: { ...current, damagedQuantity: finalVal } };
    });
  };

  const updateCheckNote = (itemId, note) => {
    setCheckData(prev => {
      const current = prev[itemId] || { present: 0, damaged: false, damagedQuantity: 0, note: "" };
      return { ...prev, [itemId]: { ...current, note } };
    });
  };

  const getItemStatus = (item) => {
    const data = checkData[item.id] || { present: item.quantity, damaged: false, damagedQuantity: 0 };
    if (data.damaged && data.damagedQuantity > 0) return "damaged";
    if (data.damaged && data.damagedQuantity === 0) return "damaged-zero";
    if (data.present >= item.quantity) return "ok";
    return "missing";
  };

  const checkStats = useMemo(() => {
    let totalRequired = 0;
    let totalPresent = 0;
    let okCount = 0;
    let missingCount = 0;
    let damagedCount = 0;
    let undeterminedCount = 0;

    currentEquipment.forEach(item => {
      const requiredQty = item.quantity || 0;
      totalRequired += requiredQty;

      const data = checkData[item.id];
      if (!data) {
        undeterminedCount += requiredQty;
        return;
      }

      const available = data.present || 0;
      totalPresent += available;

      const damagedQty = (data.damaged && data.damagedQuantity > 0)
        ? Math.min(data.damagedQuantity, available)
        : 0;

      const missingQty = Math.max(0, requiredQty - available);
      const usableQty = Math.max(0, available - damagedQty);

      damagedCount += damagedQty;
      missingCount += missingQty;
      okCount += usableQty;
    });

    const percentage = totalRequired > 0
      ? Math.round((totalPresent / totalRequired) * 100)
      : 0;

    return {
      totalRequired,
      totalPresent,
      okCount,
      missingCount,
      damagedCount,
      undeterminedCount,
      percentage
    };
  }, [currentEquipment, checkData]);

  const handleApproveAndSend = async () => {
    if (!selectedListId) {
      alert("No list selected.");
      return;
    }

    const simpleChecked = {};
    const damagedItems = {};
    const availableQuantities = {};
    const damagedQuantities = {};
    const missingQuantities = {};

    currentEquipment.forEach(item => {
      const data = checkData[item.id];
      const requiredQty = item.quantity || 0;

      if (data) {
        const available = data.present || 0;
        const damaged = (data.damaged && data.damagedQuantity > 0)
          ? Math.min(data.damagedQuantity, available)
          : 0;

        const missing = Math.max(0, requiredQty - available);

        simpleChecked[item.id] = (available >= requiredQty && !data.damaged);
        availableQuantities[item.id] = available;
        damagedQuantities[item.id] = damaged;
        missingQuantities[item.id] = missing;

        if (damaged > 0) damagedItems[item.id] = damaged;
      } else {
        simpleChecked[item.id] = false;
        availableQuantities[item.id] = 0;
        damagedQuantities[item.id] = 0;
        missingQuantities[item.id] = requiredQty;
      }
    });

    const userName = localStorage.getItem("userName") ||
                     localStorage.getItem("adminName") ||
                     "Technician";

    const payload = {
      listId: selectedListId,
      deptCode: selectedDeptId,
      listName: selectedListName,
      checkedItems: simpleChecked,
      damagedItems: damagedItems,
      availableQuantities: availableQuantities,
      damagedQuantities: damagedQuantities,
      missingQuantities: missingQuantities,
      submitted: true,
      submittedAt: new Date().toISOString(),
      submittedBy: userName,
      userRole: "admin",
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
    };

    try {
      setSaving(true);
      const data = await apiFetch(`${API_BASE}/checklist/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!data.success) throw new Error(data.message || "Unknown error");

      alert('✅ Checklist submitted successfully!');
      setCheckMode(false);
      navigate('/reports', { state: { refresh: true } });
    } catch (err) {
      console.error('❌ Error submitting checklist:', err);
      alert('❌ Error submitting checklist: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReportShortage = () => {
    alert("📢 Shortage notification sent to room administrator");
  };

  const handleCheckListImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ الصورة كبيرة! الحد الأقصى 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const compressed = await compressImage(file, 600, 0.7);
      console.log(`📷 Set image compressed: ${file.size} → ${compressed.length} chars`);
      setCheckListImage(compressed);

      const listData = {
        name: selectedListObj?.name || "",
        description: selectedListObj?.description || "",
        image: compressed,
        deptCode: selectedDeptId,
        roomId: null
      };

      const result = await apiFetch(`${API_BASE}/ot-custom-lists/${selectedListId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData)
      });

      if (result.success) {
        setLists(prev => {
          const updatedLists = { ...prev };
          if (updatedLists[selectedDeptId]) {
            updatedLists[selectedDeptId] = updatedLists[selectedDeptId].map(list =>
              list.id === selectedListId ? { ...list, image: compressed } : list
            );
          }
          return updatedLists;
        });
      } else {
        alert("❌ Failed to save image: " + (result.message || "Unknown error"));
        setCheckListImage(null);
      }
    } catch (err) {
      alert("❌ فشل رفع الصورة: " + err.message);
      setCheckListImage(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCheckListRemoveImage = async () => {
    if (!window.confirm("Remove set image?")) return;

    setCheckListImage(null);
    try {
      const listData = {
        name: selectedListObj?.name || "",
        description: selectedListObj?.description || "",
        image: null,
        deptCode: selectedDeptId,
        roomId: null
      };

      const result = await apiFetch(`${API_BASE}/ot-custom-lists/${selectedListId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData)
      });

      if (result.success) {
        setLists(prev => {
          const updatedLists = { ...prev };
          if (updatedLists[selectedDeptId]) {
            updatedLists[selectedDeptId] = updatedLists[selectedDeptId].map(list =>
              list.id === selectedListId ? { ...list, image: null } : list
            );
          }
          return updatedLists;
        });
        alert("✅ Image removed successfully");
      }
    } catch (err) {
      alert("❌ Error removing image: " + err.message);
    }
  };

  // ===================== PRINT CHECKLIST =====================
  const handlePrintChecklist = () => {
    const technicianName = checkMeta.technician || "Technician";
    const dateObj = checkMeta.startedAt || new Date();
    const printDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const printTime = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let expiryDateStr = '';
    if (expiryDate) {
      expiryDateStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    let tableRows = currentEquipment.map((item, idx) => {
      const data = checkData[item.id] || { present: item.quantity, damaged: false, damagedQuantity: 0, note: "" };
      const status = getItemStatus(item);
      let statusText = '';
      if (status === 'ok') statusText = '✅ Present';
      else if (status === 'missing') statusText = `❌ Missing (${item.quantity - data.present})`;
      else if (status === 'damaged') statusText = `⚠️ Damaged (${data.damagedQuantity})`;
      else if (status === 'damaged-zero') statusText = '⚠️ Damaged (0)';
      else statusText = '❓ Undetermined';

      return `
        <tr>
          <td class="col-index">${idx + 1}</td>
          <td class="col-name">${item.name || ''}</td>
          <td class="col-required">${item.quantity || 0}</td>
          <td class="col-available">${data.present}</td>
          <td class="col-status">${statusText}</td>
          <td class="col-notes">${data.note ? data.note : '—'}</td>
        </tr>
      `;
    }).join('');

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Print Checklist</title>
        <style>
          * { box-sizing: border-box; }
          @page { size: A4; margin: 16mm 14mm; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; color: #1f2937; }
          .print-page { width: 100%; }
          .meta-line { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin-bottom: 18px; padding-bottom: 10px; border-bottom: 1.5px solid #004d32; flex-wrap: wrap; }
          .meta-item { display: flex; align-items: baseline; gap: 6px; }
          .meta-label { font-size: 12px; font-weight: 700; color: #004d32; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-value { font-size: 14px; font-weight: 700; color: #111827; }
          .expiry-date { font-weight: 700; color: #b91c1c; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th { background: #f0f7f4; color: #004d32; font-weight: 700; padding: 8px 6px; border: 1px solid #999; text-align: left; }
          tbody td { padding: 7px 6px; border: 1px solid #999; vertical-align: middle; }
          .col-index { text-align: center; width: 36px; }
          .col-required { text-align: center; width: 70px; }
          .col-available { text-align: center; width: 70px; }
          .col-status { text-align: left; width: 120px; }
          .col-notes { text-align: left; width: 140px; }
          tbody tr:nth-child(even) { background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="print-page">
          <div class="meta-line">
            <div class="meta-item"><span class="meta-label">Inspector:</span><span class="meta-value">${technicianName}</span></div>
            <div class="meta-item"><span class="meta-label">Date &amp; Time:</span><span class="meta-value">${printDate} — ${printTime}</span></div>
            <div class="meta-item"><span class="meta-label">Expiry Date:</span><span class="expiry-date">${expiryDateStr}</span></div>
          </div>
          <table>
            <thead><tr><th class="col-index">#</th><th class="col-name">Item Name</th><th class="col-required">Required</th><th class="col-available">Available</th><th class="col-status">Status</th><th class="col-notes">Notes</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => { printWindow.print(); };
  };

  // ========== TABLE CELL STYLES ==========
  const equipThStyle = {
    padding: isMobile ? "8px 6px" : "10px 8px",
    border: "2px solid #000000",
    fontSize: isMobile ? "10px" : "11px",
    color: "#000000",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.4px"
  };
  const equipTdStyle = {
    padding: isMobile ? "7px 6px" : "9px 8px",
    border: "2px solid #000000",
    verticalAlign: "middle",
    color: "#000000",
    fontSize: isMobile ? "11px" : "13px"
  };

  // ============================================================
  // 🟣 CHECK MODE
  // ============================================================
  if (checkMode) {
    const checkThStyle = {
      padding: isMobile ? "8px 6px" : "12px 10px",
      background: "#f8fafb",
      borderBottom: "2px solid #e5e7eb",
      fontSize: isMobile ? "10px" : "12px",
      color: "#6b7280",
      fontWeight: "700",
      textAlign: "left"
    };
    const checkTdStyle = {
      padding: isMobile ? "8px 6px" : "12px 10px",
      borderBottom: "1px solid #eef0f2",
      verticalAlign: "middle",
      fontSize: isMobile ? "11px" : "13px"
    };

    return (
      <div style={{
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        background: "#eef1f0",
        minHeight: "100vh"
      }}>
        <div style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: isMobile ? "10px 16px" : "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px"
        }} className="no-print">
          <button
            onClick={() => setCheckMode(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#374151",
              fontSize: isMobile ? "13px" : "14px",
              fontWeight: "600"
            }}
          >
            <Icons.back />
            Back
          </button>

          <h1 style={{
            fontSize: isMobile ? "16px" : "20px",
            fontWeight: "700",
            color: "#1f2937",
            margin: 0
          }}>
            Checking {selectedListName || "Instrument Set"}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "18px" }}>
            <div style={{ position: "relative", color: "#374151" }}>
              <Icons.bell />
              <span style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                background: "#dc2626",
                color: "white",
                fontSize: "10px",
                fontWeight: "700",
                borderRadius: "999px",
                padding: "1px 5px",
                lineHeight: "12px"
              }}>3</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "#004d32",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: isMobile ? "12px" : "14px"
              }}>
                {(checkMeta.technician || "T").charAt(0)}
              </div>
              <span style={{ fontSize: isMobile ? "12px" : "13px", fontWeight: "600", color: "#1f2937" }}>
                {checkMeta.technician || "Technician"}
              </span>
              <Icons.chevronDown />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1300px", margin: "0 auto", padding: isMobile ? "12px 10px 100px" : "22px 24px 120px" }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "20px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            gap: isMobile ? "16px" : "20px",
            flexWrap: "wrap",
            marginBottom: "20px"
          }} className="no-print">
            <div style={{
              width: isMobile ? "100%" : "150px",
              height: isMobile ? "140px" : "110px",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#f3f4f6",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: "2px dashed #d0e8dc",
              cursor: checkListImage ? "pointer" : "default"
            }}
            className="no-print"
            onClick={() => {
              if (checkListImage) {
                setImageModal(checkListImage);
              }
            }}>
              {checkListImage ? (
                <>
                  <img
                    src={checkListImage}
                    alt={selectedListName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      console.warn('⚠️ Failed to load set image');
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCheckListRemoveImage(); }}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "22px",
                      height: "22px",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Remove image"
                    className="no-print"
                  >
                    ✕
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); document.getElementById('checkImageInput').click(); }}
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      background: "#004d32",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "26px",
                      height: "26px",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Change image"
                    className="no-print"
                  >
                    <Icons.camera />
                  </button>
                </>
              ) : (
                <>
                  <Icons.imagePlaceholder />
                  <span style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }} className="no-print">Click to add image</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); document.getElementById('checkImageInput').click(); }}
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      background: "#004d32",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Add image"
                    className="no-print"
                  >
                    <Icons.add />
                  </button>
                </>
              )}
              <input
                id="checkImageInput"
                type="file"
                accept="image/*"
                onChange={handleCheckListImageUpload}
                style={{ display: "none" }}
              />
              {isUploadingImage && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "12px"
                }} className="no-print">
                  ⏳ Uploading...
                </div>
              )}
            </div>

            <div style={{ minWidth: isMobile ? "100%" : "180px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <span style={{ fontSize: isMobile ? "17px" : "19px", fontWeight: "700", color: "#1f2937" }}>
                  {selectedListName || "Equipment Set"}
                </span>
                <span style={{
                  background: "#e6f0ec",
                  color: "#065f46",
                  fontSize: "12px",
                  fontWeight: "700",
                  padding: "3px 10px",
                  borderRadius: "6px"
                }}>
                  {(selectedListId || "SET-000").toString().slice(-7).toUpperCase()}
                </span>
                <Icons.barcode />
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, auto)",
              gap: isMobile ? "8px" : "26px",
              flex: 1,
              width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "space-between" : "space-between"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.eye /> Department
                </div>
                <div style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: "700", color: "#1f2937" }}>{selectedDeptName || "—"}</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.wrench /> Total Items
                </div>
                <div style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: "700", color: "#1f2937" }}>{currentEquipment.length} items</div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.staff /> Technician
                </div>
                <div style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: "700", color: "#1f2937" }}>
                  {checkMeta.technician || "Technician"}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}>
                  <Icons.calendar /> Date & Time
                </div>
                <div style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: "700", color: "#1f2937" }}>
                  {(checkMeta.startedAt || new Date()).toLocaleDateString('en-CA')}{"  "}
                  {(checkMeta.startedAt || new Date()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, marginLeft: isMobile ? "0" : "auto" }}>
              <div style={{
                padding: isMobile ? "6px 12px" : "8px 16px",
                borderRadius: "8px",
                background: expiryDate ? "#fee2e2" : "#f3f4f6",
                border: "1px solid #dc2626",
                textAlign: "center"
              }}>
                <div style={{ fontSize: isMobile ? "10px" : "11px", fontWeight: "600", color: "#b91c1c" }}>Expiry Date</div>
                <div style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: "700", color: "#b91c1c" }}>
                  {expiryDate ? expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: isMobile ? "72px" : "84px",
                height: isMobile ? "72px" : "84px",
                borderRadius: "50%",
                background: `conic-gradient(#16a34a ${checkStats.percentage * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{
                  width: isMobile ? "58px" : "68px",
                  height: isMobile ? "58px" : "68px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <span style={{ fontSize: isMobile ? "13px" : "15px", fontWeight: "800", color: "#1f2937" }}>
                    {checkStats.totalPresent}/{checkStats.totalRequired}
                  </span>
                  <span style={{ fontSize: isMobile ? "10px" : "11px", fontWeight: "700", color: "#16a34a" }}>
                    ({checkStats.percentage}%)
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Check Percentage</span>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            overflow: "hidden"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? "700px" : "auto" }}>
                <thead>
                  <tr>
                    <th style={{ ...checkThStyle, textAlign: "center", width: "40px" }}>#</th>
                    <th style={checkThStyle}>Item Name</th>
                    <th style={{ ...checkThStyle, textAlign: "center" }}>Image</th>
                    <th style={{ ...checkThStyle, textAlign: "center" }}>Required</th>
                    <th style={{ ...checkThStyle, textAlign: "center" }}>Available</th>
                    <th style={{ ...checkThStyle, textAlign: "center" }}>Status</th>
                    <th style={checkThStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEquipment.map((item, idx) => {
                    const data = checkData[item.id] || { present: item.quantity, damaged: false, damagedQuantity: 0, note: "" };
                    const status = getItemStatus(item);
                    const rowBg = status === "missing" ? "#fdf2f2" : status === "damaged" || status === "damaged-zero" ? "#fff7ed" : "#ffffff";

                    return (
                      <tr key={item.id} style={{ background: rowBg }}>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            width: "22px",
                            height: "22px",
                            borderRadius: "50%",
                            background: "#004d32",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: "700",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>{idx + 1}</span>
                        </td>
                        <td style={{ ...checkTdStyle, fontWeight: "600", color: "#1f2937" }}>{item.name}</td>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          <span className="no-print">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                onClick={() => setImageModal(item.image)}
                                style={{ width: isMobile ? "30px" : "34px", height: isMobile ? "30px" : "34px", objectFit: "cover", borderRadius: "6px", cursor: "pointer", border: "1px solid #e5e7eb" }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<span style="color:#d1d5db;font-size:20px;">📷</span>`;
                                }}
                              />
                            ) : (
                              <span style={{ color: "#d1d5db", fontSize: "20px" }}>📷</span>
                            )}
                          </span>
                          <span className="print-only" style={{ display: "none", fontSize: "18px", color: "#004d32" }}>
                            ✓
                          </span>
                        </td>
                        <td style={{ ...checkTdStyle, textAlign: "center", fontWeight: "700", color: "#374151" }}>{item.quantity}</td>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <button
                              onClick={() => updateCheckPresent(item.id, -1, item.quantity)}
                              style={{
                                width: isMobile ? "22px" : "26px",
                                height: isMobile ? "22px" : "26px",
                                borderRadius: "6px",
                                border: "1px solid #d0e8dc",
                                background: "#f8fafb",
                                cursor: "pointer",
                                fontWeight: "700",
                                color: "#374151",
                                fontSize: isMobile ? "14px" : "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              className="no-print"
                            >−</button>
                            <span style={{
                              minWidth: "28px",
                              textAlign: "center",
                              fontWeight: "800",
                              color: status === "missing" ? "#dc2626" : "#1f2937",
                              fontSize: isMobile ? "14px" : "16px"
                            }}>
                              {data.present}
                            </span>
                            <button
                              onClick={() => updateCheckPresent(item.id, 1, item.quantity)}
                              style={{
                                width: isMobile ? "22px" : "26px",
                                height: isMobile ? "22px" : "26px",
                                borderRadius: "6px",
                                border: "1px solid #d0e8dc",
                                background: "#f8fafb",
                                cursor: "pointer",
                                fontWeight: "700",
                                color: "#374151",
                                fontSize: isMobile ? "14px" : "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              className="no-print"
                            >+</button>
                          </div>
                        </td>
                        <td style={{ ...checkTdStyle, textAlign: "center" }}>
                          {status === "ok" && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#dcfce7",
                              color: "#15803d",
                              fontSize: isMobile ? "10px" : "11px",
                              fontWeight: "700",
                              padding: isMobile ? "2px 8px" : "4px 10px",
                              borderRadius: "999px"
                            }}>
                              <Icons.checkCircle /> Present
                            </span>
                          )}
                          {status === "missing" && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              fontSize: isMobile ? "10px" : "11px",
                              fontWeight: "700",
                              padding: isMobile ? "2px 8px" : "4px 10px",
                              borderRadius: "999px"
                            }}>
                              <Icons.warnTriangle /> Missing ({item.quantity - data.present})
                            </span>
                          )}
                          {(status === "damaged" || status === "damaged-zero") && (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#ffedd5",
                              color: "#9a3412",
                              fontSize: isMobile ? "10px" : "11px",
                              fontWeight: "700",
                              padding: isMobile ? "2px 8px" : "4px 10px",
                              borderRadius: "999px"
                            }}>
                              <Icons.wrench /> Damaged
                              {status === "damaged" && ` (${data.damagedQuantity})`}
                            </span>
                          )}
                          <div>
                            <button
                              onClick={() => toggleCheckDamaged(item.id)}
                              style={{
                                marginTop: "4px",
                                background: "none",
                                border: "none",
                                color: "#6b7280",
                                fontSize: isMobile ? "9px" : "10px",
                                cursor: "pointer",
                                textDecoration: "underline"
                              }}
                              className="no-print"
                            >
                              {status === "damaged" || status === "damaged-zero" ? "Cancel damaged" : "Mark as damaged"}
                            </button>
                          </div>
                          {(status === "damaged" || status === "damaged-zero") && (
                            <div style={{ marginTop: "4px" }} className="no-print">
                              <label style={{ fontSize: "9px", color: "#6b7280", marginRight: "4px" }}>Damaged count:</label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={data.damagedQuantity || 0}
                                onChange={(e) => updateDamagedQuantity(item.id, e.target.value)}
                                style={{
                                  width: "40px",
                                  padding: "2px 4px",
                                  border: "1px solid #d0e8dc",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  textAlign: "center"
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td style={checkTdStyle}>
                          <input
                            type="text"
                            placeholder="Notes..."
                            value={data.note}
                            onChange={(e) => updateCheckNote(item.id, e.target.value)}
                            style={{
                              width: "100%",
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              padding: isMobile ? "4px 6px" : "6px 8px",
                              fontSize: isMobile ? "11px" : "12px",
                              outline: "none"
                            }}
                            className="no-print"
                          />
                          <span className="print-only" style={{ display: "none", fontSize: "12px", color: "#1f2937" }}>
                            {data.note || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {currentEquipment.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "50px", color: "#9ca3af" }}>
                        No equipment found in this list
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          padding: isMobile ? "10px 14px" : "14px 24px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isMobile ? "10px" : "14px",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)"
        }} className="no-print">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ textAlign: "center", background: "#f0fdf4", borderRadius: "10px", padding: isMobile ? "6px 12px" : "8px 18px", minWidth: isMobile ? "60px" : "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#16a34a", fontSize: isMobile ? "10px" : "11px", fontWeight: "700" }}>
                <Icons.checkCircle /> Present
              </div>
              <div style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "800", color: "#15803d" }}>{checkStats.okCount}</div>
            </div>
            <div style={{ textAlign: "center", background: "#fef2f2", borderRadius: "10px", padding: isMobile ? "6px 12px" : "8px 18px", minWidth: isMobile ? "60px" : "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#d97706", fontSize: isMobile ? "10px" : "11px", fontWeight: "700" }}>
                <Icons.warnTriangle /> Missing
              </div>
              <div style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "800", color: "#b91c1c" }}>{checkStats.missingCount}</div>
            </div>
            <div style={{ textAlign: "center", background: "#fff7ed", borderRadius: "10px", padding: isMobile ? "6px 12px" : "8px 18px", minWidth: isMobile ? "60px" : "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#c2410c", fontSize: isMobile ? "10px" : "11px", fontWeight: "700" }}>
                <Icons.wrench /> Damaged
              </div>
              <div style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "800", color: "#9a3412" }}>{checkStats.damagedCount}</div>
            </div>
            <div style={{ textAlign: "center", background: "#f9fafb", borderRadius: "10px", padding: isMobile ? "6px 12px" : "8px 18px", minWidth: isMobile ? "60px" : "84px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", color: "#9ca3af", fontSize: isMobile ? "10px" : "11px", fontWeight: "700" }}>
                <Icons.questionCircle /> Undetermined
              </div>
              <div style={{ fontSize: isMobile ? "18px" : "20px", fontWeight: "800", color: "#6b7280" }}>{checkStats.undeterminedCount}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handlePrintChecklist}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: isMobile ? "8px 14px" : "10px 20px",
                borderRadius: "10px",
                border: "1.5px solid #004d32",
                background: "white",
                color: "#004d32",
                fontWeight: "700",
                fontSize: isMobile ? "11px" : "13px",
                cursor: "pointer"
              }}
            >
              <Icons.printer /> Print List
            </button>
            <button
              onClick={handleApproveAndSend}
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: isMobile ? "8px 14px" : "10px 20px",
                borderRadius: "10px",
                border: "none",
                background: "#004d32",
                color: "white",
                fontWeight: "700",
                fontSize: isMobile ? "11px" : "13px",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? "⏳ Saving..." : <Icons.sendCheck />}
              {saving ? "Saving..." : "Approve & Send"}
            </button>
            <button
              onClick={handleReportShortage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: isMobile ? "8px 14px" : "10px 20px",
                borderRadius: "10px",
                border: "none",
                background: "#dc2626",
                color: "white",
                fontWeight: "700",
                fontSize: isMobile ? "11px" : "13px",
                cursor: "pointer"
              }}
            >
              <Icons.bell /> Report Shortage
            </button>
          </div>
        </div>

        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: inline !important; }
            body { background: #ffffff !important; }
            .ot-print-sheet { box-shadow: none !important; border: none !important; }
            table { border-collapse: collapse !important; }
            th, td { border: 1px solid #000 !important; }
            @page { margin: 0.5in; size: portrait; }
            .print-header, .print-footer { display: none !important; }
            table { width: 100% !important; }
          }
          @media screen {
            .print-only { display: none !important; }
          }
        `}</style>

        {imageModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              cursor: 'pointer'
            }}
            className="no-print"
            onClick={() => setImageModal(null)}
          >
            <button
              onClick={() => setImageModal(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '30px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10000
              }}
            >
              <Icons.close />
            </button>
            <img
              src={imageModal}
              alt="Zoomed view"
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                borderRadius: '8px',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // 🟢 SIMPLE VIEW
  // ============================================================
  if (isSimpleView && qrListId) {
    const simpleEquipment = equipment[qrListId] || [];

    const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const printTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const thStyle = {
      padding: isMobile ? "6px 4px" : "10px 8px",
      border: '1px solid #cfe3d8',
      fontSize: isMobile ? "9px" : "11px",
      color: '#004d32',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.4px'
    };
    const tdStyle = {
      padding: isMobile ? "6px 4px" : "9px 8px",
      border: '1px solid #e5e7eb',
      verticalAlign: 'middle',
      fontSize: isMobile ? "11px" : "13px"
    };

    return (
      <div style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        background: '#eef1f0',
        minHeight: '100vh',
        padding: isMobile ? '10px 6px' : '18px 12px'
      }}>
        <style>{`
          @media print {
            body { background: #ffffff !important; }
            .ot-no-print { display: none !important; }
            .ot-print-sheet { box-shadow: none !important; border: none !important; }
            .image-column { display: none !important; }
            .footer-print-hide { display: none !important; }
            .signature-print-hide { display: none !important; }
            .header-print-hide { display: none !important; }
            .dept-row-print-hide { display: none !important; }
          }
        `}</style>

        <div className="ot-print-sheet" style={{
          maxWidth: '860px',
          margin: '0 auto',
          background: '#ffffff',
          border: '1px solid #d7e3dc',
          boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div className="header-print-hide" style={{
            background: '#006341',
            padding: isMobile ? "12px 16px" : "16px 26px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '6px' : '0',
            borderBottom: '4px solid #c9a84c'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
                <path d="M9 3v4M15 3v4M9 11h2M13 11h2M9 15h2M13 15h2" />
              </svg>
              <div>
                <div style={{ color: '#ffffff', fontSize: isMobile ? "14px" : "16px", fontWeight: '700', letterSpacing: '0.4px', lineHeight: 1.2 }}>
                  OPERATING THEATER DEPARTMENT
                </div>
                <div style={{ color: '#d9ecdf', fontSize: isMobile ? "10px" : "11px", letterSpacing: '0.4px', marginTop: '2px' }}>
                  Instrument &amp; Equipment Inventory Sheet
                </div>
              </div>
            </div>
            <div style={{ textAlign: isMobile ? 'center' : 'right', color: '#eafaf0', fontSize: isMobile ? "10px" : "11px", lineHeight: 1.5 }}>
              <div>Date: {printDate}</div>
              <div>Time: {printTime}</div>
            </div>
          </div>

          <div className="dept-row-print-hide" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div style={{ padding: isMobile ? "10px 16px" : "14px 26px", borderRight: isMobile ? 'none' : '1px solid #e5e7eb', borderBottom: isMobile ? '1px solid #e5e7eb' : 'none' }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Department
              </div>
              <div style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: '700', color: '#004d32', marginTop: '2px' }}>
                {selectedDeptName || "—"}
              </div>
            </div>
            <div style={{ padding: isMobile ? "10px 16px" : "14px 26px" }}>
              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Instrument Set / List
              </div>
              <div style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: '700', color: '#004d32', marginTop: '2px' }}>
                {selectedListName || "Equipment List"}
              </div>
            </div>
          </div>

          <div style={{ padding: isMobile ? "12px 10px" : "22px 26px 10px" }}>
            {simpleEquipment.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <p>No equipment found in this list.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? "11px" : "13px", minWidth: isMobile ? "500px" : "auto" }}>
                  <thead>
                    <tr style={{ background: '#eef5f1' }}>
                      <th style={{ ...thStyle, width: '34px', textAlign: 'center' }}>No.</th>
                      <th className="image-column" style={{ ...thStyle, width: '60px', textAlign: 'center' }}>Image</th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Item Description</th>
                      <th style={{ ...thStyle, width: '110px', textAlign: 'left' }}>Code</th>
                      <th style={{ ...thStyle, width: '56px', textAlign: 'center' }}>Qty</th>
                      <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simpleEquipment.map((item, idx) => (
                      <tr key={item.id || item._id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafcfb' }}>
                        <td style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>{idx + 1}</td>
                        <td className="image-column" style={{ ...tdStyle, textAlign: 'center' }}>
                          {item.image ? (
                            <img
                              src={item.image}
                              style={{
                                width: isMobile ? "28px" : "36px",
                                height: isMobile ? "28px" : "36px",
                                objectFit: 'cover',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: '1px solid #e5e7eb'
                              }}
                              onClick={() => setImageModal(item.image)}
                              alt={item.name}
                            />
                          ) : (
                            <div style={{
                              width: isMobile ? "28px" : "36px",
                              height: isMobile ? "28px" : "36px",
                              background: '#f3f4f6',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isMobile ? "14px" : "15px",
                              border: '1px solid #e5e7eb',
                              margin: '0 auto'
                            }}>
                              📷
                            </div>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: '600', color: '#1f2937' }}>{item.name}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#4b5563' }}>{item.code || '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: '#004d32' }}>{item.quantity || 0}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', color: '#c8cdd3', fontSize: isMobile ? "14px" : "15px" }}>☐</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="signature-print-hide" style={{
            borderTop: '2px solid #e5e7eb',
            padding: isMobile ? "14px 16px 18px" : "20px 26px 26px",
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '16px' : '24px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '30px', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Checked By
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Signature &amp; Date
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '30px', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Verified By
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', borderBottom: '1px solid #d1d5db', paddingBottom: '4px' }}>
                Signature &amp; Date
              </div>
            </div>
          </div>

          <div className="footer-print-hide" style={{
            textAlign: 'center',
            padding: '8px',
            background: '#f8fafb',
            borderTop: '1px solid #e5e7eb',
            fontSize: isMobile ? "9px" : "10px",
            color: '#9ca3af'
          }}>
            📱 Generated via QR Code Scan • Internal Asset List • {simpleEquipment.length} item(s) total
          </div>
        </div>

        <div className="ot-no-print" style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: isMobile ? "8px 20px" : "10px 30px",
              background: '#006341',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: isMobile ? "13px" : "14px",
              boxShadow: '0 2px 8px rgba(0,99,65,0.25)'
            }}
          >
            🖨️ Print Sheet
          </button>
        </div>

        {imageModal && (
          <div
            className="ot-no-print"
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, cursor: 'pointer'
            }}
            onClick={() => setImageModal(null)}
          >
            <img src={imageModal} alt="Equipment" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }} />
          </div>
        )}
      </div>
    );
  }

  // ========== RENDER (Full Page) ==========
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <div style={{ marginBottom: "20px" }}><Icons.loading /></div>
        <p>Loading departments...</p>
      </div>
    );
  }

  if (serverError && departments.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
        <h2 style={{ color: "#dc2626", marginBottom: "10px" }}>تعذّر الاتصال بالسيرفر</h2>
        <p style={{ color: "#6b7280", marginBottom: "8px" }}>{serverError}</p>
        <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "20px", wordBreak: "break-all" }}>
          API: {API_BASE}
        </p>
        <button
          onClick={loadDepartments}
          style={{ padding: "10px 24px", background: "#006341", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          🔄 إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: isMobile ? "16px" : "30px",
      maxWidth: "1600px",
      margin: "0 auto",
      background: "#f5f7f6",
      minHeight: "100vh"
    }}>
      {/* ===== HEADER ===== */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        marginBottom: "24px",
        gap: "12px"
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? "22px" : "28px",
            color: "#004d32",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Icons.hospital />
            OT Department Management
          </h1>
          <p style={{ color: "#6b7280", margin: "5px 0 0", fontSize: isMobile ? "13px" : "14px" }}>
            Manage departments, lists, and equipment
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              loadDepartments();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "#e5e7eb",
              color: "#374151",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: isMobile ? "12px" : "13px"
            }}
            title="Refresh data from server"
          >
            <Icons.refresh /> Refresh
          </button>
          <span style={{
            padding: "4px 12px",
            borderRadius: "20px",
            background: isAdmin ? "#d1fae5" : "#fef3c7",
            color: isAdmin ? "#065f46" : "#92400e",
            fontSize: isMobile ? "11px" : "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            {isAdmin ? <Icons.admin /> : <Icons.staff />}
            {isAdmin ? "Admin Mode" : "Staff Mode"}
          </span>
        </div>
      </div>

      {/* ===== TWO COLUMN LAYOUT ===== */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : (isTablet ? "1fr 1.5fr" : "380px 1fr"),
        gap: "20px",
        alignItems: "start"
      }}>
        {/* ===== LEFT COLUMN ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* DEPARTMENTS SECTION */}
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: isMobile ? "14px" : "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <h2 style={{
              fontSize: isMobile ? "15px" : "16px",
              color: "#004d32",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Icons.hospital />
              Departments
            </h2>

            {isAdmin && (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                marginBottom: "12px"
              }}>
                <input
                  type="text"
                  placeholder="Department name..."
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1.5px solid #d0e8dc",
                    borderRadius: "8px",
                    fontSize: isMobile ? "13px" : "14px"
                  }}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1.5px solid #d0e8dc",
                    borderRadius: "8px",
                    fontSize: isMobile ? "13px" : "14px"
                  }}
                />
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={handleAddDept}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "#006341",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: saving ? "not-allowed" : "pointer",
                      fontWeight: "600",
                      opacity: saving ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      fontSize: isMobile ? "12px" : "13px"
                    }}
                  >
                    {saving ? "⏳" : <Icons.add />}
                    {editingDeptId ? "Update" : "Add"}
                  </button>
                  {editingDeptId && (
                    <button
                      onClick={() => { setEditingDeptId(null); setNewDept({ name: "", description: "" }); }}
                      style={{
                        padding: "8px 12px",
                        background: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: isMobile ? "12px" : "13px"
                      }}
                    >
                      <Icons.cancel />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {departments.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "13px" }}>No departments available.</p>
              ) : (
                departments.map(dept => (
                  <div
                    key={dept.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: selectedDeptId === dept.id ? "2px solid #006341" : "1px solid #d0e8dc",
                      background: selectedDeptId === dept.id ? "#e6f0ec" : "white",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                      cursor: "pointer",
                      fontSize: isMobile ? "12px" : "13px"
                    }}
                    onClick={() => {
                      setSelectedDeptId(dept.id);
                      setSelectedListId(null);
                      fetchLists(dept.id);
                    }}
                  >
                    <Icons.hospital />
                    <span style={{ flex: 1, fontWeight: selectedDeptId === dept.id ? "600" : "400" }}>
                      {dept.name}
                    </span>
                    {isAdmin && (
                      <div style={{ display: "flex", gap: "2px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditDept(dept); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                        >
                          <Icons.edit />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id, dept.name); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                        >
                          <Icons.delete />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LISTS SECTION */}
          {selectedDeptId && (
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: isMobile ? "14px" : "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}>
              <h2 style={{
                fontSize: isMobile ? "15px" : "16px",
                color: "#004d32",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Icons.list />
                Lists
              </h2>

              {isAdmin && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginBottom: "12px"
                }}>
                  <input
                    type="text"
                    placeholder="List name..."
                    value={newList.name}
                    onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1.5px solid #d0e8dc",
                      borderRadius: "8px",
                      fontSize: isMobile ? "13px" : "14px"
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newList.description}
                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "1.5px solid #d0e8dc",
                      borderRadius: "8px",
                      fontSize: isMobile ? "13px" : "14px"
                    }}
                  />
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={handleAddList}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#c9a84c",
                        color: "#004d32",
                        border: "none",
                        borderRadius: "8px",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        opacity: saving ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        fontSize: isMobile ? "12px" : "13px"
                      }}
                    >
                      {saving ? "⏳" : <Icons.add />}
                      {editingListId ? "Update" : "Add"}
                    </button>
                    {editingListId && (
                      <button
                        onClick={() => { setEditingListId(null); setNewList({ name: "", description: "" }); }}
                        style={{
                          padding: "8px 12px",
                          background: "#e5e7eb",
                          color: "#374151",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: isMobile ? "12px" : "13px"
                        }}
                      >
                        <Icons.cancel />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {currentLists.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: "13px" }}>No lists in this department.</p>
                ) : (
                  currentLists.map(list => (
                    <div
                      key={list.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: selectedListId === list.id ? "2px solid #c9a84c" : "1px solid #d0e8dc",
                        background: selectedListId === list.id ? "#fef9ec" : "white",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        fontSize: isMobile ? "12px" : "13px"
                      }}
                      onClick={() => {
                        setSelectedListId(list.id);
                        fetchEquipment(list.id);
                      }}
                    >
                      <Icons.list />
                      <span style={{ flex: 1 }}>{list.name}</span>
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        ({equipment[list.id]?.length || 0})
                      </span>
                      {isAdmin && (
                        <div style={{ display: "flex", gap: "2px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditList(list); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          >
                            <Icons.edit />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id, list.name); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          >
                            <Icons.delete />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN: EQUIPMENT ===== */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: isMobile ? "16px" : "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: "12px",
            marginBottom: "16px"
          }}>
            <h2 style={{
              fontSize: isMobile ? "16px" : "18px",
              color: "#004d32",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Icons.equipment />
              Equipment {selectedListId && `- ${currentLists.find(l => l.id === selectedListId)?.name || ""}`}
            </h2>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {selectedListId && (
                <button
                  onClick={() => fetchEquipment(selectedListId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: isMobile ? "6px 12px" : "8px 14px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: isMobile ? "11px" : "12px"
                  }}
                  title="Refresh equipment from server"
                >
                  <Icons.refresh /> Refresh
                </button>
              )}
              {selectedListId && currentEquipment.length > 0 && (
                <button
                  onClick={startCheck}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: isMobile ? "8px 14px" : "10px 20px",
                    background: "linear-gradient(135deg, #004d32, #006341)",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: isMobile ? "12px" : "13px",
                    boxShadow: "0 3px 10px rgba(0,77,50,0.25)"
                  }}
                >
                  <Icons.checkCircle />
                  Start Checklist
                </button>
              )}
            </div>
          </div>

          {!selectedListId ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
              <div style={{ marginBottom: "16px" }}><Icons.equipment /></div>
              <p style={{ fontSize: isMobile ? "14px" : "16px" }}>Select a list from the left panel to manage equipment</p>
            </div>
          ) : (
            <>
              {/* Add Equipment Form */}
              {isAdmin && (
                <div style={{
                  background: "#f8fafb",
                  padding: isMobile ? "12px" : "16px",
                  borderRadius: "12px",
                  marginBottom: "20px"
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: "8px"
                  }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#4b5563", display: "block", marginBottom: "4px" }}>
                        Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Equipment name"
                        value={newEquipment.name}
                        onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1.5px solid #d0e8dc",
                          borderRadius: "6px",
                          fontSize: isMobile ? "13px" : "14px"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#4b5563", display: "block", marginBottom: "4px" }}>
                        Code *
                      </label>
                      <input
                        type="text"
                        placeholder="Equipment code"
                        value={newEquipment.code}
                        onChange={(e) => setNewEquipment({ ...newEquipment, code: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1.5px solid #d0e8dc",
                          borderRadius: "6px",
                          fontSize: isMobile ? "13px" : "14px"
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#4b5563", display: "block", marginBottom: "4px" }}>
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newEquipment.quantity}
                        onChange={(e) => setNewEquipment({ ...newEquipment, quantity: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1.5px solid #d0e8dc",
                          borderRadius: "6px",
                          fontSize: isMobile ? "13px" : "14px"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "#e5e7eb",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          fontSize: isMobile ? "11px" : "13px"
                        }}
                      >
                        <Icons.camera />
                        Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => document.getElementById('equipFileInput').click()}
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: "#e5e7eb",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          fontSize: isMobile ? "11px" : "13px"
                        }}
                      >
                        <Icons.upload />
                        Upload
                      </button>
                    </div>
                  </div>

                  <input
                    id="equipFileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />

                  {imagePreview && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}
                      />
                      <button
                        onClick={() => { setImagePreview(null); setNewEquipment(prev => ({ ...prev, image: null })); }}
                        style={{ color: "#dc2626", cursor: "pointer", border: "none", background: "none", fontSize: "16px" }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ marginTop: "10px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleAddEquipment}
                      disabled={saving}
                      style={{
                        padding: isMobile ? "6px 16px" : "8px 24px",
                        background: "#006341",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: "600",
                        opacity: saving ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: isMobile ? "12px" : "13px"
                      }}
                    >
                      {saving ? "⏳" : <Icons.add />}
                      {editingEquipId ? "Update" : "Add"}
                    </button>
                    {editingEquipId && (
                      <button
                        onClick={resetEquipmentForm}
                        style={{
                          padding: isMobile ? "6px 12px" : "8px 16px",
                          background: "#e5e7eb",
                          color: "#374151",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: isMobile ? "12px" : "13px"
                        }}
                      >
                        <Icons.cancel />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* EQUIPMENT LIST HEADER WITH QR */}
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                alignItems: isMobile ? "stretch" : "center",
                gap: "12px",
                marginBottom: "20px",
                paddingBottom: "16px",
                borderBottom: "2px solid #e5e7eb"
              }}>
                <div>
                  <h3 style={{
                    fontSize: isMobile ? "18px" : "20px",
                    fontWeight: "700",
                    color: "#004d32",
                    margin: 0
                  }}>
                    Instrument Set
                  </h3>
                  <p style={{
                    fontSize: isMobile ? "12px" : "14px",
                    color: "#6b7280",
                    margin: "4px 0 0"
                  }}>
                    Total Instruments: <strong style={{ color: "#004d32" }}>{filteredAndSortedEquipment.length}</strong>
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap"
                }}>
                  <div
                    onClick={() => setShowQRModal(true)}
                    style={{
                      cursor: 'pointer',
                      background: '#ffffff',
                      padding: isMobile ? "4px 8px" : "8px 14px",
                      borderRadius: '10px',
                      border: '2px solid #006341',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 8px rgba(0,99,65,0.1)',
                      minWidth: isMobile ? '60px' : '80px'
                    }}
                  >
                    <QRCodeCanvas
                      value={getQRUrl()}
                      size={isMobile ? 50 : 70}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#006341"
                    />
                    <div style={{
                      fontSize: isMobile ? '7px' : '9px',
                      color: '#006341',
                      fontWeight: '600',
                      textAlign: 'center',
                      letterSpacing: '0.3px'
                    }}>
                      📱 Scan Me
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "white",
                    border: "1.5px solid #d0e8dc",
                    borderRadius: "8px",
                    padding: "2px 8px",
                    flex: isMobile ? 1 : "auto"
                  }}>
                    <Icons.search />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        border: "none",
                        padding: "6px 4px",
                        fontSize: isMobile ? "12px" : "13px",
                        outline: "none",
                        width: isMobile ? "80px" : "120px",
                        background: "transparent"
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9ca3af",
                          fontSize: "14px",
                          padding: "2px"
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: isMobile ? "4px 6px" : "8px 12px",
                      border: "1.5px solid #d0e8dc",
                      borderRadius: "8px",
                      fontSize: isMobile ? "12px" : "13px",
                      background: "white",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="quantity">Sort by Quantity</option>
                  </select>
                </div>
              </div>

              {/* EQUIPMENT TABLE */}
              {filteredAndSortedEquipment.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#9ca3af"
                }}>
                  <div style={{ marginBottom: "16px" }}>
                    <Icons.empty />
                  </div>
                  <h3 style={{ fontSize: "18px", color: "#6b7280", margin: "0 0 8px 0" }}>
                    No Instruments Found
                  </h3>
                  <p style={{ fontSize: "14px", margin: 0 }}>
                    {searchTerm ? "Try adjusting your search." : "Start by adding a new instrument."}
                  </p>
                </div>
              ) : (
                <div style={{
                  background: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: "4px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  overflow: "hidden"
                }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: isMobile ? "11px" : "13px",
                      minWidth: isMobile ? "600px" : "auto"
                    }}>
                      <thead>
                        <tr style={{ background: "#e5e5e5" }}>
                          <th style={equipThStyle}>No.</th>
                          <th style={{ ...equipThStyle, textAlign: "center" }}>Image</th>
                          <th style={{ ...equipThStyle, textAlign: "left" }}>Item Description</th>
                          <th style={{ ...equipThStyle, textAlign: "left" }}>Code</th>
                          <th style={{ ...equipThStyle, textAlign: "center" }}>Qty</th>
                          {isAdmin && <th style={{ ...equipThStyle, textAlign: "center" }}>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedEquipment.map((item, idx) => (
                          <tr
                            key={item.id || item._id}
                            style={{
                              background: idx % 2 === 0 ? "#ffffff" : "#f5f5f5",
                              opacity: item._optimistic ? 0.6 : 1
                            }}
                          >
                            <td style={{ ...equipTdStyle, textAlign: "center" }}>{idx + 1}</td>
                            <td style={{ ...equipTdStyle, textAlign: "center" }}>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  onClick={() => setImageModal(item.image)}
                                  style={{
                                    width: isMobile ? "30px" : "40px",
                                    height: isMobile ? "30px" : "40px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    border: "1px solid #e5e7eb"
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `<span style="font-size:20px;color:#9ca3af;">📷</span>`;
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: "20px", color: "#9ca3af" }}>📷</span>
                              )}
                            </td>
                            <td style={{ ...equipTdStyle, fontWeight: "600" }}>
                              {item.name}
                              {item._optimistic && <span style={{ fontSize: "10px", color: "#6b7280", marginLeft: "6px" }}>⏳</span>}
                            </td>
                            <td style={{ ...equipTdStyle, fontFamily: "monospace" }}>{item.code}</td>
                            <td style={{ ...equipTdStyle, textAlign: "center", fontWeight: "700" }}>{item.quantity}</td>
                            {isAdmin && (
                              <td style={{ ...equipTdStyle, textAlign: "center" }}>
                                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                                  <button
                                    onClick={() => handleEditEquipment(item)}
                                    title="Edit"
                                    disabled={item._optimistic}
                                    style={{
                                      padding: "4px 6px",
                                      background: "#c9a84c",
                                      color: "#004d32",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: item._optimistic ? "not-allowed" : "pointer",
                                      opacity: item._optimistic ? 0.5 : 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    <Icons.edit />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEquipment(item.id || item._id, item.name)}
                                    title="Delete"
                                    disabled={item._optimistic}
                                    style={{
                                      padding: "4px 6px",
                                      background: "#fee2e2",
                                      color: "#991b1b",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: item._optimistic ? "not-allowed" : "pointer",
                                      opacity: item._optimistic ? 0.5 : 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center"
                                    }}
                                  >
                                    <Icons.delete />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{
                    textAlign: "center",
                    padding: "6px",
                    background: "#f0f0f0",
                    borderTop: "2px solid #000000",
                    fontSize: isMobile ? "8px" : "10px",
                    color: "#000000"
                  }}>
                    Internal Asset List • {filteredAndSortedEquipment.length} item(s) total
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* QR MODAL */}
      {showQRModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowQRModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: isMobile ? "24px" : "40px",
              borderRadius: '20px',
              textAlign: 'center',
              maxWidth: '90%',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: isMobile ? "18px" : "24px",
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ✕
            </button>

            <h3 style={{ marginBottom: '4px', color: '#004d32', marginTop: '0', fontSize: isMobile ? "16px" : "20px" }}>
              📋 {selectedListName || "Instrument Set"}
            </h3>
            <p style={{ fontSize: isMobile ? "10px" : "12px", color: '#666', marginBottom: '16px' }}>
              {selectedDeptName || "Department"} • Scan this QR to view equipment list only
            </p>

            <QRCodeCanvas
              value={getQRUrl()}
              size={isMobile ? 180 : 280}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#006341"
            />

            <p style={{ fontSize: isMobile ? "9px" : "11px", color: '#999', marginTop: '12px', wordBreak: 'break-all' }}>
              {getQRUrl()}
            </p>

            <button
              onClick={() => setShowQRModal(false)}
              style={{
                marginTop: '12px',
                padding: isMobile ? "6px 18px" : "8px 30px",
                background: '#006341',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: isMobile ? "13px" : "14px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "pointer"
          }}
          onClick={() => setImageModal(null)}
        >
          <img
            src={imageModal}
            alt="Equipment"
            style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: "8px" }}
          />
        </div>
      )}
    </div>
  );
}

export default OTDepartment;