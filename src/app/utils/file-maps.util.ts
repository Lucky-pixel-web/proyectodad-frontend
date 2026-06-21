export function openGoogleMaps(query: string): void {
  if (!query?.trim()) return;
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`,
    '_blank',
    'noopener'
  );
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function pickImageFromInput(event: Event): Promise<{ dataUrl: string; name: string } | null> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return null;
  const dataUrl = await readImageAsDataUrl(file);
  input.value = '';
  return { dataUrl, name: file.name };
}
