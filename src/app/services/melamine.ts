import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Melamine } from '../models/melamine';
import { API } from '../config/api.config';

interface MelamineResponse {
  id: number;
  nombre: string;
  ancho: number;
  largo: number;
  cantidad: number;
  colorId: number;
  colorNombre: string;
  marcaId: number;
  marcaNombre: string;
  estadoId: number;
  estadoNombre: string;
  imagenUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class MelamineService {
  private apiUrl = API.melamine;
  private http = inject(HttpClient);

  listar(): Observable<Melamine[]> {
    return this.http.get<MelamineResponse[]>(this.apiUrl).pipe(
      map((lista) => lista.map((r) => this.mapResponse(r)))
    );
  }

  buscarPorId(id: number): Observable<Melamine> {
    return this.http.get<MelamineResponse>(`${this.apiUrl}/${id}`).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  crear(m: Melamine, imagen?: File): Observable<Melamine> {
    const formData = this.buildFormData(m, imagen);
    return this.http.post<MelamineResponse>(this.apiUrl, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  actualizar(id: number, m: Melamine, imagen?: File): Observable<Melamine> {
    const formData = this.buildFormData(m, imagen);
    return this.http.put<MelamineResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private buildFormData(m: Melamine, imagen?: File): FormData {
    const request = {
      nombre: m.nombre,
      ancho: m.ancho,
      largo: m.largo,
      cantidad: m.cantidad,
      colorId: m.colorId,
      marcaId: m.marcaId,
      estadoId: m.estadoId,
    };
    const formData = new FormData();
    formData.append('melamine', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (imagen) formData.append('imagen', imagen);
    return formData;
  }

  private mapResponse(r: MelamineResponse): Melamine {
    return {
      id: r.id,
      nombre: r.nombre,
      ancho: r.ancho,
      largo: r.largo,
      cantidad: r.cantidad,
      colorId: r.colorId,
      colorNombre: r.colorNombre,
      marcaId: r.marcaId,
      marcaNombre: r.marcaNombre,
      estadoId: r.estadoId,
      estadoNombre: r.estadoNombre,
      foto: r.imagenUrl ?? '',
    };
  }
}
