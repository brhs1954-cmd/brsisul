
import { GOOGLE_SHEET_API_URL } from './data';

export const ApiService = {
  async fetchData(sheetName?: string) {
    try {
      const url = sheetName 
        ? `${GOOGLE_SHEET_API_URL}?sheet=${encodeURIComponent(sheetName)}` 
        : GOOGLE_SHEET_API_URL;
        
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetching error:', error);
      return null;
    }
  },

  async submitData(payload: { org: string; category: string; title: string; value: any }) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ...payload, action: 'LOG' }),
      });
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Submission error:', error);
      return { success: false };
    }
  },

  async updateLogData(payload: { org: string; category: string; title: string; value: any }) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ ...payload, action: 'UPDATE_LOG' }),
      });
      const result = await response.json();
      return { success: result.result === 'success', message: result.message };
    } catch (error) {
      console.error('Update log error:', error);
      return { success: false };
    }
  },

  async savePath(path: any) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'SAVE_PATH', ...path }),
      });
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Path save error:', error);
      return { success: false };
    }
  },

  async deletePath(id: string) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'DELETE_PATH', id }),
      });
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Path delete error:', error);
      return { success: false };
    }
  },

  async updatePath(id: string, points: any[]) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'UPDATE_PATH', id, points }),
      });
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Path update error:', error);
      return { success: false };
    }
  },

  async deleteNotice(id: string) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'DELETE_NOTICE', id: id }),
      });
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Notice delete error:', error);
      return { success: false };
    }
  },

  async updateBuildingInfo(id: string, info: any) {
    try {
      const payload = {
        action: 'UPDATE_BUILDING',
        id: id,
        info: info, // Wrapped for some script versions
        ...info,    // Flattened for others
        coordX: info.x,
        coordY: info.y
      };

      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log('Building update result:', result);
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Update error:', error);
      return { success: false };
    }
  },

  async updateEquipmentInfo(id: string, info: any) {
    try {
      const payload = {
        action: 'UPDATE_EQUIPMENT',
        id: id,
        info: info, // Wrapped
        ...info,    // Flattened
        coordX: info.x,
        coordY: info.y
      };
      
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log('Equipment update result:', result);
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Equipment update error:', error);
      return { success: false };
    }
  },

  async addEquipment(info: any) {
    try {
      const payload = {
        action: 'ADD_EQUIPMENT',
        info: info, // Wrapped
        ...info,    // Flattened
        coordX: info.x,
        coordY: info.y
      };

      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log('Equipment add result:', result);
      if (result.result === 'success') return { success: true };
      
      // If ADD_EQUIPMENT action is not supported, try UPDATE_EQUIPMENT as fallback
      console.warn('ADD_EQUIPMENT failed, trying UPDATE_EQUIPMENT fallback');
      return this.updateEquipmentInfo(info.id, info);
    } catch (error) {
      console.error('Equipment add error:', error);
      return this.updateEquipmentInfo(info.id, info);
    }
  },

  async updatePosition(id: string, x: number, y: number) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'UPDATE_POSITION',
          id: id,
          coordX: x,
          coordY: y
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Position update error:', error);
      return { success: false };
    }
  },

  async updateEquipmentPosition(id: string, x: number, y: number) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ 
          action: 'UPDATE_EQUIPMENT_POSITION',
          id: id,
          coordX: x,
          coordY: y
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Equipment position update error:', error);
      return { success: false };
    }
  },

  async updateLandscapingPlan(plans: any[]) {
    try {
      const response = await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPDATE_LANDSCAPING_PLAN', plans }),
      });
      const result = await response.json();
      return { success: result.result === 'success' };
    } catch (error) {
      console.error('Landscaping plan update error:', error);
      return { success: false };
    }
  }
};
