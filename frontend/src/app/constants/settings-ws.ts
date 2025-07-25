//set parameters from .env file
export const SETTINGS_WS = {
  WS_PORT: 8080,
  REVERB_HOST: "localhost",
  REVERB_APP_KEY:   "ev8piqhxekeslho3x91g",
  ECHO_AUTH_ENDPOINT: 'http://localhost:8000/broadcasting/auth'
} as const;