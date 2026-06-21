import { Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Header } from '../header/header';

import { HerramientaService } from '../../services/herramienta';

import { Herramienta } from '../../models/herramienta';

import { cacheEntityImage, mergeEntityImages } from '../../utils/image-cache.util';
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

  busqueda = '';

  busquedaActiva = false;

  form!: FormGroup;

  showModal = false;

  isEditMode = false;

  herramientaId: number | null = null;

  buscando = false;

  formError = '';

  fotoNombre = '';

  fotoPreview = '';



  private fb = inject(FormBuilder);

  private svc = inject(HerramientaService);



  ngOnInit(): void {

    this.form = this.fb.group({

      nombre: ['', Validators.required],

      tipo: ['Eléctrica', Validators.required],

      marca: ['', Validators.required],

      estado: ['Excelente', Validators.required],

      compra: ['', Validators.required],

      inicio: [''],

      vidaUtil: ['24', Validators.required],

      foto: [''],

    });

    this.listar();

  }



  get sinResultadosBusqueda(): boolean {

    return this.busquedaActiva && !this.filtradas.length && this.herramientas.length > 0;

  }



  listar(): void {

    this.buscando = true;

    this.svc.listar().subscribe({

      next: (data) => {

        this.herramientas = mergeEntityImages('herramienta', data);

        this.filtrar();

        this.buscando = false;

      },

      error: () => { this.buscando = false; },

    });

  }



  filtrar(): void {

    this.busquedaActiva = !!this.busqueda.trim();

    const q = this.busqueda.toLowerCase();

    this.filtradas = this.herramientas.filter(

      (h) => !q || h.nombre?.toLowerCase().includes(q) || h.marca?.toLowerCase().includes(q)

    );

  }



  getEstadoClass(estado?: string): string {

    const e = (estado || '').toLowerCase();

    if (e.includes('excelente') || e.includes('disponible') || e.includes('bueno')) return 'success';

    if (e.includes('reparar') || e.includes('mantenimiento')) return 'warning';

    return 'info';

  }



  getVidaInfo(h: Herramienta): { text: string; ok: boolean } {

    if (!h.compra || !h.vidaUtil) return { text: 'Sin datos de vida útil', ok: true };

    const mesesRaw = parseInt(String(h.vidaUtil).replace(/[^\d]/g, ''), 10);

    const meses = Number.isFinite(mesesRaw) && mesesRaw > 0 ? Math.min(mesesRaw, 600) : 24;

    const inicio = new Date(h.compra);

    if (isNaN(inicio.getTime())) return { text: 'Fecha de compra inválida', ok: false };

    const fin = new Date(inicio.getTime());

    fin.setMonth(fin.getMonth() + meses);

    if (isNaN(fin.getTime())) return { text: 'Vida útil fuera de rango (máx. 600 meses)', ok: false };

    const diff = Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (!Number.isFinite(diff)) return { text: 'No se pudo calcular vida útil', ok: true };

    if (diff >= 0) return { text: `${diff} días restantes de vida útil`, ok: true };

    return { text: `Expiró hace ${Math.abs(diff)} días`, ok: false };

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

    this.herramientaId = null;

    this.formError = '';

    this.fotoNombre = '';

    this.fotoPreview = '';

    this.form.reset({ tipo: 'Eléctrica', estado: 'Excelente', vidaUtil: '24' });

    this.showModal = true;

  }



  abrirModalEditar(h: Herramienta): void {

    this.isEditMode = true;

    this.herramientaId = h.id ?? null;

    this.formError = '';

    const compra = h.compra ? String(h.compra).split('T')[0] : '';

    const foto = h.foto || '';

    this.fotoNombre = foto ? 'imagen-cargada' : '';

    this.fotoPreview = foto;

    this.form.patchValue({ ...h, compra, inicio: compra, foto, estado: h.estado || 'Bueno' });

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

    const { inicio, ...data } = this.form.value;

    const payload: Herramienta = { ...data, vidaUtil: String(data.vidaUtil) };

    const obs = this.isEditMode && this.herramientaId

      ? this.svc.actualizar(this.herramientaId, payload)

      : this.svc.crear(payload);

    obs.subscribe({

      next: (res) => {

        const id = res.id ?? this.herramientaId;

        if (id && payload.foto) cacheEntityImage('herramienta', id, payload.foto);

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


