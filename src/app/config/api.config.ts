const GATEWAY = 'http://localhost:8080';

export const API = {
  // Rutas con predicate en api-gateway (application.yml) -> pasan por el gateway.
  accesorios: `${GATEWAY}/api/accesorios`,
  clientes: `${GATEWAY}/api/clientes`,
  herramientas: `${GATEWAY}/api/herramientas`,
  melamine: `${GATEWAY}/api/melamine`,
  proveedores: `${GATEWAY}/api/proveedores`,
  proyectos: `${GATEWAY}/api/proyectos`,
  auth: `${GATEWAY}/auth`,

  // Sin ruta definida en el gateway todavía -> se llama directo al microservicio.
  categorias: 'http://localhost:8082/api/categorias',
  estado: 'http://localhost:8084/api/estado',
} as const;