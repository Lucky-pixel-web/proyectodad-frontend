import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 🎯 Ajustado a la ruta exacta de tu AuthController
  private URL_AUTH = 'http://localhost:8090/auth'; 

  constructor(private http: HttpClient) {}

  // 🔐 Mapeado exacto a tu AuthRequest de Java
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.URL_AUTH}/login`, credentials).pipe(
      tap(response => {
        // Tu AuthResponse devuelve token, username y rol. Guardamos el token y el rol:
        if (response && response.token) {
          localStorage.setItem('token_inventario', response.token);
          localStorage.setItem('rol_usuario', response.rol); 
        }
      })
    );
  }

  getToken() {
    return localStorage.getItem('token_inventario');
  }

  getRol() {
    return localStorage.getItem('rol_usuario');
  }

  logout() {
    localStorage.removeItem('token_inventario');
    localStorage.removeItem('rol_usuario');
  }
}