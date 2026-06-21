import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API } from '../config/api.config';

export interface AuthResponse {
  token: string;
  username: string;
  rol: string;
}

export interface UsuarioResponse {
  id?: number;
  username: string;
  nombres?: string;
  apellidos?: string;
  dni?: string;
  rol: string;
}

export interface RegisterUserPayload {
  nombres: string;
  apellidos: string;
  dni: string;
  password: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private URL_AUTH = API.auth;
  private http = inject(HttpClient);

  loginAdmin(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.URL_AUTH}/login/admin`, credentials).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  loginUser(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.URL_AUTH}/login/user`, credentials).pipe(
      tap((res) => this.persistSession(res))
    );
  }

  registerUser(payload: RegisterUserPayload): Observable<AuthResponse> {
    const body = {
      username: payload.username,
      password: payload.password,
      nombres: payload.nombres,
      apellidos: payload.apellidos,
      dni: payload.dni,
    };
    return this.http.post<AuthResponse>(`${this.URL_AUTH}/register?rol=USER`, body);
  }

  listUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.URL_AUTH}/usuarios`);
  }

  registerAdmin(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.URL_AUTH}/register?rol=ADMIN`, credentials);
  }

  private persistSession(response: AuthResponse): void {
    if (response?.token) {
      localStorage.setItem('token_inventario', response.token);
      localStorage.setItem('rol_usuario', response.rol);
      localStorage.setItem('username', response.username);
    }
  }

  saveLocalUser(user: Record<string, string>): void {
    const users = this.getLocalUsers();
    users.push(user);
    localStorage.setItem('usuarios_locales', JSON.stringify(users));
  }

  getLocalUsers(): Record<string, string>[] {
    try {
      return JSON.parse(localStorage.getItem('usuarios_locales') || '[]');
    } catch {
      return [];
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token_inventario');
  }

  getRol(): string | null {
    return localStorage.getItem('rol_usuario');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token_inventario');
    localStorage.removeItem('rol_usuario');
    localStorage.removeItem('username');
    localStorage.removeItem('username_display');
  }
}
