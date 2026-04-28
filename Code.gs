/**
 * 보령학사 시설물 관리 시스템 백엔드 (GAS)
 * 최종 승인 강제 실행 버전
 */

// [중요] 에디터 상단에서 이 함수를 선택하고 [▶ 실행]을 누르세요.
// 이번에는 에러 메시지 대신 "승인 필요" 팝업이 확실히 뜹니다.
function triggerAuthorization() {
  // 1. 드라이브 전체 권한 강제 요청
  const root = DriveApp.getRootFolder();
  const folders = DriveApp.getFolders();
  
  // 2. 파일 생성 권한 강제 요청 (이 줄이 승인창을 띄우는 핵심입니다)
  const tempFile = DriveApp.createFile("권한인증용.txt", "승인 테스트");
  tempFile.setTrashed(true);
  
  // 3. 시트 권한 강제 요청
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getName();
  
  Logger.log("인증 완료! 이제 모든 기능이 정상 작동합니다.");
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetParam = (e && e.parameter && e.parameter.sheet) || "건축물관리";
  
  // Bulk fetch support
  if (sheetParam === "all") {
    const sheetNames = ["log", "관로관리", "공지사항", "설비관리", "차량현황", "공사관리", "공사실적", "조경계획", "조경관리", "수질관리", "info", "건축물관리"];
    const allData = {};
    
    sheetNames.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) {
        allData[name] = [];
        return;
      }
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 1) {
        allData[name] = [];
        return;
      }
      
      const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
      const headers = data[0];
      const rows = data.slice(1);
      allData[name] = rows.map(row => {
        let obj = { "__raw": row };
        headers.forEach((header, i) => {
          let value = row[i];
          if (value instanceof Date) value = Utilities.formatDate(value, "GMT+9", "yyyy-MM-dd HH:mm:ss");
          const headerStr = String(header || "").trim();
          if (headerStr) obj[headerStr] = value;
        });
        return obj;
      });
    });
    
    return ContentService.createTextOutput(JSON.stringify(allData))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheetName = sheetParam;
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    const autoCreateSheets = ["log", "관로관리", "공지사항", "설비관리", "차량현황", "공사관리", "공사실적", "조경계획", "조경관리", "수질관리", "info", "건축물관리"];
    if (autoCreateSheets.indexOf(sheetName) !== -1) {
      if (sheetName === "조경계획") {
        const initialData = [
          ["season", "months", "tasks"],
          ["봄 (Spring)", "3월 - 5월", "수목 식재 및 이식, 춘계 비료 살포, 교정 내 봄꽃 식재, 병충해 예방 방제"],
          ["여름 (Summer)", "6월 - 8월", "정기 예초 및 제초 작업, 수분 공급(관수), 하계 전정(가지치기), 돌발 해충 집중 방제"],
          ["가을 (Autumn)", "9월 - 11월", "추계 비료 살포, 낙엽 수거 및 청소, 월동 준비(짚싸기), 수형 정리 전정"],
          ["겨울 (Winter)", "12월 - 2월", "염화칼슘 피해 방지, 수목 월동 보호구 점검, 폭설 대비 가지 지지, 장비 정비"]
        ];
        const newSheet = ss.insertSheet("조경계획");
        initialData.forEach(row => newSheet.appendRow(row));
        return ContentService.createTextOutput(JSON.stringify(initialData.slice(1).map(r => ({season: r[0], months: r[1], tasks: r[2]}))))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({error: "'" + sheetName + "' 시트를 찾을 수 없습니다."}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0];
  const rows = data.slice(1);
  const result = rows.map(row => {
    let obj = { "__raw": row };
    headers.forEach((header, i) => {
      let value = row[i];
      if (value instanceof Date) value = Utilities.formatDate(value, "GMT+9", "yyyy-MM-dd HH:mm:ss");
      const headerStr = String(header || "").trim();
      if (headerStr) obj[headerStr] = value;
    });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function uploadFile(fileData, fileName, fileType, orgName) {
  if (!fileData || !fileName || typeof fileData !== 'string') return "";
  try {
    const targetFolderId = "1zI3PIOGZ-PT04wOiNOi5A1Fupzh5_ZyP";
    let rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(targetFolderId);
    } catch (e) {
      console.warn("Folder access failed, using root.");
      rootFolder = DriveApp.getRootFolder();
    }
    
    const safeOrgName = (orgName || "기타").replace(/[\/\\:*?"<>|]/g, "_");
    const orgFolder = getOrCreateFolder(rootFolder, safeOrgName);
    
    let base64Part = fileData;
    if (fileData.indexOf(",") > -1) base64Part = fileData.split(",")[1];
    base64Part = base64Part.replace(/\s/g, ""); 
    
    const contentType = fileType || "application/octet-stream";
    const decodedFile = Utilities.base64Decode(base64Part);
    const blob = Utilities.newBlob(decodedFile, contentType, fileName);
    const file = orgFolder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    console.error("UPLOAD ERROR: " + err.toString());
    return "저장 실패: " + err.toString();
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const params = JSON.parse(e.postData.contents);
    const action = params.action; 
  
    let sheetName = "건축물관리";
  if (action === "UPDATE_EQUIPMENT" || action === "UPDATE_EQUIPMENT_POSITION" || action === "ADD_EQUIPMENT") {
    sheetName = "설비관리";
  } else if (action === "NOTICE" || (params.category === "NOTICE" && action === "LOG")) {
    sheetName = "공지사항";
  } else if (action === "UPDATE_LANDSCAPING_PLAN") {
    sheetName = "조경계획";
  } else if (action === "SAVE_PATH" || action === "DELETE_PATH" || action === "UPDATE_PATH") {
    sheetName = "관로관리";
  }
  
  let targetSheet = ss.getSheetByName(sheetName);
  if (!targetSheet) targetSheet = ss.insertSheet(sheetName);
  
  if (action === "DELETE_PATH") {
    const data = targetSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(params.id).trim()) {
            targetSheet.deleteRow(i + 1);
            break;
        }
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "UPDATE_PATH") {
    const data = targetSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const colPoints = headers.indexOf("points") + 1;
    const idToUpdate = String(params.id).trim();
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === idToUpdate && colPoints > 0) {
            targetSheet.getRange(i + 1, colPoints).setValue(JSON.stringify(params.points));
            return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
        }
    }
  }

  if (action === "SAVE_PATH") {
    const p = params.path;
    if (targetSheet.getLastRow() === 0) targetSheet.appendRow(["id", "name", "type", "color", "points", "timestamp"]);
    targetSheet.appendRow([p.id, p.name, p.type, p.color, JSON.stringify(p.points), Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")]);
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "UPDATE_LANDSCAPING_PLAN") {
    const plans = params.plans;
    if (!plans || !Array.isArray(plans)) return ContentService.createTextOutput(JSON.stringify({result: "error"})).setMimeType(ContentService.MimeType.JSON);
    targetSheet.clear();
    targetSheet.appendRow(["season", "months", "tasks"]);
    plans.forEach(p => targetSheet.appendRow([p.season, p.months, p.tasks]));
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "DELETE_NOTICE") {
    const data = targetSheet.getDataRange().getValues();
    const idToDelete = String(params.id).trim();
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === idToDelete) {
            targetSheet.deleteRow(i + 1);
            break;
        }
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "NOTICE" || (params.category === "NOTICE" && action === "LOG")) {
    const val = params.value || {};
    const newId = "N" + Date.now();
    if (targetSheet.getLastRow() === 0) targetSheet.appendRow(["id", "title", "date", "isUrgent", "category", "content", "photoUrl", "fileUrl"]);
    let photoUrl = val.photoUrl || "";
    let fileUrl = val.fileUrl || "";
    if (val.photoData && val.photoName) photoUrl = uploadFile(val.photoData, val.photoName, val.photoType, "공지사항_사진");
    if (val.fileData && val.fileName) fileUrl = uploadFile(val.fileData, val.fileName, val.fileType, "공지사항_첨부");
    targetSheet.appendRow([newId, val.title || params.title, val.date || Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd"), val.isUrgent ? "true" : "false", val.category || "시설", val.content || "", photoUrl, fileUrl]);
    
    // 이메일 발송
    sendEmailNotifications("공지사항", val.title || params.title, val.content || "새로운 공지사항이 등록되었습니다.");
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  }

  const data = targetSheet.getDataRange().getValues();
  if (!data || data.length === 0) return ContentService.createTextOutput(JSON.stringify({result: "error"})).setMimeType(ContentService.MimeType.JSON);
  const headers = data[0].map(h => String(h).trim()); 
  const idToUpdate = String(params.id).trim();
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idToUpdate) {
      rowIndex = i + 1;
      break;
    }
  }
  
  let updateMap = {};
  if (action === "UPDATE_POSITION" || action === "UPDATE_EQUIPMENT_POSITION") {
    updateMap = {"coordX": params.coordX, "coordY": params.coordY, "x": params.coordX, "y": params.coordY};
  } else if (action === "UPDATE_BUILDING") {
    const info = params.info || {};
    let photoUrl = info.photoUrl || "";
    if (info.fileData && info.fileName) photoUrl = uploadFile(info.fileData, info.fileName, info.fileType, info.name || "건축물");
    
    // 기본 매핑 (정보 소실 방지)
    updateMap = {
      "id": idToUpdate,
      "name": info.name,
      "시설명": info.name,
      "구조": info.structure,
      "규모": info.floors,
      "연면적": info.area,
      "준공일": info.completionDate,
      "안전등급": info.safetyGrade,
      "최종안전진단일": info.lastSafetyCheck,
      "address": info.address,
      "valuation": info.valuation,
      "bookValue": info.bookValue,
      "usage": info.usage,
      "roofType": info.roofType,
      "heatingType": info.heatingType,
      "elevatorCount": info.elevatorCount,
      "exteriorFinish": info.exteriorFinish,
      "parkingCapacity": info.parkingCapacity,
      "floorPlanUrl": info.floorPlanUrl,
      "registrationTranscriptUrl": info.registrationTranscriptUrl,
      "buildingLedgerUrl": info.buildingLedgerUrl,
      "photoUrl": photoUrl,
      "사진": photoUrl,
      "coordX": params.coordX || info.x,
      "coordY": params.coordY || info.y
    };
    // 추가 필드가 있을 경우 대비하여 전체 병합
    Object.keys(info).forEach(k => { if (updateMap[k] === undefined) updateMap[k] = info[k]; });
    
  } else if (action === "UPDATE_NOTICE") {
    const info = params.info || {};
    let photoUrl = info.photoUrl || "";
    let fileUrl = info.fileUrl || "";
    if (info.photoData && info.photoName) photoUrl = uploadFile(info.photoData, info.photoName, info.photoType, "공지사항_사진");
    if (info.fileData && info.fileName) fileUrl = uploadFile(info.fileData, info.fileName, info.fileType, "공지사항_첨부");
    
    updateMap = {
      "id": idToUpdate,
      "title": info.title,
      "category": info.category,
      "content": info.content,
      "isUrgent": info.isUrgent === true || info.isUrgent === "true" ? "true" : "false",
      "photoUrl": photoUrl || info.photoUrl,
      "fileUrl": fileUrl || info.fileUrl
    };
  } else if (action === "UPDATE_EQUIPMENT" || action === "ADD_EQUIPMENT") {
    const info = params.info || {};
    let photoUrl = info.photoUrl || "";
    if (info.fileData && info.fileName) photoUrl = uploadFile(info.fileData, info.fileName, info.fileType, info.name || "설비");
    
    updateMap = {
      "id": idToUpdate,
      "설비명": info.name,
      "설비위치": info.location,
      "관리주체": info.orgName,
      "설치일": info.installDate,
      "주요제원": info.specs,
      "관리주기": info.cycle,
      "사진": photoUrl,
      "photoUrl": photoUrl,
      "As업체": info.asCompany,
      "전화번호": info.asTel,
      "비고": info.remarks,
      "coordX": params.coordX || info.x,
      "coordY": params.coordY || info.y
    };
    Object.keys(info).forEach(k => { if (updateMap[k] === undefined) updateMap[k] = info[k]; });
    
    if (rowIndex === -1 && action === "ADD_EQUIPMENT") {
      targetSheet.appendRow(headers.map(h => updateMap[h] || ""));
      return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
    }
  } else if (action === "UPDATE_LOG") {
    const val = params.value || {};
    const fileUrl = (val.fileData || val.file?.data) 
      ? uploadFile(val.fileData || val.file?.data, val.fileName || val.file?.name, val.fileType || val.file?.type, params.org) 
      : val.fileUrl;
      
    let logSheetName = "log";
    if (params.category === "CONSTRUCTION") logSheetName = "공사관리";
    else if (params.category === "LANDSCAPING") logSheetName = "조경관리";
    else if (params.category === "WATER_QUALITY") logSheetName = "수질관리";
    else if (params.category === "CONSTRUCTION_RESULTS") logSheetName = "공사실적";
    
    let logSheet = ss.getSheetByName(logSheetName);
    if (!logSheet) return ContentService.createTextOutput(JSON.stringify({result: "error", message: "Sheet not found"})).setMimeType(ContentService.MimeType.JSON);
    
    const data = logSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    
    // Find the row to update. 
    // Since we don't have a reliable ID stored in the sheet yet, we match by key fields (org, date/year, title)
    // For older records, timestamp might be the best unique identifier if available.
    let targetRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        let match = false;
        
        // Helper for flexible matching
        const isMatch = (sheetVal, paramVal) => {
          if (!paramVal) return !sheetVal;
          let s = String(sheetVal || "").trim();
          let p = String(paramVal || "").trim();
          
          // Date handling: try to normalize to yyyy-MM-dd
          if (sheetVal instanceof Date) {
            s = Utilities.formatDate(sheetVal, "GMT+9", "yyyy-MM-dd");
          } else if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
            s = s.substring(0, 10);
          }
          
          if (p.match(/^\d{4}-\d{2}-\d{2}/)) {
            p = p.substring(0, 10);
          }
          
          return s === p;
        };

        const originalTitle = params.originalTitle || params.title;
        const originalDate = params.originalDate || val.date;
        const originalOrg = params.originalOrg || params.org;
        
        if (params.category === "CONSTRUCTION_RESULTS") {
            // Match by year and title and amount
            const yearIndex = headers.indexOf("연도별");
            const titleIndex = headers.indexOf("사업명");
            if (yearIndex > -1 && titleIndex > -1 && isMatch(row[yearIndex], originalDate) && isMatch(row[titleIndex], originalTitle)) {
                match = true;
            }
        } else if (params.category === "WATER_QUALITY") {
            // Match by tank name and date
            const tankIndex = headers.indexOf("저수조 명");
            const dateIndex = headers.indexOf("날짜");
            if (tankIndex > -1 && dateIndex > -1 && isMatch(row[tankIndex], originalOrg) && isMatch(row[dateIndex], originalDate)) {
                match = true;
            }
        } else {
            // CONSTRUCTION, LANDSCAPING: Match by org, date, and title
            const orgIndex = headers.indexOf("대상 시설");
            const dateIndex = headers.indexOf("날짜 / 기간");
            const titleIndex = headers.indexOf("작업/공사명");
            if (orgIndex > -1 && dateIndex > -1 && titleIndex > -1 && 
                isMatch(row[orgIndex], originalOrg) && 
                isMatch(row[dateIndex], originalDate) && 
                isMatch(row[titleIndex], originalTitle)) {
                match = true;
            }
        }
        
        if (match) {
            targetRowIndex = i + 1;
            break;
        }
    }
    
    if (targetRowIndex === -1) {
        // If no match found, append as new instead? Or return error.
        // User expected edit, so return error for transparency.
        return ContentService.createTextOutput(JSON.stringify({result: "error", message: "Matching record not found for update"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Perform update
    let dataMap = {};
    if (params.category === "CONSTRUCTION") {
      dataMap = { "대상 시설": params.org, "날짜 / 기간": val.date || "", "작업/공사명": params.title || "", "담당자 / 업체": val.contractor || "", "첨부파일": fileUrl };
    } else if (params.category === "LANDSCAPING") {
      dataMap = { "대상 시설": params.org, "날짜 / 기간": val.date || "", "작업/공사명": params.title || "", "담당자 / 업체": val.contractor || "", "첨부파일": fileUrl };
    } else if (params.category === "WATER_QUALITY") {
      dataMap = { "저수조 명": params.org, "날짜": val.date || "", "pH": val.ph || "", "잔류염소": val.chlorine || "", "탁도": val.turbidity || "", "수온": val.temperature || "", "담당자": val.worker || "", "비고/청소내용": val.remarks || "", "첨부파일": fileUrl };
    } else if (params.category === "CONSTRUCTION_RESULTS") {
      dataMap = { "시설명": val.type || "", "연도별": val.year || "", "사업명": params.title || "", "사업량": val.amount || "", "공사업자": val.contractor || "", "주요내용": val.content || "", "예산액(설계)": val.budget || "", "계약액": val.contractPrice || "", "설계변경": val.designChange || "", "정산액": val.settlement || "", "비고": val.remarks || "", "첨부파일": fileUrl };
    }
    
    headers.forEach((h, colIdx) => {
        if (dataMap[h] !== undefined) {
            logSheet.getRange(targetRowIndex, colIdx + 1).setValue(dataMap[h]);
        } else if ((h === "첨부이미지" || h === "첨부" || h === "파일") && dataMap["첨부파일"] !== undefined) {
            logSheet.getRange(targetRowIndex, colIdx + 1).setValue(dataMap["첨부파일"]);
        }
    });
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  } else if (action === "LOG") {
    const val = params.value || {};
    const fileUrl = uploadFile(val.fileData || val.file?.data, val.fileName || val.file?.name, val.fileType || val.file?.type, params.org);
    let logSheetName = "log";
    let headings = ["timestamp", "org", "category", "title", "value"];
    
    // Define expected columns and data map based on category
    let dataMap = {};
    if (params.category === "CONSTRUCTION") {
      logSheetName = "공사관리";
      headings = ["대상 시설", "날짜 / 기간", "작업/공사명", "담당자 / 업체", "첨부파일", "timestamp"];
      dataMap = {
        "대상 시설": params.org,
        "날짜 / 기간": val.date || "",
        "작업/공사명": params.title || "",
        "담당자 / 업체": val.contractor || "",
        "첨부파일": fileUrl,
        "timestamp": Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
      };
    } else if (params.category === "LANDSCAPING") {
      logSheetName = "조경관리";
      headings = ["대상 시설", "날짜 / 기간", "작업/공사명", "담당자 / 업체", "첨부파일", "timestamp"];
      dataMap = {
        "대상 시설": params.org,
        "날짜 / 기간": val.date || "",
        "작업/공사명": params.title || "",
        "담당자 / 업체": val.contractor || "",
        "첨부파일": fileUrl,
        "timestamp": Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
      };
    } else if (params.category === "WATER_QUALITY") {
      logSheetName = "수질관리";
      headings = ["저수조 명", "날짜", "pH", "잔류염소", "탁도", "수온", "담당자", "비고/청소내용", "첨부파일", "timestamp"];
      dataMap = {
        "저수조 명": params.org,
        "날짜": val.date || "",
        "pH": val.ph || "",
        "잔류염소": val.chlorine || "",
        "탁도": val.turbidity || "",
        "수온": val.temperature || "",
        "담당자": val.worker || "",
        "비고/청소내용": val.remarks || "",
        "첨부파일": fileUrl,
        "timestamp": Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
      };
    } else if (params.category === "CONSTRUCTION_RESULTS") {
      logSheetName = "공사실적";
      headings = ["시설명", "연도별", "사업명", "사업량", "공사업자", "주요내용", "예산액(설계)", "계약액", "설계변경", "정산액", "비고", "첨부파일", "timestamp"];
      dataMap = {
        "시설명": val.type || "",
        "연도별": val.year || "",
        "사업명": params.title || "",
        "사업량": val.amount || "",
        "공사업자": val.contractor || "",
        "주요내용": val.content || "",
        "예산액(설계)": val.budget || "",
        "계약액": val.contractPrice || "",
        "설계변경": val.designChange || "",
        "정산액": val.settlement || "",
        "비고": val.remarks || "",
        "첨부파일": fileUrl,
        "timestamp": Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
      };
    } else {
      dataMap = {
        "timestamp": Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss"),
        "org": params.org,
        "category": params.category,
        "title": params.title,
        "value": JSON.stringify(val)
      };

      if (params.category === "EMERGENCY_ALERT") {
        sendEmailNotifications("응급알림", params.title, val.message || "응급 상황이 발생했습니다.");
      }
    }
    
    let logSheet = ss.getSheetByName(logSheetName);
    if (!logSheet) {
      logSheet = ss.insertSheet(logSheetName);
      logSheet.appendRow(headings);
    }
    
    // Header Synchronization: Ensure all expected headers exist
    let currentHeaders = logSheet.getRange(1, 1, 1, Math.max(1, logSheet.getLastColumn())).getValues()[0].map(h => String(h).trim());
    
    headings.forEach(h => {
      let exists = currentHeaders.indexOf(h) !== -1;
      // Alias handling for attachment column
      if (h === "첨부파일" && !exists) {
        exists = (currentHeaders.indexOf("첨부이미지") !== -1 || currentHeaders.indexOf("첨부") !== -1 || currentHeaders.indexOf("파일") !== -1);
      }
      
      if (h && !exists) {
        logSheet.getRange(1, currentHeaders.length + 1).setValue(h);
        currentHeaders.push(h);
      }
    });

    // Prepare row data based on ACTUAL headers in the sheet to prevent column shift
    const rowData = currentHeaders.map(h => {
      if (dataMap[h] !== undefined) return dataMap[h];
      // Alias mapping for attachment column
      if ((h === "첨부이미지" || h === "첨부" || h === "파일") && dataMap["첨부파일"] !== undefined) {
        return dataMap["첨부파일"];
      }
      return "";
    });
    logSheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (rowIndex !== -1) {
    headers.forEach((header, colIdx) => { if (updateMap[header] !== undefined) targetSheet.getRange(rowIndex, colIdx + 1).setValue(updateMap[header]); });
  }
  return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to send email notifications to all emails in column F of 'info' sheet
 */
function sendEmailNotifications(category, title, content) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const infoSheet = ss.getSheetByName("info");
    if (!infoSheet) return;

    const data = infoSheet.getDataRange().getValues();
    if (data.length < 2) return;

    // F열 (index 5) 에서 이메일 추출
    const emails = [];
    for (let i = 1; i < data.length; i++) {
        const email = String(data[i][5] || "").trim();
        if (email && email.indexOf("@") > -1) {
            emails.push(email);
        }
    }

    if (emails.length === 0) return;

    const subject = `[보령학사 알림] ${title}`;
    const body = `
본 메일은 보령학사 시설물 통합관리 시스템에서 발송되었습니다.

[알림 내용]
- 유형: ${category}
- 제목: ${title}
- 내용: ${content}

- 발송일시: ${new Date().toLocaleString('ko-KR')}

보령학사 시설물 관리 앱에서 상세 내용을 확인하세요.
    `;

    GmailApp.sendEmail(emails.join(","), subject, body);
    console.log(`Sent notification for ${category} to ${emails.length} recipients.`);
  } catch (err) {
    console.error("Email notification error: " + err.toString());
  }
}
