
import React, { useState, useMemo } from 'react';
import { Vehicle } from '../types';
import { 
  Truck, 
  Car, 
  AlertCircle, 
  ArrowUpRight,
  ShieldCheck,
  Send,
  RefreshCw,
  User,
  Search,
  BarChart3,
  Bus,
  Zap,
  Filter,
  XCircle,
  CheckCircle2,
  LayoutList
} from 'lucide-react';
import { ApiService } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VehicleManagerProps {
  vehicles: Vehicle[];
  onRefresh: () => Promise<void>;
}

const VehicleManager: React.FC<VehicleManagerProps> = ({ vehicles, onRefresh }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 대시보드 통계 계산
  const stats = useMemo(() => {
    const orgCounts: Record<string, number> = {};
    const typeCounts = { BUS: 0, VAN: 0, CAR: 0, SPECIAL: 0 };
    const statusCounts = { OPERATING: 0, REPAIR: 0, WAITING: 0 };

    vehicles.forEach(v => {
      const org = v.orgName || '미지정';
      orgCounts[org] = (orgCounts[org] || 0) + 1;
      if (v.type === 'BUS') typeCounts.BUS++;
      else if (v.type === 'VAN') typeCounts.VAN++;
      else if (v.type === 'SPECIAL') typeCounts.SPECIAL++;
      else typeCounts.CAR++;
      
      if (v.status === 'OPERATING') statusCounts.OPERATING++;
      else if (v.status === 'REPAIR') statusCounts.REPAIR++;
      else statusCounts.WAITING++;
    });

    const chartData = Object.entries(orgCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { total: vehicles.length, orgCounts, typeCounts, statusCounts, chartData };
  }, [vehicles]);

  // 2. 정밀 일치(Strict Match) 검색 엔진
  const filteredVehicles = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    
    // 검색어가 없으면 원본 리스트(순번대로) 반환
    if (!term) return vehicles;

    return vehicles.filter(v => {
      // 데이터 전처리 (공백 제거 및 소문자화)
      const plate = (v.plateNumber || '').toLowerCase().replace(/\s/g, '');
      const owner = (v.ownerInfo || '').toLowerCase().trim();
      const model = (v.model || '').toLowerCase().trim();
      const org = (v.orgName || '').toLowerCase().trim();
      const cleanTerm = term.replace(/\s/g, '');

      // [로직 A] 차량번호 정밀 매칭: 전체 번호 일치 OR 숫자만 입력 시 뒷자리 일치
      const isNumeric = /^\d+$/.test(cleanTerm);
      const isPlateMatch = plate === cleanTerm || (isNumeric && cleanTerm.length >= 2 && plate.endsWith(cleanTerm));
      
      // [로직 B] 텍스트 필드 정밀 매칭: 입력값과 필드값이 완전히 일치해야 함 (Strict Equality)
      const isOwnerMatch = owner === term;
      const isOrgMatch = org === term;
      const isModelMatch = model === term;

      // 하나라도 정확히 일치하는 경우만 반환
      return isPlateMatch || isOwnerMatch || isOrgMatch || isModelMatch;
    });
  }, [vehicles, searchQuery]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await onRefresh();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSendToSheet = async (vehicle: Vehicle) => {
    setIsSubmitting(vehicle.id);
    const now = new Date();
    const kstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const dateStr = kstDate.toISOString().split('T')[0];

    try {
      await ApiService.submitData({
        org: vehicle.orgName || '미지정',
        category: 'VEHICLE_LOG',
        title: `${vehicle.plateNumber} (${vehicle.model})`,
        value: {
          mileage: vehicle.mileage,
          status: vehicle.status,
          timestamp: dateStr
        }
      });
      alert(`[${vehicle.plateNumber}] 차량 데이터가 시트에 성공적으로 기록되었습니다.`);
    } catch (e) {
      alert('데이터 전송 실패');
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Status Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-200">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">차량 정밀 관리 센터</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {searchQuery ? `정밀 검색 모드: ${filteredVehicles.length}건 검색됨` : '전체 리스트가 원본 순번대로 정렬되어 있습니다.'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleManualSync} disabled={isSyncing} className="px-5 py-3 bg-white text-blue-600 rounded-2xl font-black text-xs border border-blue-100 hover:bg-blue-50 transition-all flex items-center shadow-sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> 
            새로고침
          </button>
          <div className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-center shadow-lg shadow-blue-100 border border-white/10">
             <p className="text-[9px] font-black text-blue-100 uppercase mb-0.5 tracking-widest">Master Fleet</p>
             <p className="text-lg font-black">{stats.total} 대</p>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[240px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800 text-sm flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-blue-500" /> 기관별 차량 보유량</h3>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Analytics</span>
          </div>
          <div className="h-full pb-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} width={100} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={12}>
                  {stats.chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#8b5cf6'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-400 transition-all">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3"><Bus className="w-5 h-5" /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">대형/승합</p><p className="text-2xl font-black text-slate-900">{stats.typeCounts.BUS + stats.typeCounts.VAN} 대</p></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-400 transition-all">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3"><Car className="w-5 h-5" /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">일반승용</p><p className="text-2xl font-black text-slate-900">{stats.typeCounts.CAR} 대</p></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-amber-400 transition-all">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3"><Zap className="w-5 h-5" /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">특수/작업</p><p className="text-2xl font-black text-slate-900">{stats.typeCounts.SPECIAL} 대</p></div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-rose-400 transition-all">
            <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3"><AlertCircle className="w-5 h-5" /></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">정비 대상</p><p className="text-2xl font-black text-rose-600">{stats.statusCounts.REPAIR} 대</p></div>
          </div>
        </div>
      </div>

      {/* Strict Search Bar */}
      <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4 sticky top-0 z-10 transition-all duration-300">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500" />
          <input 
            type="text" 
            placeholder="번호판 뒷자리 또는 차주 성함(완전 일치)을 입력하세요..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-all">
              <XCircle className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
        <div className="flex items-center px-6 py-4 bg-blue-50 rounded-2xl border border-blue-100 whitespace-nowrap">
          <Filter className="w-4 h-4 text-blue-500 mr-2" />
          <span className="text-[11px] font-black text-blue-700 uppercase tracking-widest">
            {searchQuery ? `STRICT MATCH: ${filteredVehicles.length} UNITS` : `MASTER LIST (DEFAULT)`}
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">순번</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">차량번호</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">모델/차종</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">소속기관</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">차주 및 비고</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">운행상태</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle, index) => {
                  const status = vehicle.status === 'OPERATING' ? { label: '정상', color: 'text-emerald-600', bg: 'bg-emerald-50' } : 
                                 vehicle.status === 'REPAIR' ? { label: '정비', color: 'text-rose-600', bg: 'bg-rose-50' } : 
                                 { label: '대기', color: 'text-amber-600', bg: 'bg-amber-50' };
                  
                  return (
                    <tr key={`${vehicle.id}-${index}`} className="hover:bg-blue-50/20 transition-all group animate-in fade-in slide-in-from-left-2 duration-300">
                      <td className="px-8 py-6 text-center text-[10px] font-black text-slate-300">{index + 1}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                          <div className="p-2.5 bg-slate-100 rounded-xl mr-4 group-hover:bg-white transition-colors"><Car className="w-4 h-4 text-slate-400" /></div>
                          <span className="text-sm font-black text-slate-800 tracking-tight">
                            {vehicle.plateNumber || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700">{vehicle.model || '-'}</span>
                          <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{vehicle.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100">
                          {vehicle.orgName || '미지정'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-600">
                        <div className="flex items-center">
                          <User className="w-3.5 h-3.5 mr-2 text-slate-300" />
                          {vehicle.ownerInfo || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleSendToSheet(vehicle)} 
                          disabled={isSubmitting !== null} 
                          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center ml-auto"
                        >
                          {isSubmitting === vehicle.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                          운행기록
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-40 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-100 p-8 rounded-full mb-6 text-slate-300">
                        <Search className="w-16 h-16" />
                      </div>
                      <h4 className="text-xl font-black text-slate-800 mb-2">일치하는 차량이 없습니다</h4>
                      <p className="text-sm text-slate-400 font-medium mb-8">정밀 검색 모드이므로 성함이나 번호를 정확히 입력해주세요.</p>
                      <button onClick={handleClearSearch} className="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center">
                        <LayoutList className="w-4 h-4 mr-2" /> 마스터 리스트 복구
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Compliance Footer */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row md:items-center justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-blue-500/20 p-5 rounded-[1.5rem] border border-blue-500/30">
            <ShieldCheck className="w-10 h-10 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight mb-2">지능형 자산 정밀 보안 시스템</h3>
            <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed">
              검색 엔진이 <span className="text-white font-black underline decoration-blue-500">Strict Match</span> 모드로 작동하고 있습니다. 
              정확한 데이터 필터링을 통해 보령학사의 자산을 오차 없이 관리하십시오.
            </p>
          </div>
        </div>
        <button className="relative z-10 mt-8 md:mt-0 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs hover:bg-blue-50 transition-all shadow-2xl flex items-center">
          보안 지침 확인 <ArrowUpRight className="w-4 h-4 ml-2 text-blue-600" />
        </button>
      </div>
    </div>
  );
};

export default VehicleManager;
