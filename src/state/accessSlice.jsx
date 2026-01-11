import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    menu: null,
    canAccess: false,
    authenticated: false,
    roles: [],
};

const accessSliceSlice = createSlice({
    name: "accessSlice",
    initialState,
    reducers: {
        onSetMenu: (state, action) => {
            state.menu = action.payload.menu;
        },
        onSetCanAccess: (state, action) => {
            state.canAccess = action.payload.canAccess;
        },
        onSetAuthenticated: (state, action) => {
            state.authenticated = action.payload.authenticated;
        },
        onClearMenu: (state) => {
            state.menu = null;
        },
        onSetRoles: (state, action) => {
            state.roles = action.payload.roles;
        },
        onClear: (state) => {
            state.menu = null;
            state.canAccess = false;
            state.authenticated = false;
            state.roles = [];
        }
     
    }
});

export default accessSliceSlice.reducer;
export const {
    onSetMenu,
    onSetCanAccess,
    onSetAuthenticated,
    onClearMenu,
    onClear,
    onSetRoles
} = accessSliceSlice.actions;
