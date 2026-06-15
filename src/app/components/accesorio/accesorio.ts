import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../header/header';
import { AccesorioService } from '../../services/accesorio';
import { Accesorio } from '../../models/accesorio';

@Component({
  selector: 'app-accesorio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './accesorio.html',
  styleUrl: './accesorio.css'
})
export class AccesorioComponent implements OnInit {

  accesorios: Accesorio[] = [];
  form: FormGroup;
  showModal = false;
  isEditMode = false;
  accesorioIdSeleccionado: number | null = null;
  
  buscando = false;
  mensajeError = '';

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private accesorioService = inject(AccesorioService);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]], // 🎯 Sincronizado con longitud 100
      descripcion: ['', [Validators.required, Validators.maxLength(150)]], // 🎯 Sincronizado con longitud 150
      precio: [0.0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      categoria: ['', [Validators.required, Validators.maxLength(50)]],
      marca: ['', [Validators.required, Validators.maxLength(50)]],
      estado: ['Disponible', [Validators.required, Validators.maxLength(20)]]
    });
  }

  ngOnInit(): void {
    this.listarAccesorios();
  }

  listarAccesorios(): void {
    this.buscando = true;
    this.accesorioService.listar().subscribe({
      next: (data) => {
        this.accesorios = data;
        this.buscando = false;
      },
      error: (err) => {
        console.error(err);
        this.mensajeError = 'Error al conectar con el microservicio de accesorios.';
        this.buscando = false;
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const accesorioData: Accesorio = this.form.value;

    if (this.isEditMode && this.accesorioIdSeleccionado !== null) {
      this.accesorioService.actualizar(this.accesorioIdSeleccionado, accesorioData).subscribe({
        next: () => {
          alert('Accesorio modificado correctamente');
          this.cerrarModal();
          this.listarAccesorios();
        },
        error: () => alert('Error al actualizar el accesorio')
      });
    } else {
      this.accesorioService.crear(accesorioData).subscribe({
        next: () => {
          alert('Accesorio registrado con éxito');
          this.cerrarModal();
          this.listarAccesorios();
        },
        error: () => alert('Error al guardar el accesorio')
      });
    }
  }

  eliminar(id?: number): void {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar este accesorio?')) {
      this.accesorioService.eliminar(id).subscribe({
        next: () => {
          alert('Accesorio eliminado con éxito');
          this.listarAccesorios();
        },
        error: () => alert('Error al intentar eliminar el accesorio')
      });
    }
  }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.accesorioIdSeleccionado = null;
    this.form.reset({ stock: 0, precio: 0.0, estado: 'Disponible' });
    this.showModal = true;
  }

  abrirModalEditar(accesorio: Accesorio): void {
    this.isEditMode = true;
    this.accesorioIdSeleccionado = accesorio.id ?? null;
    this.form.patchValue(accesorio);
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.form.reset();
  }

  onAtras(): void {
    this.router.navigateByUrl('/');
  }
}