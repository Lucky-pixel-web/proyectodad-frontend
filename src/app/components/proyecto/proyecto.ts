import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header'; // <-- Importación restaurada
import { ProyectoService } from '../../services/proyecto';
import { ClienteService } from '../../services/cliente';
import { HerramientaService } from '../../services/herramienta';
import { AccesorioService } from '../../services/accesorio';
import { MelamineService } from '../../services/melamine'; // Asegúrate de importar MelamineService si es necesario
import { CatalogoService, CatalogoItem } from '../../services/catalogo';
import { Proyecto } from '../../models/proyecto';
import { Cliente } from '../../models/cliente';
import { Herramienta } from '../../models/herramienta';
import { Accesorio } from '../../models/accesorio';
import { Melamine } from '../../models/melamine';
import { httpErrorMessage } from '../../utils/http-error.util';
import { formValidationMessage } from '../../utils/form-validation.util';

@Component({
  selector: 'app-proyecto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header], // <-- Header añadido aquí
  templateUrl: './proyecto.html',
})
export class ProyectoComponent implements OnInit {
  proyectos: Proyecto[] = [];
  filtrados: Proyecto[] = []; // Restaurado para el buscador
  clientes: Cliente[] = [];
  herramientas: Herramienta[] = [];
  accesorios: Accesorio[] = [];
  melamines: Melamine[] = [];
  busqueda = '';
  filtroEstado = 'Todos';
  buscando = false;
  busquedaActiva = false;
  
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  proyectoId: number | null = null;
  formError = '';

  private fb = inject(FormBuilder);
  private proyectoSvc = inject(ProyectoService);
  private clienteSvc = inject(ClienteService);
  private herramientaSvc = inject(HerramientaService);
  private accesorioSvc = inject(AccesorioService);
  private melamineSvc = inject(MelamineService); // Asegúrate de importar MelamineService si es necesario 

  ngOnInit(): void {
    this.initForm();
    this.cargarDatosMaestros();
    this.listar();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      clienteId: [null, Validators.required],
      detalles: this.fb.array([])
    });
  }

  // --- Lógica del FormArray ---
  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  agregarFila(data: any = null): void {
    this.detalles.push(this.fb.group({
      herramientaId: [data?.herramientaId || null, Validators.required],
      accesorioId: [data?.accesorioId || null, Validators.required],
      melamineId: [data?.melamineId || null, Validators.required]
    }));
  }

  eliminarFila(index: number): void {
    this.detalles.removeAt(index);
  }

  // --- Lógica de visualización y filtrado ---
  get totalProyectos() { return this.proyectos.length; }
  get perfectos() { return this.proyectos.length; } // Ajustar según tu lógica de estado
  get conProblemas() { return 0; } // Ajustar según tu lógica de estado

  getNombreCliente(id?: number): string {
    const c = this.clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellido}` : '—';
  }

  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length;
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim();
    const q = this.busqueda.toLowerCase();
    this.filtrados = this.proyectos.filter((p) => 
      !q || p.nombre?.toLowerCase().includes(q) || p.direccion?.toLowerCase().includes(q)
    );
  }

  setFiltro(f: string): void { this.filtroEstado = f; this.filtrar(); }

  // --- Gestión de Datos ---
  private cargarDatosMaestros(): void {
    this.clienteSvc.listar().subscribe(d => this.clientes = d);
    this.herramientaSvc.listar().subscribe(d => this.herramientas = d);
    this.accesorioSvc.listar().subscribe(d => this.accesorios = d);
    this.melamineSvc.listar().subscribe(d => this.melamines = d);
  }

  listar(): void {
    this.buscando = true;
    this.proyectoSvc.listar().subscribe(data => {
      this.proyectos = data;
      this.filtrados = data;
      this.buscando = false;
    });
  }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.proyectoId = null;
    this.form.reset();
    this.detalles.clear();
    this.agregarFila(); 
    this.showModal = true;
  }

  abrirModalEditar(p: Proyecto): void {
    this.isEditMode = true;
    this.proyectoId = p.id ?? null;
    this.form.patchValue({
      nombre: p.nombre,
      direccion: p.direccion,
      clienteId: p.clienteId
    });
    this.detalles.clear();
    p.detalles?.forEach(d => this.agregarFila(d));
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.formError = '';
    this.form.reset();
    this.detalles.clear();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    const payload = this.form.value;
    const obs = this.isEditMode && this.proyectoId
      ? this.proyectoSvc.actualizar(this.proyectoId, payload)
      : this.proyectoSvc.crear(payload);

    obs.subscribe({
      next: () => { this.cerrarModal(); this.listar(); },
      error: (err) => this.formError = httpErrorMessage(err, 'Error al guardar')
    });
  }

  eliminar(id?: number): void {
    if (id && confirm('¿Eliminar este proyecto?')) {
      this.proyectoSvc.eliminar(id).subscribe(() => this.listar());
    }
  }
}