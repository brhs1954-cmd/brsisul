
import React from 'react';
import { X, Calendar, Megaphone, Bell, Image as ImageIcon, Paperclip, Download } from 'lucide-react';
import { Notice } from '../types';

interface NoticeDetailModalProps {
  notice: Notice;
  onClose: () => void;
}

const NoticeDetailModal: React.FC<NoticeDetailModalProps> = ({ notice, onClose }) => {
  const downloadFile = (url: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `첨부파일_${notice.title}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className={`px-8 py-6 text-white flex items-center justify-between flex-shrink-0 ${notice.isUrgent ? 'bg-rose-600' : 'bg-slate-900'}`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">{notice.title}</h2>
                {notice.isUrgent && (
                  <span className="px-2 py-0.5 bg-white text-rose-600 rounded text-[9px] font-black uppercase flex items-center">
                    <Bell className="w-2 h-2 mr-1" /> 긴급
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-0.5">Announcement Detail</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1 bg-[#F8FAFC]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center text-xs font-bold text-slate-500">
              <Calendar className="w-4 h-4 mr-1.5" /> {notice.date}
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest">
              {notice.category}
            </span>
          </div>

          <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[100px]">
            {notice.content || "공지 내용이 없습니다."}
          </div>

          {notice.photoUrl && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <ImageIcon className="w-3 h-3 mr-1" /> 첨부 사진
              </p>
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <img src={notice.photoUrl} alt="공지 첨부 사진" className="w-full h-auto object-contain max-h-[400px]" />
              </div>
            </div>
          )}

          {notice.fileUrl && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                <Paperclip className="w-3 h-3 mr-1" /> 첨부 파일
              </p>
              <button 
                onClick={() => downloadFile(notice.fileUrl!)}
                className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 transition-all group shadow-sm"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-xl mr-3">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-slate-700">공지사항 첨부파일 다운로드</span>
                </div>
                <Download className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-xl shadow-slate-100">
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetailModal;
