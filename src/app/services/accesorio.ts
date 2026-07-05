import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Accesorio } from '../models/accesorio';
import { API } from '../config/api.config';

interface AccesorioResponse {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  marcaId: number;
  marcaNombre: string;
  estadoId: number;
  estadoNombre: string;
  imagenUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AccesorioService {
  private apiUrl = API.accesorios;
  private http = inject(HttpClient);

  listar(): Observable<Accesorio[]> {
    return this.http.get<AccesorioResponse[]>(this.apiUrl).pipe(
      map((lista) => lista.map((r) => this.mapResponse(r)))
    );
  }

  buscarPorId(id: number): Observable<Accesorio> {
    return this.http.get<AccesorioResponse>(`${this.apiUrl}/${id}`).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  buscarPorNombre(nombre: string): Observable<Accesorio[]> {
    return this.http.get<AccesorioResponse[]>(`${this.apiUrl}/buscar?nombre=${nombre}`).pipe(
      map((lista) => lista.map((r) => this.mapResponse(r)))
    );
  }

  crear(accesorio: Accesorio, imagen?: File): Observable<Accesorio> {
    const formData = this.buildFormData(accesorio, imagen);
    return this.http.post<AccesorioResponse>(this.apiUrl, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  actualizar(id: number, accesorio: Accesorio, imagen?: File): Observable<Accesorio> {
    const formData = this.buildFormData(accesorio, imagen);
    return this.http.put<AccesorioResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  private buildFormData(a: Accesorio, imagen?: File): FormData {
    const request = {
      nombre: a.nombre,
      descripcion: a.descripcion,
      precio: a.precio,
      stock: a.stock,
      marcaId: a.marcaId,
      estadoId: a.estadoId,
    };
    const formData = new FormData();
    formData.append('accesorio', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (imagen) formData.append('imagen', imagen);
    return formData;
  }

  private mapResponse(r: AccesorioResponse): Accesorio {
    return {
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      precio: r.precio,
      stock: r.stock,
      marcaId: r.marcaId,
      marcaNombre: r.marcaNombre,
      estadoId: r.estadoId,
      estadoNombre: r.estadoNombre,
      foto: r.imagenUrl ?? '',
    };
  }
}
