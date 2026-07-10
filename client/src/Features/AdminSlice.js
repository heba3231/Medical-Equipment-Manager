// store/slices/adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ==================== Async Thunks ====================

// Admin Login
// Admin Login
export const adminLogin = createAsyncThunk(
  'admin/login',
  async ({ name, staff_no, password }, { rejectWithValue }) => {
    try {
      const API_URL = `http://${window.location.hostname}:5000/api/admin/login`;
      const response = await axios.post(API_URL, { name, staff_no, password });
      
      // ✅ حفظ بيانات الأدمن مع الاسم
      const adminData = {
        ...response.data.admin,
        name: response.data.admin.name || name
      };
      
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminData', JSON.stringify(adminData));
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userName', adminData.name);
      localStorage.setItem('staffNumber', adminData.staff_no || staff_no);
      
      return { ...response.data, admin: adminData };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);
// Admin Logout
export const adminLogout = createAsyncThunk(
  'admin/logout',
  async () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('staffNumber');
    return null;
  }
);

// Check Auth
export const checkAdminAuth = createAsyncThunk(
  'admin/checkAuth',
  async () => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (token && adminData) {
      return {
        token,
        admin: JSON.parse(adminData),
        isAuthenticated: true
      };
    }
    return {
      token: null,
      admin: null,
      isAuthenticated: false
    };
  }
);

// Update Admin Profile
export const updateAdminProfile = createAsyncThunk(
  'admin/updateProfile',
  async (updateData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().admin;
      const response = await axios.put(
        `http://${window.location.hostname}:5000/api/admin/profile`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const searchInstrument = createAsyncThunk(
  'admin/searchInstrument',
  async (instrumentName) => {
    const response = await fetch(
      `/api/ai-search/instrument?name=${encodeURIComponent(instrumentName)}`
    );
    return response.json();
  }
);

// ==================== Initial State ====================

const initialState = {
  admin: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: [],
  lastLogin: null,
  sessionExpiry: null,
  searchResults: null
};

// ==================== The Slice ====================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    setAdminPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    updateSession: (state, action) => {
      state.sessionExpiry = action.payload;
    },
    resetAdminState: () => initialState,
    updateAdminData: (state, action) => {
      state.admin = { ...state.admin, ...action.payload };
      localStorage.setItem('adminData', JSON.stringify(state.admin));
      localStorage.setItem('userName', state.admin.name);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.admin = action.payload.admin;
        state.token = action.payload.token;
        state.lastLogin = new Date().toISOString();
        state.error = null;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
        state.admin = null;
        state.token = null;
      })
      .addCase(adminLogout.fulfilled, (state) => {
        return initialState;
      })
      .addCase(checkAdminAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAdminAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.token = action.payload.token;
        state.admin = action.payload.admin;
      })
      .addCase(checkAdminAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.admin = null;
        state.token = null;
      })
      .addCase(updateAdminProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.admin = { ...state.admin, ...action.payload };
        localStorage.setItem('adminData', JSON.stringify(state.admin));
        localStorage.setItem('userName', state.admin.name);
        state.error = null;
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(searchInstrument.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });
  }
});

// ==================== Export Actions & Reducer ====================

export const {
  clearAdminError,
  setAdminPermissions,
  updateSession,
  resetAdminState,
  updateAdminData
} = adminSlice.actions;

export default adminSlice.reducer;

// ==================== Selectors ====================

export const selectAdmin = (state) => state.admin.admin;
export const selectAdminToken = (state) => state.admin.token;
export const selectIsAdminAuthenticated = (state) => state.admin.isAuthenticated;
export const selectAdminLoading = (state) => state.admin.isLoading;
export const selectAdminError = (state) => state.admin.error;
export const selectAdminPermissions = (state) => state.admin.permissions;
export const selectAdminName = (state) => state.admin.admin?.name || localStorage.getItem('userName') || 'Admin';
export const selectAdminStaffNo = (state) => state.admin.admin?.staff_no || '';
export const selectAdminRole = (state) => state.admin.admin?.role || '';
export const selectHasPermission = (permission) => (state) => 
  state.admin.permissions.includes(permission) || state.admin.admin?.role === 'super_admin';
export const selectIsSuperAdmin = (state) => state.admin.admin?.role === 'super_admin';