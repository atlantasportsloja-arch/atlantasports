'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Upload, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ImageUpload({ images = [], onChange, maxImages = 6 }) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const slots = maxImages - images.length;
    if (slots <= 0) { toast.error(`Máximo de ${maxImages} imagens`); return; }

    const toUpload = files.slice(0, slots);
    setUploading(true);

    try {
      const formData = new FormData();
      toUpload.forEach(f => formData.append('images', f));

      const { data } = await api.post('/upload/produto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onChange([...images, ...data.urls]);
      toast.success(`${data.urls.length} imagem(ns) enviada(s)`);
    } catch {
      toast.error('Erro ao enviar imagens');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function removeImage(url, index) {
    try {
      await api.delete('/upload/produto', { data: { url } });
    } catch {}
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Imagens ({images.length}/{maxImages})
      </p>

      <div className="grid grid-cols-3 gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <Image src={url} alt={`Imagem ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url, i)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                Principal
              </span>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <label className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 hover:bg-primary-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            {uploading ? (
              <div className="text-center text-sm text-gray-400">
                <Upload size={20} className="mx-auto mb-1 animate-bounce" />
                Enviando...
              </div>
            ) : (
              <div className="text-center text-sm text-gray-400">
                <ImagePlus size={20} className="mx-auto mb-1" />
                Adicionar
              </div>
            )}
          </label>
        )}

        {Array.from({ length: Math.max(0, maxImages - images.length - 1) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-lg border-2 border-dashed border-gray-100 bg-gray-50" />
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Arraste ou clique para enviar. Máx. 5MB por imagem. A 1ª imagem é a foto principal.
      </p>
    </div>
  );
}
