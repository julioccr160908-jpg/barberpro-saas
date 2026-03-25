import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Card } from './Card';
import { Button } from './Button';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import getCroppedImg from '../../utils/cropImage';

interface ImageCropperModalProps {
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleCropComplete = useCallback((croppedArea: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        
        try {
            setIsGenerating(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImageBlob) {
                onCropComplete(croppedImageBlob);
            }
        } catch (e) {
            console.error("Erro ao gerar imagem recortada", e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <Card className="w-full max-w-lg bg-zinc-900 border-zinc-800 p-0 overflow-hidden flex flex-col shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">Ajustar Imagem</h2>
                    <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors" disabled={isGenerating}>
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative w-full h-80 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={handleCropComplete}
                        onZoomChange={setZoom}
                        cropShape="rect"
                        showGrid={true}
                        style={{
                            containerStyle: { background: '#000' }
                        }}
                    />
                </div>

                {/* Controls Area */}
                <div className="p-6 space-y-6 bg-zinc-900">
                    <div className="flex items-center gap-4">
                        <ZoomOut size={18} className="text-zinc-500 shrink-0" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-label="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                        />
                        <ZoomIn size={18} className="text-zinc-500 shrink-0" />
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={onCancel} disabled={isGenerating} className="flex-1 border-zinc-700 text-zinc-300">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isGenerating} className="flex-1 shadow-lg shadow-amber-400/10">
                            {isGenerating ? 'Processando...' : (
                                <>
                                    <Check size={18} className="mr-2" />
                                    Confirmar Corte
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
