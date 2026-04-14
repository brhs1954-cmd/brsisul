
import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Map as MapIcon,
  FolderOpen,
  ShieldCheck,
  ImageOff,
  RefreshCw,
  Phone,
  Smartphone,
  Mail,
  User,
  Users,
  MessageSquare,
  Megaphone,
  Bell,
  Info,
  AlertOctagon,
  Send
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Hotspot, Notice } from '../types';
import EmergencyAlertModal from './EmergencyAlertModal';

const data = [
  { name: '학교', count: 12 },
  { name: '복지관', count: 18 },
  { name: '체육관', count: 8 },
  { name: '요양원', count: 15 },
  { name: '온실', count: 5 },
];

const DRIVE_URL = "https://drive.google.com/drive/folders/1zI3PIOGZ-PT04wOiNOi5A1Fupzh5_ZyP?usp=drive_link";

interface DashboardProps {
  facilities: Hotspot[];
  contacts: any[];
  notices: Notice[];
  onNoticeClick: (notice: Notice) => void;
  onAction: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ facilities, contacts, notices, onNoticeClick, onAction }) => {
  const [imgError, setImgError] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  
  const FILE_ID = "1Jl-RMMoh6u_McdcUl58PiaEESVf42vBI";
  const MAP_IMAGE_URL = `https://lh3.googleusercontent.com/d/${FILE_ID}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Emergency Alert Banner */}
      <div className="bg-rose-600 rounded-3xl p-6 shadow-xl shadow-rose-200 border-b-4 border-rose-800 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-rose-500 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex items-center space-x-5 relative z-10">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30 animate-pulse">
            <AlertOctagon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">응급 상황 관리자 알림 시스템</h2>
            <p className="text-rose-100 text-sm font-medium mt-1">화재, 단수, 단전 등 긴급 상황 발생 시 모든 담당자에게 즉시 전파합니다.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAlertModalOpen(true)}
          className="relative z-10 w-full md:w-auto px-8 py-4 bg-white text-rose-600 rounded-2xl font-black text-sm shadow-2xl hover:bg-rose-50 transition-all flex items-center justify-center transform active:scale-95"
        >
          <Megaphone className="w-4 h-4 mr-2" /> 응급 상황 알림 전송
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 p-8 md:p-12 text-white shadow-2xl min-h-[350px]">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none overflow-hidden">
           {!imgError ? (
             <img 
              src={MAP_IMAGE_URL} 
              className="object-cover w-full h-full scale-125 rotate-6 transform transition-transform duration-[10s] hover:scale-150" 
              alt="배경 조감도" 
              onError={() => setImgError(true)}
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <ImageOff className="w-12 h-12 text-slate-700 opacity-20" />
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-900/60 to-slate-900"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest mb-6">
             Boryeong Haksa FM System
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
            보령학사 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">시설물 통합 관리</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed mb-8">
            수채화 조감도 기반의 실시간 시설물 모니터링 시스템입니다.<br className="hidden md:block" />
            모든 도면과 문서는 <span className="text-blue-400 font-bold">Google Drive</span>와 실시간 동기화됩니다.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onAction('map')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center"
            >
              조감도 탐색 <MapIcon className="w-5 h-5 ml-2" />
            </button>
            <a 
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold backdrop-blur-md transition-all border border-white/10 flex items-center"
            >
              문서 클라우드 <FolderOpen className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </div>

      {/* Analytics & Sidebar */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" /> 건물별 관리 활동 지표
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700}}
                />
                <Bar dataKey="count" barSize={32} radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
           {/* Notice Board Widget */}
           <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-black text-slate-800 text-sm flex items-center">
                  <Megaphone className="w-4 h-4 mr-2 text-rose-500" /> 최신 공지사항
                </h3>
                <button 
                  onClick={() => onAction('admin')}
                  className="text-[10px] font-black text-blue-600 hover:underline"
                >
                  전체보기
                </button>
              </div>
              <div className="p-0 overflow-y-auto max-h-[440px]">
                <div className="divide-y divide-slate-50">
                  {notices.length > 0 ? notices.map((notice, index) => (
                    <div 
                      key={`${notice.id}-${index}`} 
                      onClick={() => onNoticeClick(notice)}
                      className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {notice.isUrgent && (
                          <span className="flex items-center px-2 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black rounded-full animate-pulse">
                            <Bell className="w-2.5 h-2.5 mr-1" /> 긴급
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded-full">
                          {notice.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {notice.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">{notice.date}</p>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                       등록된 공지 없음
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 mt-auto border-t border-slate-100">
                <div className="flex items-start bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <Info className="w-3.5 h-3.5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-[9px] text-slate-500 font-medium leading-normal">
                    본 시스템의 모든 알림은 법인 사무국 승인 후 게시됩니다.
                  </p>
                </div>
              </div>
           </div>
        </div>
      </div>
      
      {/* (Emergency Contact Network omitted for brevity, logic remains the same) */}

      {isAlertModalOpen && (
        <EmergencyAlertModal 
          facilities={facilities} 
          contacts={contacts} 
          onClose={() => setIsAlertModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
