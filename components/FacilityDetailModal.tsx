
import React, { useState } from 'react';
import { 
  Hotspot, FacilityStatus, FacilityDocument, ManagementLog 
} from '../types';
import { 
  X, Calendar, Clipboard, Trees, Hammer, Activity, User, 
  ChevronRight, FileText, FileImage, FileCode, Plus, 
  ExternalLink, FolderOpen, Info, MapPin, Ruler, Layers, 
  DollarSign, Landmark, Zap, Wind, ArrowUpRight, Image as ImageIcon,
  ShieldCheck,
  DownloadCloud
} from 'lucide-react';

interface FacilityDetailModalProps {
  facility: Hotspot;
  onClose: () => void;
  onUpdate: (facility: Hotspot) => void;
}

const DRIVE_URL = "https://drive.google.com/drive/folders/1zI3PIOGZ-PT04wOiNOi5A1Fupzh5_ZyP?usp=drive_link";

const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({ facility, onClose, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const info = facility.buildingInfo;

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-rose-500" />;
      case 'image': return <FileImage className="w-5 h-5 text-blue-500" />;
      case 'dwg': return <FileCode className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleAddFile = () => {
    const fileName = prompt('구글 드라이브에 업로드한 파일명을 입력하여 시스템에 등록하세요:');
    if (!fileName) return;
    setIsUploading(true);
    setTimeout(() => {
      const type = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 
                   (fileName.toLowerCase().endsWith('.dwg') ? 'dwg' : 'image');
      const newDoc: FacilityDocument = {
        id: `doc-${Date.now()}`,
        name: fileName,
        type: type as any,
        url: DRIVE_URL,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(Math.random() * 5 + 1).toFixed(1)}MB`
      };
      const updatedFacility = { ...facility, documents: [newDoc, ...facility.documents] };
      onUpdate(updatedFacility);
      setIsUploading(false);
    }, 1500);
  };

  const handleAddHistory = () => {
    const description = prompt('관리 기록 내용을 입력하세요:');
    if (!description) return;

    const worker = prompt('작업자 이름을 입력하세요:');
    if (!worker) return;

    const newLog: ManagementLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'maintenance',
      description,
      worker
    };

    const updatedFacility = {
      ...facility,
      history: [newLog, ...facility.history]
    };

    onUpdate(updatedFacility);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.includes('drive.google.com')) {
      const match = url.match(/[-\w]{25,}/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  const imageUrl = getImageUrl(info?.photoUrl);

  const openLink = (url?: string) => {
    if (url && url.startsWith('http')) window.open(url, '_blank');
    else alert('등록된 링크가 없습니다.');
  };

  const formatCurrency = (val?: string | number) => {
    if (val === undefined || val === null || val === '') return '정보 없음';
    const strVal = String(val);
    const numOnly = strVal.replace(/[^0-9]/g, '');
    if (!numOnly) return strVal;
    return Number(numOnly).toLocaleString() + ' 원';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">{facility.name}</h2>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${
                  facility.status === FacilityStatus.NORMAL ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {facility.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Facility Master Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onClose()}
              className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-[#F8FAFC]">
          
          {/* 상단 사진 및 기본 정보 섹션 */}
          <section className="flex flex-col md:flex-row gap-6 animate-in slide-in-from-top-4 duration-500">
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="relative aspect-[4/3] md:aspect-square bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-sm group">
                {imageUrl ? (
                  <img src={imageUrl} alt={facility.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">No Photo</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <Info className="w-4 h-4 mr-2 text-blue-500" /> 건축물 주요 제원 및 자산 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center text-blue-600 mb-1">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Location & Usage</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold mb-0.5">건축물 소재지</p>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{info?.address || '정보 없음'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold mb-0.5">주요 용도</p>
                        <p className="text-xs font-bold text-slate-800">{info?.usage || '정보 없음'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold mb-0.5">구조 형식</p>
                        <p className="text-xs font-bold text-slate-800">{info?.structure || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center text-emerald-600 mb-1">
                    <Ruler className="w-4 h-4 mr-2" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Scale & Safety</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold mb-0.5">연면적</p>
                        <p className="text-xs font-bold text-slate-800">{info?.area || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold mb-0.5">규모 (층수)</p>
                        <p className="text-xs font-bold text-slate-800">{info?.floors || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold mb-0.5">안전 등급</p>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black">{info?.safetyGrade || 'A'} 등급</span>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold mb-0.5">최종 점검일</p>
                        <p className="text-xs font-bold text-slate-800">{info?.lastSafetyCheck || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 자산 가치 별도 섹션 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center text-amber-600 mb-1">
                <DollarSign className="w-4 h-4 mr-2" />
                <span className="text-[10px] font-black uppercase tracking-tight">Valuation</span>
              </div>
              <div className="flex gap-8">
                <div className="flex-1">
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">평가액 (Valuation)</p>
                  <p className="text-sm font-black text-slate-800">{formatCurrency(info?.valuation)}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">장부가액 (Book Value)</p>
                  <p className="text-sm font-black text-amber-600">{formatCurrency(info?.bookValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center text-blue-600 mb-1">
                <Layers className="w-4 h-4 mr-2" />
                <span className="text-[10px] font-black uppercase tracking-tight">Building Specs</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">지붕구조</p>
                  <p className="text-xs font-bold text-slate-800">{info?.roofType || '-'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold mb-0.5">냉난방방식</p>
                  <p className="text-xs font-bold text-slate-800">{info?.heatingType || '-'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 도면 및 대장 (디지털 자산 버튼) */}
          <section className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2 text-emerald-500" /> 도면 및 대장 (디지털 자산)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={() => openLink(info?.floorPlanUrl)}
                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 transition-all group"
              >
                <div className="flex items-center">
                  <ImageIcon className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-[11px] font-black text-blue-900 uppercase">평면도 (U)</span>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => openLink(info?.registrationTranscriptUrl)}
                className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl hover:bg-emerald-100 transition-all group"
              >
                <div className="flex items-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mr-3" />
                  <span className="text-[11px] font-black text-emerald-900 uppercase">등기부등본 (W)</span>
                </div>
                <DownloadCloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                onClick={() => openLink(info?.buildingLedgerUrl)}
                className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all group"
              >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-slate-600 mr-3" />
                  <span className="text-[11px] font-black text-slate-900 uppercase">건축물대장 (V)</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            <section>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                <Clipboard className="w-4 h-4 mr-1.5 text-blue-500" /> 최근 관리 이력
              </h3>
              <div className="space-y-3">
                {facility.history.length > 0 ? (
                  facility.history.map((log, index) => (
                    <div key={`${log.id}-${index}`} className="flex space-x-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="bg-blue-50 text-blue-600 p-2.5 h-fit rounded-xl">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 leading-snug">{log.description}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-semibold">{log.date}</span>
                          <span className="flex items-center font-bold text-slate-400 uppercase tracking-tighter"><User className="w-3 h-3 mr-1" /> {log.worker}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">등록된 이력이 없습니다.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <FolderOpen className="w-4 h-4 mr-1.5 text-blue-500" /> 기타 드라이브 문서
                </h3>
                <button 
                  onClick={handleAddFile}
                  disabled={isUploading}
                  className="text-[10px] font-black text-blue-600 flex items-center bg-blue-50 px-2 py-1 rounded"
                >
                  <Plus className="w-3 h-3 mr-1" /> 문서 추가
                </button>
              </div>
              <div className="space-y-2">
                {facility.documents && facility.documents.length > 0 ? (
                  facility.documents.map((doc, index) => (
                    <div 
                      key={`${doc.id}-${index}`} 
                      onClick={() => openLink(doc.url)}
                      className="flex items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-400 transition-all cursor-pointer group"
                    >
                      <div className="p-2 bg-slate-50 rounded-lg mr-3">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[9px] text-slate-400">{doc.uploadDate}</p>
                      </div>
                      <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-all" />
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-400 font-medium">기타 등록된 문서가 없습니다.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-5 border-t border-slate-100 flex justify-end space-x-3 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-[12px] font-black text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
          >
            모달 닫기
          </button>
          <button 
            onClick={handleAddHistory}
            className="px-6 py-2.5 text-[12px] font-black bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center"
          >
            관리 기록 추가 <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailModal;
