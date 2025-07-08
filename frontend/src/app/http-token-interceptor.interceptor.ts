import { HttpInterceptorFn, HttpXsrfTokenExtractor } from '@angular/common/http';
import { inject } from '@angular/core';

export const httpTokenInterceptorInterceptor: HttpInterceptorFn = (req, next) => {

  const tokenEx = inject(HttpXsrfTokenExtractor);
  const crsfTokenName = 'X-XSRF-TOKEN';

  const crsfToken = tokenEx.getToken() as string;

  if (crsfToken != null && !req.headers.has(crsfTokenName)) {
    req = req.clone({headers: req.headers.set(crsfTokenName, crsfToken)});

    req.clone({headers: req.headers.set('Referer', 'http://localhost:4200')});
  }

  return next(req);
};
