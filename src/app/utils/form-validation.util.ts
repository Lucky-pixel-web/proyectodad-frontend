import { FormGroup } from '@angular/forms';

const FIELD_LABELS: Record<string, string> = {
  nombre: 'Nombre',
  marca: 'Marca',
  stock: 'Cantidad',
  descripcion: 'Descripción',
  estado: 'Estado',
  estadoId: 'Estado',
  tipoId: 'Tipo',
  marcaId: 'Marca',
  compra: 'Fecha de compra',
  fechaInicio: 'Fecha de inicio',
  vidaUtil: 'Vida útil',
  precio: 'Precio',
  categoriaId: 'Categoría',
  clienteId: 'Cliente',
  herramientaId: 'Herramienta',
  accesorioId: 'Accesorio',
  nombres: 'Nombres',
  apellidos: 'Apellidos',
  telefono: 'Teléfono',
  direccion: 'Dirección',
  ubicacion: 'Ubicación',
  foto: 'Imagen',
  color: 'Color',
  colorId: 'Color',
  ancho: 'Ancho',
  largo: 'Largo',
  cantidad: 'Cantidad',
};

export function formValidationMessage(form: FormGroup): string {
  for (const key of Object.keys(form.controls)) {
    const ctrl = form.get(key);
    if (!ctrl?.invalid) continue;
    const label = FIELD_LABELS[key] || key;
    if (ctrl.errors?.['required']) return `Complete el campo «${label}».`;
    if (ctrl.errors?.['min']) {
      if (key === 'stock') return 'La cantidad debe ser al menos 1. No se permite 0.';
      return `El campo «${label}» no cumple el valor mínimo permitido.`;
    }
    if (ctrl.errors?.['maxlength']) {
      const max = ctrl.errors['maxlength'].requiredLength;
      return `El campo «${label}» no debe exceder ${max} caracteres.`;
    }
    if (ctrl.errors?.['minlength']) {
      const min = ctrl.errors['minlength'].requiredLength;
      return `El campo «${label}» debe tener al menos ${min} caracteres.`;
    }
    if (ctrl.errors?.['pattern']) return `El campo «${label}» tiene un formato inválido.`;
  }
  return 'Revise los campos marcados en rojo antes de guardar.';
}
