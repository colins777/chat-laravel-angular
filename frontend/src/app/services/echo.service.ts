import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { SETTINGS_WS } from '../constants/settings-ws';
import axios from 'axios';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EchoService {
  private echo!: Echo<any>;

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
      authorizer: (channel: any, options: any) => {
        return {
          authorize: (socketId: string, callback: Function) => {
           
            const xsrfToken = this.getCookie('XSRF-TOKEN');
            
            axios.post(
              environment.baseUrl + '/api/broadcasting/auth',
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                headers: {
                  Accept: 'application/json',
                  'X-XSRF-TOKEN': xsrfToken ?? '',
                },
                withCredentials: true,
              }
            )
            .then((response) => {
              if(response.data && !response.data.error) {
                callback(false, response.data);
              } else {
                callback(true, response.data?.error ?? 'Auth error');
              }
            })
            .catch((error) => {
              callback(true, error);
            });
          }
        };
      },
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
