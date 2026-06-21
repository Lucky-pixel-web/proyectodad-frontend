import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { MapsPlanet } from '../maps-planet/maps-planet';
import { ProveedorService } from '../../services/proveedor';
import { CatalogoService, CatalogoItem } from '../../services/catalogo';
import { Proveedor } from '../../models/proveedor';
import { cacheEntityImage, mergeEntityImages } from '../../utils/image-cache.util';
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

  private fb = inject(FormBuilder);
  private svc = inject(ProveedorService);
  private catSvc = inject(CatalogoService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      telefono: [987654321, Validators.required],
      categoriaId: [null as number | null, Validators.required],
      direccion: ['', Validators.required],
      ubicacion: ['', Validators.required],
      foto: ['', Validators.required],
      descripcion: ['Proveedor registrado desde el sistema', Validators.required],
    });
    this.cargarCategorias();
    this.listar();
  }

  private cargarCategorias(onLoaded?: () => void): void {
    this.catSvc.listarCategorias().subscribe({
      next: (c) => {
        this.categorias = c;
        if (c.length) {
          const current = this.form.get('categoriaId')?.value;
          const exists = c.some((x) => x.id === current);
          if (!exists) this.form.patchValue({ categoriaId: c[0].id });
        }
        onLoaded?.();
      },
      error: () => { this.categorias = []; },
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
        this.proveedores = mergeEntityImages('proveedor', data);
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

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.proveedorId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.cargarCategorias(() => {
      this.form.reset({
        telefono: 987654321,
        categoriaId: this.categorias[0]?.id ?? null,
        foto: '',
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
    this.cargarCategorias(() => {
      this.form.patchValue({
        ...p,
        categoriaId: p.categoriaId ?? this.categorias[0]?.id ?? null,
        foto: p.foto ? 'imagen-cargada.png' : '',
      });
      this.showModal = true;
    });
  }

  cerrarModal(): void { this.showModal = false; this.formError = ''; }

  guardar(): void {
    if (!this.categorias.length) {
      this.formError = 'No hay categorías disponibles. Reinicie ms-categorias (8082) y recargue la página.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const v = this.form.value;
    const fotoRef = this.fotoNombre || 'sin-imagen.png';
    const payload: Proveedor = {
      ...v,
      categoriaId: Number(v.categoriaId),
      foto: fotoRef,
    };
    const obs = this.isEditMode && this.proveedorId
      ? this.svc.actualizar(this.proveedorId, payload)
      : this.svc.crear(payload);
    obs.subscribe({
      next: (res) => {
        const id = res.id ?? this.proveedorId;
        if (id && this.fotoPreview) cacheEntityImage('proveedor', id, this.fotoPreview);
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-proveedores (8092) y ms-categorias (8082). Si config-server usa 8088, proveedores no puede usar ese puerto.');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar este proveedor?')) return;
    this.svc.eliminar(id).subscribe({ next: () => this.listar() });
  }

  async onFotoSelected(event: Event): Promise<void> {
    const { pickImageFromInput } = await import('../../utils/file-maps.util');
    const picked = await pickImageFromInput(event);
    if (!picked) return;
    this.fotoNombre = picked.name;
    this.fotoPreview = picked.dataUrl;
    this.form.patchValue({ foto: picked.dataUrl });
  }

  get mapsQuery(): string {
    return this.form.get('ubicacion')?.value || this.form.get('direccion')?.value || '';
  }
}
