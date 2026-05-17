
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Printer, Share2 } from 'lucide-react';

interface QRCodeModalProps {
  title: string;
  id: string;
  type: 'building' | 'equipment';
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ title, id, type, onClose }) => {
  const qrUrl = `${window.location.origin}${window.location.pathname}#${type}?id=${id}`;

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    // SVG to Image
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${id}_${title}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 print:p-0">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md print:hidden" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="font-black text-slate-900 tracking-tight text-lg">QR 코드 상세</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner mb-6 print:bg-white print:border-0 print:shadow-none">
            <QRCodeSVG 
              id="qr-code-svg"
              value={qrUrl} 
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "https://drive.google.com/uc?export=view&id=1IhXDEQqanaawhtFsFlh8rvcB-KPo_WAS",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <div className="text-center mb-8">
            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black mb-2 uppercase tracking-widest">
              {type === 'building' ? 'Building Asset' : 'Equipment Asset'}
            </span>
            <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-1">{title}</h4>
            <p className="text-xs font-bold text-slate-400">ID: {id}</p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 w-full print:hidden">
            <button 
              onClick={downloadQR}
              className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-blue-600 transition-all shadow-lg active:scale-95"
            >
              <Download className="w-4 h-4" /> 이미지 저장
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" /> 인쇄하기
            </button>
          </div>
          
          <button 
            onClick={() => {
                navigator.clipboard.writeText(qrUrl);
                alert('링크가 클립보드에 복사되었습니다.');
            }}
            className="mt-4 flex items-center justify-center gap-2 py-3 w-full bg-slate-50 text-slate-500 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all print:hidden"
          >
            <Share2 className="w-4 h-4" /> 링크 복사하기
          </button>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center print:bg-white">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Boryeong Haksa Asset QR System</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
