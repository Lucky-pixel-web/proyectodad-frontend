import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Herramienta } from '../models/herramienta';
import { API } from '../config/api.config';

interface HerramientaResponse {
  id: number;
  nombre: string;
  tipoNombre: string;
  marcaNombre: string;
  estadoNombre: string;
  compra: string;
  fechaInicio: string;
  vidaUtil: number;
  diasRestantes: number;
  cantidad: number;
  imagenUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class HerramientaService {
  private apiUrl = API.herramientas;
  private http = inject(HttpClient);

  listar(): Observable<Herramienta[]> {
    return this.http.get<HerramientaResponse[]>(this.apiUrl).pipe(
      map((lista) => lista.map((r) => this.mapResponse(r)))
    );
  }

  buscarPorId(id: number): Observable<Herramienta> {
    return this.http.get<HerramientaResponse>(`${this.apiUrl}/${id}`).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  crear(herramienta: Herramienta, imagen?: File): Observable<Herramienta> {
    const formData = this.buildFormData(herramienta, imagen);
    return this.http.post<HerramientaResponse>(this.apiUrl, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  actualizar(id: number, herramienta: Herramienta, imagen?: File): Observable<Herramienta> {
    const formData = this.buildFormData(herramienta, imagen);
    return this.http.put<HerramientaResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      map((r) => this.mapResponse(r))
    );
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  private buildFormData(h: Herramienta, imagen?: File): FormData {
    const request = {
      nombre: h.nombre,
      cantidad: h.cantidad,
      tipoId: h.tipoId,
      marcaId: h.marcaId,
      estadoId: h.estadoId,
      compra: h.compra,
      fechaInicio: h.fechaInicio,
      vidaUtil: h.vidaUtil,
    };
    const formData = new FormData();
    formData.append('herramienta', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (imagen) formData.append('imagen', imagen);
    return formData;
  }

  private mapResponse(r: HerramientaResponse): Herramienta {
    return {
      id: r.id,
      nombre: r.nombre,
      cantidad: r.cantidad,
      tipoNombre: r.tipoNombre,
      marcaNombre: r.marcaNombre,
      estadoNombre: r.estadoNombre,
      compra: r.compra,
      fechaInicio: r.fechaInicio,
      vidaUtil: r.vidaUtil,
      diasRestantes: r.diasRestantes,
      foto: r.imagenUrl ?? '',
    };
  }
}
