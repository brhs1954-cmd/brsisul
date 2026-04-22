
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Hotspot, Equipment, FacilityStatus, FacilityPath, PathPoint } from '../types';
import { 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Zap, 
  PlusCircle, 
  Trash2, 
  Save, 
  X, 
  Layers, 
  Droplets, 
  Flame, 
  Waves, 
  ShieldAlert,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info,
  MousePointer2,
  AlertTriangle,
  Building2,
  Edit3
} from 'lucide-react';

interface InteractiveMapProps {
  facilities: (Hotspot & { isFixed?: boolean })[];
  equipment: Equipment[];
  paths: FacilityPath[];
  isEditMode: boolean;
  isPathMode: boolean;
  onHotspotClick: (facility: Hotspot) => void;
  onEquipmentClick: (eq: Equipment) => void;
  onPositionChange: (id: string, x: number, y: number, type: 'building' | 'equipment') => void;
  onAddPath: (path: FacilityPath) => Promise<boolean>;
  onUpdatePath: (id: string, points: PathPoint[]) => Promise<boolean>;
  onDeletePath: (id: string) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  facilities, 
  equipment,
  paths,
  isEditMode, 
  isPathMode,
  onHotspotClick,
  onEquipmentClick,
  onPositionChange, 
  onAddPath,
  onUpdatePath,
  onDeletePath
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showPathList, setShowPathList] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [draggingItem, setDraggingItem] = useState<{id: string, type: 'building' | 'equipment'} | null>(null);
  const [draggingPathPoint, setDraggingPathPoint] = useState<{pathId: string, pointIndex: number} | null>(null);
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    water: true,
    gas: true,
    electric: true,
    fire: true,
    sewer: true,
    groundwater: true, // 지하수 레이어 가시성 상태 추가
    buildings: true,
    equipment: true
  });

  const [newPathPoints, setNewPathPoints] = useState<PathPoint[]>([]);
  const [selectedPathType, setSelectedPathType] = useState<FacilityPath['type']>('water');
  const [newPathName, setNewPathName] = useState('');

  const FILE_ID = "1Jl-RMMoh6u_McdcUl58PiaEESVf42vBI";
  const MAP_IMAGE_URL = `https://lh3.googleusercontent.com/d/${FILE_ID}`;

  const PATH_CONFIG: Record<FacilityPath['type'], { color: string; label: string; icon: React.ReactNode; dash?: string }> = {
    water: { color: '#3b82f6', label: '상수도', icon: <Droplets className="w-3.5 h-3.5" /> },
    groundwater: { color: '#0d9488', label: '지하수', icon: <Droplets className="w-3.5 h-3.5" /> }, // 지하수 설정 추가
    gas: { color: '#f59e0b', label: '가스관', icon: <Flame className="w-3.5 h-3.5" /> },
    electric: { color: '#8b5cf6', label: '전기선로', icon: <Zap className="w-3.5 h-3.5" />, dash: "0" },
    fire: { color: '#ef4444', label: '소방관로', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    sewer: { color: '#475569', label: '하수도', icon: <Waves className="w-3.5 h-3.5" />, dash: "6,6" }
  };

  const MARKER_LAYER_CONFIG = [
    { id: 'buildings', label: '건축물 마커', color: '#2563eb', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'equipment', label: '설비 마커', color: '#f59e0b', icon: <Zap className="w-3.5 h-3.5" /> }
  ];

  const groupedPaths = useMemo(() => {
    return paths.reduce((acc, path) => {
      if (!acc[path.type]) acc[path.type] = [];
      acc[path.type].push(path);
      return acc;
    }, {} as Record<string, FacilityPath[]>);
  }, [paths]);

  const toggleLayer = (type: string) => {
    setVisibleLayers(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const setAllLayers = (visible: boolean) => {
    const newLayers = { ...visibleLayers };
    Object.keys(newLayers).forEach(key => {
      newLayers[key] = visible;
    });
    setVisibleLayers(newLayers);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, type: 'building' | 'equipment') => {
    if (!isEditMode || isPathMode) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingItem({id, type});
  };

  const handlePathPointMouseDown = (e: React.MouseEvent, pathId: string, pointIndex: number) => {
    if (!isEditMode || isPathMode || editingPathId !== pathId) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingPathPoint({ pathId, pointIndex });
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isPathMode || !mapContainerRef.current) return;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewPathPoints(prev => [...prev, { x, y }]);
  };

  const handleSavePath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (newPathPoints.length < 2 || !newPathName.trim()) {
      alert('관로 명칭을 입력하고 조감도에 최소 2개 이상의 마디를 찍어주세요.');
      return;
    }

    setIsSaving(true);
    const newPath: FacilityPath = {
      id: 'PATH-' + Date.now(),
      name: newPathName.trim(),
      type: selectedPathType,
      points: newPathPoints,
      color: PATH_CONFIG[selectedPathType].color
    };

    try {
      const success = await onAddPath(newPath);
      if (success) {
        setNewPathPoints([]);
        setNewPathName('');
        setVisibleLayers(prev => ({ ...prev, [selectedPathType]: true }));
      } else {
        alert('서버 저장에 실패했습니다. 구글 시트 연결 상태를 확인해주세요.');
      }
    } catch (err) {
      console.error(err);
      alert('저장 도중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const nameInputValid = newPathName.trim().length > 0;
  const pointsValid = newPathPoints.length >= 2;
  const canSave = nameInputValid && pointsValid && !isSaving;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mapContainerRef.current || !isEditMode) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      if (draggingItem) {
        onPositionChange(draggingItem.id, x, y, draggingItem.type);
      } else if (draggingPathPoint) {
        const targetPath = paths.find(p => p.id === draggingPathPoint.pathId);
        if (targetPath) {
          const newPoints = [...targetPath.points];
          newPoints[draggingPathPoint.pointIndex] = { x, y };
          // 로컬 상태 업데이트를 위해 부모에게 전달 (App.tsx에서 처리 필요)
          onUpdatePath(draggingPathPoint.pathId, newPoints);
        }
      }
    };
    const handleMouseUp = () => {
      setDraggingItem(null);
      setDraggingPathPoint(null);
    };
    if (draggingItem || draggingPathPoint) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingItem, draggingPathPoint, onPositionChange, onUpdatePath, isEditMode, paths]);

  return (
    <div className="relative w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-100 min-h-[650px]">
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-[45] flex items-center justify-center bg-slate-50/90 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Master Map Data Loading...</p>
          </div>
        </div>
      )}

      <div 
        ref={mapContainerRef}
        onClick={handleMapClick}
        className={`relative w-full h-full overflow-hidden bg-slate-200 ${isEditMode ? 'cursor-move' : isPathMode ? 'cursor-crosshair' : 'cursor-default'}`}
      >
        <img 
          src={MAP_IMAGE_URL} 
          alt="보령학사 조감도"
          className={`w-full h-auto block object-cover transition-all duration-700 select-none ${isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => { setHasError(true); setIsLoading(false); }}
        />

        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {paths.filter(p => visibleLayers[p.type]).map((path, idx) => (
            <g key={`${path.id}-${idx}`} className="transition-opacity duration-300">
              {/* 시인성 강화를 위한 베이스 흰색 선 (Halo effect) */}
              <polyline
                points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="white"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ vectorEffect: 'non-scaling-stroke', opacity: 0.6 }}
              />
              {/* 메인 관로 선 */}
              <polyline
                points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={path.color}
                strokeWidth="2.4"
                strokeDasharray={PATH_CONFIG[path.type]?.dash || "0"}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
              {/* 관로 마디 포인트 */}
              {path.points.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.x} 
                  cy={p.y} 
                  r={editingPathId === path.id ? "1.2" : "0.6"} 
                  fill={path.color} 
                  stroke="white" 
                  strokeWidth={editingPathId === path.id ? "0.4" : "0.15"} 
                  className={`pointer-events-auto transition-all ${isEditMode && editingPathId === path.id ? 'cursor-move hover:scale-150' : ''}`}
                  onMouseDown={(e) => handlePathPointMouseDown(e, path.id, i)}
                />
              ))}
            </g>
          ))}

          {/* 설계 중인 관로 프리뷰 */}
          {newPathPoints.length > 0 && (
            <g>
              <polyline
                points={newPathPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ vectorEffect: 'non-scaling-stroke', opacity: 0.4 }}
              />
              <polyline
                points={newPathPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={PATH_CONFIG[selectedPathType].color}
                strokeWidth="3"
                strokeDasharray="4,2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[dash_20s_linear_infinite]"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
              {newPathPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="1.0" fill={PATH_CONFIG[selectedPathType].color} stroke="white" strokeWidth="0.4" className="animate-pulse" />
              ))}
            </g>
          )}
        </svg>

        {hasError && (
          <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-12 text-center z-20">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-4">이미지를 불러올 수 없습니다</h3>
          </div>
        )}

        {!isPathMode && visibleLayers.buildings && facilities.map((facility, idx) => (
          <div
            key={`building-${facility.id}-${idx}`}
            className={`absolute group transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 z-30 ${draggingItem?.id === facility.id ? 'scale-150 z-50' : ''}`}
            style={{ left: `${facility.x}%`, top: `${facility.y}%` }}
          >
            <button
              onMouseDown={(e) => handleMouseDown(e, facility.id, 'building')}
              onClick={() => !isEditMode && onHotspotClick(facility)}
              className={`relative flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full shadow-sm border-2 transition-all ${isEditMode && facility.isFixed ? 'bg-emerald-500/80 border-emerald-300' : facility.status === FacilityStatus.NORMAL ? 'bg-blue-600/60 border-blue-400' : 'bg-amber-500/60 border-amber-400'} backdrop-blur-[2px] ${isEditMode ? 'cursor-move ring-2 ring-blue-400/30' : 'cursor-pointer hover:scale-125 hover:bg-opacity-90'}`}
            >
              <span className="text-[7px] md:text-[9px] font-black text-white leading-none tracking-tighter">{facility.id}</span>
            </button>
          </div>
        ))}

        {!isPathMode && visibleLayers.equipment && equipment.map((eq, idx) => (
          <div
            key={`eq-${eq.id}-${idx}`}
            className={`absolute group transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 z-40 ${draggingItem?.id === eq.id ? 'scale-150 z-50' : ''}`}
            style={{ left: `${eq.x || 50}%`, top: `${eq.y || 50}%` }}
          >
            {/* Hover Label */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/90 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-all transform translate-y-1 group-hover:translate-y-0 shadow-xl z-[60]">
              {eq.name}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90"></div>
            </div>

            <button
              onMouseDown={(e) => handleMouseDown(e, eq.id, 'equipment')}
              onClick={() => !isEditMode && onEquipmentClick(eq)}
              className={`relative flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-lg shadow-md border-2 transition-all bg-amber-500 border-white text-white ${isEditMode ? 'cursor-move ring-2 ring-amber-400/50' : 'cursor-pointer hover:scale-125 hover:bg-amber-600'}`}
            >
              <Zap className="w-3 h-3 md:w-4 md:h-4 text-white fill-white" />
            </button>
          </div>
        ))}
      </div>

      <div className="absolute top-6 right-6 z-[60] flex flex-col items-end gap-2">
        <button 
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`p-3.5 rounded-2xl shadow-xl border flex items-center justify-center transition-all ${showLayerPanel ? 'bg-slate-900 text-white border-slate-800 scale-105' : 'bg-white/90 backdrop-blur-md text-slate-700 border-white hover:bg-white'}`}
          title="가시성 설정"
        >
          <Layers className="w-5 h-5" />
          {showLayerPanel && <span className="ml-2 text-xs font-black uppercase tracking-widest">레이어 설정</span>}
        </button>
        {showLayerPanel && (
          <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-slate-100 w-56 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">레이어 가시성</h4>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAllLayers(true)}
                  className="text-[9px] font-black text-blue-600 hover:text-blue-700 transition-colors"
                >
                  전체선택
                </button>
                <div className="w-[1px] h-2 bg-slate-200"></div>
                <button 
                  onClick={() => setAllLayers(false)}
                  className="text-[9px] font-black text-slate-400 hover:text-slate-600 transition-colors"
                >
                  전체해제
                </button>
              </div>
            </div>

            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">마커 표시 설정</h4>
            <div className="space-y-1 mb-4">
              {MARKER_LAYER_CONFIG.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${visibleLayers[layer.id] ? 'bg-slate-50' : 'opacity-40 grayscale'}`}
                >
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-lg mr-2" style={{ backgroundColor: `${layer.color}15`, color: layer.color }}>
                      {layer.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{layer.label}</span>
                  </div>
                  {visibleLayers[layer.id] ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                </button>
              ))}
            </div>

            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">관로 레이어 선택</h4>
            <div className="space-y-1">
              {(Object.keys(PATH_CONFIG) as FacilityPath['type'][]).map(type => (
                <button
                  key={type}
                  onClick={() => toggleLayer(type)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${visibleLayers[type] ? 'bg-slate-50' : 'opacity-40 grayscale'}`}
                >
                  <div className="flex items-center">
                    <div className="p-1.5 rounded-lg mr-2" style={{ backgroundColor: `${PATH_CONFIG[type].color}15`, color: PATH_CONFIG[type].color }}>
                      {PATH_CONFIG[type].icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{PATH_CONFIG[type].label}</span>
                  </div>
                  {visibleLayers[type] ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isPathMode && (
        <div 
          className="absolute top-4 left-4 z-[60] bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col gap-3 w-64 max-h-[calc(100%-2rem)] overflow-y-auto animate-in slide-in-from-left duration-300 scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center">
              <PlusCircle className="w-3.5 h-3.5 mr-2 text-blue-500" /> 관로 설계 도구
            </h3>
            <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded">NEW</span>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">1. 유형 선택</label>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(PATH_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedPathType(key as any); }}
                  className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all ${selectedPathType === key ? 'border-blue-500 bg-blue-50 shadow-inner' : 'border-slate-50 hover:bg-slate-100'}`}
                >
                  <div className="flex items-center">
                     <div className="p-1 rounded-md mr-2" style={{ backgroundColor: `${config.color}20`, color: config.color }}>{config.icon}</div>
                     <span className="text-[10px] font-black text-slate-700">{config.label}</span>
                  </div>
                  {selectedPathType === key && <Check className="w-3 h-3 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">2. 관로 명칭 입력</label>
            <input 
              type="text"
              value={newPathName}
              onChange={(e) => setNewPathName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="예: 본관 서측 상수도관"
              className={`w-full border rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none transition-all ${nameInputValid ? 'bg-white border-blue-500 ring-2 ring-blue-100' : 'bg-slate-50 border-slate-200'}`}
            />
            {!nameInputValid && <p className="text-[9px] text-rose-500 font-bold ml-1 flex items-center"><AlertTriangle className="w-2.5 h-2.5 mr-1" /> 명칭 입력이 필요합니다.</p>}
          </div>

          <div className={`p-3 rounded-xl border transition-all ${pointsValid ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
             <div className="flex items-start gap-2">
               <MousePointer2 className={`w-3 h-3 mt-0.5 shrink-0 ${pointsValid ? 'text-blue-500' : 'text-rose-400'}`} />
               <p className={`text-[9px] leading-tight ${pointsValid ? 'text-blue-700' : 'text-rose-700'}`}>
                 {newPathPoints.length === 0 
                   ? '조감도를 클릭하여 시작하세요.' 
                   : newPathPoints.length === 1 
                   ? '다음 지점을 찍으세요.' 
                   : '설계가 준비되었습니다.'}
               </p>
             </div>
             <p className={`text-[10px] font-black mt-1.5 ${pointsValid ? 'text-blue-600' : 'text-rose-600'}`}>
               현재 마디: {newPathPoints.length} 개
             </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <button 
              type="button"
              onClick={handleSavePath}
              disabled={!canSave}
              className={`w-full py-3 rounded-xl text-[11px] font-black shadow-lg transition-all flex items-center justify-center ${
                canSave
                ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 scale-[1.02] active:scale-95 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale'
              }`}
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              {isSaving ? '저장 중...' : '설계 저장 및 완료'}
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setNewPathPoints([]); setNewPathName(''); }}
              disabled={isSaving}
              className="w-full py-2 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black hover:bg-slate-200 transition-all flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> 전체 취소
            </button>
          </div>
        </div>
      )}

      {!isPathMode && isEditMode && paths.length > 0 && (
        <div className="absolute bottom-4 left-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-[1.5rem] shadow-2xl border border-white w-60 max-h-[300px] flex flex-col animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <Layers className="w-3 h-3 mr-2 text-blue-500" /> 저장된 관로 리스트
            </h3>
            <button onClick={() => setShowPathList(!showPathList)}>
              {showPathList ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
          {showPathList && (
            <div className="overflow-y-auto space-y-3 pr-1 scrollbar-hide">
              {Object.entries(groupedPaths).map(([type, items]) => {
                const pathItems = items as FacilityPath[];
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PATH_CONFIG[type as any]?.color }}></div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{PATH_CONFIG[type as any]?.label} ({pathItems.length})</span>
                    </div>
                    <div className="space-y-1">
                      {pathItems.map((path, idx) => (
                        <div key={`${path.id}-${idx}`} className={`flex flex-col p-2 rounded-lg group transition-all ${editingPathId === path.id ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">{path.name}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingPathId(editingPathId === path.id ? null : path.id); }}
                                className={`p-1 rounded-md transition-all ${editingPathId === path.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`}
                                title="정밀 편집"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDeletePath(path.id); }} 
                                className="p-1 text-slate-300 hover:text-rose-500 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {editingPathId === path.id && (
                            <div className="mt-1 text-[8px] font-medium text-blue-600 animate-pulse">
                              • 마디를 드래그하여 이동하세요.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
