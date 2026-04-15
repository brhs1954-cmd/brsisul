
import React, { useState, useRef } from 'react';
import { Hotspot } from '../types';
import { Search, Filter, Download, MoreVertical, Calendar, User, Tag, Plus, X, Paperclip, ExternalLink } from 'lucide-react';

interface HistoryTableProps {
  title: string;
  type: 'maintenance' | 'landscaping' | 'construction';
  facilities: Hotspot[];
  onAdd?: (data: { org: string; date: string; title: string; contractor: string; file?: { name: string; type: string; data: string } }) => void;
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
  const [newRecord, setNewRecord] = useState<{ org: string; date: string; title: string; contractor: string; file?: { name: string; type: string; data: string } }>({ 
    org: '', 
    date: new Date().toISOString().split('T')[0], 
    title: '', 
    contractor: '' 
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 요청된 순서대로 시설물을 먼저 정렬한 후 이력을 추출하여 목록 순서 보장
  const sortedFacilities = [...facilities].sort((a, b) => {
    const indexA = ORDERED_ORG_NAMES.indexOf(a.name);
    const indexB = ORDERED_ORG_NAMES.indexOf(b.name);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const allRecords = sortedFacilities.flatMap<any>(f => {
    if (type === 'construction') {
      return f.construction.map(c => ({ ...c, facilityName: f.name }));
    } else if (type === 'landscaping') {
      return f.landscaping.map((l, i) => ({ id: `l-${f.id}-${i}`, title: l, date: '2024-11-01', worker: '정심조경팀', facilityName: f.name }));
    } else {
      return f.history.map(h => ({ ...h, facilityName: f.name }));
    }
  });

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
    link.setAttribute('download', `${title}_${new Date().toISOString().split('T')[0]}.csv`);
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
    if (!newRecord.org || !newRecord.title) {
      alert('시설명과 작업명은 필수입니다.');
      return;
    }
    onAdd?.(newRecord);
    setIsAddModalOpen(false);
    setNewRecord({ org: '', date: new Date().toISOString().split('T')[0], title: '', contractor: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          {type === 'construction' && (
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">작업/공사명</th>
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
                      {record.description || record.title}
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
              <h3 className="text-lg font-black text-slate-900">공사 실적 추가</h3>
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
                  placeholder="예: 2024-04-20 ~ 2024-05-13"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                  required
                />
              </div>
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
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 ml-1">담당자 / 업체</label>
                <input 
                  type="text"
                  placeholder="담당자 또는 업체명"
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
