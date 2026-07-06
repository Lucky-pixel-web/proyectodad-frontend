// proyecto.model.ts
export interface DetalleProyecto {
  herramientaId?: number;
  accesorioId?: number;
  melamineId?: number;
}

export interface Proyecto {
  id?: number;
  nombre?: string;
  direccion?: string;
  clienteId?: number;
  detalles?: DetalleProyecto[];
}