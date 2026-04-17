
import React, { useState, useRef, useMemo } from 'react';
import { Hotspot } from '../types';
import { Search, Filter, Download, MoreVertical, Calendar, User, Tag, Plus, X, Paperclip, ExternalLink, Eye, MapPin, HardHat, Droplets, Activity, Thermometer } from 'lucide-react';
import { getCurrentKSTDateString } from '../lib/dateUtils';
import { compressImage } from '../lib/imageUtils';

interface HistoryTableProps {
  title: string;
  type: 'maintenance' | 'landscaping' | 'construction' | 'water_quality';
  facilities: Hotspot[];
  records?: any[]; // 추가: 로그 데이터를 직접 전달받을 수 있도록 함
  onAdd?: (data: any) => void;
  targetOptions?: string[];
}

const ORDERED_ORG_NAMES = [
  '충남정심원',
  '정심요양원',
  '정심작업장',
  '보령정심학교',
  '충남서부 장애인종합복지관'
];

const HistoryTable: React.FC<HistoryTableProps> = ({ title, type, facilities, records: propRecords, onAdd, targetOptions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<any>({ 
    recordType: 'measurement',
    org: '', 
    date: getCurrentKSTDateString(), 
    title: '', 
    contractor: '',
    worker: '',
    ph: '',
    chlorine: '',
    turbidity: '',
    temperature: '',
    remarks: ''
  });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 요청된 순서대로 시설물을 먼저 정렬한 후 이력을 추출하여 목록 순서 보장
  const sortedFacilities = [...facilities].sort((a, b) => {
    const indexA = ORDERED_ORG_NAMES.indexOf(a.name);
    const indexB = ORDERED_ORG_NAMES.indexOf(b.name);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const allRecords = useMemo(() => {
    // 1. 만약 prop으로 records가 전달되었다면 그것을 우선 사용
    if (propRecords && propRecords.length > 0) {
      const mappedPropRecords = propRecords.map(r => ({
        ...r,
        facilityName: r.facilityName || r.tankName || r.org || '기타'
      }));
      
      const seen = new Set();
      return mappedPropRecords.filter(r => {
        const key = `${r.id}-${r.facilityName}-${r.date || r.period}-${r.description || r.title || r.remarks || ''}`
          .toLowerCase()
          .replace(/\s+/g, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    // 2. 전달된 records가 없으면 기존 방식(facilities 순회) 사용
    const records = sortedFacilities.flatMap<any>(f => {
      if (type === 'construction') {
        return f.construction.map(c => ({ ...c, facilityName: f.name }));
      } else if (type === 'landscaping') {
        return f.landscaping.map(l => ({ ...l, facilityName: f.name }));
      } else if (type === 'water_quality') {
        return (f.waterQualityLogs || []).map(w => ({ ...w, facilityName: w.tankName || f.name }));
      } else {
        return f.history.map(h => ({ ...h, facilityName: f.name }));
      }
    });

    // 중복 제거 (대상시설, 날짜, 내용, 담당자가 모두 같은 경우)
    const seen = new Set();
    return records.filter(r => {
      const key = `${r.facilityName}-${r.date || r.period}-${r.description || r.title || r.remarks || ''}-${r.worker || r.contractor}`
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
    (r.remarks || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.worker || r.contractor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const headers = [
      '날짜', 
      type === 'water_quality' ? '저수조 명' : '대상 시설', 
      type === 'water_quality' ? '내용/측정값' : '작업/공사명', 
      type === 'water_quality' ? '담당자' : '담당자/업체'
    ];
    const rows = filteredRecords.map((r: any) => [
      r.date || r.period,
      r.facilityName,
      type === 'water_quality' 
        ? (r.remarks || `pH:${r.ph}, Cl:${r.chlorine}, Turb:${r.turbidity}, Temp:${r.temperature}`)
        : (r.description || r.title),
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
    reader.onload = async (event) => {
      let base64 = event.target?.result as string;
      
      // 이미지 파일인 경우 압축 시도
      if (file.type.startsWith('image/')) {
        try {
          base64 = await compressImage(base64);
        } catch (error) {
          console.error('Image compression failed:', error);
        }
      }

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
      recordType: 'measurement',
      org: '', 
      date: getCurrentKSTDateString(), 
      title: '', 
      contractor: '',
      worker: '',
      ph: '',
      chlorine: '',
      turbidity: '',
      temperature: '',
      remarks: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          {(type === 'construction' || type === 'landscaping' || type === 'water_quality') && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" /> {type === 'water_quality' ? '측정 기록 추가' : '실적 추가'}
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
            placeholder={type === 'water_quality' ? "저수조 명, 측정자 검색..." : "시설명, 작업 내용 또는 작업자 검색..."}
            className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '점검 날짜' : '날짜 / 기간'}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '저수조 명' : '대상 시설'}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '측정값 / 점검내용' : '작업/공사명'}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '담당자' : '담당자 / 업체'}
                </th>
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
                        <div className="space-y-1">
                          {record.remarks && <div className="text-slate-900 font-bold mb-1">{record.remarks}</div>}
                          {(!record.remarks || record.ph) && (
                            <div className="flex flex-wrap gap-2 text-[10px]">
                              <span className="bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold text-blue-600">pH {record.ph}</span>
                              <span className="bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold text-emerald-600">Cl {record.chlorine}</span>
                              <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-bold text-amber-600">Turb {record.turbidity}</span>
                              <span className="bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 font-bold text-rose-600">{record.temperature}°C</span>
                            </div>
                          )}
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
                    {(() => {
                      const link = record.fileUrl || record.attachedFile || record.첨부파일 || record.drive || record.file;
                      // URL이 비고란에 밀려 들어간 경우를 대비하여 추가 체크
                      const altLink = (record.remarks && String(record.remarks).startsWith('http')) ? record.remarks : null;
                      const finalLink = (link && String(link).startsWith('http')) ? link : altLink;
                      
                      return finalLink ? (
                        <a 
                          href={String(finalLink)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1.5 bg-blue-50 text-[10px] font-black text-blue-600 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Paperclip className="w-3 h-3 mr-1.5" /> 파일
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[11px] font-medium">-</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(record);
                        console.log("Record selected for detail view:", record);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm font-black text-[10px]"
                      title="상세 정보 보기"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> 상세보기
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
              {type === 'water_quality' && (
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-2">
                  <button
                    type="button"
                    onClick={() => setNewRecord({...newRecord, recordType: 'measurement'})}
                    className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${newRecord.recordType === 'measurement' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    수질 측정
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRecord({...newRecord, recordType: 'cleaning'})}
                    className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all ${newRecord.recordType === 'cleaning' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    청소 이력
                  </button>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 ml-1">
                  {type === 'water_quality' ? '저수조 명' : '대상 시설'}
                </label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  value={newRecord.org}
                  onChange={(e) => setNewRecord({...newRecord, org: e.target.value})}
                  required
                >
                  <option value="">{type === 'water_quality' ? '저수조 선택...' : '시설 선택...'}</option>
                  {(targetOptions || ORDERED_ORG_NAMES).map(name => (
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
              {type === 'water_quality' && (
                <>
                  {newRecord.recordType === 'measurement' ? (
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
                      <label className="text-xs font-black text-slate-500 ml-1">청소 내용 / 비고</label>
                      <textarea 
                        placeholder="청소 내역을 입력하세요"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                        value={newRecord.remarks}
                        onChange={(e) => setNewRecord({...newRecord, remarks: e.target.value})}
                        required
                      />
                    </div>
                  )}
                </>
              )}
              {type !== 'water_quality' && (
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
                  value={type === 'water_quality' ? newRecord.worker : newRecord.contractor}
                  onChange={(e) => setNewRecord({...newRecord, [type === 'water_quality' ? 'worker' : 'contractor']: e.target.value})}
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
                    accept="image/*,application/pdf"
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
      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="px-3 py-1 bg-blue-600 text-[10px] font-black text-white rounded-full uppercase tracking-widest mb-2 inline-block">
                  {type === 'water_quality' ? '수질/청소 상세내역' : '관리 실적 상세'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {selectedRecord.remarks ? '저수조 청소 및 점검' : (selectedRecord.description || selectedRecord.title || '상세 정보')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)} 
                className="p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Main Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> 날짜 / 기간
                  </p>
                  <p className="text-base font-black text-slate-800">{selectedRecord.date || selectedRecord.period}</p>
                </div>
                <div className="space-y-1.5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> {type === 'water_quality' ? '저수조 명' : '대상 시설'}
                  </p>
                  <p className="text-base font-black text-slate-800">{selectedRecord.facilityName}</p>
                </div>
                <div className="space-y-1.5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5" /> 담당자 / 업체
                  </p>
                  <p className="text-base font-black text-slate-800">{selectedRecord.worker || selectedRecord.contractor || '미지정'}</p>
                </div>
                <div className="space-y-1.5 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center">
                    <HardHat className="w-3.5 h-3.5 mr-1.5" /> 관리 유형
                  </p>
                  <p className="text-base font-black text-blue-700">
                    {type === 'water_quality' ? (selectedRecord.remarks ? '저수조 청소' : '수질 검사') : 
                     type === 'construction' ? '시설 공사' : 
                     type === 'landscaping' ? '조경 관리' : '일반 점검'}
                  </p>
                </div>
              </div>

              {/* Specific Details Section */}
              {type === 'water_quality' && (
                <div className="space-y-6">
                  {selectedRecord.remarks && (
                    <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">청소 및 비고 내용</p>
                       <p className="text-base font-bold leading-relaxed">{selectedRecord.remarks}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-4 gap-4 pt-2">
                    {[
                      { label: 'pH', value: selectedRecord.ph, color: 'text-blue-500', icon: <Droplets className="w-4 h-4" /> },
                      { label: '잔류염소', value: selectedRecord.chlorine, unit: 'mg/L', color: 'text-emerald-500', icon: <Droplets className="w-4 h-4" /> },
                      { label: '탁도', value: selectedRecord.turbidity, unit: 'NTU', color: 'text-amber-500', icon: <Activity className="w-4 h-4" /> },
                      { label: '수온', value: selectedRecord.temperature, unit: '°C', color: 'text-rose-500', icon: <Thermometer className="w-4 h-4" /> },
                    ].map((m, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-1 text-slate-400">
                          {m.icon}
                          <span className="ml-1 text-[8px] font-black uppercase tracking-tighter">{m.label}</span>
                        </div>
                        <p className={`text-lg font-black ${m.color}`}>
                          {m.value}
                          {m.unit && <span className="text-[10px] ml-0.5 opacity-60 font-bold">{m.unit}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Preview / Attachment */}
              {(() => {
                const link = selectedRecord.fileUrl || selectedRecord.attachedFile || selectedRecord.첨부파일 || selectedRecord.drive || (selectedRecord.remarks?.startsWith('http') ? selectedRecord.remarks : null);
                const isImage = link && (String(link).toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|avif)/) || String(link).includes('lh3.googleusercontent.com'));
                
                return link ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">증빙 자료 및 첨부파일</p>
                    {isImage ? (
                      <div className="relative rounded-[2.5rem] overflow-hidden border border-slate-200 bg-slate-100 group/zoom shadow-inner">
                        <img 
                          src={String(link).includes('drive.google.com') ? `https://lh3.googleusercontent.com/d/${String(link).match(/[-\w]{25,}/)?.[0]}` : String(link)} 
                          alt="첨부 이미지"
                          className="w-full max-h-[300px] object-contain"
                          referrerPolicy="no-referrer"
                        />
                        <a 
                          href={String(link)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute bottom-4 right-4 px-5 py-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl text-xs font-black text-slate-900 flex items-center hover:bg-white transition-all border border-slate-100"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" /> 전체 화면
                        </a>
                      </div>
                    ) : (
                      <a 
                        href={String(link)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] hover:bg-white transition-all group"
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mr-4 group-hover:scale-110 transition-transform">
                          <Paperclip className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">첨부 문서 보기</p>
                          <p className="text-xs text-slate-400 font-bold">크게 보려면 클릭하여 새 창으로 열기</p>
                        </div>
                        <ExternalLink className="w-5 h-5 ml-auto text-slate-300" />
                      </a>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all shadow-sm"
              >
                닫기
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" /> PDF/인쇄 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
