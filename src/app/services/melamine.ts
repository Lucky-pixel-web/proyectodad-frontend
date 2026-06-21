import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Melamine } from '../models/melamine';
import { API } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class MelamineService {
  private apiUrl = API.melamine;
  private http = inject(HttpClient);

  listar(): Observable<Melamine[]> {
    return this.http.get<Melamine[]>(this.apiUrl);
  }

  crear(m: Melamine): Observable<Melamine> {
    return this.http.post<Melamine>(this.apiUrl, m);
  }

  actualizar(id: number, m: Melamine): Observable<Melamine> {
    return this.http.put<Melamine>(`${this.apiUrl}/${id}`, m);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
