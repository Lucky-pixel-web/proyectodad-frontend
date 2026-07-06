import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Header } from '../header/header';
import { MelamineService } from '../../services/melamine';
import { EstadoMelamineService } from '../../services/estado-melamine';
import { MarcaMelamineService } from '../../services/marca-melamine';
import { ColorMelamineService } from '../../services/color-melamine';
import { CatalogoItem } from '../../services/catalogo';
import { Melamine } from '../../models/melamine';

import { httpErrorMessage } from '../../utils/http-error.util';
import { formValidationMessage } from '../../utils/form-validation.util';

@Component({
  selector: 'app-melamine',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './melamine.html',
})
export class MelamineComponent implements OnInit {
  items: Melamine[] = [];
  filtrados: Melamine[] = [];
  estados: CatalogoItem[] = [];
  marcas: CatalogoItem[] = [];
  colores: CatalogoItem[] = [];
  busqueda = '';
  filtroEstado = 'Todos';
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  itemId: number | null = null;
  buscando = false;
  formError = '';
  busquedaActiva = false;
  fotoNombre = '';
  fotoPreview = '';
  private archivoSeleccionado?: File;

  private fb = inject(FormBuilder);
  private svc = inject(MelamineService);
  private estadoSvc = inject(EstadoMelamineService);
  private marcaSvc = inject(MarcaMelamineService);
  private colorSvc = inject(ColorMelamineService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      ancho: [1220, Validators.required],
      largo: [2440, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0)]],
      colorId: [null as number | null, Validators.required],
      marcaId: [null as number | null, Validators.required],
      estadoId: [null as number | null, Validators.required],
    });
    this.listar();
    this.estadoSvc.listar().subscribe({ next: (estados) => (this.estados = estados) });
  }

  private cargarCatalogos(onLoaded?: () => void): void {
    forkJoin({
      estados: this.estadoSvc.listar(),
      marcas: this.marcaSvc.listar(),
      colores: this.colorSvc.listar(),
    }).subscribe({
      next: ({ estados, marcas, colores }) => {
        this.estados = estados;
        this.marcas = marcas;
        this.colores = colores;
        onLoaded?.();
      },
      error: () => {
        this.estados = [];
        this.marcas = [];
        this.colores = [];
        onLoaded?.();
      },
    });
  }

  get countBueno() { return this.items.filter((m) => (m.estadoNombre || '').toLowerCase().includes('bueno')).length; }
  get countRegular() { return this.items.filter((m) => (m.estadoNombre || '').toLowerCase().includes('regular')).length; }
  get countMalo() { return this.items.filter((m) => (m.estadoNombre || '').toLowerCase().includes('malo')).length; }

  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length && this.items.length > 0;
  }

  listar(): void {
    this.buscando = true;
    this.svc.listar().subscribe({
      next: (data) => {
        this.items = data;
        this.filtrar();
        this.buscando = false;
      },
      error: () => { this.buscando = false; },
    });
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim();
    const q = this.busqueda.toLowerCase();
    this.filtrados = this.items.filter((m) => {
      const matchQ = !q || m.nombre?.toLowerCase().includes(q) || m.colorNombre?.toLowerCase().includes(q) || m.marcaNombre?.toLowerCase().includes(q);
      const matchE = this.filtroEstado === 'Todos' || (m.estadoNombre || '').toLowerCase().includes(this.filtroEstado.toLowerCase());
      return matchQ && matchE;
    });
  }

  setFiltro(f: string): void { this.filtroEstado = f; this.filtrar(); }

  getEstadoClass(n?: string): string {
    const e = (n || '').toLowerCase();
    if (e.includes('bueno')) return 'success';
    if (e.includes('regular')) return 'warning';
    if (e.includes('malo')) return 'danger';
    return 'info';
  }

  async onFotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const { readImageAsDataUrl } = await import('../../utils/file-maps.util');
    this.archivoSeleccionado = file;
    this.fotoNombre = file.name;
    this.fotoPreview = await readImageAsDataUrl(file);
    input.value = '';
  }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.itemId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      this.form.reset({
        ancho: 1220,
        largo: 2440,
        cantidad: 1,
        colorId: this.colores[0]?.id ?? null,
        marcaId: this.marcas[0]?.id ?? null,
        estadoId: this.estados[0]?.id ?? null,
      });
      this.showModal = true;
    });
  }

  abrirModalEditar(m: Melamine): void {
    this.isEditMode = true;
    this.itemId = m.id ?? null;
    this.formError = '';
    this.fotoNombre = m.foto ? 'imagen-cargada' : '';
    this.fotoPreview = m.foto || '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      this.form.patchValue({
        nombre: m.nombre,
        ancho: m.ancho,
        largo: m.largo,
        cantidad: m.cantidad,
        colorId: m.colorId ?? this.colores[0]?.id ?? null,
        marcaId: m.marcaId ?? this.marcas[0]?.id ?? null,
        estadoId: m.estadoId ?? this.estados[0]?.id ?? null,
      });
      this.showModal = true;
    });
  }

  cerrarModal(): void { this.showModal = false; this.formError = ''; }

  guardar(): void {
    if (!this.estados.length || !this.marcas.length || !this.colores.length) {
      this.formError = 'No se cargaron los catálogos de estado/marca/color. Verifique ms-melamine (8086) y recargue.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const v = this.form.value;
    const payload: Melamine = {
      nombre: v.nombre,
      ancho: Number(v.ancho),
      largo: Number(v.largo),
      cantidad: Number(v.cantidad),
      colorId: Number(v.colorId),
      marcaId: Number(v.marcaId),
      estadoId: Number(v.estadoId),
    };
    const obs = this.isEditMode && this.itemId
      ? this.svc.actualizar(this.itemId, payload, this.archivoSeleccionado)
      : this.svc.crear(payload, this.archivoSeleccionado);
    obs.subscribe({
      next: () => {
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-melamine (8086).');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar este melamine?')) return;
    this.svc.eliminar(id).subscribe({ next: () => this.listar() });
  }
}
