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
  MESSAGES: {
    GET_MESSAGES_BY_USER: `${BASE_URL}/api/messages`,
    STORE_MESSAGE: `${BASE_URL}/api/message-store`,
    MARK_AS_READ: `${BASE_URL}/api/messages/mark-as-read`
  }
} as const;