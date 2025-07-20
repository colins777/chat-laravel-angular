import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { SETTINGS_WS } from '../constants/settings-ws';

@Injectable({
  providedIn: 'root',
})
export class EchoService {
  private echo: Echo<any>;

  constructor() {
    window.Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: SETTINGS_WS.REVERB_APP_KEY,
      wsHost: SETTINGS_WS.REVERB_HOST,
      wsPort: SETTINGS_WS.WS_PORT,
      wssPort: SETTINGS_WS.WS_PORT ?? 443,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: SETTINGS_WS.ECHO_AUTH_ENDPOINT,
      withCredentials: true,
      //csrfToken: this.getCookie('XSRF-TOKEN'),
    });
  }

  getInstance(): Echo<any> {
    return this.echo;
  }

  getCookie(name: string): string | null {
    const value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return value ? decodeURIComponent(value.pop()!) : null;
  }
}
