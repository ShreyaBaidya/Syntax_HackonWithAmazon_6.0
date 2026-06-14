'use client';
import { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';

export default function ImageUpload({ onUpload, isLoading }: { onUpload: (file: File) => void; isLoading: boolean }) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setPreview(URL.createObjectURL(file)); onUpload(file); } };
  return (
    <div className="w-full max-w-md mx-auto">
      <div onClick={() => fileInputRef.current?.click()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) { setPreview(URL.createObjectURL(f)); onUpload(f); } }} onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-500 hover:border-amazon-orange rounded-xl p-8 text-center cursor-pointer transition-colors bg-amazon-blue-light/30 hover:bg-amazon-blue-light/50">
        {preview ? <div><img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />{isLoading && <p className="text-amazon-orange text-sm animate-pulse mt-2">Analyzing...</p>}</div>
         : <div className="space-y-3"><div className="flex justify-center gap-3"><Camera className="h-8 w-8 text-gray-400" /><Upload className="h-8 w-8 text-gray-400" /><ImageIcon className="h-8 w-8 text-gray-400" /></div><p className="text-gray-300 font-medium">Upload a photo</p><p className="text-gray-500 text-sm">Fridge, food, recipe, or grocery shelf</p></div>}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
