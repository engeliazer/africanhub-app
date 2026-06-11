import axios from './axios';

const BATCHES_ENDPOINT = '/api/mail/batches';

const mailService = {
  /**
   * Fetch mail batches.
   * @returns {Promise<{ data: Array|Object }>}
   */
  getBatches: async () => {
    const response = await axios.get(BATCHES_ENDPOINT);
    return response.data;
  },

  /**
   * Create a mail batch.
   * @param {Object} payload
   * @param {string} payload.source_email
   * @param {string} payload.subject
   * @param {string} payload.message_body
   * @param {number} payload.interval_seconds
   * @param {number} payload.interval_limit
   * @param {Array<{ email: string, full_name: string }>} payload.recipients
   */
  createBatch: async (payload) => {
    const body = {
      source_email: payload.source_email,
      subject: payload.subject,
      message_body: payload.message_body,
      interval_seconds: payload.interval_seconds,
      interval_limit: payload.interval_limit,
      recipients: (payload.recipients || []).map(({ email, full_name }) => ({
        email,
        full_name: full_name || ''
      }))
    };
    const response = await axios.post(BATCHES_ENDPOINT, body);
    return response.data;
  },

  /**
   * Fetch a single batch with recipient statuses.
   * @param {number|string} id
   */
  getBatch: async (id) => {
    const response = await axios.get(`${BATCHES_ENDPOINT}/${id}`);
    return response.data;
  },

  /**
   * Start sending a batch. Only valid when status is pending.
   * @param {number|string} id
   */
  startBatch: async (id) => {
    const response = await axios.post(`${BATCHES_ENDPOINT}/${id}/start`);
    return response.data;
  },

  /**
   * Upload or replace PDF attachment for a pending batch.
   * @param {number|string} id
   * @param {File} file - PDF file (max 2MB)
   */
  uploadAttachment: async (id, file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    const response = await axios.post(`${BATCHES_ENDPOINT}/${id}/attachment`, formData);
    return response.data;
  },

  /**
   * Remove PDF attachment from a pending batch.
   * @param {number|string} id
   */
  removeAttachment: async (id) => {
    const response = await axios.delete(`${BATCHES_ENDPOINT}/${id}/attachment`);
    return response.data;
  },

  /**
   * Download batch PDF attachment.
   * @param {number|string} id
   */
  downloadAttachment: async (id) => {
    const response = await axios.get(`${BATCHES_ENDPOINT}/${id}/attachment`, {
      responseType: 'blob'
    });
    return response;
  }
};

export default mailService;
