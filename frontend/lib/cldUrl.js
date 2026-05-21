/**
 * Transforma URL do Cloudinary para servir imagem otimizada.
 * f_auto = WebP para quem suporta, JPEG para quem não suporta
 * q_auto = compressão automática (2-5MB → 50-200KB)
 * w_N   = redimensiona para largura real exibida
 */
export function cldUrl(src, width) {
  try {
    if (!src || typeof src !== 'string') return src;
    if (!src.includes('res.cloudinary.com') || !src.includes('/upload/')) return src;

    const transform = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
    const uploadIdx = src.indexOf('/upload/');
    const base = src.substring(0, uploadIdx);
    const rest = src.substring(uploadIdx + 8); // tudo após '/upload/'

    // Identifica onde começam o folder/arquivo (após transformações existentes)
    // URL com versão:  v1234/folder/file.jpg
    // URL com transform: f_auto/v1234/folder/file.jpg → pega a partir do v
    const vMatch = rest.match(/^(?:[^/]+\/)*(v\d+\/.+)$/);
    const cleanRest = vMatch ? vMatch[1] : rest;

    return `${base}/upload/${transform}/${cleanRest}`;
  } catch {
    return src;
  }
}
