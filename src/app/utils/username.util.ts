export function generateUsername(nombre: string, apellido: string): string {
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const n = normalize(nombre);
  const a = normalize(apellido);

  if (!n && !a) return '';
  if (!a) return n;
  if (!n) return a;
  return `${n}.${a}`;
}
