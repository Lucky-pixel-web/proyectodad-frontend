import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { MapsPlanet } from '../maps-planet/maps-planet';
import { ProveedorService } from '../../services/proveedor';
import { CategoriaProveedorService } from '../../services/categoria-proveedor';
import { CatalogoItem } from '../../services/catalogo';
import { Proveedor } from '../../models/proveedor';
import { httpErrorMessage } from '../../utils/http-error.util';
import { formValidationMessage } from '../../utils/form-validation.util';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header, MapsPlanet],
  templateUrl: './proveedor.html',
})
export class ProveedorComponent implements OnInit {
  proveedores: Proveedor[] = [];
  filtrados: Proveedor[] = [];
  categorias: CatalogoItem[] = [];
  busqueda = '';
  filtroCat = 'Todos';
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  proveedorId: number | null = null;
  buscando = false;
  formError = '';
  busquedaActiva = false;
  fotoNombre = '';
  fotoPreview = '';
  private archivoSeleccionado?: File;

  private fb = inject(FormBuilder);
  private svc = inject(ProveedorService);
  private catSvc = inject(CategoriaProveedorService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      telefono: ['987654321', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
      categoriaId: [null as number | null, Validators.required],
      direccion: ['', Validators.required],
      ubicacion: ['', Validators.required],
      descripcion: ['Proveedor registrado desde el sistema', Validators.required],
    });
    this.cargarCategorias();
    this.listar();
  }

  private cargarCategorias(onLoaded?: () => void): void {
    this.catSvc.listar().subscribe({
      next: (c) => {
        this.categorias = c;
        onLoaded?.();
      },
      error: () => {
        this.categorias = [];
        onLoaded?.();
      },
    });
  }

  getNombreCompleto(p: Proveedor): string {
    return `${p.nombres} ${p.apellidos}`;
  }

  getCatClass(n?: string): string {
    const c = (n || '').toLowerCase();
    if (c.includes('herramienta')) return 'warning';
    if (c.includes('melamine')) return 'purple';
    return 'info';
  }

  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length && this.proveedores.length > 0;
  }

  listar(): void {
    this.buscando = true;
    this.svc.listar().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.filtrar();
        this.buscando = false;
      },
      error: () => { this.buscando = false; },
    });
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim();
    const q = this.busqueda.toLowerCase();
    this.filtrados = this.proveedores.filter((p) => {
      const matchQ = !q || this.getNombreCompleto(p).toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q);
      const matchC = this.filtroCat === 'Todos' || (p.categoriaNombre || '').toLowerCase().includes(this.filtroCat.toLowerCase());
      return matchQ && matchC;
    });
  }

  setFiltro(f: string): void { this.filtroCat = f; this.filtrar(); }

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
    this.proveedorId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.archivoSeleccionado = undefined;
    this.cargarCategorias(() => {
      this.form.reset({
        telefono: '987654321',
        categoriaId: this.categorias[0]?.id ?? null,
        descripcion: 'Proveedor registrado desde el sistema',
      });
      this.showModal = true;
    });
  }

  abrirModalEditar(p: Proveedor): void {
    this.isEditMode = true;
    this.proveedorId = p.id ?? null;
    this.formError = '';
    this.fotoNombre = p.foto ? 'imagen-cargada' : '';
    this.fotoPreview = p.foto || '';
    this.archivoSeleccionado = undefined;
    this.cargarCategorias(() => {
      this.form.patchValue({
        nombres: p.nombres,
        apellidos: p.apellidos,
        telefono: p.telefono,
        categoriaId: p.categoriaId ?? this.categorias[0]?.id ?? null,
        direccion: p.direccion,
        ubicacion: p.ubicacion,
        descripcion: p.descripcion,
      });
      this.showModal = true;
    });
  }

  cerrarModal(): void { this.showModal = false; this.formError = ''; }

  guardar(): void {
    if (!this.categorias.length) {
      this.formError = 'No se cargaron las categorías. Verifique ms-proveedores (8092) y recargue.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const v = this.form.value;
    const payload: Proveedor = {
      nombres: v.nombres,
      apellidos: v.apellidos,
      telefono: v.telefono,
      categoriaId: Number(v.categoriaId),
      direccion: v.direccion,
      ubicacion: v.ubicacion,
      descripcion: v.descripcion,
    };
    const obs = this.isEditMode && this.proveedorId
      ? this.svc.actualizar(this.proveedorId, payload, this.archivoSeleccionado)
      : this.svc.crear(payload, this.archivoSeleccionado);
    obs.subscribe({
      next: () => {
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-proveedores (8092).');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar este proveedor?')) return;
    this.svc.eliminar(id).subscribe({ next: () => this.listar() });
  }

  get mapsQuery(): string {
    return this.form.get('ubicacion')?.value || this.form.get('direccion')?.value || '';
  }
}
