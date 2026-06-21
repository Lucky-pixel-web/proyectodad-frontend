import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Herramienta } from '../models/herramienta';
import { API } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class HerramientaService {
  private apiUrl = API.herramientas;
  private http = inject(HttpClient);

  listar(): Observable<Herramienta[]> {
    return this.http.get<Herramienta[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Herramienta> {
    return this.http.get<Herramienta>(`${this.apiUrl}/${id}`);
  }

  crear(herramienta: Herramienta): Observable<Herramienta> {
    return this.http.post<Herramienta>(this.apiUrl, herramienta);
  }

  actualizar(id: number, herramienta: Herramienta): Observable<Herramienta> {
    return this.http.put<Herramienta>(`${this.apiUrl}/${id}`, herramienta);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}