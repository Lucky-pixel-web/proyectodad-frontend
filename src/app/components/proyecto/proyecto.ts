import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { MapsPlanet } from '../maps-planet/maps-planet';
import { ProyectoService } from '../../services/proyecto';
import { ClienteService } from '../../services/cliente';
import { HerramientaService } from '../../services/herramienta';
import { AccesorioService } from '../../services/accesorio';
import { Proyecto } from '../../models/proyecto';
import { Cliente } from '../../models/cliente';
import { Herramienta } from '../../models/herramienta';
import { Accesorio } from '../../models/accesorio';
import { httpErrorMessage } from '../../utils/http-error.util';
import { formValidationMessage } from '../../utils/form-validation.util';

@Component({
  selector: 'app-proyecto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, MapsPlanet],
  templateUrl: './proyecto.html',
})
export class ProyectoComponent implements OnInit {
  proyectos: Proyecto[] = [];
  filtrados: Proyecto[] = [];
  clientes: Cliente[] = [];
  herramientas: Herramienta[] = [];
  accesorios: Accesorio[] = [];
  busqueda = '';
  filtroEstado = 'Todos';
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  proyectoId: number | null = null;
  buscando = false;
  formError = '';
  busquedaActiva = false;

  private fb = inject(FormBuilder);
  private proyectoSvc = inject(ProyectoService);
  private clienteSvc = inject(ClienteService);
  private herramientaSvc = inject(HerramientaService);
  private accesorioSvc = inject(AccesorioService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['Proyecto registrado en el sistema', Validators.required],
      direccion: ['', Validators.required],
      clasificacion: ['Perfecto', Validators.required],
      incidentes: ['Ninguno', Validators.required],
      clienteId: [null as number | null, Validators.required],
      herramientaId: [null as number | null, Validators.required],
      accesorioId: [null as number | null, Validators.required],
    });
    this.listar();
    this.clienteSvc.listar().subscribe({
      next: (d) => {
        this.clientes = d;
        if (d.length && !this.form.get('clienteId')?.value) {
          this.form.patchValue({ clienteId: d[0].id });
        }
      },
      error: () => { this.clientes = []; },
    });
    this.herramientaSvc.listar().subscribe({
      next: (d) => {
        this.herramientas = d;
        if (d.length) this.form.patchValue({ herramientaId: d[0].id });
      },
      error: () => { this.herramientas = []; },
    });
    this.accesorioSvc.listar().subscribe({
      next: (d) => {
        this.accesorios = d;
        if (d.length) this.form.patchValue({ accesorioId: d[0].id });
      },
      error: () => { this.accesorios = []; },
    });
  }

  get totalProyectos() { return this.proyectos.length; }
  get perfectos() { return this.proyectos.filter((p) => this.getClasificacion(p) === 'Perfecto').length; }
  get conProblemas() { return this.totalProyectos - this.perfectos; }

  getClasificacion(p: Proyecto): string {
    return (p as any).clasificacion || 'Perfecto';
  }

  getNombreCliente(id?: number): string {
    const c = this.clientes.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellido}` : '—';
  }

  listar(): void {
    this.buscando = true;
    this.proyectoSvc.listar().subscribe({
      next: (data) => { this.proyectos = data; this.filtrar(); this.buscando = false; },
      error: () => { this.buscando = false; },
    });
  }

  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length && this.proyectos.length > 0;
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim();
    const q = this.busqueda.toLowerCase();
    this.filtrados = this.proyectos.filter((p) => {
      const matchQ = !q || p.nombre?.toLowerCase().includes(q) || p.direccion?.toLowerCase().includes(q) || this.getNombreCliente(p.clienteId).toLowerCase().includes(q);
      const cls = this.getClasificacion(p);
      const matchF = this.filtroEstado === 'Todos' || (this.filtroEstado === 'Perfectos' && cls === 'Perfecto') || (this.filtroEstado === 'Con Problemas' && cls !== 'Perfecto');
      return matchQ && matchF;
    });
  }

  setFiltro(f: string): void { this.filtroEstado = f; this.filtrar(); }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.proyectoId = null;
    this.formError = '';
    this.form.reset({
      clasificacion: 'Perfecto',
      incidentes: 'Ninguno',
      descripcion: 'Proyecto registrado en el sistema',
      clienteId: this.clientes[0]?.id ?? null,
      herramientaId: this.herramientas[0]?.id ?? null,
      accesorioId: this.accesorios[0]?.id ?? null,
    });
    this.showModal = true;
  }

  abrirModalEditar(p: Proyecto): void {
    this.isEditMode = true;
    this.proyectoId = p.id ?? null;
    this.formError = '';
    this.form.patchValue({
      nombre: p.nombre || '',
      direccion: p.direccion || '',
      clienteId: p.clienteId ?? this.clientes[0]?.id ?? null,
      herramientaId: p.herramientaId ?? this.herramientas[0]?.id ?? null,
      accesorioId: p.accesorioId ?? this.accesorios[0]?.id ?? null,
      descripcion: (p as any).descripcion || 'Proyecto registrado en el sistema',
      clasificacion: this.getClasificacion(p),
      incidentes: (p as any).incidentes || 'Ninguno',
    });
    this.showModal = true;
  }

  cerrarModal(): void { this.showModal = false; this.formError = ''; }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const v = this.form.value;
    const payload = {
      nombre: v.nombre,
      direccion: v.direccion,
      clienteId: Number(v.clienteId),
      herramientaId: Number(v.herramientaId),
      accesorioId: Number(v.accesorioId),
    };
    const obs = this.isEditMode && this.proyectoId
      ? this.proyectoSvc.actualizar(this.proyectoId, payload as Proyecto)
      : this.proyectoSvc.crear(payload as Proyecto);
    obs.subscribe({
      next: () => { this.cerrarModal(); this.listar(); },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Cree al menos un cliente, una herramienta y un accesorio antes de registrar proyectos.');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar este proyecto?')) return;
    this.proyectoSvc.eliminar(id).subscribe({ next: () => this.listar() });
  }

  get mapsQuery(): string {
    return this.form.get('direccion')?.value || '';
  }
}
