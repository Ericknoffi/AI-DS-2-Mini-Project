const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
  // Fetch dashboard analytics
  getAnalytics: async (batchId = null) => {
    try {
      const url = batchId && batchId !== 'all' 
        ? `${API_BASE_URL}/analytics?batch_id=${encodeURIComponent(batchId)}`
        : `${API_BASE_URL}/analytics`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return await res.json();
    } catch (err) {
      console.warn('Analytics fetch warning:', err);
      return null;
    }
  },

  // Fetch paginated logs with filters
  getLogs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.batch_id && params.batch_id !== 'all') query.append('batch_id', params.batch_id);
    if (params.anomaly_only) query.append('anomaly_only', 'true');
    if (params.status_code) query.append('status_code', params.status_code);
    if (params.ip_search) query.append('ip_search', params.ip_search);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);

    try {
      const res = await fetch(`${API_BASE_URL}/logs?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return await res.json();
    } catch (err) {
      console.warn('Logs fetch warning:', err);
      return { logs: [], total: 0 };
    }
  },

  // Fetch all uploaded batches / log file history
  getBatches: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/batches`);
      if (!res.ok) throw new Error('Failed to fetch upload batches');
      return await res.json();
    } catch (err) {
      console.warn('Batches fetch warning:', err);
      return { batches: [] };
    }
  },

  // Delete a specific batch
  deleteBatch: async (batchId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/batches/${encodeURIComponent(batchId)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete batch');
      return await res.json();
    } catch (err) {
      console.error('Delete batch error:', err);
      throw err;
    }
  },

  // Trigger AI explanation for a log entry
  explainLog: async (logId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/logs/${logId}/explain`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to generate AI explanation');
      return await res.json();
    } catch (err) {
      console.error('AI Explainer error:', err);
      throw err;
    }
  },

  // Upload CSV file
  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/logs/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload CSV');
    }
    return await res.json();
  },

  // Export Executive SRE Report
  exportReport: async (minScore = 0.70) => {
    try {
      const res = await fetch(`${API_BASE_URL}/export/report?min_score=${minScore}`);
      if (!res.ok) throw new Error('Failed to export executive report');
      return await res.json();
    } catch (err) {
      console.error('Report Export error:', err);
      throw err;
    }
  },

  // Get available models from backend/models/ folder
  getModels: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/models`);
      if (!res.ok) throw new Error('Failed to fetch available models');
      return await res.json();
    } catch (err) {
      console.warn('Models fetch warning:', err);
      return { models: [{ id: 'isolation_forest.joblib', name: 'Isolation Forest (300 Trees)' }] };
    }
  },

  // Switch active detector model and re-evaluate
  switchModel: async (modelFilename) => {
    try {
      const res = await fetch(`${API_BASE_URL}/models/re-run?model_filename=${encodeURIComponent(modelFilename)}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to switch model');
      return await res.json();
    } catch (err) {
      console.error('Model switch error:', err);
      throw err;
    }
  }
};
