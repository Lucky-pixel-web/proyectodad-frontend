import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { LoginComponent } from './components/auth-service/login';
import { ClienteComponent } from './components/cliente/cliente';
import { AccesorioComponent } from './components/accesorio/accesorio';
import { HerramientaComponent } from './components/herramienta/herramienta';
import { ProyectoComponent } from './components/proyecto/proyecto';
import { MelamineComponent } from './components/melamine/melamine';
import { ProveedorComponent } from './components/proveedor/proveedor';
import { UsuarioComponent } from './components/usuario/usuario';

// Importa tus Guards
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard'; // <-- Importa el nuevo guard

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Rutas protegidas para usuarios normales/autenticados
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'herramientas', component: HerramientaComponent, canActivate: [authGuard] },
  { path: 'accesorios', component: AccesorioComponent, canActivate: [authGuard] },
  { path: 'melamine', component: MelamineComponent, canActivate: [authGuard] },
  { path: 'proveedores', component: ProveedorComponent, canActivate: [authGuard] },
  { path: 'clientes', component: ClienteComponent, canActivate: [authGuard] },
  
  // Rutas protegidas solo para Administradores
  // (Ojo: si tu adminGuard ya hereda o valida el login, déjalo así. Si no, puedes poner ambos: [authGuard, adminGuard])
  { path: 'proyectos', component: ProyectoComponent, canActivate: [adminGuard] },
  { path: 'usuarios', component: UsuarioComponent, canActivate: [adminGuard] },
  
  { path: '**', redirectTo: 'login' },
];