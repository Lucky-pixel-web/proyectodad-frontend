import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor } from '../models/proveedor';
import { API } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private apiUrl = API.proveedores;
  private http = inject(HttpClient);

  listar(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  crear(p: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, p);
  }

  actualizar(id: number, p: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${id}`, p);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
