export function parseAuthError(err: unknown, fallback = 'Ocurrió un error. Intente nuevamente.'): string {
  if (!err || typeof err !== 'object') {
    return fallback;
  }

  const httpErr = err as {
    status?: number;
    statusText?: string;
    message?: string;
    error?: string | { mensaje?: string; message?: string; error?: string };
  };

  if (httpErr.status === 0 || httpErr.statusText === 'Unknown Error') {
    return 'Por favor conecte el backend (auth-service en puerto 8090) para realizar el login y gestión de usuarios.';
  }

  const body = httpErr.error;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    if (body.mensaje) return body.mensaje;
    if (body.message) return body.message;
    if (body.error) return body.error;
  }

  if (httpErr.message?.includes('Http failure response')) {
    return 'Por favor conecte el backend (auth-service en puerto 8090) para realizar el login y gestión de usuarios.';
  }

  return fallback;
}
