
/**
 * 보령학사 시설물 관리 시스템 백엔드 (GAS)
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (e && e.parameter && e.parameter.sheet) || "건축물관리";
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    // 필수 시트가 없는 경우 에러 대신 빈 배열 반환 (초기화 편의성)
    const autoCreateSheets = ["log", "관로관리", "공지사항", "설비관리", "차량현황"];
    if (autoCreateSheets.indexOf(sheetName) !== -1) {
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

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const params = JSON.parse(e.postData.contents);
  const action = params.action; 
  
  let sheetName = "건축물관리";
  if (action === "UPDATE_EQUIPMENT" || action === "UPDATE_EQUIPMENT_POSITION") {
    sheetName = "설비관리";
  } else if (action === "NOTICE" || action === "ADD_NOTICE" || action === "DELETE_NOTICE" || (params.category === "NOTICE" && action === "LOG")) {
    sheetName = "공지사항";
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
      new Date()
    ]);
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
    targetSheet.appendRow([
      newId, 
      val.title || params.title, 
      val.date || new Date().toISOString().split('T')[0], 
      val.isUrgent ? "true" : "false", 
      val.category || "시설", 
      val.content || "", 
      val.photoUrl || "", 
      val.fileUrl || ""
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
      "photoUrl": info.photoUrl, "사진": info.photoUrl, "사진URL": info.photoUrl
    };
  } else if (action === "UPDATE_EQUIPMENT") {
    const info = params.info || {};
    updateMap = {
      "id": idToUpdate,
      "설비명": info.name, "name": info.name,
      "설비위치": info.location, "location": info.location,
      "관리주체": info.orgName, "orgName": info.orgName,
      "설치일": info.installDate, "installDate": info.installDate,
      "주요제원": info.specs, "specs": info.specs,
      "관리주기": info.cycle, "cycle": info.cycle,
      "관리메뉴얼": info.manualUrl, "manualUrl": info.manualUrl,
      "사진": info.photoUrl, "photoUrl": info.photoUrl, "사진URL": info.photoUrl,
      "As업체": info.asCompany, "asCompany": info.asCompany,
      "전화번호": info.asTel, "asTel": info.asTel,
      "비고": info.remarks, "remarks": info.remarks
    };
  } else if (action === "LOG") {
    let logSheet = ss.getSheetByName("log");
    if (!logSheet) {
      logSheet = ss.insertSheet("log");
      logSheet.appendRow(["timestamp", "org", "category", "title", "value"]);
    }
    logSheet.appendRow([new Date(), params.org, params.category, params.title, JSON.stringify(params.value)]);
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
