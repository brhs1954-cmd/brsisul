
import React, { useState, useEffect, useRef } from 'react';
import { Equipment } from '../types';
import { X, Save, RefreshCw, Zap, Settings, Camera, Upload, Trash2, Image as ImageIcon, MessageSquare, MapPin, Phone, Truck } from 'lucide-react';
import { ApiService } from '../api';
import { compressImage } from '../lib/imageUtils';

interface EquipmentEditModalProps {
  equipment: Equipment;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const EquipmentEditModal: React.FC<EquipmentEditModalProps> = ({ 
  equipment, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<Omit<Equipment, 'status'>>({
    id: '',
    name: '',
    location: '',
    orgName: '',
    installDate: '',
    specs: '',
    cycle: '',
    manualUrl: '',
    photoUrl: '',
    asCompany: '',
    asTel: '',
    remarks: '',
    x: 50,
    y: 50
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (url.includes('drive.google.com')) {
      const match = url.match(/[-\w]{25,}/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[0]}`;
    }
    return url;
  };

  useEffect(() => {
    if (equipment) {
      setFormData({
        id: equipment.id || '',
        name: equipment.name || '',
        location: equipment.location || '',
        orgName: equipment.orgName || '',
        installDate: equipment.installDate || '',
        specs: equipment.specs || '',
        cycle: equipment.cycle || '',
        manualUrl: equipment.manualUrl || '',
        photoUrl: equipment.photoUrl || '',
        asCompany: equipment.asCompany || '',
        asTel: equipment.asTel || '',
        remarks: equipment.remarks || '',
        x: equipment.x ?? 50,
        y: equipment.y ?? 50
      });
    }
  }, [equipment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setFormData(prev => ({ ...prev, photoUrl: compressed }));
        } catch (error) {
          console.error("Image compression failed:", error);
          setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      alert('설비 ID와 명칭은 필수 입력 사항입니다.');
      return;
    }
    setIsSaving(true);
    try {
      let result;
      if (!equipment.id) {
        // New equipment
        result = await ApiService.addEquipment(formData);
        if (result.success) {
          alert(`[${formData.name}] 신규 설비가 성공적으로 등록되었습니다.`);
        } else {
          throw new Error('Save failed');
        }
      } else {
        // Update existing
        result = await ApiService.updateEquipmentInfo(equipment.id, formData);
        if (result.success) {
          alert(`[${formData.name}] 설비 정보가 성공적으로 업데이트되었습니다.`);
        } else {
          throw new Error('Update failed');
        }
      }
      await onSave();
    } catch (error) {
      console.error("Save error:", error);
      alert('저장 중 오류가 발생했습니다. 구글 시트 연결 상태나 권한을 확인해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const previewUrl = getImageUrl(formData.photoUrl);
  const isNew = !equipment.id;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <form 
        onSubmit={handleSubmit}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-2.5 rounded-2xl shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{isNew ? '신규 설비 자산 등록' : '설비 자산 정보 수정'}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Cloud Sync Enabled</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 flex items-center tracking-widest uppercase">
              <Camera className="w-4 h-4 mr-2 text-amber-500" /> 설비 현장 사진 관리
            </h3>
            <div className="flex flex-col md:flex-row gap-6 items-start bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="relative w-full md:w-48 aspect-square bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden group flex items-center justify-center">
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={removePhoto} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-[10px] font-black">사진 없음</p>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black hover:bg-blue-600 transition-all flex items-center justify-center">
                  <Upload className="w-4 h-4 mr-2" /> 사진 파일 선택
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                <div className="space-y-1.5 pt-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">사진 URL (J열 연동)</label>
                  <input name="photoUrl" value={formData.photoUrl.startsWith('data:') ? '이미지 파일 첨부됨' : formData.photoUrl} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-500" />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 flex items-center tracking-widest uppercase">
              <Settings className="w-4 h-4 mr-2 text-amber-500" /> 상세 제원 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">설비 고유 ID (필수)</label>
                <input 
                  name="id" 
                  value={formData.id} 
                  onChange={handleChange} 
                  disabled={!isNew}
                  placeholder="예: EQ-001"
                  className={`w-full border rounded-2xl px-5 py-3.5 text-sm font-bold outline-none transition-all shadow-sm ${isNew ? 'bg-white border-slate-200 focus:ring-2 focus:ring-amber-500 text-slate-700' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`} 
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">설비명 (필수)</label>
                <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> 설비위치 (C열)</label>
                <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">관리주체</label>
                <input name="orgName" value={formData.orgName} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">설치일자</label>
                <input name="installDate" type="date" value={formData.installDate} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" />
              </div>
            </div>

            <h3 className="text-xs font-black text-slate-400 flex items-center tracking-widest uppercase mt-4">
              <Truck className="w-4 h-4 mr-2 text-blue-500" /> 유지보수(AS) 정보 (K, L열)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/30 p-6 rounded-[2rem] border border-blue-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">As업체 (K열)</label>
                <input name="asCompany" value={formData.asCompany} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center"><Phone className="w-3 h-3 mr-1" /> 전화번호 (L열)</label>
                <input name="asTel" value={formData.asTel} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">주요 제원</label>
              <textarea name="specs" value={formData.specs} onChange={handleChange} rows={3} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm resize-none" />
            </div>

            {/* Added remarks field textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">비고 (Remarks)</label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={2} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm resize-none" />
            </div>
          </section>
        </div>

        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all">취소</button>
          <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-2xl hover:bg-amber-600 transition-all flex items-center justify-center">
            {isSaving ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            최종 데이터 저장 (Cloud Sync)
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentEditModal;
