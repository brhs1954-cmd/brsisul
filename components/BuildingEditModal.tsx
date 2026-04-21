
import React, { useState, useEffect, useRef } from 'react';
import { Hotspot } from '../types';
import { X, Save, RefreshCw, Info, MapPin, DollarSign, Image as ImageIcon, FileText, Landmark, ExternalLink, ShieldCheck, DownloadCloud, Camera, Upload, Trash2 } from 'lucide-react';
import { ApiService } from '../api';
import { compressImage } from '../lib/imageUtils';

interface BuildingEditModalProps {
  facility: Hotspot;
  initialSection?: 'basic' | 'detail';
  onClose: () => void;
  onSave: () => Promise<void>;
}

const BuildingEditModal: React.FC<BuildingEditModalProps> = ({ 
  facility, 
  initialSection = 'basic', 
  onClose, 
  onSave 
}) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'detail'>(initialSection);
  const [formData, setFormData] = useState({
    name: '',
    structure: '',
    floors: '',
    area: '',
    completionDate: '',
    safetyGrade: 'A' as any,
    lastSafetyCheck: '',
    address: '',
    valuation: '',
    bookValue: '',
    usage: '',
    floorPlanUrl: '',
    registrationTranscriptUrl: '',
    buildingLedgerUrl: '',
    roofType: '',
    heatingType: '',
    elevatorCount: '',
    exteriorFinish: '',
    parkingCapacity: '',
    photoUrl: '',
    x: 0,
    y: 0
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; type: string; data: string } | null>(null);
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
    if (facility && facility.buildingInfo) {
      setFormData({
        name: facility.name || '',
        structure: facility.buildingInfo.structure || '',
        floors: facility.buildingInfo.floors || '',
        area: facility.buildingInfo.area || '',
        completionDate: facility.buildingInfo.completionDate || '',
        safetyGrade: facility.buildingInfo.safetyGrade || 'A',
        lastSafetyCheck: facility.buildingInfo.lastSafetyCheck || '',
        address: facility.buildingInfo.address || '',
        valuation: facility.buildingInfo.valuation || '',
        bookValue: facility.buildingInfo.bookValue || '',
        usage: facility.buildingInfo.usage || '',
        floorPlanUrl: facility.buildingInfo.floorPlanUrl || '',
        registrationTranscriptUrl: facility.buildingInfo.registrationTranscriptUrl || '',
        buildingLedgerUrl: facility.buildingInfo.buildingLedgerUrl || '',
        roofType: facility.buildingInfo.roofType || '',
        heatingType: facility.buildingInfo.heatingType || '',
        elevatorCount: facility.buildingInfo.elevatorCount || '',
        exteriorFinish: facility.buildingInfo.exteriorFinish || '',
        parkingCapacity: facility.buildingInfo.parkingCapacity || '',
        photoUrl: facility.buildingInfo.photoUrl || '',
        x: facility.x || 0,
        y: facility.y || 0
      });
      setFileDetails(null);
    }
  }, [facility]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          setFileDetails({
            name: file.name,
            type: file.type,
            data: compressed
          });
        } catch (error) {
          console.error("Image compression failed:", error);
          setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
          setFileDetails({
            name: file.name,
            type: file.type,
            data: reader.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photoUrl: '' }));
    setFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 폼 데이터와 파일 정보를 결합
      const submitInfo = {
        ...formData,
        fileData: fileDetails?.data,
        fileName: fileDetails?.name,
        fileType: fileDetails?.type
      };
      
      const result = await ApiService.updateBuildingInfo(facility.id, submitInfo);
      if (result.success) {
        await onSave();
        alert(`시트 정보가 성공적으로 저장되었습니다.`);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error("Save error:", error);
      alert('저장 중 오류가 발생했습니다. 구글 시트 연결 상태나 권한을 확인해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const openLink = (url: string) => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      alert('유효한 링크 주소를 먼저 입력해주세요.');
    }
  };

  const previewUrl = getImageUrl(formData.photoUrl);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <form 
        onSubmit={handleSubmit}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]"
      >
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-black tracking-tight">제원 및 도면 정보 수정</h2>
                <span className="px-1.5 py-0.5 bg-white/10 text-white/60 rounded text-[9px] font-black border border-white/10">
                   ID: {facility.id}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Cloud Connected</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
           <button 
            type="button"
            onClick={() => setActiveSection('basic')}
            className={`flex-1 py-3 text-xs font-black transition-all ${activeSection === 'basic' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
           >
             공통 제원 (구조/안전)
           </button>
           <button 
            type="button"
            onClick={() => setActiveSection('detail')}
            className={`flex-1 py-3 text-xs font-black transition-all ${activeSection === 'detail' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
           >
             자산 및 도면 (상세)
           </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
           {activeSection === 'basic' ? (
             <div className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">기관/건축물 명칭</label>
                  <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" required />
               </div>

               <div className="space-y-4">
                 <h3 className="text-xs font-black text-slate-400 flex items-center tracking-widest uppercase">
                   <Camera className="w-4 h-4 mr-2 text-blue-500" /> 건축물 현장 사진 관리
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
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">사진 URL (시트 연동)</label>
                       <input name="photoUrl" value={formData.photoUrl.startsWith('data:') ? '이미지 파일 첨부됨' : formData.photoUrl} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold text-slate-500" />
                     </div>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">구조 형식</label>
                    <input name="structure" value={formData.structure} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">규모 (층수)</label>
                    <input name="floors" value={formData.floors} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">지붕구조 (I열)</label>
                    <input name="roofType" value={formData.roofType} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">냉난방방식 (J열)</label>
                    <input name="heatingType" value={formData.heatingType} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">승강기대수 (K열)</label>
                    <input name="elevatorCount" value={formData.elevatorCount} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">주차대수 (L열)</label>
                    <input name="parkingCapacity" value={formData.parkingCapacity} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">외벽마감 (M열)</label>
                    <input name="exteriorFinish" value={formData.exteriorFinish} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" />
                  </div>
               </div>
             </div>
           ) : (
             <div className="space-y-8">
               <section className="space-y-4">
                 <h3 className="text-xs font-black text-blue-600 flex items-center tracking-widest uppercase">
                   <Info className="w-4 h-4 mr-2" /> 자산 및 기본 정보
                 </h3>
                 <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> 건축물 소재지 (Q열 - address)
                      </label>
                      <input name="address" value={formData.address} onChange={handleChange} placeholder="정확한 지번 주소를 입력하세요" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" /> 평가액 (R열 - valuation)
                        </label>
                        <input name="valuation" value={formData.valuation} onChange={handleChange} placeholder="숫자만 입력" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center tracking-widest">
                           <Landmark className="w-3 h-3 mr-1" /> 장부가액 (S열 - bookValue)
                        </label>
                        <input name="bookValue" value={formData.bookValue} onChange={handleChange} placeholder="숫자만 입력" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">주요 용도 (T열 - usage)</label>
                      <input name="usage" value={formData.usage} onChange={handleChange} placeholder="예: 작업장" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm" />
                    </div>
                 </div>
               </section>

               <section className="space-y-4">
                 <h3 className="text-xs font-black text-emerald-600 flex items-center tracking-widest uppercase">
                   <ImageIcon className="w-4 h-4 mr-2" /> 도면 및 대장 (U, V, W열 링크 관리)
                 </h3>
                 <div className="grid grid-cols-1 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {/* 평면도 (U) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center">
                        <ImageIcon className="w-3 h-3 mr-1" /> 평면도 링크 (U열)
                      </label>
                      <div className="flex gap-2">
                        <input name="floorPlanUrl" value={formData.floorPlanUrl} onChange={handleChange} placeholder="구글 드라이브 링크 붙여넣기" className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button type="button" onClick={() => openLink(formData.floorPlanUrl)} className="px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center shadow-lg shadow-emerald-100">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 등기부등본 (W) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" /> 등기부등본 링크 (W열)
                      </label>
                      <div className="flex gap-2">
                        <input name="registrationTranscriptUrl" value={formData.registrationTranscriptUrl} onChange={handleChange} placeholder="구글 드라이브 링크 붙여넣기" className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="button" onClick={() => openLink(formData.registrationTranscriptUrl)} className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center shadow-lg shadow-blue-100">
                          <DownloadCloud className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 건축물대장 (V) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center">
                        <FileText className="w-3 h-3 mr-1" /> 건축물대장 링크 (V열)
                      </label>
                      <div className="flex gap-2">
                        <input name="buildingLedgerUrl" value={formData.buildingLedgerUrl} onChange={handleChange} placeholder="구글 드라이브 링크 붙여넣기" className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-slate-500" />
                        <button type="button" onClick={() => openLink(formData.buildingLedgerUrl)} className="px-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors flex items-center">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                 </div>
               </section>
             </div>
           )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all">취소</button>
          <button type="submit" disabled={isSaving} className="flex-2 px-12 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-50">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            최종 데이터 저장
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuildingEditModal;
