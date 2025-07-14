import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { SETTINGS_WS } from '../constants/settings-ws';

window.Pusher = Pusher;

declare global {
  interface Window {
    Echo: Echo<any>;
    Pusher: typeof Pusher;
  }
}

export const echo = new Echo({
  broadcaster: 'reverb',
  key: SETTINGS_WS.REVERB_APP_KEY,
  wsHost: SETTINGS_WS.REVERB_HOST,
  wsPort: SETTINGS_WS.WS_PORT,
  authEndpoint: 'http://localhost:8000/broadcasting/auth',
  forceTLS: false,
  disableStats: true,
  enabledTransports: ['ws', 'wss'],
});
