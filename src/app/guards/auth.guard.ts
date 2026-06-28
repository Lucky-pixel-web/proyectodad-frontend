import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1. Si NO está logueado, directo al login
  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Si SÍ está logueado (sin importar si es ADMIN o USER), lo dejamos pasar
  return true;
};