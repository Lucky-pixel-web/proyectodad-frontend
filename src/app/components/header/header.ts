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

  private readonly adminNav = [
    { label: '📊 Reportes',    route: '/home'        },
    { label: '📦 Accesorios',   route: '/accesorios'   },
    { label: '🔧 Herramientas', route: '/herramientas' },
    { label: '🪵 Melamine',     route: '/melamine'     },
    { label: '🏭 Proveedores', route: '/proveedores' },
    { label: '👥 Clientes',    route: '/clientes'    },
    { label: '🧾 Ordenes',     route: '/ordenes'     },
    { label: '📁 Proyectos',   route: '/proyectos'   },
    { label: '👤 Usuarios',    route: '/usuarios'    },
  ];

  private readonly userNav = [
    { label: '📊 Reportes',    route: '/home'        },
    { label: '🪵 Melamine',    route: '/melamine'    },
    { label: '📦 Accesorios',  route: '/accesorios'  },
    { label: '🧾 Ordenes',     route: '/ordenes'     },
    { label: '🔧 Herramientas',route: '/herramientas'},
    { label: '🏭 Proveedores', route: '/proveedores' },
  ];

  get navItems() {
    return this.isAdmin ? this.adminNav : this.userNav;
  }

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
