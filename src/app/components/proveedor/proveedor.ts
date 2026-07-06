import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { MapsPlanet } from '../maps-planet/maps-planet';
import { ProveedorService } from '../../services/proveedor';
import { CatalogoService, CatalogoItem } from '../../services/catalogo';
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
  categorias: CatalogoItem[] = [];
  form!: FormGroup;
  showModal = false;
  isEditMode = false;
  proveedorId: number | null = null;
  fotoFile: File | null = null;
  fotoPreview = '';
  fotoNombre = '';
  formError = '';
  busqueda = '';

  private fb = inject(FormBuilder);
  private svc = inject(ProveedorService);
  private catSvc = inject(CatalogoService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      categoriaId: [null, Validators.required],
      direccion: ['', Validators.required],
      ubicacion: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
    this.catSvc.listarCategorias().subscribe(c => this.categorias = c);
    this.listar();
  }

  listar(): void {
    this.svc.listar().subscribe(data => this.proveedores = data);
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase();
    if (!q) { this.listar(); return; }
    this.proveedores = this.proveedores.filter(p => 
      p.nombres?.toLowerCase().includes(q) || 
      p.descripcion?.toLowerCase().includes(q)
    );
  }

  onFotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.fotoFile = file;
      this.fotoNombre = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => this.fotoPreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.form.reset();
    this.fotoPreview = '';
    this.fotoNombre = '';
    this.fotoFile = null;
    this.showModal = true;
  }

  abrirModalEditar(p: Proveedor): void {
    this.isEditMode = true;
    this.proveedorId = p.id ?? null;
    this.form.patchValue(p);
    this.fotoFile = null;
    this.fotoPreview = p.foto || '';
    this.fotoNombre = p.foto ? 'Imagen actual' : '';
    this.showModal = true;
  }

  guardar(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.formError = formValidationMessage(this.form);
    return;
  }

  const formData = new FormData();
  const v = this.form.value;
  
  const request = {
    nombres: v.nombres,
    apellidos: v.apellidos,
    telefono: v.telefono,
    categoriaId: Number(v.categoriaId),
    direccion: v.direccion,
    ubicacion: v.ubicacion,
    descripcion: v.descripcion
  };

  // CAMBIO CRÍTICO: Debe ser 'proveedor' para coincidir con @RequestPart("proveedor") en Java
  formData.append('proveedor', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  
  // Mantenemos 'imagen' porque coincide con el @RequestPart("imagen") de Java
  if (this.fotoFile) formData.append('imagen', this.fotoFile);

  const obs = this.isEditMode && this.proveedorId
    ? this.svc.actualizar(this.proveedorId, formData)
    : this.svc.crear(formData);

  obs.subscribe({
    next: () => { this.showModal = false; this.listar(); },
    error: (err) => this.formError = httpErrorMessage(err, 'Error al guardar.')
  });
}

  eliminar(id: number): void {
    if (confirm('¿Eliminar este proveedor?')) {
      this.svc.eliminar(id).subscribe(() => this.listar());
    }
  }

  cerrarModal(): void { this.showModal = false; }
  getNombreCompleto(p: any): string { return `${p.nombres} ${p.apellidos}`; }
  getCatClass(n?: string): string { return n?.includes('Melamine') ? 'purple' : 'info'; }
}