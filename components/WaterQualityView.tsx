
import React, { useState, useMemo } from 'react';
import { Hotspot, Equipment } from '../types';
import { 
  Droplets, 
  Thermometer, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  Clock,
  RefreshCcw,
  CheckCircle2,
  ClipboardList,
  Maximize2,
  X,
  Zap,
  Building2,
  Calendar
} from 'lucide-react';
import HistoryTable from './HistoryTable';

interface WaterQualityViewProps {
  facilities: Hotspot[];
  equipment: Equipment[];
}

const WaterQualityView: React.FC<WaterQualityViewProps> = ({ facilities, equipment }) => {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 설비 중 '저수조'가 포함된 항목만 필터링
  const waterTanks = useMemo(() => {
    return equipment.filter(eq => eq.name.includes('저수조'));
  }, [equipment]);

  // 구글 드라이브 링크를 직접 표시 가능한 URL로 변환
  const getImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.includes('drive.google.com')) {
      const match = url.match(/[-\w]{25,}/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Overall Status */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-100">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">저수조 위생 및 수질 모니터링</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">설비 마스터 데이터의 저수조 자산을 실시간으로 추적합니다.</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center px-5 py-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-black text-xs shadow-sm">
            <ShieldCheck className="w-4 h-4 mr-1.5" /> 전체 저수조 위생 적합
          </div>
        </div>
      </div>

      {/* Standards Summary Card */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'pH (수소이온지수)', standard: '5.8 ~ 8.5', icon: <Activity className="w-4 h-4 text-blue-500" /> },
          { label: '잔류염소 (mg/L)', standard: '0.1 ~ 4.0', icon: <Droplets className="w-4 h-4 text-emerald-500" /> },
          { label: '탁도 (NTU)', standard: '0.5 이하', icon: <Activity className="w-4 h-4 text-amber-500" /> },
          { label: '수온 (°C)', standard: '계절별 가변', icon: <Thermometer className="w-4 h-4 text-rose-500" /> },
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex items-center mb-2">
              <div className="p-1.5 bg-slate-50 rounded-lg">{item.icon}</div>
              <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-auto tracking-tight">관리 기준: {item.standard}</p>
          </div>
        ))}
      </div>

      {/* Water Tank Monitoring List */}
      <div className="grid lg:grid-cols-2 gap-8">
        {waterTanks.length > 0 ? (
          waterTanks.map((tank, index) => {
            const displayImageUrl = getImageUrl(tank.photoUrl);
            // 시뮬레이션된 수질 데이터 (실제 시트에 데이터가 생기면 매핑 가능)
            const simulatedMetrics = {
              ph: 7.2 + (Math.random() * 0.4 - 0.2),
              chlorine: 0.6 + (Math.random() * 0.2 - 0.1),
              turbidity: 0.08 + (Math.random() * 0.04),
              temperature: 18.5 + (Math.random() * 2),
            };

            return (
              <div key={`${tank.id}-${index}`} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg tracking-tight">{tank.name}</h3>
                      <span className="px-2 py-0.5 bg-blue-600 text-[9px] font-black rounded uppercase">Active Asset</span>
                    </div>
                    <p className="text-[10px] text-slate-400 flex items-center mt-1 font-bold">
                      <Clock className="w-3 h-3 mr-1" /> 최종 점검: {tank.installDate || '일자 미상'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                    <Droplets className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                
                <div className="p-8 flex flex-col md:flex-row gap-8">
                  {/* Left: Photos */}
                  <div className="w-full md:w-48 space-y-4">
                    <div className="relative aspect-square bg-slate-100 rounded-[2rem] border border-slate-200 overflow-hidden group/img cursor-zoom-in shadow-inner"
                      onClick={() => displayImageUrl && setPreviewImageUrl(displayImageUrl)}
                    >
                      {displayImageUrl ? (
                        <img 
                          src={displayImageUrl} 
                          alt={tank.name} 
                          className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                          <Droplets className="w-10 h-10 mb-2 opacity-20" />
                          <span className="text-[10px] font-black">사진 없음</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="space-y-1.5 px-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Details</p>
                       <div className="flex items-center text-[11px] font-bold text-slate-600">
                         <Building2 className="w-3.5 h-3.5 mr-2 text-slate-300" /> {tank.orgName}
                       </div>
                       <div className="flex items-center text-[11px] font-bold text-slate-600">
                         <Calendar className="w-3.5 h-3.5 mr-2 text-slate-300" /> 주기: {tank.cycle}
                       </div>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">pH Level</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-black text-slate-800 tracking-tighter">{simulatedMetrics.ph.toFixed(1)}</span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase">Excellent</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(simulatedMetrics.ph / 14) * 100}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temperature</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-black text-slate-800 tracking-tighter">{simulatedMetrics.temperature.toFixed(1)}°</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase">Optimal</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: `${(simulatedMetrics.temperature / 40) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50 space-y-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center">
                           <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm"></div>
                           <span className="text-xs font-black text-slate-700">잔류염소 (Chlorine)</span>
                         </div>
                         <span className="text-sm font-black text-slate-900">{simulatedMetrics.chlorine.toFixed(2)} <span className="text-[9px] text-slate-400 ml-1 font-bold tracking-tight">mg/L</span></span>
                       </div>
                       <div className="flex items-center justify-between">
                         <div className="flex items-center">
                           <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-2 shadow-sm"></div>
                           <span className="text-xs font-black text-slate-700">탁도 (Turbidity)</span>
                         </div>
                         <span className="text-sm font-black text-slate-900">{simulatedMetrics.turbidity.toFixed(3)} <span className="text-[9px] text-slate-400 ml-1 font-bold tracking-tight">NTU</span></span>
                       </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                       <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black transition-all hover:bg-blue-600 shadow-lg shadow-slate-200 flex items-center justify-center">
                         <ClipboardList className="w-4 h-4 mr-2" /> 정기 검사 작성
                       </button>
                       <button className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                         <RefreshCcw className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="lg:col-span-2 py-32 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
            <Droplets className="w-16 h-16 text-slate-100 mb-6" />
            <h3 className="text-xl font-black text-slate-800">등록된 저수조가 없습니다</h3>
            <p className="text-sm text-slate-400 mt-2">설비(구축물) 관리 탭에서 설비명을 '저수조'로 포함하여 등록해주세요.</p>
          </div>
        )}
      </div>

      {/* Manual Check Card */}
      <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center text-blue-600 mb-6 border border-blue-100">
          <ClipboardList className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">저수조 위생 수기 점검</h3>
        <p className="text-xs text-slate-500 font-bold leading-relaxed mb-8 max-w-sm uppercase tracking-widest">
          Manual Health Inspection Input
        </p>
        <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-2xl hover:bg-blue-600 transition-all flex items-center">
          수질 데이터 수기 등록하기 <Maximize2 className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* History Table Integration */}
      <section className="pt-8">
        <HistoryTable 
          title="저수조 점검 및 청소 이력" 
          type="maintenance" 
          facilities={facilities} 
        />
      </section>

      {/* Lightbox Component */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setPreviewImageUrl(null)}>
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"></div>
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button className="absolute -top-12 right-0 text-white hover:text-blue-400 transition-colors flex items-center gap-2 font-black text-sm" onClick={() => setPreviewImageUrl(null)}>
              <X className="w-6 h-6" /> 닫기
            </button>
            <img src={previewImageUrl} alt="확대 사진" className="w-full h-full object-contain rounded-3xl shadow-2xl animate-in zoom-in duration-300 border-4 border-white/10" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterQualityView;
