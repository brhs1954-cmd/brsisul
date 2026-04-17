
import React, { useState, useMemo } from 'react';
import { Hotspot } from '../types';
import { 
  Building2, 
  ShieldCheck, 
  Ruler, 
  Layers, 
  Clock, 
  ArrowRight,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Hash,
  Search,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  MapPin,
  Eye
} from 'lucide-react';
import BuildingEditModal from './BuildingEditModal';

interface BuildingManagerProps {
  facilities: Hotspot[];
  onRefresh: () => Promise<void>;
  adminRole: string | null; 
  onViewDetail?: (facility: Hotspot) => void;
}

const BuildingManager: React.FC<BuildingManagerProps> = ({ facilities, onRefresh, adminRole, onViewDetail }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Hotspot | null>(null);
  const [initialEditSection, setInitialEditSection] = useState<'basic' | 'detail'>('basic');
  const [searchQuery, setSearchQuery] = useState('');

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onRefresh();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleOpenEdit = (facility: Hotspot, section: 'basic' | 'detail') => {
    setInitialEditSection(section);
    setEditingBuilding(facility);
  };

  const filteredBuildings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return facilities;

    return facilities.filter(f => 
      f.name.toLowerCase().includes(query) || 
      f.id.toLowerCase().includes(query) ||
      (f.buildingInfo?.structure && f.buildingInfo.structure.toLowerCase().includes(query)) ||
      (f.buildingInfo?.address && f.buildingInfo.address.toLowerCase().includes(query))
    );
  }, [facilities, searchQuery]);

  const getGradeUI = (grade: string) => {
    switch (grade) {
      case 'A': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      case 'B': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
      case 'C': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
      case 'D': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
      case 'E': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
      default: return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' };
    }
  };

  const canEdit = (facilityName: string) => {
    if (adminRole === 'ALL') return true;
    if (adminRole === facilityName) return true;
    return false;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* 검색 및 컨트롤 섹션 */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="기관명, ID, 주소 또는 구조 형식으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleManualSync} disabled={isSyncing} className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl text-xs font-black transition-all hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            동기화
          </button>
          <div className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 text-[10px] font-black uppercase tracking-tighter">
            Total: {filteredBuildings.length} Units
          </div>
        </div>
      </div>

      {/* 테이블 레이아웃 */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">기관 및 건축물 현황</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">안전등급</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">구조 및 용도</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">규모 / 연면적</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">최종 점검</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBuildings.length > 0 ? (
                filteredBuildings.map((facility, index) => {
                  const grade = getGradeUI(facility.buildingInfo?.safetyGrade || 'A');
                  return (
                    <tr key={`${facility.id}-${index}`} className="hover:bg-blue-50/30 transition-colors group">
                      {/* ID */}
                      <td className="px-6 py-5 text-center">
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-black">
                          {facility.id}
                        </span>
                      </td>
                      
                      {/* Name & Date */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{facility.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center mt-0.5">
                            <Clock className="w-2.5 h-2.5 mr-1" /> {facility.buildingInfo?.completionDate || '준공일 미상'}
                          </span>
                        </div>
                      </td>

                      {/* Safety Grade */}
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black border ${grade.bg} ${grade.color} ${grade.border} shadow-sm`}>
                          {facility.buildingInfo?.safetyGrade || 'A'}
                        </span>
                      </td>

                      {/* Structure & Usage */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-600 truncate max-w-[150px]">{facility.buildingInfo?.structure}</span>
                          <span className="text-[10px] font-medium text-slate-400 mt-0.5">{facility.buildingInfo?.usage || '정보 없음'}</span>
                        </div>
                      </td>

                      {/* Scale & Area */}
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-4">
                           <div className="flex items-center text-[11px] font-bold text-slate-600">
                             <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                             {facility.buildingInfo?.floors}
                           </div>
                           <div className="flex items-center text-[11px] font-bold text-slate-600">
                             <Ruler className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                             {facility.buildingInfo?.area}
                           </div>
                        </div>
                      </td>

                      {/* Last Check */}
                      <td className="px-6 py-5">
                        <div className="flex items-center text-[11px] font-black text-emerald-600">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                          {facility.buildingInfo?.lastSafetyCheck}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => onViewDetail?.(facility)}
                            className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm font-black text-[10px]"
                            title="시설 상세 정보 보기"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" /> 상세보기
                          </button>
                          {canEdit(facility.name) && (
                            <button 
                              onClick={() => handleOpenEdit(facility, 'basic')}
                              className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-amber-600 transition-all shadow-lg"
                            >
                              수정 <Edit3 className="w-3 h-3 ml-1.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="w-12 h-12 text-slate-100 mb-4" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">일치하는 건축물 데이터가 없습니다</p>
                      <button onClick={() => setSearchQuery('')} className="mt-4 text-[10px] font-black text-blue-600 hover:underline underline-offset-4">필터 초기화</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Info */}
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Real-time Google Sheets Sync Enabled
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-[10px] font-black text-slate-500">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span> A등급: 최상
                </span>
                <span className="flex items-center text-[10px] font-black text-slate-500">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> B등급: 양호
                </span>
                <span className="flex items-center text-[10px] font-black text-slate-500">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span> C등급: 보통
                </span>
              </div>
           </div>
        </div>
      </div>

      {editingBuilding && (
        <BuildingEditModal 
          facility={editingBuilding} 
          initialSection={initialEditSection}
          onClose={() => setEditingBuilding(null)} 
          onSave={async () => {
            await onRefresh();
            setEditingBuilding(null);
          }} 
        />
      )}
    </div>
  );
};

export default BuildingManager;
