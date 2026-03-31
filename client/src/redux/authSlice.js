/**
 * authSlice.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bug fixes:
 *  1. rejected cases used action.payload?.message — but rejectWithValue sends
 *     a STRING, not an object. Fixed to just use action.payload directly.
 *  2. checkAuth rejected no longer sets error (prevents false error flash on load)
 *  3. googleAuthUser thunk added
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../utils/axiosClient';

// ── Thunks ────────────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register', userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Registration failed'
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Login failed'
      );
    }
  }
);

// Bug fix: NEW thunk — Google OAuth
export const googleAuthUser = createAsyncThunk(
  'auth/google',
  async ({ credential }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/google-auth', { credential });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Google authentication failed'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/user/logout');
      return null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Logout failed'
      );
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/check');
      return data.user;
    } catch (error) {
      // This rejects silently when not authenticated — expected behavior
      return rejectWithValue(null);
    }
  }
);

// ── Shared case handlers ──────────────────────────────────────────────────────
const pendingCase = (state) => {
  state.loading = true;
  state.error   = null;
};

const fulfilledCase = (state, action) => {
  state.loading         = false;
  state.isAuthenticated = !!action.payload;
  state.user            = action.payload;
  state.error           = null;
};

// Bug fix: action.payload IS the string — not action.payload?.message
const rejectedCase = (state, action) => {
  state.loading         = false;
  state.error           = action.payload || 'Something went wrong';
  state.isAuthenticated = false;
  state.user            = null;
};

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            null,
    loading:         false,
    isAuthenticated: false,
    error:           null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    // Optimistic local logout (called alongside logoutUser thunk if needed)
    clearAuth(state) {
      state.user            = null;
      state.isAuthenticated = false;
      state.error           = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Register ──────────────────────────────────────────────────────────
      .addCase(registerUser.pending,    pendingCase)
      .addCase(registerUser.fulfilled,  fulfilledCase)
      .addCase(registerUser.rejected,   rejectedCase)

      // ── Login ──────────────────────────────────────────────────────────────
      .addCase(loginUser.pending,    pendingCase)
      .addCase(loginUser.fulfilled,  fulfilledCase)
      .addCase(loginUser.rejected,   rejectedCase)

      // ── Google Auth ────────────────────────────────────────────────────────
      .addCase(googleAuthUser.pending,    pendingCase)
      .addCase(googleAuthUser.fulfilled,  fulfilledCase)
      .addCase(googleAuthUser.rejected,   rejectedCase)

      // ── Check Auth (silent — don't set error on 401) ───────────────────────
      .addCase(checkAuth.pending,   pendingCase)
      .addCase(checkAuth.fulfilled, fulfilledCase)
      .addCase(checkAuth.rejected,  (state) => {
        // Bug fix: don't set state.error here — 401 on check is normal
        // when user is not logged in; showing an error would be wrong
        state.loading         = false;
        state.isAuthenticated = false;
        state.user            = null;
      })

      // ── Logout ────────────────────────────────────────────────────────────
      .addCase(logoutUser.pending,   pendingCase)
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading         = false;
        state.user            = null;
        state.isAuthenticated = false;
        state.error           = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        // Still clear local auth state even if server call fails
        state.loading         = false;
        state.user            = null;
        state.isAuthenticated = false;
        state.error           = action.payload || 'Logout failed';
      });
  },
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
