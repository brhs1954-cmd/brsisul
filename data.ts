
import { Hotspot, FacilityStatus, ParkingArea, Notice } from './types';

// 구글 앱스 스크립트 웹 앱 URL (제공된 주소)
// Google Sheets API URL (Vercel 배포 시 환경 변수 VITE_GOOGLE_SHEET_API_URL 설정 필요)
export const GOOGLE_SHEET_API_URL = import.meta.env.VITE_GOOGLE_SHEET_API_URL || "https://script.google.com/macros/s/AKfycbwSan-mqGy3I5FuRNv6wfdeuOSlJJCkU3pULz9Z74ESaK4r2FlYULxUxS963Y4M17D5/exec";

// 제공된 조감도 이미지의 시각적 위치에 기반한 좌표 설정
export const FACILITIES: Hotspot[] = [
  {
    id: 'jeongsimwon',
    name: '충남정심원',
    description: '장애인들의 따뜻한 보금자리가 되어주는 거주 시설입니다.',
    x: 82, 
    y: 75,
    status: FacilityStatus.NORMAL,
    history: [
      { id: 'h-js-1', date: '2024-11-15', type: 'maintenance', description: '생활관 내부 도배 및 장판 보수', worker: '정심원 관리팀' }
    ],
    landscaping: ['화목 정원 가꾸기', '생활관 주변 제초'],
    construction: [
      { id: 'c-js-1', title: '생활관 증축 및 개보수', period: '2022.03 - 2022.12', contractor: '대건건설', cost: '2.5억원' }
    ],
    documents: [],
    contactInfo: {
      dept: '운영지원팀',
      manager: '이정심 팀장',
      tel: '041-933-0001',
      mobile: '010-1234-5678',
      email: 'js_won@boryeong.or.kr',
      remarks: '평일 09:00~18:00 근무, 야간 비상대기조 운영'
    },
    buildingInfo: {
      structure: '철근콘크리트(RC)조',
      floors: '지상 2층',
      area: '1,890.11㎡',
      completionDate: '2008-09-12',
      safetyGrade: 'A',
      lastSafetyCheck: '2024-01-10'
    },
    /* Added missing asCompany and asTel properties to match Equipment interface */
    equipment: [
       { 
         id: 'e-js-1', 
         name: '지하수 관정 펌프 제어반', 
         location: '충남정심원 기계실',
         orgName: '충남정심원', 
         installDate: '2015-06-20', 
         specs: 'HYUNDAI-VFD', 
         cycle: '6개월', 
         manualUrl: '', 
         photoUrl: '', 
         asCompany: '현대중공업 AS',
         asTel: '1588-0000',
         remarks: '최종 점검일: 2024-02-15', 
         status: 'RUNNING' 
       }
    ],
    vehicles: [
      { id: 'v-js-1', type: 'VAN', model: '현대 스타리아 (특수)', plateNumber: '충남 70 가 1001', status: 'OPERATING', mileage: 15200, lastInspection: '2024-01-10', nextInspection: '2025-01-10' },
      { id: 'v-js-2', type: 'CAR', model: '기아 EV6', plateNumber: '123 가 4567', status: 'WAITING', mileage: 8500, lastInspection: '2023-11-05', nextInspection: '2024-11-05' }
    ],
    waterQuality: {
      ph: 6.9,
      chlorine: 0.72,
      turbidity: 0.15,
      temperature: 17.8,
      lastChecked: '2024-11-20 08:30'
    }
  },
  {
    id: 'nursing_home',
    name: '정심요양원',
    description: '어르신 및 중증 장애인을 위한 전문 요양 서비스를 제공하는 시설입니다.',
    x: 75, 
    y: 65,
    status: FacilityStatus.NORMAL,
    history: [
      { id: 'h-nh-1', date: '2024-10-20', type: 'maintenance', description: '휠체어 리프트 정기 점검', worker: '리프트안전' }
    ],
    landscaping: ['요양원 옥상 정원 관리'],
    construction: [],
    documents: [],
    contactInfo: {
      dept: '간호관리팀',
      manager: '박요양 과장',
      tel: '041-933-0002',
      mobile: '010-2234-5678',
      email: 'nh_care@boryeong.or.kr',
      remarks: '의료 소모품 및 위생 관리 총괄'
    },
    buildingInfo: {
      structure: '철근콘크리트조',
      floors: '지상 3층',
      area: '1,450.50㎡',
      completionDate: '2012-05-20',
      safetyGrade: 'A',
      lastSafetyCheck: '2024-05-20'
    },
    /* Added missing asCompany and asTel properties to match Equipment interface */
    equipment: [
      { 
        id: 'e-nh-1', 
        name: '요양원 비상 발전기', 
        location: '정심요양원 외부',
        orgName: '정심요양원', 
        installDate: '2012-06-01', 
        specs: 'DOOSAN-P126', 
        cycle: '6개월', 
        manualUrl: '', 
        photoUrl: '', 
        asCompany: '두산에너빌리티',
        asTel: '02-000-0000',
        remarks: '최종 점검일: 2024-06-01', 
        status: 'RUNNING' 
      }
    ],
    vehicles: [
      { id: 'v-nh-1', type: 'VAN', model: '현대 쏠라티 (리프트)', plateNumber: '충남 70 가 2002', status: 'OPERATING', mileage: 42000, lastInspection: '2024-03-20', nextInspection: '2025-03-20' }
    ]
  },
  {
    id: 'workshop',
    name: '정심작업장',
    description: '장애인들의 직업 재활과 자립을 돕는 생산 활동 공간입니다.',
    x: 90, 
    y: 80,
    status: FacilityStatus.NORMAL,
    history: [],
    landscaping: [],
    construction: [
      { id: 'c-ws-1', title: '작업장 냉난방기 전면 교체', period: '2023.07', contractor: 'LG시스템', cost: '3,200만원' }
    ],
    documents: [],
    contactInfo: {
      dept: '직업재활팀',
      manager: '최작업 팀장',
      tel: '041-933-0003',
      mobile: '010-3234-5678',
      email: 'ws_prod@boryeong.or.kr',
      remarks: '작업장 설비 및 안전 관리 전담'
    },
    buildingInfo: {
      structure: '일반철골조',
      floors: '지상 1층',
      area: '820.30㎡',
      completionDate: '2015-10-30',
      safetyGrade: 'B',
      lastSafetyCheck: '2024-03-15'
    },
    /* Added missing asCompany and asTel properties to match Equipment interface */
    equipment: [
      { 
        id: 'e-ws-1', 
        name: '산업용 공기 압축기', 
        location: '정심작업장 내부',
        orgName: '정심작업장', 
        installDate: '2016-01-10', 
        specs: 'ATLAS-CAPCO', 
        cycle: '6개월', 
        manualUrl: '', 
        photoUrl: '', 
        asCompany: '아틀라스콥코 코리아',
        asTel: '02-2189-4000',
        remarks: '최종 점검일: 2024-07-10', 
        status: 'RUNNING' 
      }
    ],
    vehicles: [
      { id: 'v-ws-1', type: 'SPECIAL', model: '현대 포터II (탑차)', plateNumber: '충남 80 바 3003', status: 'OPERATING', mileage: 125000, lastInspection: '2024-02-15', nextInspection: '2025-02-15' }
    ]
  },
  {
    id: 'school',
    name: '보령정심학교',
    description: '특수교육 대상 학생들을 위한 맞춤형 교육 환경을 제공하는 학교입니다.',
    x: 18, 
    y: 15,
    status: FacilityStatus.NORMAL,
    history: [
      { id: 'h1', date: '2024-03-15', type: 'maintenance', description: '창호 단열 성능 점검', worker: '김시설' }
    ],
    landscaping: ['교정 수목 전정 작업'],
    construction: [
      { id: 'c-sc-1', title: '운동장 배수관 정비', period: '2024.01', contractor: '우수건설', cost: '1,200만원' }
    ],
    documents: [],
    contactInfo: {
      dept: '행정실',
      manager: '김학교 실장',
      tel: '041-933-0004',
      mobile: '010-4234-5678',
      email: 'school_admin@boryeong.or.kr',
      remarks: '학교 시설물 유지보수 및 예산 관리'
    },
    buildingInfo: {
      structure: '철근콘크리트(RC)조',
      floors: '지상 3층 / 지하 1층',
      area: '3,842.15㎡',
      completionDate: '2005-03-10',
      safetyGrade: 'A',
      lastSafetyCheck: '2024-02-15'
    },
    /* Added missing asCompany and asTel properties to match Equipment interface */
    equipment: [
      { 
        id: 'e-sc-1', 
        name: '학교 급식실 대형 냉장고', 
        location: '보령정심학교 급식소',
        orgName: '보령정심학교', 
        installDate: '2020-05-12', 
        specs: 'LG-B-2000', 
        cycle: '6개월', 
        manualUrl: '', 
        photoUrl: '', 
        asCompany: 'LG전자 서비스',
        asTel: '1544-7777',
        remarks: '최종 점검일: 2024-05-10', 
        status: 'RUNNING' 
      }
    ],
    vehicles: [
      { id: 'v-sc-1', type: 'BUS', model: '현대 유니버스 45인승', plateNumber: '충남 70 가 1234', status: 'OPERATING', mileage: 124500, lastInspection: '2024-03-10', nextInspection: '2025-03-10' },
      { id: 'v-sc-2', type: 'BUS', model: '현대 카운티 25인승', plateNumber: '충남 70 가 5678', status: 'OPERATING', mileage: 82100, lastInspection: '2024-05-20', nextInspection: '2025-05-20' }
    ],
    waterQuality: {
      ph: 7.2,
      chlorine: 0.6,
      turbidity: 0.12,
      temperature: 18.5,
      lastChecked: '2024-11-20 09:00'
    }
  },
  {
    id: 'welfare',
    name: '충남서부 장애인종합복지관',
    description: '지역사회 장애인의 재활과 자립을 돕는 종합 복지 기관입니다.',
    x: 62, 
    y: 58,
    status: FacilityStatus.NORMAL,
    history: [
      { id: 'h-wf-1', date: '2024-11-01', type: 'maintenance', description: '메인 현관 자동문 보수', worker: '자동시스템' }
    ],
    landscaping: ['복지관 진입로 화단 정비'],
    construction: [],
    documents: [],
    contactInfo: {
      dept: '기획홍보팀',
      manager: '홍복지 팀장',
      tel: '041-933-0005',
      mobile: '010-5234-5678',
      email: 'wf_center@boryeong.or.kr',
      remarks: '복지관 시설 대관 및 외부 행사 관리'
    },
    buildingInfo: {
      structure: '철근콘크리트(RC)조',
      floors: '지상 2층',
      area: '2,150.44㎡',
      completionDate: '2002-11-30',
      safetyGrade: 'A',
      lastSafetyCheck: '2024-04-01'
    },
    /* Added missing asCompany and asTel properties to match Equipment interface */
    equipment: [
      { 
        id: 'e-wf-1', 
        name: '복지관 메인 배전반', 
        location: '복지관 전기실',
        orgName: '충남서부 장애인종합복지관', 
        installDate: '2002-12-01', 
        specs: 'LS-2000', 
        cycle: '12개월', 
        manualUrl: '', 
        photoUrl: '', 
        asCompany: 'LS ELECTRIC',
        asTel: '1544-2080',
        remarks: '최종 점검일: 2024-10-15', 
        status: 'RUNNING' 
      }
    ],
    vehicles: [
      { id: 'v-wf-1', type: 'VAN', model: '현대 스타리아 15인승', plateNumber: '충남 70 가 3344', status: 'REPAIR', mileage: 12000, lastInspection: '2024-08-01', nextInspection: '2025-08-01' }
    ],
    waterQuality: {
      ph: 7.1,
      chlorine: 0.55,
      turbidity: 0.08,
      temperature: 19.2,
      lastChecked: '2024-11-20 09:15'
    }
  }
];

export const PARKING_DATA: ParkingArea[] = [
  { id: 'p1', name: '정심학교 주차장', totalSpots: 45, occupiedSpots: 12, disabledSpots: 5 },
  { id: 'p2', name: '복지관 주차장', totalSpots: 30, occupiedSpots: 28, disabledSpots: 4 },
  { id: 'p3', name: '중앙 주차 구역', totalSpots: 80, occupiedSpots: 35, disabledSpots: 8 },
  { id: 'p4', name: '사무국/요양원 주차장', totalSpots: 40, occupiedSpots: 15, disabledSpots: 4 }
];

export const NOTICES: Notice[] = [
  { id: 'n1', title: '동절기 소방시설 동파 방지 집중 점검 안내', date: '2024-11-20', isUrgent: true, category: '안전' },
  { id: 'n2', title: '복지관 본관 승관기 정기 점검에 따른 이용 제한', date: '2024-11-22', isUrgent: false, category: '시설' }
];
