import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../header/header';

// Servicios Necesarios para la Orquestación
import { ProyectoService } from '../../services/proyecto';
import { ClienteService } from '../../services/cliente';
import { HerramientaService } from '../../services/herramienta';
import { AccesorioService } from '../../services/accesorio';

// Modelos
import { Proyecto } from '../../models/proyecto';
import { Cliente } from '../../models/cliente';
import { Herramienta } from '../../models/herramienta';
import { Accesorio } from '../../models/accesorio';

@Component({
  selector: 'app-proyecto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './proyecto.html',
  styleUrl: './proyecto.css'
})
export class ProyectoComponent implements OnInit {

  proyectos: Proyecto[] = [];
  clientes: Cliente[] = [];
  herramientas: Herramienta[] = [];
  accesorios: Accesorio[] = [];

  form: FormGroup;
  showModal = false;
  isEditMode = false;
  proyectoIdSeleccionado: number | null = null;
  buscando = false;

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private proyectoService = inject(ProyectoService);
  private clienteService = inject(ClienteService);
  private herramientaService = inject(HerramientaService);
  private accesorioService = inject(AccesorioService);

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      direccion: ['', [Validators.required, Validators.maxLength(150)]],
      clienteId: ['', [Validators.required]],
      herramientaId: ['', [Validators.required]],
      accesorioId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.listarProyectos();
    this.cargarCatalogosAuxiliares();
  }

  listarProyectos(): void {
    this.buscando = true;
    this.proyectoService.listar().subscribe({
      next: (data) => {
        this.proyectos = data;
        this.buscando = false;
      },
      error: (err) => {
        console.error(err);
        this.buscando = false;
      }
    });
  }

  cargarCatalogosAuxiliares(): void {
    // Carga de catálogos en paralelo para poblar las llaves foráneas en los selects
    this.clienteService.listar().subscribe(data => this.clientes = data);
    this.herramientaService.listar().subscribe(data => this.herramientas = data);
    this.accesorioService.listar().subscribe(data => this.accesorios = data);
  }

  // Métodos auxiliares para mostrar nombres en la tabla principal en lugar de IDs crudos
  getNombreCliente(id?: number): string {
    const c = this.clientes.find(item => item.id === id);
    return c ? `${c.nombre} ${c.apellido}` : `ID: ${id}`;
  }

  getNombreHerramienta(id?: number): string {
    const h = this.herramientas.find(item => item.id === id);
    return h ? `${h.nombre} (${h.marca})` : `ID: ${id}`;
  }

  getNombreAccesorio(id?: number): string {
    const a = this.accesorios.find(item => item.id === id);
    return a ? `${a.nombre}` : `ID: ${id}`;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const proyectoData: Proyecto = this.form.value;

    if (this.isEditMode && this.proyectoIdSeleccionado !== null) {
      this.proyectoService.actualizar(this.proyectoIdSeleccionado, proyectoData).subscribe({
        next: () => {
          alert('Proyecto actualizado con éxito');
          this.cerrarModal();
          this.listarProyectos();
        },
        error: () => alert('Error al actualizar el proyecto')
      });
    } else {
      this.proyectoService.crear(proyectoData).subscribe({
        next: () => {
          alert('Proyecto registrado con éxito');
          this.cerrarModal();
          this.listarProyectos();
        },
        error: () => alert('Error al guardar el proyecto')
      });
    }
  }

  eliminar(id?: number): void {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar este proyecto y liberar sus recursos asignados?')) {
      this.proyectoService.eliminar(id).subscribe({
        next: () => {
          alert('Proyecto eliminado de forma correcta');
          this.listarProyectos();
        },
        error: () => alert('Error al eliminar el proyecto')
      });
    }
  }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.proyectoIdSeleccionado = null;
    this.form.reset({ clienteId: '', herramientaId: '', accesorioId: '' });
    this.showModal = true;
  }

  abrirModalEditar(proyecto: Proyecto): void {
    this.isEditMode = true;
    this.proyectoIdSeleccionado = proyecto.id ?? null;
    this.form.patchValue(proyecto);
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