import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { ProyectoService } from '../../services/proyecto';
import { ClienteService } from '../../services/cliente';
import { HerramientaService } from '../../services/herramienta';
import { AccesorioService } from '../../services/accesorio';
import { MelamineService } from '../../services/melamine';
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
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './proyecto.html',
})
export class ProyectoComponent implements OnInit {
  proyectos: Proyecto[] = [];
  filtrados: Proyecto[] = [];
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

  // --- Variables para el Modal Ticket (Ver más) ---
  showTicketModal = false;
  proyectoSeleccionado: any = null;
  fechaActual: string = new Date().toLocaleDateString('es-PE'); // Formato local

  private fb = inject(FormBuilder);
  private proyectoSvc = inject(ProyectoService);
  private clienteSvc = inject(ClienteService);
  private herramientaSvc = inject(HerramientaService);
  private accesorioSvc = inject(AccesorioService);
  private melamineSvc = inject(MelamineService);

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

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  // --- Modificado para incluir las cantidades independientes ---
  agregarFila(data: any = null): void {
    this.detalles.push(this.fb.group({
      herramientaId: [data?.herramientaId || null],
      cantidadHerramienta: [data?.cantidadHerramienta || 0, [Validators.min(0)]],
      
      accesorioId: [data?.accesorioId || null],
      cantidadAccesorio: [data?.cantidadAccesorio || 0, [Validators.min(0)]],
      
      melamineId: [data?.melamineId || null],
      cantidadMelamine: [data?.cantidadMelamine || 0, [Validators.min(0)]]
    }));
  }

  eliminarFila(index: number): void {
    this.detalles.removeAt(index);
  }

  get totalProyectos() { return this.proyectos.length; }
  get perfectos() { return this.proyectos.length; } 
  get conProblemas() { return 0; } 

  getNombreCliente(id?: number): string {
    const c = this.clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellido || ''}` : '—';
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

  // --- Helpers para obtener nombres en el Ticket ---
  getHerramientaNombre(id: any): string {
    return this.herramientas.find(h => h.id == id)?.nombre || 'Herramienta no encontrada';
  }
  getAccesorioNombre(id: any): string {
    return this.accesorios.find(a => a.id == id)?.nombre || 'Accesorio no encontrado';
  }
  getMelamineNombre(id: any): string {
    return this.melamines.find(m => m.id == id)?.nombre || 'Melamine no encontrado';
  }

  // --- Lógica del Modal Ticket ---
  abrirTicket(p: Proyecto): void {
    this.proyectoSeleccionado = p;
    this.showTicketModal = true;
  }
  cerrarTicket(): void {
    this.showTicketModal = false;
    this.proyectoSeleccionado = null;
  }

  // --- Lógica del Modal Formulario ---
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