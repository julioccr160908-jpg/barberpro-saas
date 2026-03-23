import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Copy, Check, Scissors } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { toast } from 'sonner';

interface BarberQRCodeProps {
    slug: string;
    barberId: string;
    barberName: string;
    primaryColor?: string;
}

export const BarberQRCode: React.FC<BarberQRCodeProps> = ({ slug, barberId, barberName, primaryColor = '#EAB308' }) => {
    const formattedName = barberName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
    const bookingUrl = `${window.location.origin}/${slug}?prof=${formattedName}`;
    const qrRef = useRef<SVGSVGElement>(null);
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(bookingUrl);
        setCopied(true);
        toast.success('Link de agendamento copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadQR = () => {
        if (!qrRef.current) return;
        
        const svg = qrRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        img.onload = () => {
            canvas.width = 1024;
            canvas.height = 1024;
            if (ctx) {
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 50, 50, 924, 924);
                
                // Add text at bottom
                ctx.fillStyle = "black";
                ctx.font = "bold 40px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(`Agende com ${barberName}`, 512, 980);
                
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `QR_Code_${barberName.replace(/\s+/g, '_')}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };
        
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800 p-6 flex flex-col items-center text-center space-y-5 h-full relative">
            <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">Seu QR Code de Agendamento</h3>
                <p className="text-zinc-400 max-w-xs mx-auto text-sm leading-relaxed">
                    Imprima este código e coloque no seu espelho. Seus clientes poderão agendar o próximo corte em segundos!
                </p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG 
                    ref={qrRef}
                    value={bookingUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                        src: "/favicon.ico",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                    }}
                />
            </div>

            <div className="flex flex-row gap-2 w-full max-w-sm">
                <Button 
                    onClick={handleCopy}
                    variant="outline" 
                    className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2 h-10 text-xs px-2"
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    {copied ? 'Copiado' : 'Cópia'}
                </Button>
                
                <Button 
                    onClick={downloadQR}
                    className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600 font-bold gap-2 h-10 text-xs px-2"
                >
                    <Download size={14} />
                    Baixar
                </Button>
            </div>

            <div className="pt-4 border-t border-zinc-800 w-full mt-auto">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 text-left">Link Direto</p>
                <div className="flex items-center gap-2 bg-black/40 border border-zinc-800 rounded-lg p-2.5 overflow-hidden">
                    <Share2 size={14} className="text-zinc-500 flex-shrink-0" />
                    <input 
                        type="text" 
                        readOnly 
                        value={bookingUrl} 
                        className="bg-transparent text-xs text-zinc-400 w-full outline-none select-all truncate"
                    />
                </div>
            </div>
        </Card>
    );
};
