// Local Storage Keys
const STORAGE_KEYS = {
  token: 'hrms_token',
  user: 'hrms_user'
};

export const canAccessRoute = (visitedRoute, accessibleRoutes) => {
  if(!visitedRoute || !accessibleRoutes) return false;
  // IF NOT STRING
  if(typeof visitedRoute !== "string") return false;
  if(!Array.isArray(accessibleRoutes)) return false;
   return accessibleRoutes.some((route) => {
    return visitedRoute?.toUpperCase() === route?.toUpperCase();
   });
};

export const saveTokenLocal = (token) => {
  // Store the token directly without JSON.stringify
  localStorage.setItem(STORAGE_KEYS.token, token);
};

export const getTokenLocal = () => {
  // Get the token directly without JSON.parse
  return localStorage.getItem(STORAGE_KEYS.token);
};

export const removeTokenLocal = () => {
  localStorage.removeItem(STORAGE_KEYS.token);
};

export const saveModuleLocal = (module) => {
  localStorage.setItem("module", JSON.stringify(module));
};

export const getModuleLocal = () => {
  return JSON.parse(localStorage.getItem("module"));
};

export const saveSessionItem = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

export const getSessionItem = (key) => {
  return JSON.parse(sessionStorage.getItem(key));
};

export const removeSessionItem = (key) => {
  sessionStorage.removeItem(key);
};

