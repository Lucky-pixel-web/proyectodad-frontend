export interface DetalleProyecto {
  id?: number;
  herramientaId?: number | null;
  cantidadHerramienta?: number;
  accesorioId?: number | null;
  cantidadAccesorio?: number;
  melamineId?: number | null;
  cantidadMelamine?: number;
}

export interface Proyecto {
  id?: number;
  nombre?: string;
  direccion?: string;
  clienteId?: number;
  detalles?: DetalleProyecto[];
}