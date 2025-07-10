const BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  GET_CRSF_TOKEN: `${BASE_URL}/sanctum/csrf-cookie`,
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    LOGOUT: `${BASE_URL}/auth/logout`,
    REGISTER: `${BASE_URL}/auth/register`,
  },
  USERS: {
    
  },
  CONVERSATIONS: {
    GET_ALL_CONVERSATIONS: `${BASE_URL}/api/conversations`,
  },
} as const;