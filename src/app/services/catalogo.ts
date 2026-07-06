import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';

export interface CatalogoItem {
  id: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);

  // --- Catálogos para Melamine ---
  listarMarcasMelamine(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${API.melamine}/marcas`);
  }

  listarEstadosMelamine(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${API.melamine}/estados`);
  }

  listarColoresMelamine(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${API.melamine}/colores`);
  }

  // --- Catálogos para Proveedores / Otros ---
  listarCategorias(): Observable<CatalogoItem[]> {
    // Reemplaza API.proveedores por la ruta real donde esté Categoria en tu backend
    return this.http.get<CatalogoItem[]>(`${API.proveedores}/categorias`); 
  }
}