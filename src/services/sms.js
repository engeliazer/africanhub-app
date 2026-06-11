import axios from './axios';

const SMS_LOGS_ENDPOINT = '/api/sms/logs';
const SEND_BROADCAST_ENDPOINT = '/api/sms/send-broadcast';
const SEND_CUSTOM_ENDPOINT = '/api/sms/send-custom';

const smsService = {
  /**
   * Fetch SMS logs with optional filters and pagination.
   * @param {Object} params
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.per_page=20] - Page size (capped at 100)
   * @param {string} [params.process_name] - Filter by process (e.g. registration, payment_approved, api_send)
   * @param {string} [params.status] - Filter by sent or failed
   * @param {string} [params.recipient] - Filter by recipient (substring match on number)
   * @param {string} [params.from_date] - Filter from date (YYYY-MM-DD)
   * @param {string} [params.to_date] - Filter to date (YYYY-MM-DD)
   * @returns {Promise<{ data: { logs: Array, pagination: Object } }>}
   */
  getLogs: async (params = {}) => {
    const { page = 1, per_page = 20, process_name, status, recipient, from_date, to_date } = params;
    const query = { page, per_page: Math.min(per_page, 100) };
    if (process_name) query.process_name = process_name;
    if (status) query.status = status;
    if (recipient) query.recipient = recipient;
    if (from_date) query.from_date = from_date;
    if (to_date) query.to_date = to_date;

    const response = await axios.get(SMS_LOGS_ENDPOINT, { params: query });
    return response.data;
  },

  /**
   * Send broadcast SMS. JWT required.
   * @param {Object} payload
   * @param {string} payload.category - "all_users" | "active_subscribers" | "inactive_no_application"
   * @param {string} payload.message - Message text. Placeholders: [FULLNAME], [SINGLENAME]
   */
  sendBroadcast: async (payload) => {
    const response = await axios.post(SEND_BROADCAST_ENDPOINT, payload);
    return response.data;
  },

  /**
   * Send custom SMS to specific recipients. JWT required.
   * @param {Object} payload
   * @param {string} payload.message - Message text. Placeholders: [FULLNAME], [SINGLENAME]
   * @param {number[]|string[]} payload.recipients - Array of phone numbers or user IDs
   */
  sendCustom: async (payload) => {
    const response = await axios.post(SEND_CUSTOM_ENDPOINT, payload);
    return response.data;
  }
};

export default smsService;
