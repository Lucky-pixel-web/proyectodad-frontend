import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { AccesorioService } from '../../services/accesorio';
import { Accesorio } from '../../models/accesorio';
import { cacheEntityImage, mergeEntityImages } from '../../utils/image-cache.util';
import { httpErrorMessage } from '../../utils/http-error.util';
import { formValidationMessage } from '../../utils/form-validation.util';

const ESTADOS_UI = ['Bueno', 'Regular', 'Malo'] as const;

@Component({
  selector: 'app-accesorio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './accesorio.html',
})
export class AccesorioComponent implements OnInit {
  accesorios: Accesorio[] = [];
  filtrados: Accesorio[] = [];
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

  private fb = inject(FormBuilder);
  private svc = inject(AccesorioService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      marca: ['', Validators.required],
      stock: [100, [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      categoria: ['Consumibles', Validators.required],
      precio: [1, [Validators.required, Validators.min(0.01)]],
      estado: ['Bueno', Validators.required],
      foto: [''],
    });
    this.listar();
  }

  get totalAccesorios() { return this.accesorios.length; }
  get sinStock() { return this.accesorios.filter((a) => (a.stock ?? 0) === 0).length; }
  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length && this.accesorios.length > 0;
  }

  listar(): void {
    this.buscando = true;
    this.svc.listar().subscribe({
      next: (data) => {
        this.accesorios = mergeEntityImages('accesorio', data);
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
      (a) => !q || a.nombre?.toLowerCase().includes(q) || a.marca?.toLowerCase().includes(q) || a.descripcion?.toLowerCase().includes(q)
    );
  }

  async onFotoSelected(event: Event): Promise<void> {
    const { pickImageFromInput } = await import('../../utils/file-maps.util');
    const picked = await pickImageFromInput(event);
    if (!picked) return;
    this.fotoNombre = picked.name;
    this.fotoPreview = picked.dataUrl;
    this.form.patchValue({ foto: picked.dataUrl });
  }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.accesorioId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.form.reset({ stock: 100, precio: 1, estado: 'Bueno', categoria: 'Consumibles' });
    this.showModal = true;
  }

  abrirModalEditar(a: Accesorio): void {
    this.isEditMode = true;
    this.accesorioId = a.id ?? null;
    this.formError = '';
    this.fotoPreview = a.foto || '';
    this.fotoNombre = a.foto ? 'imagen-cargada' : '';
    this.form.patchValue({
      ...a,
      stock: Math.max(1, a.stock ?? 1),
      precio: a.precio && a.precio > 0 ? a.precio : 1,
      estado: this.estadoUi(a.estado),
    });
    this.showModal = true;
  }

  private estadoUi(estado?: string): string {
    const e = (estado || '').trim();
    if (ESTADOS_UI.includes(e as typeof ESTADOS_UI[number])) return e;
    return 'Bueno';
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
    if (this.form.get('stock')?.value === 0 || this.form.get('stock')?.value < 1) {
      this.form.get('stock')?.setValue(1);
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = formValidationMessage(this.form);
      return;
    }
    this.formError = '';
    const { foto, estado, ...apiPayload } = this.form.value;
    const payload: Accesorio = { ...apiPayload, precio: Number(apiPayload.precio) || 1 };
    const fotoData = foto as string;
    const obs = this.isEditMode && this.accesorioId
      ? this.svc.actualizar(this.accesorioId, payload)
      : this.svc.crear(payload);
    obs.subscribe({
      next: (res) => {
        const id = res.id ?? this.accesorioId;
        if (id && fotoData) cacheEntityImage('accesorio', id, fotoData);
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-accesorios (8081) y que precio > 0, stock ≥ 1 y marca sin números.');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar este accesorio?')) return;
    this.svc.eliminar(id).subscribe({ next: () => this.listar() });
  }
}
