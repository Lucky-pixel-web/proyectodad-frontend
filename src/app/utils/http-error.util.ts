import { HttpErrorResponse } from '@angular/common/http';

export function httpErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) {
    return `No hay conexión con el servidor. ${fallback}`;
  }
  const body = err.error;
  if (typeof body === 'string' && body.trim()) return body;
  if (body?.mensaje) return String(body.mensaje);
  if (body?.message) return String(body.message);
  if (body?.detalle) return `${body.error || 'Error'}: ${body.detalle}`;
  if (body && typeof body === 'object') {
    const values = Object.values(body).filter((v) => typeof v === 'string') as string[];
    if (values.length) return values.join('. ');
  }
  if (err.status === 405) {
    return 'El puerto configurado no acepta esta operación. Si config-server usa 8088, ms-proveedores debe estar en 8092.';
  }
  return fallback;
}
