
import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Map as MapIcon, 
  ClipboardList, 
  Trees, 
  Hammer, 
  Car, 
  ChevronRight, 
  Bell, 
  Menu, 
  X,
  Activity,
  Settings,
  Droplets,
  Building2,
  Zap,
  Truck,
  RefreshCw,
  Edit,
  Save,
  CheckCircle2,
  Lock,
  UserCheck,
  Globe,
  Waypoints
} from 'lucide-react';
import { FACILITIES as INITIAL_FACILITIES, NOTICES as INITIAL_NOTICES } from './data';
import { Hotspot, FacilityStatus, ContactInfo, Vehicle, Equipment, Notice, FacilityPath, PathPoint } from './types';
import InteractiveMap from './components/InteractiveMap';
import FacilityDetailModal from './components/FacilityDetailModal';
import EquipmentDetailModal from './components/EquipmentDetailModal';
import Dashboard from './components/Dashboard';
import ParkingManager from './components/ParkingManager';
import HistoryTable from './components/HistoryTable';
import LandscapingView from './components/LandscapingView';
import WaterQualityView from './components/WaterQualityView';
import BuildingManager from './components/BuildingManager';
import EquipmentManager from './components/EquipmentManager';
import VehicleManager from './components/VehicleManager';
import GoogleSheetsIntegration from './components/GoogleSheetsIntegration';
import NoticeManager from './components/NoticeManager'; 
import NoticeDetailModal from './components/NoticeDetailModal'; 
import { ApiService } from './api';

export interface ExtendedContactInfo extends ContactInfo {
  orgName: string;
}

const formatDateToKST = (input: any): string => {
  if (!input) return "";
  const date = new Date(input);
  if (isNaN(date.getTime())) return String(input);
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + kstOffset);
  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'building' | 'equipment' | 'history' | 'landscaping' | 'water' | 'vehicle' | 'construction' | 'parking' | 'admin'>('home');
  const [selectedFacility, setSelectedFacility] = useState<Hotspot | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [isMapEditMode, setIsMapEditMode] = useState(false);
  const [isPathEditMode, setIsPathEditMode] = useState(false);
  
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [adminOrg, setAdminOrg] = useState<string | 'ALL'>('ALL');
  
  const [facilities, setFacilities] = useState<Hotspot[]>([]);
  const [contacts, setContacts] = useState<ExtendedContactInfo[]>([]);
  const [rawVehicles, setRawVehicles] = useState<Vehicle[]>([]);
  const [rawEquipment, setRawEquipment] = useState<Equipment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]); 
  const [paths, setPaths] = useState<FacilityPath[]>([]);

  // 디바운스 처리를 위한 타이머 레프
  const updateTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const getSheetValue = (row: any, ...keys: string[]) => {
    if (!row) return undefined;
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const actualKey = rowKeys.find(rk => rk.trim().toLowerCase() === key.toLowerCase());
      if (actualKey && row[actualKey] !== undefined && row[actualKey] !== "") {
        return row[actualKey];
      }
    }
    return undefined;
  };

  const refreshDataFromSheets = async () => {
    try {
      const [buildingData, infoData, vehicleData, equipmentData, noticeData, pathData, logData] = await Promise.all([
        ApiService.fetchData("건축물관리"),
        ApiService.fetchData("info"),
        ApiService.fetchData("차량현황"),
        ApiService.fetchData("설비관리"),
        ApiService.fetchData("공지사항"),
        ApiService.fetchData("관로관리"),
        ApiService.fetchData("log")
      ]);

      if (infoData && Array.isArray(infoData)) {
        const mappedContacts = infoData.map((row: any) => ({
          orgName: String(getSheetValue(row, '기관명') || '').trim(),
          dept: String(getSheetValue(row, '관리부서') || '').trim(),
          manager: String(getSheetValue(row, '시설관리실무자') || '').trim(),
          tel: String(getSheetValue(row, '전화번호') || '').trim(),
          mobile: String(getSheetValue(row, '휴대전화') || '').trim(),
          email: String(getSheetValue(row, '이메일') || '').trim(),
          remarks: String(getSheetValue(row, '비고') || '').trim()
        })).filter(c => c.orgName);
        setContacts(mappedContacts);
      }

      if (vehicleData && Array.isArray(vehicleData)) {
        const vehicleList = vehicleData.map((row: any) => ({
          id: String(getSheetValue(row, '차량번호') || '').trim(),
          type: String(getSheetValue(row, '차종') || '').includes('버스') ? 'BUS' : 'CAR',
          model: String(getSheetValue(row, '차종', '모델/차종') || ''),
          plateNumber: String(getSheetValue(row, '차량번호') || ''),
          status: 'OPERATING',
          mileage: Number(getSheetValue(row, '주행거리') || 0),
          lastInspection: formatDateToKST(getSheetValue(row, '최종검사')),
          nextInspection: formatDateToKST(getSheetValue(row, '차기검사')),
          orgName: String(getSheetValue(row, '소속기관', '기관명') || '').trim(),
          // '차주 및 비고' 컬럼을 최우선으로 참고하도록 수정
          ownerInfo: String(getSheetValue(row, '차주 및 비고', '비고및차주', '비고') || '').trim()
        } as Vehicle));
        setRawVehicles(vehicleList);
      }

      if (equipmentData && Array.isArray(equipmentData)) {
        const eqList = equipmentData.map((row: any) => ({
          id: String(getSheetValue(row, 'id') || '').trim(),
          name: String(getSheetValue(row, '설비명') || '').trim(),
          location: String(getSheetValue(row, '설비위치') || '').trim(),
          orgName: String(getSheetValue(row, '관리주체') || '').trim(),
          installDate: formatDateToKST(getSheetValue(row, '설치일')),
          specs: String(getSheetValue(row, '주요제원') || '').trim(),
          cycle: String(getSheetValue(row, '관리주기') || '').trim(),
          manualUrl: String(getSheetValue(row, '관리메뉴얼') || '').trim(),
          photoUrl: String(getSheetValue(row, '사진') || '').trim(),
          asCompany: String(getSheetValue(row, 'As업체') || '').trim(),
          asTel: String(getSheetValue(row, '전화번호') || '').trim(),
          status: 'RUNNING',
          remarks: String(getSheetValue(row, '비고') || '').trim(),
          x: parseFloat(getSheetValue(row, 'coordX', 'x') || '0'),
          y: parseFloat(getSheetValue(row, 'coordY', 'y') || '0'),
        } as Equipment)).filter(eq => eq.name);
        setRawEquipment(eqList);
      }

      if (noticeData && Array.isArray(noticeData)) {
        const noticeList = noticeData.map((row: any) => ({
          id: String(getSheetValue(row, 'id') || '').trim(),
          title: String(getSheetValue(row, 'title', '제목') || '').trim(),
          date: formatDateToKST(getSheetValue(row, 'date', '게시일')),
          isUrgent: String(getSheetValue(row, 'isUrgent', '긴급여부')) === 'true',
          category: (getSheetValue(row, 'category', '분류') || '시설') as any,
          content: String(getSheetValue(row, 'content', '내용') || ''),
          photoUrl: String(getSheetValue(row, 'photoUrl', '사진URL') || ''),
          fileUrl: String(getSheetValue(row, 'fileUrl', '파일URL') || '')
        } as Notice)).sort((a, b) => b.id.localeCompare(a.id)); 
        setNotices(noticeList);
      }

      if (pathData && Array.isArray(pathData)) {
        const pathList = pathData.map((row: any) => {
          try {
            const pointsRaw = getSheetValue(row, 'points', '좌표');
            if (!pointsRaw) return null;
            
            return {
              id: String(getSheetValue(row, 'id') || ''),
              name: String(getSheetValue(row, 'name', '이름') || ''),
              type: String(getSheetValue(row, 'type', '유형') || 'water') as any,
              color: String(getSheetValue(row, 'color', '색상') || '#3b82f6'),
              points: JSON.parse(pointsRaw)
            } as FacilityPath;
          } catch(e) {
            console.error("Path parsing error:", e);
            return null;
          }
        }).filter(p => p && p.points && p.points.length > 0);
        setPaths(pathList as FacilityPath[]);
      }

      let historyMap: Record<string, any[]> = {};
      if (logData && Array.isArray(logData)) {
        logData.forEach((row: any) => {
          const org = String(getSheetValue(row, 'org') || '').trim();
          const category = String(getSheetValue(row, 'category') || '').trim();
          if (category.toUpperCase() === 'MAINTENANCE') {
            if (!historyMap[org]) historyMap[org] = [];
            
            let value = {};
            try {
              const valRaw = getSheetValue(row, 'value');
              value = typeof valRaw === 'string' ? JSON.parse(valRaw) : (valRaw || {});
            } catch(e) {}

            historyMap[org].push({
              id: `log-${Date.now()}-${Math.random()}`,
              date: formatDateToKST(getSheetValue(row, 'timestamp')),
              type: 'maintenance',
              description: String(getSheetValue(row, 'title') || ''),
              worker: (value as any).worker || '관리자'
            });
          }
        });
        // 최신순 정렬
        Object.keys(historyMap).forEach(key => {
          historyMap[key].sort((a, b) => b.date.localeCompare(a.date));
        });
      }

      if (buildingData && Array.isArray(buildingData)) {
        const mergedFacilities = buildingData.map((row: any) => {
          const rowId = String(getSheetValue(row, 'id') || '').trim();
          const facilityName = String(getSheetValue(row, 'name', '이름', '시설명') || '').trim();
          
          return {
            id: rowId,
            name: facilityName,
            description: String(getSheetValue(row, 'usage', '주요용도') || ''),
            x: parseFloat(getSheetValue(row, 'coordX', 'x') || '0'),
            y: parseFloat(getSheetValue(row, 'coordY', 'y') || '0'),
            status: FacilityStatus.NORMAL,
            history: historyMap[facilityName] || [],
            construction: [],
            documents: [],
            buildingInfo: {
              structure: getSheetValue(row, 'structure', '구조'),
              floors: getSheetValue(row, 'floors', '규모', '층수'),
              area: getSheetValue(row, 'area', '연면적'),
              completionDate: formatDateToKST(getSheetValue(row, 'completionDate', '준공일')),
              safetyGrade: (getSheetValue(row, 'safetyGrade', '안전등급') || 'A') as any,
              lastSafetyCheck: formatDateToKST(getSheetValue(row, 'lastSafetyCheck', '최종안전진단일')),
              address: String(getSheetValue(row, 'address', '건축물소재지') || ''),
              valuation: String(getSheetValue(row, 'valuation', '평가액') || ''),
              bookValue: String(getSheetValue(row, 'bookValue', '장부가액') || ''),
              usage: String(getSheetValue(row, 'usage', '주요용도') || ''),
              floorPlanUrl: String(getSheetValue(row, 'floorPlanUrl', '평면도링크') || ''),
              registrationTranscriptUrl: String(getSheetValue(row, 'registrationTranscriptUrl', '등기부등본링크') || ''),
              buildingLedgerUrl: String(getSheetValue(row, 'buildingLedgerUrl', '건축물대장링크') || ''),
              roofType: String(getSheetValue(row, 'roofType', '지붕구조') || ''),
              heatingType: String(getSheetValue(row, 'heatingType', '냉난방방식') || ''),
              elevatorCount: String(getSheetValue(row, 'elevatorCount', '승강기대수') || ''),
              exteriorFinish: String(getSheetValue(row, 'exteriorFinish', '외벽마감') || ''),
              parkingCapacity: String(getSheetValue(row, 'parkingCapacity', '주차대수') || ''),
              photoUrl: String(getSheetValue(row, 'photoUrl', '사진', '사진URL') || '')
            },
            landscaping: ['교정 수목 전정', '화단 잡초 제거'],
            waterQuality: {
              ph: 7.2,
              chlorine: 0.5,
              turbidity: 0.1,
              temperature: 18,
              lastChecked: formatDateToKST(new Date())
            }
          } as Hotspot;
        });
        setFacilities(mergedFacilities.filter(f => f.name));
      }
    } catch (error) {
      console.error("❌ 데이터 새로고침 실패:", error);
    } finally {
      setIsInitialSyncing(false);
    }
  };

  useEffect(() => {
    refreshDataFromSheets();
  }, []);

  const handlePositionChange = (id: string, x: number, y: number, type: 'building' | 'equipment') => {
    // UI 상태는 즉시 업데이트하여 부드러운 드래그 유지
    if (type === 'building') {
      setFacilities(prev => prev.map(f => f.id === id ? { ...f, x, y } : f));
    } else {
      setRawEquipment(prev => prev.map(eq => eq.id === id ? { ...eq, x, y } : eq));
    }

    // 네트워크 요청은 디바운스 처리 (마지막 이동 후 500ms 뒤에 전송)
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    
    updateTimerRef.current = setTimeout(async () => {
      try {
        if (type === 'building') {
          await ApiService.updatePosition(id, x, y);
        } else {
          await ApiService.updateEquipmentPosition(id, x, y);
        }
      } catch (error) {
        console.error("Position sync error:", error);
      }
    }, 500);
  };

  const handleAddPath = async (path: FacilityPath) => {
    try {
      setPaths(prev => [...prev, path]);
      const result = await ApiService.savePath(path);
      if (result.success) {
        alert('새로운 배관/선로가 클라우드에 저장되었습니다.');
        refreshDataFromSheets(); 
        return true;
      }
      return false;
    } catch (error) {
      console.error("Path save error:", error);
      alert('저장 중 서버 오류가 발생했습니다.');
      refreshDataFromSheets(); 
      return false;
    }
  };

  const handleUpdatePath = async (id: string, points: PathPoint[]) => {
    // UI 상태 즉시 업데이트
    setPaths(prev => prev.map(p => p.id === id ? { ...p, points } : p));

    // 디바운스 처리하여 서버 저장
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(async () => {
      try {
        await ApiService.updatePath(id, points);
      } catch (error) {
        console.error("Path update sync error:", error);
      }
    }, 500);

    return true;
  };

  const handleDeletePath = async (id: string) => {
    if (!confirm('이 배관 정보를 삭제하시겠습니까?')) return;
    setPaths(prev => prev.filter(p => p.id !== id));
    await ApiService.deletePath(id);
    refreshDataFromSheets();
  };

  const handleUpdateFacility = async (updatedFacility: Hotspot) => {
    // UI 즉시 업데이트
    setFacilities(prev => prev.map(f => f.id === updatedFacility.id ? updatedFacility : f));
    
    // 만약 새로운 히스토리가 추가되었다면 (가장 최근 것)
    if (updatedFacility.history.length > (selectedFacility?.history.length || 0)) {
      const newLog = updatedFacility.history[0];
      try {
        await ApiService.submitData({
          org: updatedFacility.name,
          category: 'MAINTENANCE',
          title: newLog.description,
          value: { worker: newLog.worker }
        });
        // 서버 데이터와 동기화
        refreshDataFromSheets();
      } catch (error) {
        console.error("History sync error:", error);
      }
    }
    
    setSelectedFacility(updatedFacility);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard facilities={facilities} contacts={contacts} notices={notices} onNoticeClick={(n) => setSelectedNotice(n)} onAction={(tab) => setActiveTab(tab)} />;
      case 'map': return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={() => { setIsMapEditMode(!isMapEditMode); setIsPathEditMode(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center shadow-sm ${
                isMapEditMode ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {isMapEditMode ? <><CheckCircle2 className="w-4 h-4 mr-2" /> 마커 저장</> : <><Edit className="w-4 h-4 mr-2" /> 마커 위치 편집</>}
            </button>
            <button 
              onClick={() => { setIsPathEditMode(!isPathEditMode); setIsMapEditMode(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center shadow-sm ${
                isPathEditMode ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {isPathEditMode ? <><CheckCircle2 className="w-4 h-4 mr-2" /> 편집 완료</> : <><Waypoints className="w-4 h-4 mr-2" /> 배관/선로 편집</>}
            </button>
          </div>
          <InteractiveMap 
            facilities={facilities} 
            equipment={rawEquipment}
            paths={paths}
            isEditMode={isMapEditMode} 
            isPathMode={isPathEditMode}
            onHotspotClick={(f) => setSelectedFacility(f)} 
            onEquipmentClick={(eq) => setSelectedEquipment(eq)}
            onPositionChange={handlePositionChange} 
            onAddPath={handleAddPath}
            onUpdatePath={handleUpdatePath}
            onDeletePath={handleDeletePath}
          />
        </div>
      );
      case 'building': return <BuildingManager facilities={facilities} onRefresh={refreshDataFromSheets} adminRole={isAdminMode ? adminOrg : null} />;
      case 'equipment': return <EquipmentManager equipment={rawEquipment} onRefresh={refreshDataFromSheets} />;
      case 'vehicle': return <VehicleManager vehicles={rawVehicles} onRefresh={refreshDataFromSheets} />;
      case 'landscaping': return <LandscapingView facilities={facilities} />;
      case 'water': return <WaterQualityView facilities={facilities} equipment={rawEquipment} />;
      case 'construction': return <HistoryTable title="공사 및 대수선 관리 실적" type="construction" facilities={facilities} />;
      case 'admin': return (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <GoogleSheetsIntegration />
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <NoticeManager notices={notices} onRefresh={refreshDataFromSheets} onViewNotice={(n) => setSelectedNotice(n)} />
          </div>
        </div>
      );
      default: return <Dashboard facilities={facilities} contacts={contacts} notices={notices} onNoticeClick={(n) => setSelectedNotice(n)} onAction={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 md:relative md:translate-x-0 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Activity className="w-6 h-6" /></div>
            <h1 className="font-bold text-slate-900 leading-tight">Boryeong Haksa</h1>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={(e) => { e.preventDefault(); setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} className={`flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-50'}`}>
                <item.icon className="w-5 h-5 mr-3" /> {item.name}
              </a>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="md:hidden flex items-center justify-between mb-6">
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><Menu className="w-6 h-6" /></button>
          </div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {navigation.find(n => n.id === activeTab)?.name}
            </h2>
          </div>
          {renderContent()}
        </div>
      </main>
      {selectedFacility && (
        <FacilityDetailModal 
          facility={selectedFacility} 
          onClose={() => setSelectedFacility(null)} 
          onUpdate={handleUpdateFacility} 
        />
      )}
      {selectedEquipment && <EquipmentDetailModal equipment={selectedEquipment} onClose={() => setSelectedEquipment(null)} />}
      {selectedNotice && <NoticeDetailModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />}
    </div>
  );
};

const navigation = [
  { name: '홈 대시보드', icon: Home, id: 'home' },
  { name: '조감도 탐색', icon: MapIcon, id: 'map' },
  { name: '건축물 현황', icon: Building2, id: 'building' },
  { name: '설비(구축물) 관리', icon: Zap, id: 'equipment' },
  { name: '차량 현황', icon: Truck, id: 'vehicle' },
  { name: '조경 관리', icon: Trees, id: 'landscaping' },
  { name: '수질 관리', icon: Droplets, id: 'water' },
  { name: '공사 관리', icon: Hammer, id: 'construction' },
  { name: '시스템 관리', icon: Settings, id: 'admin' },
];

export default App;
