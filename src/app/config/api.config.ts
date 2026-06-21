/**
 * Puertos según application.yml del backend (proyectodad-backend).
 * ms-proveedores suele levantar en 8092 cuando config-server ya ocupa 8088.
 */
export const API = {
  accesorios: 'http://localhost:8081/api/accesorios',
  categorias: 'http://localhost:8082/api/categorias',
  clientes: 'http://localhost:8083/api/clientes',
  estado: 'http://localhost:8084/api/estado',
  herramientas: 'http://localhost:8085/api/herramientas',
  melamine: 'http://localhost:8086/api/melamine',
  proveedores: 'http://localhost:8092/api/proveedores',
  proyectos: 'http://localhost:8089/api/proyectos',
  auth: 'http://localhost:8090/auth',
} as const;
