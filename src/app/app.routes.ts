import { Routes } from '@angular/router';
import { Home } from './components/home/home';

// 🎯 IMPORTACIONES DE LOS MICROSERVICIOS Y LOGIN
import { LoginComponent } from './components/auth-service/login'; // 🔐 Ajusta la ruta exacta de tu archivo de login
import { ClienteComponent } from './components/cliente/cliente';
import { AccesorioComponent } from './components/accesorio/accesorio';
import { HerramientaComponent } from './components/herramienta/herramienta';
import { ProyectoComponent } from './components/proyecto/proyecto';

export const routes: Routes = [
    // 🚪 Ruta raíz: Cuando entres a http://localhost:4200/ te mandará directo al login
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    
    // 🔐 Pantalla de inicio de sesión
    { path: 'login', component: LoginComponent },

    // 🏠 Panel o Inicio (puedes redirigir aquí tras un login exitoso)
    { path: 'home', component: Home },
    
    // 🛠️ Rutas para tus módulos de gestión
    { path: 'clientes', component: ClienteComponent },
    { path: 'accesorios', component: AccesorioComponent },
    { path: 'herramientas', component: HerramientaComponent },
    { path: 'proyectos', component: ProyectoComponent },
    
    // 🔄 Comodín para redirigir cualquier ruta inválida o inexistente al Login
    { path: '**', redirectTo: 'login' }
];