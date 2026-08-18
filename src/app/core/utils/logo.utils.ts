export const LOGO_SRC = 'logo-faes.png';

export function loadLogoDataUrl(): Promise<string | null> {
  return fetch(LOGO_SRC)
    .then(response => {
      if (!response.ok) {
        throw new Error('Logo no encontrado');
      }
      return response.blob();
    })
    .then(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    }))
    .catch(() => null);
}
