import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  // Apuntamos al puerto 8083 de tu microservicio ms-clientes
  private apiUrl = 'http://localhost:8083/api/clientes'; 
  
  private http = inject(HttpClient);

  // @GetMapping -> listar()
  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  // @GetMapping("/{id}") -> buscarPorId(@PathVariable Long id)
  buscarPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  // @GetMapping("/dni/{dni}") -> buscarPorDni(@PathVariable String dni)
  buscarPorDni(dni: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/dni/${dni}`);
  }

  // @GetMapping("/buscar") -> buscarPorNombre(@RequestParam String nombre)
  buscarPorNombre(nombre: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar?nombre=${nombre}`);
  }

  // @GetMapping("/apellido/{apellido}") -> buscarPorApellido(@PathVariable String apellido)
  buscarPorApellido(apellido: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/apellido/${apellido}`);
  }

  // @PostMapping -> crear(@Valid @RequestBody ClienteRequest request)
  crear(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  // @PutMapping("/{id}") -> actualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest request)
  actualizar(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  // @DeleteMapping("/{id}") -> eliminar(@PathVariable Long id)
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}