import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Proveedor } from '../models/proveedor';
import { API } from '../config/api.config';

interface ProveedorResponse {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string;
  categoriaId: number;
  categoriaNombre: string;
  direccion: string;
  ubicacion: string;
  imagenUrl: string | null;
  descripcion: string;
}

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private apiUrl = API.proveedores;
  private http = inject(HttpClient);

  listar(): Observable<Proveedor[]> {
    return this.http.get<ProveedorResponse[]>(this.apiUrl).pipe(
      map((lista) => lista.map((r) => this.mapResponse(r)))
    );
  }

  buscarPorId(id: number): Observable<Proveedor> {
    return this.http.get<ProveedorResponse>(`${this.apiUrl}/${id}`).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  crear(p: Proveedor, imagen?: File): Observable<Proveedor> {
    const formData = this.buildFormData(p, imagen);
    return this.http.post<ProveedorResponse>(this.apiUrl, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  actualizar(id: number, p: Proveedor, imagen?: File): Observable<Proveedor> {
    const formData = this.buildFormData(p, imagen);
    return this.http.put<ProveedorResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private buildFormData(p: Proveedor, imagen?: File): FormData {
    const request = {
      nombres: p.nombres,
      apellidos: p.apellidos,
      telefono: p.telefono,
      categoriaId: p.categoriaId,
      direccion: p.direccion,
      ubicacion: p.ubicacion,
      descripcion: p.descripcion,
    };
    const formData = new FormData();
    formData.append('proveedor', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (imagen) formData.append('imagen', imagen);
    return formData;
  }

  private mapResponse(r: ProveedorResponse): Proveedor {
    return {
      id: r.id,
      nombres: r.nombres,
      apellidos: r.apellidos,
      telefono: r.telefono,
      categoriaId: r.categoriaId,
      categoriaNombre: r.categoriaNombre,
      direccion: r.direccion,
      ubicacion: r.ubicacion,
      descripcion: r.descripcion,
      foto: r.imagenUrl ?? '',
    };
  }
}
