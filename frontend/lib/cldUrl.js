/**
 * Transforma uma URL do Cloudinary para servir imagem otimizada:
 * - f_auto: serve WebP para quem suporta, JPEG para quem não suporta
 * - q_auto: comprime com qualidade ótima automaticamente
 * - w_N: redimensiona para a largura especificada em pixels
 *
 * Reduz imagens de 2-5MB para 50-200KB, essencial para conexões móveis.
 */
export function cldUrl(src, width) {
  if (!src || !src.includes('res.cloudinary.com') || !src.includes('/upload/')) {
    return src;
  }
  const transform = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  // Remove transformações já existentes entre /upload/ e /v (versão)
  return src.replace(/\/upload\/((?:[^/]+\/)*?)(v\d)/, `/upload/${transform}/$2`);
}
