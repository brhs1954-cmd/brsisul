
import React, { useState, useRef, useMemo } from 'react';
import { Hotspot } from '../types';
import { Search, Filter, Download, MoreVertical, Calendar, User, Tag, Plus, X, Paperclip, ExternalLink, Eye, MapPin, HardHat, Droplets, Activity, Thermometer, CheckCircle2 } from 'lucide-react';
import { getCurrentKSTDateString } from '../lib/dateUtils';
import { compressImage, getDisplayImageUrl } from '../lib/imageUtils';

// 천단위 콤마 포맷 함수
const formatCurrency = (val: any) => {
  if (val === undefined || val === null || val === '') return '-';
  const str = String(val).trim();
  const numericValue = str.replace(/,/g, '');
  if (!isNaN(Number(numericValue)) && numericValue !== '') {
    return Number(numericValue).toLocaleString('ko-KR');
  }
  return str;
};

interface HistoryTableProps {
  title: string;
  type: 'maintenance' | 'landscaping' | 'construction' | 'water_quality' | 'construction_results';
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
    remarks: '',
    // 공사실적용 추가 필드
    year: '',
    amount: '',
    content: '',
    budget: '',
    contractPrice: '',
    designChange: '',
    settlement: '',
    type: '',
    file: null,
    fileUrl: ''
  });
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 요청된 순서대로 시설물을 먼저 정렬한 후 이력을 추출하여 목록 순서 보장
  const sortedFacilities = [...facilities].sort((a, b) => {
    const indexA = ORDERED_ORG_NAMES.indexOf(a.name);
    const indexB = ORDERED_ORG_NAMES.indexOf(b.name);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const allRecords = useMemo(() => {
    // Helper to extract value regardless of key variations (Korean/English/Capitalization)
    const getVal = (r: any, keys: string[]) => {
      for (const k of keys) {
        if (r[k] !== undefined) return r[k];
      }
      return undefined;
    };

    // 1. 만약 prop으로 records가 전달되었다면 그것을 우선 사용
    if (propRecords && propRecords.length > 0) {
      const mappedPropRecords = propRecords.map(r => ({
        ...r,
        // Normalize keys from Google Sheets (Korean Headers) to standard keys
        facilityName: r.facilityName || r.tankName || r.org || r['대상 시설'] || r['저수조 명'] || (type === 'construction_results' ? '시설 전체' : '기타'),
        date: r.date || r.period || r['날짜 / 기간'] || r['날짜'] || r['연도별'] || r['연도'],
        title: r.title || r.description || r['작업/공사명'] || r['사업명'] || r['비고/청소내용'],
        worker: r.worker || r.contractor || r['담당자 / 업체'] || r['공사업자'] || r['담당자'],
        remarks: r.remarks || r['비고/청소내용'] || r['비고'],
        ph: getVal(r, ['ph', 'pH']),
        chlorine: getVal(r, ['chlorine', '잔류염소']),
        turbidity: getVal(r, ['turbidity', '탁도']),
        temperature: getVal(r, ['temperature', '수온']),
        fileUrl: r.fileUrl || r.attachedFile || r['첨부파일'] || r['첨부이미지'] || r['첨부'] || r.drive || r.file,
        // Construction Results specific fields
        type: r.type || r['구분'],
        year: r.year || r['연도별'] || r['연도'],
        amount: r.amount || r['사업량'],
        content: r.content || r['주요내용'],
        budget: r.budget || r['예산액(설계)'] || r['예산액'],
        contractPrice: r.contractPrice || r['계약액'],
        designChange: r.designChange || r['설계변경'],
        settlement: r.settlement || r['정산액']
      }));
      
      const seen = new Set();
      return mappedPropRecords.filter(r => {
        const key = `${r.id}-${r.facilityName}-${r.date}-${r.title || ''}`
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

    // 중복 제거 및 정규화
    const seen = new Set();
    return records.filter(r => {
      const key = `${r.facilityName}-${r.date || r.period}-${r.description || r.title || r.remarks || ''}-${r.worker || r.contractor}`
        .toLowerCase()
        .replace(/\s+/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(r => ({
      ...r,
      facilityName: r.facilityName || r.tankName || r.org || r['대상 시설'] || r['저수조 명'] || '기타',
      date: r.date || r.period || r['날짜 / 기간'] || r['날짜'],
      title: r.title || r.description || r['작업/공사명'] || r['비고/청소내용'],
      worker: r.worker || r.contractor || r['담당자 / 업체'] || r['담당자'],
      remarks: r.remarks || r['비고/청소내용'],
      fileUrl: r.fileUrl || r.attachedFile || r['첨부파일'] || r['첨부이미지'] || r['첨부'] || r.drive || r.file
    }));
  }, [sortedFacilities, type, propRecords]);

  const filteredRecords = allRecords.filter((r: any) => 
    (String(r.facilityName || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (String(r.title || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (String(r.remarks || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (String(r.worker || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type === 'construction_results' && (String(r.type || '')).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExport = () => {
    let headers = [];
    let rows = [];

    if (type === 'construction_results') {
      headers = ['시설명', '연도별', '사업명', '사업량', '공사업자', '주요내용', '예산액(설계)', '계약액', '설계변경', '정산액', '비고'];
      rows = filteredRecords.map((r: any) => [
        r.type, r.year, r.title, r.amount, r.worker, r.content, r.budget, r.contractPrice, r.designChange, r.settlement, r.remarks
      ]);
    } else {
      headers = [
        '날짜', 
        type === 'water_quality' ? '저수조 명' : '대상 시설', 
        type === 'water_quality' ? '내용/측정값' : '작업/공사명', 
        type === 'water_quality' ? '담당자' : '담당자/업체'
      ];
      rows = filteredRecords.map((r: any) => [
        r.date || r.period,
        r.facilityName,
        type === 'water_quality' 
          ? (r.remarks || `pH:${r.ph}, Cl:${r.chlorine}, Turb:${r.turbidity}, Temp:${r.temperature}`)
          : (r.description || r.title),
        r.worker || r.contractor
      ]);
    }
    
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
      setFilePreview(base64);
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
    if (type !== 'construction_results' && !newRecord.org) {
        alert('대상 시설을 선택해주세요.');
        return;
    }
    if (type !== 'water_quality' && !newRecord.title) {
      alert('필수 항목(사업명/작업명)을 입력해주세요.');
      return;
    }
    
    const dataToSubmit = { ...newRecord };
    if (type === 'construction_results' && !dataToSubmit.org) {
        dataToSubmit.org = '시설 전체';
    }
    
    onAdd?.(dataToSubmit);
    setIsAddModalOpen(false);
    setFilePreview(null);
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
      remarks: '',
      // 공사실적 전용 필드 초기화
      year: '',
      amount: '',
      content: '',
      budget: '',
      contractPrice: '',
      designChange: '',
      settlement: '',
      type: '',
      file: null,
      fileUrl: ''
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          {(type === 'construction' || type === 'landscaping' || type === 'water_quality' || type === 'construction_results') && (
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
                  {type === 'water_quality' ? '점검 날짜' : (type === 'construction_results' ? '연도별' : '날짜 / 기간')}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '저수조 명' : (type === 'construction_results' ? '시설명' : '대상 시설')}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '측정값 / 점검내용' : (type === 'construction_results' ? '사업명' : '작업/공사명')}
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === 'water_quality' ? '담당자' : (type === 'construction_results' ? '공사업자' : '담당자 / 업체')}
                </th>
                {type === 'construction_results' && (
                  <>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">정산액</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">비고</th>
                  </>
                )}
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
                      {type === 'construction_results' ? record.type || '일반' : record.facilityName}
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
                  {type === 'construction_results' && (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-emerald-600">{formatCurrency(record.settlement)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500 line-clamp-1">{record.remarks || '-'}</div>
                      </td>
                    </>
                  )}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <h3 className="text-lg font-black text-slate-900">
                {type === 'construction' ? '공사 실적 추가' : 
                 type === 'landscaping' ? '조경 실적 추가' : 
                 type === 'construction_results' ? '공사 실적(사업) 추가' :
                 type === 'water_quality' ? '수질 측정 기록 추가' : '실적 추가'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
              {type === 'construction_results' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">시설명</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                        value={newRecord.type}
                        onChange={(e) => setNewRecord({...newRecord, type: e.target.value})}
                      >
                        <option value="">시설 선택...</option>
                        <option value="일반">시설 전체(일반)</option>
                        {(targetOptions || ORDERED_ORG_NAMES).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">연도별</label>
                    <input 
                      type="text" placeholder="예: 2024"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.year}
                      onChange={(e) => setNewRecord({...newRecord, year: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">사업명 (작업/공사명)</label>
                    <input 
                      type="text" placeholder="사업명을 입력하세요"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.title}
                      onChange={(e) => setNewRecord({...newRecord, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">사업량</label>
                    <input 
                      type="text" placeholder="사업량을 입력하세요 (예: 1식, 100m 등)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord({...newRecord, amount: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">공사업자 (담당자/업체)</label>
                    <input 
                      type="text" placeholder="업체명을 입력하세요"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.contractor}
                      onChange={(e) => setNewRecord({...newRecord, contractor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">주요내용</label>
                    <textarea 
                      placeholder="공사 주요 내용을 입력하세요"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all h-20 resize-none"
                      value={newRecord.content}
                      onChange={(e) => setNewRecord({...newRecord, content: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 ml-1">예산액(설계)</label>
                      <input 
                        type="text" placeholder="숫자만 입력"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newRecord.budget}
                        onChange={(e) => setNewRecord({...newRecord, budget: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 ml-1">계약액</label>
                      <input 
                        type="text" placeholder="숫자만 입력"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newRecord.contractPrice}
                        onChange={(e) => setNewRecord({...newRecord, contractPrice: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 ml-1">설계변경</label>
                      <input 
                        type="text" placeholder="설계변경액"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newRecord.designChange}
                        onChange={(e) => setNewRecord({...newRecord, designChange: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 ml-1">정산액</label>
                      <input 
                        type="text" placeholder="정산액"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newRecord.settlement}
                        onChange={(e) => setNewRecord({...newRecord, settlement: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1">비고</label>
                    <input 
                      type="text" placeholder="추가 참고사항"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newRecord.remarks}
                      onChange={(e) => setNewRecord({...newRecord, remarks: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 ml-1">파일 첨부 (이미지/문서)</label>
                  
                  {filePreview && (
                    <div className="relative w-full aspect-video mb-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
                      {filePreview.startsWith('data:image') ? (
                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <Paperclip className="w-8 h-8 mb-2" />
                          <span className="text-[10px] font-bold">문서 파일 첨부됨</span>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => {
                          setFilePreview(null);
                          setNewRecord({...newRecord, file: null});
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all ${filePreview ? 'h-12' : ''}`}
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
                        <CheckCircle2 className="w-4 h-4 mr-2" /> 
                        {!filePreview ? newRecord.file.name : '파일 변경하기'}
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center">
                        <Plus className="w-4 h-4 mr-2" /> 파일 직접 선택
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-500 ml-1">또는 링크 주소 직접 입력 (Google 드라이브 등)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="url" 
                      placeholder="https://drive.google.com/..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      value={newRecord.fileUrl || ''}
                      onChange={(e) => {
                        const url = e.target.value;
                        setNewRecord({...newRecord, fileUrl: url});
                        // If it looks like a direct image URL or common storage URL, we could show preview but for Google Drive it's tricky.
                        // For now we don't preview URLs to avoid complexity, but keep it consistent.
                      }}
                    />
                  </div>
                </div>
                {isUploading && <p className="text-[10px] text-blue-500 animate-pulse ml-1">파일 처리 중...</p>}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 flex-shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-300 transition-colors"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className={`flex-[2] px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  {selectedRecord.title || '상세 정보'}
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
                    <Calendar className="w-3.5 h-3.5 mr-1.5" /> {type === 'construction_results' ? '연도별' : '날짜 / 기간'}
                  </p>
                  <p className="text-base font-black text-slate-800">{selectedRecord.year || selectedRecord.date || '-'}</p>
                </div>
                <div className="space-y-1.5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" /> {type === 'water_quality' ? '저수조 명' : (type === 'construction_results' ? '시설명' : '대상 시설')}
                  </p>
                  <p className="text-base font-black text-slate-800">{type === 'construction_results' ? selectedRecord.type || '시설 전체' : selectedRecord.facilityName}</p>
                </div>
                <div className="space-y-1.5 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5" /> {type === 'construction_results' ? '공사업자' : '담당자 / 업체'}
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
                     type === 'construction_results' ? '공사 실적(연도)' :
                     type === 'landscaping' ? '조경 관리' : '일반 점검'}
                  </p>
                </div>
              </div>

              {/* Specific Details Section */}
              {type === 'construction_results' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">사업량</p>
                      <p className="text-sm font-bold text-slate-700">{selectedRecord.amount || '-'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">정산액</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(selectedRecord.settlement)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">예산액(설계)</p>
                      <p className="text-sm font-bold text-slate-600">{formatCurrency(selectedRecord.budget)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">계약액</p>
                      <p className="text-sm font-bold text-slate-600">{formatCurrency(selectedRecord.contractPrice)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">설계변경</p>
                      <p className="text-sm font-bold text-slate-600">{formatCurrency(selectedRecord.designChange)}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">주요 내용</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRecord.content || '-'}</p>
                  </div>
                  <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">비고</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedRecord.remarks || '-'}</p>
                  </div>
                </div>
              )}

              {/* Attachment Preview Section */}
              {(() => {
                const link = selectedRecord.fileUrl || selectedRecord.attachedFile || selectedRecord.첨부파일 || selectedRecord.drive || selectedRecord.file;
                const isImg = link && (String(link).match(/\.(jpeg|jpg|gif|png|webp)$/i) || String(link).startsWith('data:image'));
                
                return link ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                        <Paperclip className="w-3.5 h-3.5 mr-1.5" /> 첨부파일 확인
                      </h4>
                      <a 
                        href={String(link)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> 새 탭에서 열기
                      </a>
                    </div>
                    {isImg ? (
                      <div className="w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group relative">
                        <img 
                          src={getDisplayImageUrl(String(link))} 
                          alt="Attachment preview" 
                          className="w-full h-auto max-h-96 object-contain mx-auto transition-transform duration-500 group-hover:scale-[1.02]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 border border-slate-100">
                          <Paperclip className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">문서 파일이 첨부되어 있습니다</p>
                          <p className="text-xs text-slate-500 font-medium">위 버튼을 클릭하여 전체 내용을 확인하세요.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
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
                          {m.value || '-'}
                          {m.value && m.unit && <span className="text-[10px] ml-0.5 opacity-60 font-bold">{m.unit}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all shadow-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
