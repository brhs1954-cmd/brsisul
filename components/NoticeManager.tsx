
import React, { useState, useRef } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Paperclip, 
  Bell, 
  Save, 
  X, 
  RefreshCw,
  FileText,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Notice } from '../types';
import { ApiService } from '../api';

interface NoticeManagerProps {
  notices: Notice[];
  onRefresh: () => Promise<void>;
  onViewNotice: (notice: Notice) => void;
}

const NoticeManager: React.FC<NoticeManagerProps> = ({ notices, onRefresh, onViewNotice }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Notice>>({
    title: '',
    category: '시설',
    isUrgent: false,
    content: '',
    photoUrl: '',
    fileUrl: ''
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'photo') {
        setFormData(prev => ({ 
          ...prev, 
          photoUrl: base64,
          photoName: file.name,
          photoType: file.type,
          photoData: base64
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          fileUrl: base64,
          fileName: file.name,
          fileType: file.type,
          fileData: base64
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ApiService.submitData({
        org: '시스템관리자',
        category: 'NOTICE',
        title: formData.title || '',
        value: {
          ...formData,
          date: new Date().toISOString().split('T')[0]
        }
      });
      alert('공지사항이 성공적으로 등록되었습니다.');
      setIsAdding(false);
      setFormData({ 
        title: '', 
        category: '시설', 
        isUrgent: false, 
        content: '', 
        photoUrl: '', 
        fileUrl: '',
        photoName: undefined,
        photoType: undefined,
        photoData: undefined,
        fileName: undefined,
        fileType: undefined,
        fileData: undefined
      });
      await onRefresh();
    } catch (error) {
      alert('등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까? (구글 시트에서도 삭제됩니다)')) return;
    setDeletingId(id);
    try {
      await ApiService.deleteNotice(id);
      await onRefresh();
      alert('공지사항이 삭제되었습니다.');
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">공지사항 시스템 관리</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Notice & Announcement Board</p>
          </div>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center shadow-lg hover:bg-rose-600 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> 새 공지 등록
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 animate-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-black text-slate-700 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-rose-500" /> 신규 공지사항 작성
            </h4>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">공지 제목</label>
                <input 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">분류</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
                  >
                    <option value="시설">시설</option>
                    <option value="조경">조경</option>
                    <option value="행정">행정</option>
                    <option value="안전">안전</option>
                    <option value="수질">수질</option>
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-center pt-4">
                  <label className="flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      name="isUrgent"
                      checked={formData.isUrgent}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-rose-600 bg-white border-slate-300 rounded focus:ring-rose-500 mr-2"
                    />
                    <span className="text-xs font-black text-rose-600 uppercase tracking-widest">긴급 공지 설정</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">공지 내용</label>
              <textarea 
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 h-32 resize-none"
                placeholder="공지 상세 내용을 작성하세요..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center">
                  <ImageIcon className="w-3 h-3 mr-1" /> 사진 첨부
                </label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-all flex items-center"
                  >
                    {formData.photoUrl ? '이미지 변경됨' : '이미지 선택'}
                  </button>
                  {formData.photoUrl && (
                    <button type="button" onClick={() => setFormData(p => ({...p, photoUrl: ''}))} className="p-3 bg-rose-50 text-rose-500 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'photo')} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center">
                  <Paperclip className="w-3 h-3 mr-1" /> 일반 파일 첨부
                </label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-all flex items-center"
                  >
                    {formData.fileUrl ? '파일 선택됨' : '파일 선택'}
                  </button>
                  {formData.fileUrl && (
                    <button type="button" onClick={() => setFormData(p => ({...p, fileUrl: ''}))} className="p-3 bg-rose-50 text-rose-500 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, 'file')} />
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                시스템 공지 게시하기
              </button>
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">구분</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">제목</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">분류</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">게시일</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">첨부</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">기능</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {notices.length > 0 ? (
                  notices.map((notice, index) => (
                    <tr key={`${notice.id}-${index}`} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-center">
                        {notice.isUrgent ? (
                          <Bell className="w-4 h-4 text-rose-600 animate-bounce mx-auto" />
                        ) : (
                          <div className="w-2 h-2 bg-slate-200 rounded-full mx-auto"></div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${notice.isUrgent ? 'text-rose-600' : 'text-slate-800'}`}>
                          {notice.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full">
                          {notice.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-400">
                        {notice.date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {notice.photoUrl && <ImageIcon className="w-4 h-4 text-blue-400" />}
                          {notice.fileUrl && <Paperclip className="w-4 h-4 text-emerald-400" />}
                          {!notice.photoUrl && !notice.fileUrl && <span className="text-[10px] text-slate-300">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onViewNotice(notice)}
                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="내용 보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(notice.id)}
                            disabled={deletingId === notice.id}
                            className={`p-2 rounded-lg transition-all ${deletingId === notice.id ? 'text-rose-300' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                            title="삭제"
                          >
                            {deletingId === notice.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-slate-100 mb-4" />
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">게시된 공지사항이 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeManager;
