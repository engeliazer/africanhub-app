import { configureStore } from "@reduxjs/toolkit";
import profileSlice from "./profileSlice.jsx";
import accessSlice from "./accessSlice.jsx";
import rbacSlice from "./rbacSlice";

// Load state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('reduxState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('reduxState', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    profile: profileSlice,
    access: accessSlice,
    rbac: rbacSlice
  },
  preloadedState
});

// Subscribe to store changes and save to localStorage
store.subscribe(() => {
  saveState(store.getState());
});