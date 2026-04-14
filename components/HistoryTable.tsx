
import React from 'react';
import { Hotspot } from '../types';
import { Search, Filter, Download, MoreVertical, Calendar, User, Tag } from 'lucide-react';

interface HistoryTableProps {
  title: string;
  type: 'maintenance' | 'landscaping' | 'construction';
  facilities: Hotspot[];
}

const ORDERED_ORG_NAMES = [
  '충남정심원',
  '정심요양원',
  '정심작업장',
  '보령정심학교',
  '충남서부 장애인종합복지관'
];

const HistoryTable: React.FC<HistoryTableProps> = ({ title, type, facilities }) => {
  // 요청된 순서대로 시설물을 먼저 정렬한 후 이력을 추출하여 목록 순서 보장
  const sortedFacilities = [...facilities].sort((a, b) => {
    const indexA = ORDERED_ORG_NAMES.indexOf(a.name);
    const indexB = ORDERED_ORG_NAMES.indexOf(b.name);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const records = sortedFacilities.flatMap<any>(f => {
    if (type === 'construction') {
      return f.construction.map(c => ({ ...c, facilityName: f.name }));
    } else if (type === 'landscaping') {
      return f.landscaping.map((l, i) => ({ id: `l-${f.id}-${i}`, title: l, date: '2024-11-01', worker: '정심조경팀', facilityName: f.name }));
    } else {
      return f.history.map(h => ({ ...h, facilityName: f.name }));
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4 mr-2" /> 필터
          </button>
          <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
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
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record: any, index: number) => (
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

        {records.length === 0 && (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-medium">검색된 관리 이력이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTable;
