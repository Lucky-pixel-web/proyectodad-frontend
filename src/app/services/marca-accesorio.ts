import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';
import { CatalogoItem } from './catalogo';

@Injectable({ providedIn: 'root' })
export class MarcaAccesorioService {
  private http = inject(HttpClient);
  private apiUrl = `${API.accesorios}/marcas`;

  listar(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(this.apiUrl);
  }
}
