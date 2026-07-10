import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

const staffSlice = createSlice({
  name: "staff",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    registerSuccess: (state, action) => {
      state.loading = false;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    }
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  registerSuccess,
  updateUser
} = staffSlice.actions;

// ✅ تحديث الرابط ليعمل تلقائياً على الهاتف واللابتوب
const API_LOGIN_URL = `http://${window.location.hostname}:5000/api/staff/login`;

// Async action for login
export const loginStaff = (credentials ) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const response = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ✅ الـ credentials الآن ستحتوي على staffNumber و password
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // حفظ البيانات في localStorage للمحافظة على الجلسة
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      
      dispatch(loginSuccess({ user: data.user, token: data.token }));
      return { success: true };
    } else {
      dispatch(loginFailure(data.message));
      return { success: false, error: data.message };
    }
  } catch (error) {
    dispatch(loginFailure(error.message));
    return { success: false, error: error.message };
  }
};

export default staffSlice.reducer;
