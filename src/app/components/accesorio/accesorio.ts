import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Header } from '../header/header';
import { AccesorioService } from '../../services/accesorio';
import { MarcaAccesorioService } from '../../services/marca-accesorio';
import { EstadoAccesorioService } from '../../services/estado-accesorio';
import { CatalogoItem } from '../../services/catalogo';
import { Accesorio } from '../../models/accesorio';
import { httpErrorMessage } from '../../utils/http-error.util';
import { formValidationMessage } from '../../utils/form-validation.util';

@Component({
  selector: 'app-accesorio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './accesorio.html',
})
export class AccesorioComponent implements OnInit {
  accesorios: Accesorio[] = [];
  filtrados: Accesorio[] = [];
  marcas: CatalogoItem[] = [];
  estados: CatalogoItem[] = [];
  busqueda = '';
  busquedaActiva = false;
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  accesorioId: number | null = null;
  buscando = false;
  formError = '';
  fotoNombre = '';
  fotoPreview = '';
  private archivoSeleccionado?: File;

  private fb = inject(FormBuilder);
  private svc = inject(AccesorioService);
  private marcaSvc = inject(MarcaAccesorioService);
  private estadoSvc = inject(EstadoAccesorioService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      marcaId: [null as number | null, Validators.required],
      stock: [100, [Validators.required, Validators.min(1), Validators.max(1000)]],
      descripcion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
      precio: [1, [Validators.required, Validators.min(0.01), Validators.max(999.99)]],
      estadoId: [null as number | null, Validators.required],
    });
    this.listar();
  }

  get totalAccesorios() { return this.accesorios.length; }
  get sinStock() { return this.accesorios.filter((a) => (a.stock ?? 0) === 0).length; }
  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length && this.accesorios.length > 0;
  }

  private cargarCatalogos(onLoaded?: () => void): void {
    forkJoin({
      marcas: this.marcaSvc.listar(),
      estados: this.estadoSvc.listar(),
    }).subscribe({
      next: ({ marcas, estados }) => {
        this.marcas = marcas;
        this.estados = estados;
        onLoaded?.();
      },
      error: () => {
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
        this.accesorios = data;
        this.filtrar();
        this.buscando = false;
      },
      error: () => { this.buscando = false; },
    });
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim();
    const q = this.busqueda.toLowerCase();
    this.filtrados = this.accesorios.filter(
      (a) => !q || a.nombre?.toLowerCase().includes(q) || a.marcaNombre?.toLowerCase().includes(q) || a.descripcion?.toLowerCase().includes(q)
    );
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
    this.accesorioId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      this.form.reset({
        stock: 100,
        precio: 1,
        marcaId: this.marcas[0]?.id ?? null,
        estadoId: this.estados[0]?.id ?? null,
      });
      this.showModal = true;
    });
  }

  abrirModalEditar(a: Accesorio): void {
    this.isEditMode = true;
    this.accesorioId = a.id ?? null;
    this.formError = '';
    this.fotoPreview = a.foto || '';
    this.fotoNombre = a.foto ? 'imagen-cargada' : '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      this.form.patchValue({
        nombre: a.nombre,
        marcaId: a.marcaId ?? this.marcas[0]?.id ?? null,
        stock: Math.max(1, a.stock ?? 1),
        descripcion: a.descripcion,
        precio: a.precio && a.precio > 0 ? a.precio : 1,
        estadoId: a.estadoId ?? this.estados[0]?.id ?? null,
      });
      this.showModal = true;
    });
  }

  onStockInput(): void {
    const ctrl = this.form.get('stock');
    const val = Number(ctrl?.value);
    if (val === 0 || val < 1) {
      ctrl?.setValue(1);
    }
  }

  cerrarModal(): void { this.showModal = false; this.formError = ''; }

  guardar(): void {
    if (!this.marcas.length || !this.estados.length) {
      this.formError = 'No se cargaron los catálogos de marca/estado. Verifique ms-accesorios (8081) y recargue.';
      return;
    }
    if (this.form.get('stock')?.value === 0 || this.form.get('stock')?.value < 1) {
      this.form.get('stock')?.setValue(1);
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const v = this.form.value;
    const payload: Accesorio = {
      nombre: v.nombre,
      descripcion: v.descripcion,
      precio: Number(v.precio) || 1,
      stock: Number(v.stock),
      marcaId: Number(v.marcaId),
      estadoId: Number(v.estadoId),
    };
    const obs = this.isEditMode && this.accesorioId
      ? this.svc.actualizar(this.accesorioId, payload, this.archivoSeleccionado)
      : this.svc.crear(payload, this.archivoSeleccionado);
    obs.subscribe({
      next: () => {
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-accesorios (8081) y que precio > 0, stock ≥ 1.');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar este accesorio?')) return;
    this.svc.eliminar(id).subscribe({ next: () => this.listar() });
  }
}
