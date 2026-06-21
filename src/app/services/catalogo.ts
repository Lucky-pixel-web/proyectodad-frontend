import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { API } from '../config/api.config';

export interface CatalogoItem {
  id: number;
  nombre: string;
}

const ESTADOS_INICIALES = ['Bueno', 'Regular', 'Malo'];
const CATEGORIAS_INICIALES = ['Herramientas', 'Melamine', 'Accesorios'];

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);

  listarEstados(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(API.estado).pipe(
      switchMap((list) => (list?.length ? of(list) : this.seedEstados())),
      catchError(() => this.seedEstados())
    );
  }

  listarCategorias(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(API.categorias).pipe(
      switchMap((list) => (list?.length ? of(list) : this.seedCategorias())),
      catchError(() => this.seedCategorias())
    );
  }

  private seedEstados(): Observable<CatalogoItem[]> {
    const posts = ESTADOS_INICIALES.map((nombre) =>
      this.http.post<CatalogoItem>(API.estado, { nombre }).pipe(catchError(() => of(null)))
    );
    return forkJoin(posts).pipe(
      switchMap(() => this.http.get<CatalogoItem[]>(API.estado)),
      catchError(() => of([]))
    );
  }

  private seedCategorias(): Observable<CatalogoItem[]> {
    const posts = CATEGORIAS_INICIALES.map((nombre) =>
      this.http.post<CatalogoItem>(API.categorias, { nombre }).pipe(catchError(() => of(null)))
    );
    return forkJoin(posts).pipe(
      switchMap(() => this.http.get<CatalogoItem[]>(API.categorias)),
      catchError(() => of([]))
    );
  }
}
