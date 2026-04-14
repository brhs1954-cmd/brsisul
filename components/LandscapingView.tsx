
import React from 'react';
import { Hotspot } from '../types';
import HistoryTable from './HistoryTable';
import { Leaf, Sun, Wind, Snowflake, Calendar, CheckCircle2 } from 'lucide-react';

interface LandscapingViewProps {
  facilities: Hotspot[];
}

const MONTHLY_PLANS = [
  {
    season: '봄 (Spring)',
    months: '3월 - 5월',
    icon: <Sun className="w-5 h-5 text-amber-500" />,
    tasks: ['수목 식재 및 이식', '춘계 비료 살포', '교정 내 봄꽃 식재', '병충해 예방 방제'],
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-100'
  },
  {
    season: '여름 (Summer)',
    months: '6월 - 8월',
    icon: <Leaf className="w-5 h-5 text-emerald-500" />,
    tasks: ['정기 예초 및 제초 작업', '수분 공급(관수)', '하계 전정(가지치기)', '돌발 해충 집중 방제'],
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-100'
  },
  {
    season: '가을 (Autumn)',
    months: '9월 - 11월',
    icon: <Wind className="w-5 h-5 text-orange-400" />,
    tasks: ['추계 비료 살포', '낙엽 수거 및 청소', '월동 준비(짚싸기)', '수형 정리 전정'],
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-100'
  },
  {
    season: '겨울 (Winter)',
    months: '12월 - 2월',
    icon: <Snowflake className="w-5 h-5 text-blue-400" />,
    tasks: ['염화칼슘 피해 방지', '수목 월동 보호구 점검', '폭설 대비 가지 지지', '장비 정비'],
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100'
  }
];

const LandscapingView: React.FC<LandscapingViewProps> = ({ facilities }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* 월별 조경관리 계획 섹션 */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-emerald-600" /> 월별 조경관리 연간 계획
          </h2>
          <p className="text-sm text-slate-500 mt-1">보령학사 단지 내 수목 및 녹지 공간의 최적 상태 유지를 위한 연간 일정입니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MONTHLY_PLANS.map((plan, idx) => (
            <div 
              key={idx} 
              className={`${plan.bgColor} ${plan.borderColor} border-2 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  {plan.icon}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.months}</span>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-4">{plan.season}</h3>
              <ul className="space-y-3">
                {plan.tasks.map((task, tidx) => (
                  <li key={tidx} className="flex items-start">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-slate-300 mt-0.5 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[11px] font-bold text-slate-600 leading-tight">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
        />
      </section>
    </div>
  );
};

export default LandscapingView;
