
import React, { useState } from 'react';
import { 
  X, 
  AlertOctagon, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  Megaphone, 
  Building2, 
  Users, 
  AlertTriangle,
  Flame,
  Droplets,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { Hotspot } from '../types';
import { ApiService } from '../api';
import { formatTimestampToKST } from '../lib/dateUtils';

interface EmergencyAlertModalProps {
  facilities: Hotspot[];
  contacts: any[];
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'fire', name: '화재/소방', icon: <Flame className="w-4 h-4 text-rose-500" /> },
  { id: 'water', name: '단수/누수', icon: <Droplets className="w-4 h-4 text-blue-500" /> },
  { id: 'power', name: '단전/정전', icon: <Zap className="w-4 h-4 text-amber-500" /> },
  { id: 'medical', name: '응급환자/의료', icon: <ShieldAlert className="w-4 h-4 text-rose-600" /> },
  { id: 'security', name: '보안/외부침입', icon: <AlertOctagon className="w-4 h-4 text-slate-700" /> },
  { id: 'other', name: '기타 긴급', icon: <AlertTriangle className="w-4 h-4 text-slate-400" /> },
];

const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({ facilities, contacts, onClose }) => {
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !selectedCategory) {
      alert('시설과 상황 유형을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryName = CATEGORIES.find(c => c.id === selectedCategory)?.name || '기타';
      const facilityName = facilities.find(f => f.id === selectedFacility)?.name || '알 수 없음';

      await ApiService.submitData({
        org: facilityName,
        category: 'EMERGENCY_ALERT',
        title: `[긴급] ${categoryName} 상황 발생`,
        value: {
          category: categoryName,
          message: message,
          timestamp: formatTimestampToKST(new Date())
        }
      });
      
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      alert('알림 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
        <div className="relative bg-white p-12 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">알림 전송 완료</h2>
          <p className="text-slate-500 font-medium">모든 담당자에게 응급 상황이 <br/> 즉시 전달되었습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="bg-rose-600 p-8 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">응급 상황 알림 센터</h2>
                <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mt-1">Admin Emergency Dispatch</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                <Building2 className="w-3 h-3 inline mr-1 mb-0.5" /> 발생 시설 선택
              </label>
              <select 
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all appearance-none"
                required
              >
                <option value="">시설을 선택하세요</option>
                {facilities.map((f, index) => (
                  <option key={`${f.id}-${index}`} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" /> 상황 유형
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center p-4 border rounded-2xl transition-all ${
                      selectedCategory === cat.id 
                        ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500' 
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="mr-3">{cat.icon}</div>
                    <span className={`text-xs font-black ${selectedCategory === cat.id ? 'text-rose-600' : 'text-slate-600'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                <Megaphone className="w-3 h-3 inline mr-1 mb-0.5" /> 현장 상세 내용 (선택사항)
              </label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="현재 상황이나 필요한 조치를 간단히 기입하세요..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all h-24 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-center space-x-3 mb-3">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">전파 대상자 ({contacts.length})</span>
             </div>
             <div className="flex flex-wrap gap-1.5">
                {contacts.slice(0, 5).map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold text-slate-600">
                    {c.manager}
                  </span>
                ))}
                {contacts.length > 5 && <span className="text-[9px] font-bold text-slate-400 self-center">외 {contacts.length - 5}명</span>}
             </div>
          </div>

          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
              긴급 알림 즉시 전송
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyAlertModal;
