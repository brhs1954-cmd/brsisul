
import React, { useState, useMemo } from 'react';
import { Equipment } from '../types';
import { 
  Zap, 
  Settings, 
  Search, 
  RefreshCw, 
  Filter, 
  XCircle, 
  LayoutList, 
  ExternalLink, 
  Calendar, 
  FileText, 
  Building2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Maximize2,
  X
} from 'lucide-react';
import EquipmentEditModal from './EquipmentEditModal';

interface EquipmentManagerProps {
  equipment: Equipment[];
  onRefresh: () => Promise<void>;
}

const EquipmentManager: React.FC<EquipmentManagerProps> = ({ equipment, onRefresh }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 구글 드라이브 링크를 직접 표시 가능한 URL로 변환
  const getImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url; // Base64 데이터는 그대로 유지
    if (url.includes('drive.google.com')) {
      const match = url.match(/[-\w]{25,}/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  const filteredEquipment = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return equipment;
    return equipment.filter(eq => {
      const name = (eq.name || '').toLowerCase().trim();
      const id = (eq.id || '').toLowerCase().trim();
      const org = (eq.orgName || '').toLowerCase().trim();
      return name === term || id === term || org === term || name.includes(term);
    });
  }, [equipment, searchQuery]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onRefresh();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const openManual = (url: string) => {
    if (url && url.startsWith('http')) window.open(url, '_blank');
    else alert('등록된 매뉴얼 링크가 없습니다.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Upper Panel */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="bg-amber-500 p-4 rounded-2xl shadow-xl shadow-amber-100">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">지능형 설비(구축물) 자산 관리</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              고유 ID 기반으로 정밀 관리되는 보령학사 설비 마스터 리스트입니다.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleManualSync} disabled={isSyncing} className="px-5 py-3 bg-white text-blue-600 rounded-2xl font-black text-xs border border-blue-100 hover:bg-blue-50 transition-all flex items-center shadow-sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> 
            시트 동기화
          </button>
          <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-center shadow-lg shadow-slate-200 border border-white/10">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">Active Assets</p>
             <p className="text-lg font-black">{equipment.length} 개</p>
          </div>
        </div>
      </div>

      {/* Search Engine UI */}
      <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4 sticky top-0 z-10">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
          <input 
            type="text" 
            placeholder="설비명, 고유 ID, 관리주체 검색..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-all">
              <XCircle className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">고유 ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">설비 기본 정보</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">관리주체</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">설치 및 주기</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">주요 제원</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">기능</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((eq, index) => {
                  const displayImageUrl = getImageUrl(eq.photoUrl);
                  return (
                    <tr key={`${eq.id}-${index}`} className="hover:bg-amber-50/20 transition-all group animate-in fade-in slide-in-from-left-2 duration-300">
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black tracking-tighter group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                          {eq.id}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                          <button 
                            onClick={() => displayImageUrl && setPreviewImageUrl(displayImageUrl)}
                            className="w-14 h-14 bg-slate-100 rounded-2xl mr-4 overflow-hidden flex items-center justify-center border border-slate-200 group-hover:border-amber-400 group-hover:shadow-lg transition-all shadow-inner relative cursor-zoom-in"
                            title="사진 크게 보기"
                          >
                            {displayImageUrl ? (
                              <img 
                                src={displayImageUrl} 
                                alt={eq.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`fallback-icon ${displayImageUrl ? 'hidden' : ''}`}>
                               <Settings className="w-6 h-6 text-slate-300" />
                            </div>
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Maximize2 className="w-5 h-5 text-white" />
                            </div>
                          </button>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-amber-700 transition-colors">{eq.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Asset Registry Active</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                          <Building2 className="w-3.5 h-3.5 mr-2" />
                          {eq.orgName || '미지정'}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center text-[11px] font-bold text-slate-600">
                            <Calendar className="w-3.5 h-3.5 mr-2 text-slate-300" />
                            {eq.installDate || '-'}
                          </div>
                          <div className="flex items-center text-[11px] font-bold text-amber-600">
                            <RefreshCw className="w-3.5 h-3.5 mr-2 text-amber-400" />
                            주기: {eq.cycle || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 max-w-[200px] leading-relaxed">
                          {eq.specs || '제원 정보 없음'}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => setEditingEq(eq)}
                            className="p-2.5 bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600 rounded-xl transition-all shadow-sm"
                            title="수정 및 사진 업로드"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openManual(eq.manualUrl)}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-amber-600 transition-all shadow-md active:scale-95 flex items-center"
                          >
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            매뉴얼
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-40 text-center text-slate-400">
                    일치하는 설비가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Lightbox (확대 팝업) */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"></div>
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-amber-400 transition-colors flex items-center gap-2 font-black text-sm"
              onClick={() => setPreviewImageUrl(null)}
            >
              <X className="w-6 h-6" /> 닫기
            </button>
            <img 
              src={previewImageUrl} 
              alt="설비 확대 사진" 
              className="w-full h-full object-contain rounded-3xl shadow-2xl animate-in zoom-in duration-300 border-4 border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-6 text-white/50 text-xs font-bold uppercase tracking-[0.2em]">
              Boryeong Haksa Asset Master View
            </div>
          </div>
        </div>
      )}

      {editingEq && (
        <EquipmentEditModal 
          equipment={editingEq} 
          onClose={() => setEditingEq(null)} 
          onSave={async () => {
            await onRefresh();
            setEditingEq(null);
          }} 
        />
      )}
    </div>
  );
};

export default EquipmentManager;
