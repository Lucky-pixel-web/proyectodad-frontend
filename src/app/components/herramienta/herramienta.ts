import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Header } from '../header/header';
import { HerramientaService } from '../../services/herramienta';
import { TipoHerramientaService } from '../../services/tipo-herramienta';
import { MarcaHerramientaService } from '../../services/marca-herramienta';
import { EstadoHerramientaService } from '../../services/estado-herramienta';
import { CatalogoItem } from '../../services/catalogo';
import { Herramienta } from '../../models/herramienta';

import { formValidationMessage } from '../../utils/form-validation.util';
import { httpErrorMessage } from '../../utils/http-error.util';

@Component({
  selector: 'app-herramienta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './herramienta.html',
})
export class HerramientaComponent implements OnInit {
  herramientas: Herramienta[] = [];
  filtradas: Herramienta[] = [];
  tipos: CatalogoItem[] = [];
  marcas: CatalogoItem[] = [];
  estados: CatalogoItem[] = [];
  busqueda = '';
  estadoFiltro = '';
  busquedaActiva = false;
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  herramientaId: number | null = null;
  buscando = false;
  formError = '';
  fotoNombre = '';
  fotoPreview = '';
  private archivoSeleccionado?: File;

  private fb = inject(FormBuilder);
  private svc = inject(HerramientaService);
  private tipoSvc = inject(TipoHerramientaService);
  private marcaSvc = inject(MarcaHerramientaService);
  private estadoSvc = inject(EstadoHerramientaService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      tipoId: [null as number | null, Validators.required],
      marcaId: [null as number | null, Validators.required],
      estadoId: [null as number | null, Validators.required],
      compra: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      vidaUtil: [24, [Validators.required, Validators.min(1)]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
    });
    this.listar();
    this.estadoSvc.listar().subscribe({ next: (estados) => (this.estados = estados) });
  }

  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtradas.length && this.herramientas.length > 0;
  }

  private cargarCatalogos(onLoaded?: () => void): void {
    forkJoin({
      tipos: this.tipoSvc.listar(),
      marcas: this.marcaSvc.listar(),
      estados: this.estadoSvc.listar(),
    }).subscribe({
      next: ({ tipos, marcas, estados }) => {
        this.tipos = tipos;
        this.marcas = marcas;
        this.estados = estados;
        onLoaded?.();
      },
      error: () => {
        this.tipos = [];
        this.marcas = [];
        this.estados = [];
        onLoaded?.();
      },
    });
  }

  listar(): void {
    this.buscando = true;
    this.svc.listar().subscribe({
      next: (data) => {
        this.herramientas = data;
        this.filtrar();
        this.buscando = false;
      },
      error: () => { this.buscando = false; },
    });
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim() || !!this.estadoFiltro;
    const q = this.busqueda.toLowerCase();
    this.filtradas = this.herramientas.filter((h) => {
      const matchTexto = !q || h.nombre?.toLowerCase().includes(q) || h.marcaNombre?.toLowerCase().includes(q);
      const matchEstado = !this.estadoFiltro || h.estadoNombre === this.estadoFiltro;
      return matchTexto && matchEstado;
    });
  }

  getEstadoClass(estadoNombre?: string): string {
    const e = (estadoNombre || '').toLowerCase();
    if (e.includes('disponible') || e.includes('excelente') || e.includes('bueno')) return 'success';
    if (e.includes('mantenimiento') || e.includes('reparar')) return 'warning';
    if (e.includes('malogrado') || e.includes('malo')) return 'danger';
    return 'info';
  }

  formatVidaUtil(meses?: number): string {
    if (!meses || meses <= 0) return 'Sin datos';
    const anios = Math.floor(meses / 12);
    const restoMeses = meses % 12;
    const parts: string[] = [];
    if (anios) parts.push(`${anios} año${anios !== 1 ? 's' : ''}`);
    if (restoMeses || !parts.length) parts.push(`${restoMeses} mes${restoMeses !== 1 ? 'es' : ''}`);
    return parts.join(', ');
  }

  getVidaInfo(h: Herramienta): { text: string; ok: boolean } {
    if (h.diasRestantes === undefined || h.diasRestantes === null) {
      return { text: 'Sin datos de vida útil', ok: true };
    }
    if (h.diasRestantes >= 0) return { text: `${h.diasRestantes} días restantes de vida útil`, ok: true };
    return { text: `Expiró hace ${Math.abs(h.diasRestantes)} días`, ok: false };
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
    this.herramientaId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      this.form.reset({
        tipoId: this.tipos[0]?.id ?? null,
        marcaId: this.marcas[0]?.id ?? null,
        estadoId: this.estados[0]?.id ?? null,
        vidaUtil: 24,
      });
      this.showModal = true;
    });
  }

  abrirModalEditar(h: Herramienta): void {
    this.isEditMode = true;
    this.herramientaId = h.id ?? null;
    this.formError = '';
    this.fotoNombre = h.foto ? 'imagen-cargada' : '';
    this.fotoPreview = h.foto || '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      const tipoId = this.tipos.find((t) => t.nombre === h.tipoNombre)?.id ?? this.tipos[0]?.id ?? null;
      const marcaId = this.marcas.find((m) => m.nombre === h.marcaNombre)?.id ?? this.marcas[0]?.id ?? null;
      const estadoId = this.estados.find((e) => e.nombre === h.estadoNombre)?.id ?? this.estados[0]?.id ?? null;
      this.form.patchValue({
        nombre: h.nombre,
        tipoId,
        marcaId,
        estadoId,
        compra: h.compra ? String(h.compra).split('T')[0] : '',
        fechaInicio: h.fechaInicio ? String(h.fechaInicio).split('T')[0] : '',
        vidaUtil: h.vidaUtil ?? 24,
      });
      this.showModal = true;
    });
  }

  cerrarModal(): void { this.showModal = false; this.formError = ''; }

  guardar(): void {
    if (!this.tipos.length || !this.marcas.length || !this.estados.length) {
      this.formError = 'No se cargaron los catálogos de tipo/marca/estado. Verifique ms-herramientas (8085) y recargue.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const v = this.form.value;
    const payload: Herramienta = {
      nombre: v.nombre,
      tipoId: Number(v.tipoId),
      marcaId: Number(v.marcaId),
      estadoId: Number(v.estadoId),
      compra: v.compra,
      fechaInicio: v.fechaInicio,
      vidaUtil: Number(v.vidaUtil),
      cantidad: Number(v.cantidad),
    };
    const obs = this.isEditMode && this.herramientaId
      ? this.svc.actualizar(this.herramientaId, payload, this.archivoSeleccionado)
      : this.svc.crear(payload, this.archivoSeleccionado);
    obs.subscribe({
      next: () => {
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-herramientas (8085).');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar esta herramienta?')) return;
    this.svc.eliminar(id).subscribe({ next: () => this.listar() });
  }
}
