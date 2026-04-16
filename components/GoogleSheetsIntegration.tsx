
import React, { useState } from 'react';
import { FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { GOOGLE_SHEET_API_URL } from '../data';
import { ApiService } from '../api';
import { formatTimestampToKST } from '../lib/dateUtils';

const GoogleSheetsIntegration: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>("미실행");
  const [syncError, setSyncError] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncError(false);
    
    const data = await ApiService.fetchData();
    
    if (data) {
      setLastSync(formatTimestampToKST(new Date()));
    } else {
      setSyncError(true);
    }
    
    setTimeout(() => setIsSyncing(false), 800);
  };

  return (
    <div className="bg-emerald-50 border-2 border-emerald-100 rounded-3xl p-8 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200/20 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center space-x-5">
          <div className="bg-emerald-600 p-4 rounded-2xl shadow-xl shadow-emerald-200">
            <FileSpreadsheet className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-slate-900">Google Sheets 실시간 연동</h2>
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-full animate-pulse uppercase">Live Sync</span>
            </div>
            <p className="text-sm text-slate-500 font-medium max-w-lg">
              현장에서 입력한 데이터는 구글 시트에 즉시 기록됩니다. 제공해주신 API 웹 앱 주소와 안전하게 통신합니다.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleManualSync}
            disabled={isSyncing}
            className={`flex-1 md:flex-none px-6 py-3 bg-white text-emerald-600 border border-emerald-200 rounded-2xl font-black text-xs hover:bg-emerald-50 transition-all flex items-center justify-center shadow-sm disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> 강제 동기화
          </button>
          <a 
            href={GOOGLE_SHEET_API_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center justify-center shadow-xl shadow-emerald-100"
          >
            연동 서버 확인 <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-emerald-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center text-[10px] font-bold text-emerald-700">
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> 최종 연동 확인: {lastSync}
        </div>
        <div className="flex items-center text-[10px] font-bold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> 데이터 암호화 전송 (HTTPS/TLS)
        </div>
        <div className="flex items-center text-[10px] font-bold text-emerald-700">
          {syncError ? (
             <span className="flex items-center text-rose-500"><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> 통신 상태 확인 필요</span>
          ) : (
             <span className="flex items-center"><FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> 연동 모드: 웹 앱 API (GAS)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsIntegration;
