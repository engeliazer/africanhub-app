import axios from './axios';

const BASE = '/api/invitations';

const invitationsService = {
  // Trainers
  getTrainers: async (activeOnly = true) => {
    const response = await axios.get(`${BASE}/trainers`, {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  createTrainer: async (payload, photoFile = null) => {
    if (photoFile) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val != null && val !== '') formData.append(key, val);
      });
      formData.append('photo', photoFile);
      const response = await axios.post(`${BASE}/trainers`, formData);
      return response.data;
    }
    const response = await axios.post(`${BASE}/trainers`, payload);
    return response.data;
  },

  updateTrainer: async (id, payload, photoFile = null) => {
    if (photoFile) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val != null && val !== '') formData.append(key, val);
      });
      formData.append('photo', photoFile);
      const response = await axios.put(`${BASE}/trainers/${id}`, formData);
      return response.data;
    }
    const response = await axios.put(`${BASE}/trainers/${id}`, payload);
    return response.data;
  },

  deactivateTrainer: async (id) => {
    const response = await axios.delete(`${BASE}/trainers/${id}`);
    return response.data;
  },

  // Invitations
  createInvitation: async (payload) => {
    const response = await axios.post(BASE, payload);
    return response.data;
  },

  getInvitations: async (params = {}) => {
    const { page = 1, per_page = 20, status } = params;
    const query = { page, per_page: Math.min(per_page, 100) };
    if (status) query.status = status;
    const response = await axios.get(BASE, { params: query });
    return response.data;
  },

  getInvitation: async (id, includeInvitees = false) => {
    const response = await axios.get(`${BASE}/${id}`, {
      params: { include_invitees: includeInvitees }
    });
    return response.data;
  },

  updateInvitation: async (id, payload) => {
    const response = await axios.put(`${BASE}/${id}`, payload);
    return response.data;
  },

  cancelInvitation: async (id) => {
    const response = await axios.delete(`${BASE}/${id}`);
    return response.data;
  },

  assignTrainers: async (id, trainerIds) => {
    const response = await axios.post(`${BASE}/${id}/trainers`, { trainer_ids: trainerIds });
    return response.data;
  },

  // Invitees
  validateInvitees: async (id, invitees) => {
    const response = await axios.post(`${BASE}/${id}/invitees/validate`, { invitees });
    return response.data;
  },

  saveInvitees: async (id, invitees, replace = true) => {
    const response = await axios.post(`${BASE}/${id}/invitees`, { replace, invitees });
    return response.data;
  },

  getInvitees: async (id, params = {}) => {
    const response = await axios.get(`${BASE}/${id}/invitees`, { params });
    return response.data;
  },

  getInviteeSummary: async (id) => {
    const response = await axios.get(`${BASE}/${id}/invitees/summary`);
    return response.data;
  },

  clearInvitees: async (id) => {
    const response = await axios.delete(`${BASE}/${id}/invitees`);
    return response.data;
  },

  // Preview
  getPreviewHtml: async (id, params = {}) => {
    const response = await axios.get(`${BASE}/${id}/preview/html`, { params });
    return response.data;
  },

  getPreviewHtmlRaw: async (id, params = {}) => {
    const response = await axios.get(`${BASE}/${id}/preview/html`, {
      params: { ...params, format: 'html' },
      responseType: 'text'
    });
    return response.data;
  },

  downloadPreviewPdf: async (id, params = {}) => {
    const response = await axios.get(`${BASE}/${id}/preview/pdf`, {
      params,
      responseType: 'blob'
    });
    return response;
  },

  uploadTemplate: async (id, file) => {
    const formData = new FormData();
    formData.append('template', file);
    const response = await axios.post(`${BASE}/${id}/template`, formData);
    return response.data;
  },

  removeTemplate: async (id) => {
    const response = await axios.delete(`${BASE}/${id}/template`);
    return response.data;
  },

  downloadDefaultTemplate: async (id) => {
    const response = await axios.get(`${BASE}/${id}/template/default`, {
      responseType: 'blob'
    });
    return response;
  },

  // Send
  sendTest: async (id, payload) => {
    const response = await axios.post(`${BASE}/${id}/send/test`, payload);
    return response.data;
  },

  scheduleSend: async (id, scheduledAt) => {
    const response = await axios.post(`${BASE}/${id}/send/schedule`, {
      scheduled_at: scheduledAt
    });
    return response.data;
  },

  startSend: async (id, { force = false, retry_failed = false } = {}) => {
    const response = await axios.post(`${BASE}/${id}/send/start`, { force, retry_failed });
    return response.data;
  }
};

export default invitationsService;
