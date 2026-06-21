import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Accesorio } from '../models/accesorio';
import { API } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AccesorioService {
  private apiUrl = API.accesorios; 
  
  private http = inject(HttpClient);

  // @GetMapping -> listar()
  listar(): Observable<Accesorio[]> {
    return this.http.get<Accesorio[]>(this.apiUrl);
  }

  // @GetMapping("/{id}") -> buscarPorId(@PathVariable Long id)
  buscarPorId(id: number): Observable<Accesorio> {
    return this.http.get<Accesorio>(`${this.apiUrl}/${id}`);
  }

  // @GetMapping("/buscar") -> buscarPorNombre(@RequestParam String nombre)
  buscarPorNombre(nombre: string): Observable<Accesorio[]> {
    return this.http.get<Accesorio[]>(`${this.apiUrl}/buscar?nombre=${nombre}`);
  }

  // @GetMapping("/categoria/{categoria}") -> buscarPorCategoria(@PathVariable String categoria)
  buscarPorCategoria(categoria: string): Observable<Accesorio[]> {
    return this.http.get<Accesorio[]>(`${this.apiUrl}/categoria/${categoria}`);
  }

  // @PostMapping -> crear(@Valid @RequestBody AccesorioRequest request)
  crear(accesorio: Accesorio): Observable<Accesorio> {
    return this.http.post<Accesorio>(this.apiUrl, accesorio);
  }

  // @PutMapping("/{id}") -> actualizar(@PathVariable Long id, @Valid @RequestBody AccesorioRequest request)
  actualizar(id: number, accesorio: Accesorio): Observable<Accesorio> {
    return this.http.put<Accesorio>(`${this.apiUrl}/${id}`, accesorio);
  }

  // @DeleteMapping("/{id}") -> eliminar(@PathVariable Long id)
  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}