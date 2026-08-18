import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const login = router.createUrlTree(['/login']);

  return authService.user$.pipe(
    take(1),
    timeout(4000),
    map(user => user ? true : login),
    catchError(() => of(login))
  );
};
