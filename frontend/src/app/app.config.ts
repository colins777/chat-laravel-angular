import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { httpTokenInterceptorInterceptor } from './services/http-token-interceptor.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({cookieName: 'XSRF-TOKEN', headerName: 'Xsrf-Headers'}),
      withInterceptors([httpTokenInterceptorInterceptor])
    )
  ]
};
