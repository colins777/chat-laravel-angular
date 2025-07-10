import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Echo: Echo<any>;
    Pusher: typeof Pusher;
  }
}

@Injectable({
  providedIn: 'root'
})
export class EchoService {
  echo: Echo<any>;

  constructor() {
    window.Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'pusher',
      //@TODO need tofix
      key: 'your-pusher-key',         // 🔁 заміни на свій ключ
      cluster: 'your-cluster',        // 🔁 напр. 'eu'
      forceTLS: true,
      encrypted: true,
      authEndpoint: '/broadcasting/auth', // Якщо потрібна автентифікація
      auth: {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    });

    window.Echo = this.echo;
  }

  private getToken(): string {
    // 🔁 Заміни цю логіку на свою систему автентифікації
    return localStorage.getItem('token') || '';
  }
}
