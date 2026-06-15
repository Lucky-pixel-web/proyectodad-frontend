import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../header/header';
import { HerramientaService } from '../../services/herramienta';
import { Herramienta } from '../../models/herramienta';

@Component({
  selector: 'app-herramienta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './herramienta.html',
  styleUrl: './herramienta.css'
})
export class HerramientaComponent implements OnInit {

  herramientas: Herramienta[] = [];
  form: FormGroup;
  showModal = false;
  isEditMode = false;
  herramientaIdSeleccionado: number | null = null;
  
  buscando = false;
  mensajeError = '';

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private herramientaService = inject(HerramientaService);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      tipo: ['', [Validators.required, Validators.maxLength(100)]],
      marca: ['', [Validators.required, Validators.maxLength(100)]],
      estado: ['Disponible', [Validators.required, Validators.maxLength(100)]],
      compra: ['', [Validators.required]],
      vidaUtil: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.listarHerramientas();
  }

  listarHerramientas(): void {
    this.buscando = true;
    this.herramientaService.listar().subscribe({
      next: (data) => {
        this.herramientas = data;
        this.buscando = false;
      },
      error: (err) => {
        console.error(err);
        this.mensajeError = 'Error al conectar con el microservicio de herramientas.';
        this.buscando = false;
      }
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const herramientaData: Herramienta = this.form.value;

    if (this.isEditMode && this.herramientaIdSeleccionado !== null) {
      this.herramientaService.actualizar(this.herramientaIdSeleccionado, herramientaData).subscribe({
        next: () => {
          alert('Herramienta modificada correctamente');
          this.cerrarModal();
          this.listarHerramientas();
        },
        error: () => alert('Error al actualizar la herramienta')
      });
    } else {
      this.herramientaService.crear(herramientaData).subscribe({
        next: () => {
          alert('Herramienta registrada con éxito');
          this.cerrarModal();
          this.listarHerramientas();
        },
        error: () => alert('Error al guardar la herramienta')
      });
    }
  }

  eliminar(id?: number): void {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar esta herramienta?')) {
      this.herramientaService.eliminar(id).subscribe({
        next: () => {
          alert('Herramienta eliminada con éxito');
          this.listarHerramientas();
        },
        error: () => alert('Error al intentar eliminar la herramienta')
      });
    }
  }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.herramientaIdSeleccionado = null;
    this.form.reset({ estado: 'Disponible' });
    this.showModal = true;
  }

  abrirModalEditar(herramienta: Herramienta): void {
    this.isEditMode = true;
    this.herramientaIdSeleccionado = herramienta.id ?? null;
    
    // Mapeamos los datos asegurando el formato yyyy-MM-dd para el control HTML date
    const dataACargar = { ...herramienta };
    if (herramienta.compra) {
      dataACargar.compra = JSON.parse(JSON.stringify(herramienta.compra)).split('T')[0];
    }
    
    this.form.patchValue(dataACargar);
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