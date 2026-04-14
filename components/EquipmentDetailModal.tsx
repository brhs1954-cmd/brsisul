
import React from 'react';
import { Equipment } from '../types';
import { X, Zap, Calendar, Building2, Settings, FileText, ExternalLink, Image as ImageIcon, Maximize2, MapPin, Phone, Truck } from 'lucide-react';

interface EquipmentDetailModalProps {
  equipment: Equipment;
  onClose: () => void;
}

const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ equipment, onClose }) => {
  const getImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.includes('drive.google.com')) {
      const match = url.match(/[-\w]{25,}/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  const openLink = (url: string) => {
    if (url && url.startsWith('http')) window.open(url, '_blank');
    else alert('등록된 링크가 없습니다.');
  };

  const imageUrl = getImageUrl(equipment.photoUrl);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-amber-600 px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2.5 rounded-xl shadow-lg border border-white/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">{equipment.name}</h2>
                <span className="px-2 py-0.5 bg-white/10 border border-white/30 text-white rounded text-[9px] font-black uppercase">
                  {equipment.id}
                </span>
              </div>
              <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest mt-0.5">Equipment Asset Detail</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-[#F8FAFC]">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-56 space-y-4">
              <div className="relative aspect-square bg-slate-100 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner group">
                {imageUrl ? (
                  <img src={imageUrl} alt={equipment.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">No Photo</span>
                  </div>
                )}
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">설비위치</p>
                <div className="flex items-center text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-rose-500" />
                  {equipment.location || '위치 미지정'}
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">관리 주체</p>
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <Building2 className="w-4 h-4 mr-2 text-blue-500" />
                    {equipment.orgName || '미지정'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">설치 일자</p>
                    <div className="flex items-center text-sm font-bold text-slate-800">
                      <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                      {equipment.installDate || '-'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">관리 주기</p>
                    <div className="flex items-center text-sm font-bold text-slate-800">
                      <Settings className="w-4 h-4 mr-2 text-emerald-500" />
                      {equipment.cycle || '-'}
                    </div>
                  </div>
                </div>

                {/* AS 정보 섹션 */}
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">유지보수(AS) 정보</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-bold text-slate-700">
                      <Truck className="w-4 h-4 mr-2 text-blue-500" />
                      {equipment.asCompany || 'AS 업체 미등록'}
                    </div>
                    {equipment.asTel && (
                      <a href={`tel:${equipment.asTel}`} className="flex items-center px-3 py-1 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all">
                        <Phone className="w-3 h-3 mr-1" /> 전화걸기
                      </a>
                    )}
                  </div>
                  {equipment.asTel && (
                    <div className="text-[11px] font-bold text-slate-500 flex items-center pl-6">
                      연락처: {equipment.asTel}
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">주요 제원</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {equipment.specs || '등록된 제원 정보가 없습니다.'}
                  </p>
                </div>

                {/* Added remarks section in details view for consistency */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">비고 (Remarks)</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {equipment.remarks || '등록된 비고 정보가 없습니다.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[12px] font-black hover:bg-slate-200 transition-all">
            닫기
          </button>
          <button 
            onClick={() => openLink(equipment.manualUrl)}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[12px] font-black shadow-xl hover:bg-amber-600 transition-all flex items-center"
          >
            <FileText className="w-4 h-4 mr-2" /> 관리 매뉴얼 열기
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailModal;
