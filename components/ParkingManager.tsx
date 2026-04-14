
import React from 'react';
import { PARKING_DATA } from '../data';
import { Car, Circle, AlertCircle, Info } from 'lucide-react';

const ParkingManager: React.FC = () => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">실시간 주차 현황</h2>
          <p className="text-sm text-slate-500 mt-1">단지 내 주요 주차장별 가용 공간을 확인하세요.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center text-xs font-bold text-slate-600">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1.5"></div> 여유
          </div>
          <div className="flex items-center text-xs font-bold text-slate-600">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-1.5"></div> 혼잡
          </div>
          <div className="flex items-center text-xs font-bold text-slate-600">
            <div className="w-3 h-3 bg-rose-500 rounded-full mr-1.5"></div> 만차
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {PARKING_DATA.map((area, index) => {
          const occupancyRate = (area.occupiedSpots / area.totalSpots) * 100;
          let statusColor = 'bg-green-500';
          let textColor = 'text-green-600';
          if (occupancyRate > 90) { statusColor = 'bg-rose-500'; textColor = 'text-rose-600'; }
          else if (occupancyRate > 70) { statusColor = 'bg-amber-500'; textColor = 'text-amber-600'; }

          return (
            <div key={`${area.id}-${index}`} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-xl mr-4">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{area.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Parking Area</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColor} text-white`}>
                  {occupancyRate > 90 ? 'Full' : occupancyRate > 70 ? 'Busy' : 'Open'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-500">점유율</span>
                  <span className={`text-xl font-black ${textColor}`}>{Math.round(occupancyRate)}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${statusColor} transition-all duration-1000`} 
                    style={{ width: `${occupancyRate}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">전체</p>
                    <p className="text-sm font-bold text-slate-800">{area.totalSpots}</p>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">잔여</p>
                    <p className="text-sm font-bold text-slate-800">{area.totalSpots - area.occupiedSpots}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">장애인 전용</p>
                    <p className="text-sm font-bold text-blue-600">{area.disabledSpots}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start">
        <Info className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>주차 관리 시스템 안내:</strong> 현재 데이터는 5분 간격으로 업데이트됩니다. 장애인 전용 구역에 일반 차량이 주차되지 않도록 계도 및 순찰을 강화해 주시기 바랍니다. 긴급 상황 발생 시 법인 사무국으로 연락 바랍니다.
        </p>
      </div>
    </div>
  );
};

export default ParkingManager;
