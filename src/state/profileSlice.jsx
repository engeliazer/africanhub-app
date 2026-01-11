import { createSlice } from "@reduxjs/toolkit";

const initialState= {
  roles:["admin", "user", "support"],
  user:null,
};

const profileSlice = createSlice({
  name: "profileSlice",
  initialState,
  reducers: {
     setProfile: (state, action) => {
      state.roles = action.payload?.roles;
      state.user = action.payload?.user;
     },
    onClearProfile: (state) => {
      state.roles = [];
      state.user = null;
    }
  },
});

export const { setProfile, onClearProfile } = profileSlice.actions;

// Add selector
export const selectProfile = (state) => state.profile;

export default profileSlice.reducer;