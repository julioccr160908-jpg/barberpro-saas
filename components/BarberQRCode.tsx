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
            const size = 1024;
            canvas.width = size;
            canvas.height = size;
            
            if (ctx) {
                // Background & Quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, size, size);
                
                // Draw QR Code (Centered with Quiet Zone)
                const qrSize = 800;
                const qrPadding = (size - qrSize) / 2;
                ctx.drawImage(img, qrPadding, qrPadding - 40, qrSize, qrSize);
                
                // Draw Central Logo (Manual Drawing)
                const logoSize = 120;
                const logoPadding = (size - logoSize) / 2;
                const radius = 24;
                
                // Yellow Box
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = "rgba(0,0,0,0.2)";
                ctx.fillStyle = "#EAB308";
                
                // Rounded Rect Path
                ctx.beginPath();
                ctx.moveTo(logoPadding + radius, logoPadding - 40);
                ctx.lineTo(logoPadding + logoSize - radius, logoPadding - 40);
                ctx.quadraticCurveTo(logoPadding + logoSize, logoPadding - 40, logoPadding + logoSize, logoPadding - 40 + radius);
                ctx.lineTo(logoPadding + logoSize, logoPadding - 40 + logoSize - radius);
                ctx.quadraticCurveTo(logoPadding + logoSize, logoPadding - 40 + logoSize, logoPadding + logoSize - radius, logoPadding - 40 + logoSize);
                ctx.lineTo(logoPadding + radius, logoPadding - 40 + logoSize);
                ctx.quadraticCurveTo(logoPadding, logoPadding - 40 + logoSize, logoPadding, logoPadding - 40 + logoSize - radius);
                ctx.lineTo(logoPadding, logoPadding - 40 + radius);
                ctx.quadraticCurveTo(logoPadding, logoPadding - 40, logoPadding + radius, logoPadding - 40);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                
                // Scissors Icon (Real SVG Icon)
                const scissorsImg = new Image();
                const sSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='6' cy='6' r='3'/><circle cx='6' cy='18' r='3'/><line x1='20' y1='4' x2='8.12' y2='15.88'/><line x1='14.47' y1='14.48' x2='20' y2='20'/><line x1='8.12' y1='8.12' x2='12' y2='12'/></svg>`;
                
                scissorsImg.onload = () => {
                    ctx.save();
                    ctx.translate(size / 2, size / 2 - 40);
                    ctx.rotate(-Math.PI / 4); // -45 deg
                    ctx.drawImage(scissorsImg, -30, -30, 60, 60);
                    ctx.restore();
                    
                    // Typography Humanized (Luxury Studio Design)
                    const name = barberName.toUpperCase();
                    const prefix = "Sua próxima experiência, ";
                    const suffix = `com ${name}`;

                    ctx.save();
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";
                    ctx.fillStyle = "#333230"; // Warm gray
                    ctx.textBaseline = "top";
                    ctx.textAlign = "center";
                    
                    // 1. Dynamic Graphic Divider (Fine horizontal line or Diamond)
                    ctx.strokeStyle = "rgba(51, 50, 48, 0.2)";
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(size/2 - 300, size - 160);
                    ctx.lineTo(size/2 + 300, size - 160);
                    ctx.stroke();

                    // 2. Diamond Separator (◊)
                    ctx.font = "20px serif";
                    ctx.fillText("◊", size / 2, size - 173);

                    // 3. Rhythmic Copywriting (Calculated Drawing)
                    ctx.letterSpacing = "8px"; // Extreme spacing for exclusivity
                    
                    // Draw Prefix (Light & Italic)
                    ctx.font = "italic 300 24px 'Montserrat', 'Inter', sans-serif";
                    ctx.globalAlpha = 0.7;
                    ctx.fillText(prefix, size / 2, size - 120);
                    
                    // Draw Suffix (Bold & Strong)
                    ctx.font = "bold 28px 'Montserrat', 'Inter', sans-serif";
                    ctx.globalAlpha = 1.0;
                    ctx.fillText(suffix, size / 2, size - 85);
                    
                    ctx.restore();
                    
                    const pngFile = canvas.toDataURL("image/png");
                    const downloadLink = document.createElement("a");
                    downloadLink.download = `QR_Code_${slug}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                };
                scissorsImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sSvg);
            }
        };
        
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800 p-6 flex flex-col items-center text-center space-y-5 h-full relative">
            <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">Seu QR Code de Agendamento</h3>
                <p className="text-zinc-400 max-w-xs mx-auto text-sm leading-relaxed">
                    Escaneie para Agendar seu próximo corte em segundos!
                </p>
            </div>

            <div className="relative p-3 bg-white rounded-xl shadow-xl w-fit mx-auto flex-shrink-0 flex items-center justify-center">
                <QRCodeSVG 
                    ref={qrRef}
                    value={bookingUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                        src: "", // No src needed since we overlay manually or use excavate
                        height: 48,
                        width: 48,
                        excavate: true,
                    }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                        <Scissors size={20} className="text-black transform -rotate-45" />
                    </div>
                </div>
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
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2 text-left">Link Direto</p>
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
