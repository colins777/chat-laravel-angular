import { HttpInterceptorFn, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';

export const httpTokenInterceptor: HttpInterceptorFn = (req, next) => {

  const tokenEx = inject(HttpXsrfTokenExtractor);
  const xsrfTokenName = 'X-XSRF-TOKEN';

  const xsrfToken = tokenEx.getToken() as string;

  if (xsrfToken != null && !req.headers.has(xsrfTokenName)) {
    req = req.clone({
      headers: req.headers
        .set(xsrfTokenName, xsrfToken)
        .set('Referer', environment.serverUrl)
    });
  }

  return next(req);
};
