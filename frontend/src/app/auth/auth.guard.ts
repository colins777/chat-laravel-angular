import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpTokenService } from '../services/http-token.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private svc: HttpTokenService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.svc.getUser().pipe(
      map(() => true),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}