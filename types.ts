
export enum FacilityStatus {
  NORMAL = '정상',
  MAINTENANCE = '보수중',
  URGENT = '긴급점검',
  PLANNED = '공사항목'
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface FacilityPath {
  id: string;
  name: string;
  type: 'water' | 'gas' | 'electric' | 'fire' | 'sewer' | 'groundwater';
  points: PathPoint[];
  color: string;
  description?: string;
}

export interface FacilityDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'dwg';
  url: string;
  uploadDate: string;
  size?: string;
}

export interface ContactInfo {
  dept: string;      // 관리부서
  manager: string;   // 관리책임자
  tel: string;       // 전화번호 (일반)
  mobile: string;    // 휴대전화
  email: string;     // 이메일
  remarks: string;   // 비고
}

export interface BuildingInfo {
  structure: string;       // 구조
  floors: string;          // 층수
  area: string;            // 연면적
  completionDate: string;  // 준공일
  safetyGrade: 'A' | 'B' | 'C' | 'D' | 'E'; // 안전 등급
  lastSafetyCheck: string; // 최종 안전 진단일
  address?: string;        // 건축물 소재지
  valuation?: string;      // 평가액
  bookValue?: string;      // 장부가액
  usage?: string;          // 주요용도
  floorPlanUrl?: string;   // 평면도 이미지 링크
  registrationTranscriptUrl?: string; // 등기부등본 이미지 링크 (추가)
  buildingLedgerUrl?: string; // 건축물대장 이미지 링크
  roofType?: string;       // 지붕구조
  heatingType?: string;    // 냉난방방식
  elevatorCount?: string;  // 승강기대수
  exteriorFinish?: string;  // 외벽마감
  parkingCapacity?: string; 
  photoUrl?: string; 
}

export interface LandscapingLog {
  id: string;
  date: string;
  title: string;
  worker: string;
  fileUrl?: string;
}

export interface Hotspot {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  status: FacilityStatus;
  history: ManagementLog[];
  landscaping: LandscapingLog[];
  construction: ConstructionLog[];
  waterQualityLogs: WaterQualityLog[];
  documents: FacilityDocument[];
  waterQuality?: WaterQualityMetric;
  buildingInfo?: BuildingInfo;
  equipment?: Equipment[];
  vehicles?: Vehicle[];
  contactInfo?: ContactInfo;
}

export interface Equipment {
  id: string;             // id (A열)
  name: string;           // 설비명 (B열)
  location: string;       // 설비위치 (C열)
  orgName: string;        // 관리주체 (E열)
  installDate: string;    // 설치일 (F열)
  specs: string;          // 주요제원 (G열)
  cycle: string;          // 관리주기 (H열)
  manualUrl: string;      // 관리메뉴얼 (I열)
  photoUrl: string;       // 사진 (J열)
  asCompany: string;      // As업체 (K열)
  asTel: string;          // 전화번호 (L열)
  status?: 'RUNNING' | 'STOPPED' | 'ERROR' | 'MAINTENANCE';
  remarks?: string;       // 비고
  x?: number;             // coordX (M열)
  y?: number;             // coordY (N열)
}

export interface Vehicle {
  id: string;
  type: 'BUS' | 'VAN' | 'CAR' | 'SPECIAL';
  model: string;
  plateNumber: string;
  status: 'OPERATING' | 'REPAIR' | 'WAITING';
  mileage: number;
  lastInspection: string;
  nextInspection: string;
  purpose?: string;
  ownerInfo?: string;
  orgName?: string;
}

export interface WaterQualityMetric {
  ph: number;
  chlorine: number;
  turbidity: number;
  temperature: number;
  lastChecked: string;
}

export interface WaterQualityLog {
  id: string;
  date: string;
  facilityName: string;
  ph: number;
  chlorine: number;
  turbidity: number;
  temperature: number;
  worker: string;
  fileUrl?: string;
}

export interface ManagementLog {
  id: string;
  date: string;
  type: 'maintenance' | 'landscaping' | 'security' | 'water';
  description: string;
  worker: string;
}

export interface ConstructionLog {
  id: string;
  title: string;
  period: string;
  contractor: string;
  cost: string;
}

export interface ParkingArea {
  id: string;
  name: string;
  totalSpots: number;
  occupiedSpots: number;
  disabledSpots: number;
}

export interface Notice {
  id: string;
  title: string;
  date: string;
  isUrgent: boolean;
  category: '시설' | '조경' | '행정' | '안전' | '수질';
  content?: string;      // 상세 내용 추가
  photoUrl?: string;     // 첨부 사진 추가
  fileUrl?: string;      // 첨부 파일 추가
}
