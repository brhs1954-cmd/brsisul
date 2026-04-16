
import React, { useState, useEffect } from 'react';
import { Hotspot } from '../types';
import HistoryTable from './HistoryTable';
import { Leaf, Sun, Wind, Snowflake, Calendar, CheckCircle2, Edit3, Save, X, RefreshCw } from 'lucide-react';
import { ApiService } from '../api';

interface LandscapingViewProps {
  facilities: Hotspot[];
  plans: any[];
  onRefresh: () => Promise<void>;
  onAdd: (data: { org: string; date: string; title: string; contractor: string; file?: { name: string; type: string; data: string } }) => void;
}

const LandscapingView: React.FC<LandscapingViewProps> = ({ facilities, plans, onRefresh, onAdd }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPlans, setEditedPlans] = useState<any[]>([]);

  useEffect(() => {
    if (plans && plans.length > 0) {
      setEditedPlans(plans.map(p => ({
        season: p.season,
        months: p.months,
        tasks: Array.isArray(p.tasks) ? p.tasks.join(', ') : String(p.tasks || '')
      })));
    }
  }, [plans]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await ApiService.updateLandscapingPlan(editedPlans);
      if (success) {
        alert('조경 관리 계획이 성공적으로 업데이트되었습니다.');
        setIsEditing(false);
        await onRefresh();
      } else {
        alert('업데이트 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskChange = (index: number, value: string) => {
    const newPlans = [...editedPlans];
    newPlans[index].tasks = value;
    setEditedPlans(newPlans);
  };

  const getIcon = (season: string) => {
    if (season.includes('봄')) return <Sun className="w-5 h-5 text-amber-500" />;
    if (season.includes('여름')) return <Leaf className="w-5 h-5 text-emerald-500" />;
    if (season.includes('가을')) return <Wind className="w-5 h-5 text-orange-400" />;
    return <Snowflake className="w-5 h-5 text-blue-400" />;
  };

  const getColors = (season: string) => {
    if (season.includes('봄')) return { bg: 'bg-amber-50', border: 'border-amber-100' };
    if (season.includes('여름')) return { bg: 'bg-emerald-50', border: 'border-emerald-100' };
    if (season.includes('가을')) return { bg: 'bg-orange-50', border: 'border-orange-100' };
    return { bg: 'bg-blue-50', border: 'border-blue-100' };
  };

  const displayPlans = editedPlans.length > 0 ? editedPlans : [
    { season: '봄 (Spring)', months: '3월 - 5월', tasks: '수목 식재 및 이식, 춘계 비료 살포, 교정 내 봄꽃 식재, 병충해 예방 방제' },
    { season: '여름 (Summer)', months: '6월 - 8월', tasks: '정기 예초 및 제초 작업, 수분 공급(관수), 하계 전정(가지치기), 돌발 해충 집중 방제' },
    { season: '가을 (Autumn)', months: '9월 - 11월', tasks: '추계 비료 살포, 낙엽 수거 및 청소, 월동 준비(짚싸기), 수형 정리 전정' },
    { season: '겨울 (Winter)', months: '12월 - 2월', tasks: '염화칼슘 피해 방지, 수목 월동 보호구 점검, 폭설 대비 가지 지지, 장비 정비' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* 월별 조경관리 계획 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-emerald-600" /> 월별 조경관리 연간 계획
            </h2>
            <p className="text-sm text-slate-500 mt-1">보령학사 단지 내 수목 및 녹지 공간의 최적 상태 유지를 위한 연간 일정입니다.</p>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center shadow-sm"
            >
              <Edit3 className="w-4 h-4 mr-2" /> 계획 수정하기
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center shadow-lg shadow-emerald-100"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                저장
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all flex items-center"
              >
                <X className="w-4 h-4 mr-2" /> 취소
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayPlans.map((plan, idx) => {
            const colors = getColors(plan.season);
            const tasks = typeof plan.tasks === 'string' ? plan.tasks.split(',').map(t => t.trim()) : [];
            
            return (
              <div 
                key={idx} 
                className={`${colors.bg} ${colors.border} border-2 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    {getIcon(plan.season)}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.months}</span>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-4">{plan.season}</h3>
                
                {isEditing ? (
                  <textarea
                    value={plan.tasks}
                    onChange={(e) => handleTaskChange(idx, e.target.value)}
                    className="w-full bg-white/50 border border-slate-200 rounded-xl p-3 text-[11px] font-bold text-slate-600 h-32 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="작업 내용을 콤마(,)로 구분하여 입력하세요"
                  />
                ) : (
                  <ul className="space-y-3">
                    {tasks.map((task, tidx) => (
                      <li key={tidx} className="flex items-start">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-slate-300 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[11px] font-bold text-slate-600 leading-tight">{task}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 구분선 */}
      <div className="h-px bg-slate-200"></div>

      {/* 기존 조경 관리 현황 (HistoryTable) */}
      <section>
        <HistoryTable 
          title="조경 및 수목 관리 실적 현황" 
          type="landscaping" 
          facilities={facilities} 
          onAdd={onAdd}
        />
      </section>
    </div>
  );
};

export default LandscapingView;
