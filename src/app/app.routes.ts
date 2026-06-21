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
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: Home },
  { path: 'herramientas', component: HerramientaComponent },
  { path: 'accesorios', component: AccesorioComponent },
  { path: 'melamine', component: MelamineComponent },
  { path: 'proveedores', component: ProveedorComponent },
  { path: 'proyectos', component: ProyectoComponent, canActivate: [adminGuard] },
  { path: 'usuarios', component: UsuarioComponent, canActivate: [adminGuard] },
  { path: 'clientes', component: ClienteComponent },
  { path: '**', redirectTo: 'login' },
];
