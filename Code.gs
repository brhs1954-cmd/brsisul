
/**
 * 보령학사 시설물 관리 시스템 백엔드 (GAS)
 * @OnlyCurrentDoc
 * DriveApp.getFiles() // Force Drive Scope detection
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (e && e.parameter && e.parameter.sheet) || "건축물관리";
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    // 필수 시트가 없는 경우 에러 대신 빈 배열 반환 (초기화 편의성)
    const autoCreateSheets = ["log", "관로관리", "공지사항", "설비관리", "차량현황", "공사관리", "조경계획", "조경관리", "수질관리", "info", "건축물관리"];
    if (autoCreateSheets.indexOf(sheetName) !== -1) {
      if (sheetName === "조경계획") {
        // 초기 데이터 삽입
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
  
  if (lastRow < 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    let obj = { "__raw": row };
    headers.forEach((header, i) => {
      let value = row[i];
      if (value instanceof Date) {
        value = Utilities.formatDate(value, "GMT+9", "yyyy-MM-dd HH:mm:ss");
      }
      const headerStr = String(header || "").trim();
      if (headerStr) {
        obj[headerStr] = value;
      }
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function uploadFile(fileData, fileName, fileType, orgName) {
  if (!fileData || !fileName || typeof fileData !== 'string') {
    console.error("Missing required file data for upload.");
    return "";
  }
  
  try {
    const targetFolderId = "1zI3PIOGZ-PT04wOiNOi5A1Fupzh5_ZyP";
    let rootFolder;
    
    // 1. 루트 폴더 확보
    try {
      if (targetFolderId && targetFolderId.trim() !== "") {
        rootFolder = DriveApp.getFolderById(targetFolderId.trim());
      } else {
        rootFolder = DriveApp.getRootFolder();
      }
    } catch (e) {
      console.warn("Target folder ID not found or no access. Using Drive Root. Detail: " + e.toString());
      rootFolder = DriveApp.getRootFolder();
    }
    
    // 2. 하위 폴더 확보
    const safeOrgName = (orgName || "기타").replace(/[\/\\:*?"<>|]/g, "_");
    const orgFolder = getOrCreateFolder(rootFolder, safeOrgName);
    
    // 3. Base64 데이터 정제
    let base64Part = fileData;
    if (fileData.indexOf(",") > -1) {
      base64Part = fileData.split(",")[1];
    }
    // 공백 및 줄바꿈 제거 (안정성 확보)
    base64Part = base64Part.replace(/\s/g, "");
    
    // 4. 파일 생성
    const contentType = fileType || "application/octet-stream";
    const decodedFile = Utilities.base64Decode(base64Part);
    const blob = Utilities.newBlob(decodedFile, contentType, fileName);
    const file = orgFolder.createFile(blob);
    
    // 5. 공유 설정
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      console.warn("Could not set sharing permissions: " + sharingError.toString());
      // 권한 설정에 실패해도 파일 URL은 반환함
    }
    
    const url = file.getUrl();
    console.log("Success! File uploaded: " + url);
    return url;
    
  } catch (err) {
    console.error("CRITICAL UPLOAD ERROR: " + err.toString());
    // 에러 발생 시 로그를 남기고 빈 대답 (시트 저장은 계속되게 함)
    return "Upload Error: " + err.toString();
  }
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = JSON.parse(e.postData.contents);
  const action = params.action; 
  
  let sheetName = "건축물관리";
  if (action === "UPDATE_EQUIPMENT" || action === "UPDATE_EQUIPMENT_POSITION") {
    sheetName = "설비관리";
  } else if (action === "NOTICE" || action === "ADD_NOTICE" || action === "DELETE_NOTICE" || (params.category === "NOTICE" && action === "LOG")) {
    sheetName = "공지사항";
  } else if (action === "UPDATE_LANDSCAPING_PLAN") {
    sheetName = "조경계획";
  } else if (action === "SAVE_PATH" || action === "DELETE_PATH" || action === "UPDATE_PATH") {
    sheetName = "관로관리";
  }
  
  let targetSheet = ss.getSheetByName(sheetName);
  if (!targetSheet) {
    targetSheet = ss.insertSheet(sheetName);
  }
  
  // 관로 삭제 처리
  if (action === "DELETE_PATH") {
    const data = targetSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(params.id).trim()) {
        targetSheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 관로 업데이트 처리 (좌표 수정)
  if (action === "UPDATE_PATH") {
    const data = targetSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const colPoints = headers.indexOf("points") + 1;
    const idToUpdate = String(params.id).trim();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idToUpdate) {
        if (colPoints > 0) {
          targetSheet.getRange(i + 1, colPoints).setValue(JSON.stringify(params.points));
          return ContentService.createTextOutput(JSON.stringify({result: "success"}))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: "Path ID를 찾을 수 없습니다."}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 관로 저장 처리 (헤더 자동 생성 포함)
  if (action === "SAVE_PATH") {
    const p = params.path;
    // 시트가 완전히 비어있거나 데이터만 있다면 헤더를 먼저 확인
    if (targetSheet.getLastRow() === 0) {
      targetSheet.appendRow(["id", "name", "type", "color", "points", "timestamp"]);
    }
    
    targetSheet.appendRow([
      p.id, 
      p.name, 
      p.type, 
      p.color, 
      JSON.stringify(p.points), 
      Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
    ]);
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 조경 계획 업데이트
  if (action === "UPDATE_LANDSCAPING_PLAN") {
    const plans = params.plans; // Array of {season, months, tasks}
    if (!plans || !Array.isArray(plans)) {
      return ContentService.createTextOutput(JSON.stringify({result: "error", message: "Invalid plans data"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    targetSheet.clear();
    targetSheet.appendRow(["season", "months", "tasks"]);
    plans.forEach(p => {
      targetSheet.appendRow([p.season, p.months, p.tasks]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 공지사항 삭제 처리
  if (action === "DELETE_NOTICE") {
    const data = targetSheet.getDataRange().getValues();
    const idToDelete = String(params.id).trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === idToDelete) {
        targetSheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 새 공지사항 추가
  if (action === "NOTICE" || (params.category === "NOTICE" && action === "LOG")) {
    const val = params.value || {};
    const newId = "N" + Date.now();
    if (targetSheet.getLastRow() === 0) {
      targetSheet.appendRow(["id", "title", "date", "isUrgent", "category", "content", "photoUrl", "fileUrl"]);
    }
    
    // 공지사항 파일 업로드 처리
    let photoUrl = val.photoUrl || "";
    let fileUrl = val.fileUrl || "";
    
    if (val.photoData && val.photoName) {
      photoUrl = uploadFile(val.photoData, val.photoName, val.photoType, "공지사항_사진");
    }
    if (val.fileData && val.fileName) {
      fileUrl = uploadFile(val.fileData, val.fileName, val.fileType, "공지사항_첨부");
    }

    targetSheet.appendRow([
      newId, 
      val.title || params.title, 
      val.date || Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd"), 
      val.isUrgent ? "true" : "false", 
      val.category || "시설", 
      val.content || "", 
      photoUrl, 
      fileUrl
    ]);
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = targetSheet.getDataRange().getValues();
  if (!data || data.length === 0 || !data[0]) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: "시트에 데이터가 없습니다."}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const headers = data[0].map(h => String(h).trim()); 
  const idToUpdate = String(params.id).trim();
  
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === idToUpdate) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1 && action !== "LOG") {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: "ID [" + idToUpdate + "]를 찾을 수 없습니다."}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let updateMap = {};

  if (action === "UPDATE_POSITION" || action === "UPDATE_EQUIPMENT_POSITION") {
    updateMap["coordX"] = params.coordX;
    updateMap["coordY"] = params.coordY;
    updateMap["x"] = params.coordX;
    updateMap["y"] = params.coordY;
  } else if (action === "UPDATE_BUILDING") {
    const info = params.info || {};
    
    // 사진 업로드 처리
    let photoUrl = info.photoUrl || "";
    if (info.fileData && info.fileName) {
      photoUrl = uploadFile(info.fileData, info.fileName, info.fileType, info.name || "건축물");
    }

    updateMap = {
      "id": idToUpdate,
      "name": info.name, "이름": info.name, "시설명": info.name,
      "structure": info.structure, "구조": info.structure,
      "floors": info.floors, "규모": info.floors, "층수": info.floors,
      "area": info.area, "연면적": info.area,
      "completionDate": info.completionDate, "준공일": info.completionDate,
      "safetyGrade": info.safetyGrade, "안전등급": info.safetyGrade,
      "lastSafetyCheck": info.lastSafetyCheck, "최종안전진단일": info.lastSafetyCheck,
      "roofType": info.roofType, "지붕구조": info.roofType,
      "heatingType": info.heatingType, "냉난방방식": info.heatingType,
      "elevatorCount": info.elevatorCount, "승강기대수": info.elevatorCount,
      "parkingCapacity": info.parkingCapacity, "주차대수": info.parkingCapacity,
      "exteriorFinish": info.exteriorFinish, "외벽마감": info.exteriorFinish,
      "usage": info.usage, "주요용도": info.usage,
      "coordX": params.coordX || info.x, "x": params.coordX || info.x,
      "coordY": params.coordY || info.y, "y": params.coordY || info.y,
      "address": info.address, "건축물소재지": info.address,
      "valuation": info.valuation, "평가액": info.valuation,
      "bookValue": info.bookValue, "장부가액": info.bookValue,
      "floorPlanUrl": info.floorPlanUrl, "평면도링크": info.floorPlanUrl,
      "buildingLedgerUrl": info.buildingLedgerUrl, "건축물대장링크": info.buildingLedgerUrl,
      "registrationTranscriptUrl": info.registrationTranscriptUrl, "등기부등본링크": info.registrationTranscriptUrl,
      "photoUrl": photoUrl, "사진": photoUrl, "사진URL": photoUrl
    };
  } else if (action === "UPDATE_EQUIPMENT" || action === "ADD_EQUIPMENT") {
    const info = params.info || {};
    
    // 사진 업로드 처리
    let photoUrl = info.photoUrl || "";
    if (info.fileData && info.fileName) {
      photoUrl = uploadFile(info.fileData, info.fileName, info.fileType, info.orgName || "설비");
    }

    updateMap = {
      "id": idToUpdate,
      "설비명": info.name, "name": info.name,
      "설비위치": info.location, "location": info.location,
      "관리주체": info.orgName, "orgName": info.orgName,
      "설치일": info.installDate, "installDate": info.installDate,
      "주요제원": info.specs, "specs": info.specs,
      "관리주기": info.cycle, "cycle": info.cycle,
      "관리메뉴얼": info.manualUrl, "manualUrl": info.manualUrl,
      "사진": photoUrl, "photoUrl": photoUrl, "사진URL": photoUrl,
      "As업체": info.asCompany, "asCompany": info.asCompany,
      "전화번호": info.asTel, "asTel": info.asTel,
      "비고": info.remarks, "remarks": info.remarks,
      "coordX": params.coordX || info.x, "x": params.coordX || info.x,
      "coordY": params.coordY || info.y, "y": params.coordY || info.y
    };
    
    // 만약 행이 존재하지 않는다면(ADD_EQUIPMENT인 경우 등) 새 행 추가
    if (rowIndex === -1 && action === "ADD_EQUIPMENT") {
      const rowData = headers.map(h => updateMap[h] || "");
      targetSheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({result: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } else if (action === "LOG") {
    if (params.category === "CONSTRUCTION") {
      let constSheet = ss.getSheetByName("공사관리");
      if (!constSheet) {
        constSheet = ss.insertSheet("공사관리");
        constSheet.appendRow(["대상 시설", "날짜 / 기간", "작업/공사명", "담당자 / 업체", "첨부파일", "timestamp"]);
      }
      
      const val = params.value || {};
      const fileUrl = uploadFile(val.fileData, val.fileName, val.fileType, params.org);

      constSheet.appendRow([
        params.org,
        val.date || "",
        params.title || "",
        val.contractor || "",
        fileUrl,
        Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
      ]);
    } else if (params.category === "LANDSCAPING") {
      let landSheet = ss.getSheetByName("조경관리");
      if (!landSheet) {
        landSheet = ss.insertSheet("조경관리");
        landSheet.appendRow(["대상 시설", "날짜 / 기간", "작업/공사명", "담당자 / 업체", "첨부파일", "timestamp"]);
      }
      
      const val = params.value || {};
      const fileUrl = uploadFile(val.fileData, val.fileName, val.fileType, params.org);

      landSheet.appendRow([
        params.org,
        val.date || "",
        params.title || "",
        val.contractor || "",
        fileUrl,
        Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
      ]);
    } else if (params.category === "WATER_QUALITY") {
      let waterSheet = ss.getSheetByName("수질관리");
      if (!waterSheet) {
        waterSheet = ss.insertSheet("수질관리");
        waterSheet.appendRow(["저수조 명", "날짜", "pH", "잔류염소", "탁도", "수온", "담당자", "첨부파일", "timestamp"]);
      }
      
      const val = params.value || {};
      const fileUrl = uploadFile(val.fileData, val.fileName, val.fileType, params.org);

      waterSheet.appendRow([
        params.org, // 프론트에서 org 필드에 저수조 명을 담아 보냄
        val.date || "",
        val.ph || "",
        val.chlorine || "",
        val.turbidity || "",
        val.temperature || "",
        val.worker || "",
        fileUrl,
        Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss")
      ]);
    } else {
      let logSheet = ss.getSheetByName("log");
      if (!logSheet) {
        logSheet = ss.insertSheet("log");
        logSheet.appendRow(["timestamp", "org", "category", "title", "value"]);
      }
      logSheet.appendRow([Utilities.formatDate(new Date(), "GMT+9", "yyyy-MM-dd HH:mm:ss"), params.org, params.category, params.title, JSON.stringify(params.value)]);
    }
    return ContentService.createTextOutput(JSON.stringify({result: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  headers.forEach((header, colIdx) => {
    if (updateMap[header] !== undefined) {
      targetSheet.getRange(rowIndex, colIdx + 1).setValue(updateMap[header]);
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify({result: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
