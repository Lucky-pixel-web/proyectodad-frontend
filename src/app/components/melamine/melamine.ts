import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { MelamineService } from '../../services/melamine';
import { CatalogoService, CatalogoItem } from '../../services/catalogo';
import { Melamine } from '../../models/melamine';

import { cacheEntityImage, mergeEntityImages } from '../../utils/image-cache.util';
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
  busqueda = '';
  filtroEstado = 'Todos';
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  itemId: number | null = null;
  buscando = false;
  formError = '';
  busquedaActiva = false;

  private fb = inject(FormBuilder);
  private svc = inject(MelamineService);
  private catSvc = inject(CatalogoService);

  fotoNombre = '';
  fotoPreview = '';

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      ancho: [1220, Validators.required],
      largo: [2440, Validators.required],
      color: ['', Validators.required],
      marca: ['', Validators.required],
      estadoId: [null as number | null, Validators.required],
      foto: [''],
    });
    this.cargarEstados();
    this.listar();
  }

  private cargarEstados(onLoaded?: () => void): void {
    this.catSvc.listarEstados().subscribe({
      next: (e) => {
        this.estados = e;
        if (e.length) {
          const current = this.form.get('estadoId')?.value;
          const exists = e.some((x) => x.id === current);
          if (!exists) this.form.patchValue({ estadoId: e[0].id });
        }
        onLoaded?.();
      },
      error: () => { this.estados = []; },
    });
  }

  getDisplayName(m: Melamine): string {
    return m.color ? `Melamine ${m.color}` : 'Melamine';
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
        this.items = mergeEntityImages('melamine', data);
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
      const matchQ = !q || this.getDisplayName(m).toLowerCase().includes(q) || m.color?.toLowerCase().includes(q) || m.marca?.toLowerCase().includes(q);
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

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.itemId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.cargarEstados(() => {
      this.form.reset({ ancho: 1220, largo: 2440, estadoId: this.estados[0]?.id ?? null, foto: '' });
      this.showModal = true;
    });
  }

  abrirModalEditar(m: Melamine): void {
    this.isEditMode = true;
    this.itemId = m.id ?? null;
    this.formError = '';
    this.fotoNombre = m.foto ? 'imagen-cargada' : '';
    this.fotoPreview = m.foto || '';
    this.cargarEstados(() => {
      this.form.patchValue({
        ...m,
        nombre: this.getDisplayName(m),
        estadoId: m.estadoId ?? this.estados[0]?.id ?? null,
      });
      this.showModal = true;
    });
  }

  cerrarModal(): void { this.showModal = false; this.formError = ''; }

  guardar(): void {
    if (!this.estados.length) {
      this.formError = 'No hay estados disponibles. Reinicie ms-estado (8084) y recargue la página.';
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const { nombre, ...rest } = this.form.value;
    const payload: Melamine = {
      ancho: Number(rest.ancho),
      largo: Number(rest.largo),
      color: rest.color,
      marca: rest.marca,
      estadoId: Number(rest.estadoId),
      foto: rest.foto || this.fotoPreview || '',
    };
    if (!payload.color && nombre) payload.color = String(nombre).replace(/^Melamine\s/i, '');
    const obs = this.isEditMode && this.itemId
      ? this.svc.actualizar(this.itemId, payload)
      : this.svc.crear(payload);
    obs.subscribe({
      next: (res) => {
        const id = res.id ?? this.itemId;
        if (id && payload.foto) cacheEntityImage('melamine', id, payload.foto);
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-melamine (8086) y ms-estado (8084). Debe existir al menos un estado (Bueno/Regular/Malo) en la base de datos.');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar este melamine?')) return;
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
}
