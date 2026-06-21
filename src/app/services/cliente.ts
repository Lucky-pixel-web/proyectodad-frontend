import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, of, forkJoin } from 'rxjs';

import { catchError, switchMap } from 'rxjs/operators';

import { Cliente } from '../models/cliente';

import { API } from '../config/api.config';



const CLIENTES_INICIALES: Omit<Cliente, 'id'>[] = [

  { nombre: 'Juan', apellido: 'Pérez', dni: '12345678', correo: 'juan.perez@demo.com', telefono: '999888777', direccion: 'Lima' },

  { nombre: 'María', apellido: 'García', dni: '87654321', correo: 'maria.garcia@demo.com', telefono: '988777666', direccion: 'Arequipa' },

];



@Injectable({

  providedIn: 'root'

})

export class ClienteService {

  private apiUrl = API.clientes;

  private http = inject(HttpClient);



  listar(): Observable<Cliente[]> {

    return this.http.get<Cliente[]>(this.apiUrl).pipe(

      switchMap((list) => (list?.length ? of(list) : this.seedClientes())),

      catchError(() => this.seedClientes())

    );

  }



  private seedClientes(): Observable<Cliente[]> {

    const posts = CLIENTES_INICIALES.map((c) =>

      this.http.post<Cliente>(this.apiUrl, c).pipe(catchError(() => of(null)))

    );

    return forkJoin(posts).pipe(

      switchMap(() => this.http.get<Cliente[]>(this.apiUrl)),

      catchError(() => of([]))

    );

  }



  buscarPorId(id: number): Observable<Cliente> {

    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);

  }



  buscarPorDni(dni: string): Observable<Cliente> {

    return this.http.get<Cliente>(`${this.apiUrl}/dni/${dni}`);

  }



  buscarPorNombre(nombre: string): Observable<Cliente[]> {

    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar?nombre=${nombre}`);

  }



  buscarPorApellido(apellido: string): Observable<Cliente[]> {

    return this.http.get<Cliente[]>(`${this.apiUrl}/apellido/${apellido}`);

  }



  crear(cliente: Cliente): Observable<Cliente> {

    return this.http.post<Cliente>(this.apiUrl, cliente);

  }



  actualizar(id: number, cliente: Cliente): Observable<Cliente> {

    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);

  }



  eliminar(id: number): Observable<void> {

    return this.http.delete<void>(`${this.apiUrl}/${id}`);

  }

}

