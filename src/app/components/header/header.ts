import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
})
export class Header {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = localStorage.getItem('username_display') || localStorage.getItem('username') || 'Usuario';
  rol = this.formatRol(this.auth.getRol());
  isAdmin = this.auth.getRol() === 'ADMIN';

  formatRol(rol: string | null): string {
    if (rol === 'ADMIN') return 'Administrador';
    if (rol === 'USER') return 'Almacenero';
    return rol || '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
