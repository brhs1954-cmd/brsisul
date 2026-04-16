
import React, { useState, useRef, useMemo } from 'react';
import { Hotspot } from '../types';
import { Search, Filter, Download, MoreVertical, Calendar, User, Tag, Plus, X, Paperclip, ExternalLink } from 'lucide-react';
import { getCurrentKSTDateString } from '../lib/dateUtils';

interface HistoryTableProps {
  title: string;
  type: 'maintenance' | 'landscaping' | 'construction' | 'water_quality';
  facilities: Hotspot[];
  onAdd?: (data: any) => void;
}

const ORDERED_ORG_NAMES = [
  '충남정심원',
  '정심요양원',
  '정심작업장',
  '보령정심학교',
  '충남서부 장애인종합복지관'
];

const HistoryTable: React.FC<HistoryTableProps> = ({ title, type, facilities, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<any>({ 
    org: '', 
    date: getCurrentKSTDateString(), 
    title: '', 
    contractor: '',
    ph: '',
    chlorine: '',
    turbidity: '',
    temperature: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 요청된 순서대로 시설물을 먼저 정렬한 후 이력을 추출하여 목록 순서 보장
  const sortedFacilities = [...facilities].sort((a, b) => {
    const indexA = ORDERED_ORG_NAMES.indexOf(a.name);
    const indexB = ORDERED_ORG_NAMES.indexOf(b.name);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const allRecords = useMemo(() => {
    const records = sortedFacilities.flatMap<any>(f => {
      if (type === 'construction') {
        return f.construction.map(c => ({ ...c, facilityName: f.name }));
      } else if (type === 'landscaping') {
        return f.landscaping.map(l => ({ ...l, facilityName: f.name }));
      } else if (type === 'water_quality') {
        return (f.waterQualityLogs || []).map(w => ({ ...w, facilityName: f.name }));
      } else {
        return f.history.map(h => ({ ...h, facilityName: f.name }));
      }
    });

    // 중복 제거 (대상시설, 날짜, 내용, 담당자가 모두 같은 경우)
    const seen = new Set();
    return records.filter(r => {
      const key = `${r.facilityName}-${r.date || r.period}-${r.description || r.title}-${r.worker || r.contractor}`
        .toLowerCase()
        .replace(/\s+/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sortedFacilities, type]);

  const filteredRecords = allRecords.filter((r: any) => 
    (r.facilityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.description || r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.worker || r.contractor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const headers = ['날짜', '대상 시설', '작업/공사명', '담당자/업체'];
    const rows = filteredRecords.map((r: any) => [
      r.date || r.period,
      r.facilityName,
      r.description || r.title,
      r.worker || r.contractor
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${title}_${getCurrentKSTDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewRecord({
        ...newRecord,
        file: {
          name: file.name,
          type: file.type,
          data: base64
        }
      });
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('파일 읽기 실패');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.org || (type !== 'water_quality' && !newRecord.title)) {
      alert('필수 항목을 입력해주세요.');
      return;
    }
    onAdd?.(newRecord);
    setIsAddModalOpen(false);
    setNewRecord({ 
      org: '', 
      date: getCurrentKSTDateString(), 
      title: '', 
      contractor: '',
      ph: '',
      chlorine: '',
      turbidity: '',
      temperature: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          {(type === 'construction' || type === 'landscaping') && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> 실적 추가
            </button>
          )}
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 mr-2" /> 필터
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> 내보내기
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="시설명, 작업 내용 또는 작업자 검색..." 
            className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">날짜 / 기간</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">대상 시설</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '수질 측정값' : '작업/공사명'}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">담당자 / 업체</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">첨부파일</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record: any, index: number) => (
                <tr key={`${record.id}-${index}`} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-slate-600 font-medium">
                      <Calendar className="w-4 h-4 mr-2 text-slate-300" />
                      {record.date || record.period}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      {record.facilityName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">
                      {type === 'water_quality' ? (
                        <div className="flex gap-2 text-[10px]">
                          <span className="bg-blue-50 px-1.5 py-0.5 rounded">pH: {record.ph}</span>
                          <span className="bg-emerald-50 px-1.5 py-0.5 rounded">Cl: {record.chlorine}</span>
                          <span className="bg-amber-50 px-1.5 py-0.5 rounded">Turb: {record.turbidity}</span>
                          <span className="bg-rose-50 px-1.5 py-0.5 rounded">Temp: {record.temperature}°</span>
                        </div>
                      ) : (
                        record.description || record.title
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-slate-500">
                      <User className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                      {record.worker || record.contractor}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {record.fileUrl || record.첨부파일 ? (
                      <a 
                        href={record.fileUrl || record.첨부파일} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" /> 보기
                      </a>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 group-hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">검색된 관리 이력이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">
                {type === 'construction' ? '공사 실적 추가' : 
                 type === 'landscaping' ? '조경 실적 추가' : 
                 type === 'water_quality' ? '수질 측정 기록 추가' : '실적 추가'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 ml-1">대상 시설</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newRecord.org}
                  onChange={(e) => setNewRecord({...newRecord, org: e.target.value})}
                  required
                >
                  <option value="">시설 선택...</option>
                  {ORDERED_ORG_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 ml-1">날짜 / 기간</label>
                <input 
                  type="text"
                  placeholder={type === 'water_quality' ? "예: 2024-04-20" : "예: 2024-04-20 ~ 2024-05-13"}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                  required
                />
              </div>
              {type === 'water_quality' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">pH (수소이온)</label>
                    <input 
                      type="number" step="0.1" placeholder="7.0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.ph}
                      onChange={(e) => setNewRecord({...newRecord, ph: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">잔류염소 (mg/L)</label>
                    <input 
                      type="number" step="0.01" placeholder="0.5"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.chlorine}
                      onChange={(e) => setNewRecord({...newRecord, chlorine: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">탁도 (NTU)</label>
                    <input 
                      type="number" step="0.001" placeholder="0.05"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.turbidity}
                      onChange={(e) => setNewRecord({...newRecord, turbidity: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">수온 (°C)</label>
                    <input 
                      type="number" step="0.1" placeholder="15.0"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.temperature}
                      onChange={(e) => setNewRecord({...newRecord, temperature: e.target.value})}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 ml-1">작업/공사명</label>
                  <input 
                    type="text"
                    placeholder="작업 내용을 입력하세요"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({...newRecord, title: e.target.value})}
                    required
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 ml-1">{type === 'water_quality' ? '측정자' : '담당자 / 업체'}</label>
                <input 
                  type="text"
                  placeholder={type === 'water_quality' ? "측정자 성함" : "담당자 또는 업체명"}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newRecord.contractor}
                  onChange={(e) => setNewRecord({...newRecord, contractor: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 ml-1">파일 첨부 (구글 드라이브 저장)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  {newRecord.file ? (
                    <span className="text-blue-600 font-bold flex items-center">
                      <Paperclip className="w-4 h-4 mr-2" /> {newRecord.file.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center">
                      <Plus className="w-4 h-4 mr-2" /> 파일 선택
                    </span>
                  )}
                </div>
                {isUploading && <p className="text-[10px] text-blue-500 animate-pulse ml-1">파일 처리 중...</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className={`flex-2 px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
