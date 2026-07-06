import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../config/api.config';
import { CatalogoItem } from './catalogo';

@Injectable({ providedIn: 'root' })
export class MarcaMelamineService {
  private http = inject(HttpClient);
  private apiUrl = `${API.melamine}/marcas`;

  listar(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(this.apiUrl);
  }
}
