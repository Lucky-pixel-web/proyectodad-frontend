import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Header } from '../header/header';
import { MelamineService } from '../../services/melamine';
import { CatalogoService, CatalogoItem } from '../../services/catalogo'; // <- Único servicio de catálogos
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
  melamines: Melamine[] = [];
  filtrados: Melamine[] = [];
  marcas: CatalogoItem[] = [];
  estados: CatalogoItem[] = [];
  colores: CatalogoItem[] = [];
  busqueda = '';
  busquedaActiva = false;
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  melamineId: number | null = null;
  buscando = false;
  formError = '';
  fotoNombre = '';
  fotoPreview = '';
  private archivoSeleccionado?: File;

  private fb = inject(FormBuilder);
  private svc = inject(MelamineService);
  private catSvc = inject(CatalogoService); // <- Inyección limpia del catálogo centralizado

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      ancho: [100, [Validators.required, Validators.min(1), Validators.max(500)]],
      largo: [200, [Validators.required, Validators.min(1), Validators.max(500)]],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
      marcaId: [null as number | null, Validators.required],
      estadoId: [null as number | null, Validators.required],
      colorId: [null as number | null, Validators.required],
    });
    this.listar();
  }

  get totalMelamines() { return this.melamines.length; }
  get sinStock() { return this.melamines.filter((m) => (m.cantidad ?? 0) === 0).length; }
  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length && this.melamines.length > 0;
  }

  private cargarCatalogos(onLoaded?: () => void): void {
    // Solución al error TS2571: Ahora se llama a los métodos existentes en tu CatalogoService
    forkJoin({
      marcas: this.catSvc.listarMarcasMelamine(),
      estados: this.catSvc.listarEstadosMelamine(),
      colores: this.catSvc.listarColoresMelamine(),
    }).subscribe({
      next: ({ marcas, estados, colores }) => {
        this.marcas = marcas;
        this.estados = estados;
        this.colores = colores;
        onLoaded?.();
      },
      error: () => {
        this.marcas = [];
        this.estados = [];
        this.colores = [];
        onLoaded?.();
      },
    });
  }

  listar(): void {
    this.buscando = true;
    this.svc.listar().subscribe({
      next: (data) => {
        this.melamines = data;
        this.filtrar();
        this.buscando = false;
      },
      error: () => { this.buscando = false; },
    });
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim();
    const q = this.busqueda.toLowerCase();
    this.filtrados = this.melamines.filter(
      (m) => !q || 
        m.nombre?.toLowerCase().includes(q) || 
        m.marcaNombre?.toLowerCase().includes(q) || 
        m.colorNombre?.toLowerCase().includes(q)
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
    this.melamineId = null;
    this.formError = '';
    this.fotoNombre = '';
    this.fotoPreview = '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      this.form.reset({
        ancho: 100,
        largo: 200,
        cantidad: 1,
        marcaId: this.marcas[0]?.id ?? null,
        estadoId: this.estados[0]?.id ?? null,
        colorId: this.colores[0]?.id ?? null,
      });
      this.showModal = true;
    });
  }

  abrirModalEditar(m: Melamine): void {
    this.isEditMode = true;
    this.melamineId = m.id ?? null;
    this.formError = '';
    this.fotoPreview = m.foto || '';
    this.fotoNombre = m.foto ? 'imagen-cargada' : '';
    this.archivoSeleccionado = undefined;
    this.cargarCatalogos(() => {
      this.form.patchValue({
        nombre: m.nombre,
        ancho: m.ancho && m.ancho > 0 ? m.ancho : 100,
        largo: m.largo && m.largo > 0 ? m.largo : 200,
        cantidad: Math.max(1, m.cantidad ?? 1),
        marcaId: m.marcaId ?? this.marcas[0]?.id ?? null,
        estadoId: m.estadoId ?? this.estados[0]?.id ?? null,
        colorId: m.colorId ?? this.colores[0]?.id ?? null,
      });
      this.showModal = true;
    });
  }

  onCantidadInput(): void {
    const ctrl = this.form.get('cantidad');
    const val = Number(ctrl?.value);
    if (val === 0 || val < 1) {
      ctrl?.setValue(1);
    }
  }

  cerrarModal(): void { 
    this.showModal = false; 
    this.formError = ''; 
  }

  guardar(): void {
    if (!this.marcas.length || !this.estados.length || !this.colores.length) {
      this.formError = 'No se cargaron los catálogos. Verifique ms-melamine y recargue.';
      return;
    }
    if (this.form.get('cantidad')?.value === 0 || this.form.get('cantidad')?.value < 1) {
      this.form.get('cantidad')?.setValue(1);
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
      marcaId: Number(v.marcaId),
      estadoId: Number(v.estadoId),
      colorId: Number(v.colorId),
    };
    
    const obs = this.isEditMode && this.melamineId
      ? this.svc.actualizar(this.melamineId, payload, this.archivoSeleccionado)
      : this.svc.crear(payload, this.archivoSeleccionado);
      
    obs.subscribe({
      next: () => {
        this.cerrarModal();
        this.listar();
      },
      error: (err) => {
        this.formError = httpErrorMessage(err, 'No se pudo guardar. Verifique ms-melamine y que las dimensiones sean válidas.');
      },
    });
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Eliminar esta melamina?')) return;
    this.svc.eliminar(id).subscribe({ next: () => this.listar() });
  }
}