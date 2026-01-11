import axios from './axios';
import { PENDING_PAYMENTS_RESOURCE } from './constants/endpoints';

const accountingService = {
  // Get all pending payments with pagination and search
  getPendingPayments: async (filters = {}, role = null) => {
    try {
      // Construct the endpoint URL with the role if provided
      const endpoint = role ? `${PENDING_PAYMENTS_RESOURCE}/${role}` : PENDING_PAYMENTS_RESOURCE;
      
      const response = await axios.get(endpoint, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get detailed payment information
  getPaymentDetails: async (paymentId) => {
    try {
      const response = await axios.get(`${PENDING_PAYMENTS_RESOURCE}/${paymentId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error.response?.data || error.message;
    }
  },

  // Verify a payment
  verifyPayment: async (paymentId) => {
    try {
      const response = await axios.post(`${PENDING_PAYMENTS_RESOURCE}/${paymentId}/verify`);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error.response?.data || error.message;
    }
  },

  // Reject a payment
  rejectPayment: async (paymentId, reason) => {
    try {
      const response = await axios.post(`/api/accounting/review-payment/${paymentId}/rejected`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting payment:', error);
      throw error.response?.data || error.message;
    }
  },

  // Reject a reconciliation
  rejectReconciliation: async (reconciliationId, reason) => {
    try {
      const response = await axios.post(`/api/accounting/review-payment/${reconciliationId}/rejected`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting reconciliation:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get bank details
  getBankDetails: async () => {
    try {
      const response = await axios.get('/api/accounting/bank_details');
      return response.data;
    } catch (error) {
      console.error('Error fetching bank details:', error);
      throw error.response?.data || error.message;
    }
  },

  // Upload bank statement
  uploadBankStatement: async (payload) => {
    try {
      const response = await axios.post('/api/accounting/upload_statement', payload);
      return response.data;
    } catch (error) {
      console.error('Error uploading bank statement:', error);
      throw error.response?.data || error.message;
    }
  },

  // Verify a reconciliation (for Accountant role)
  verifyReconciliation: async (reconciliationId) => {
    try {
      const response = await axios.post(`/api/accounting/review-payment/${reconciliationId}/verified`);
      return response.data;
    } catch (error) {
      console.error('Error verifying reconciliation:', error);
      throw error.response?.data || error.message;
    }
  },

  // Approve a reconciliation (for Manager role)
  approveReconciliation: async (reconciliationId) => {
    try {
      const response = await axios.post(`/api/accounting/review-payment/${reconciliationId}/approved`);
      return response.data;
    } catch (error) {
      console.error('Error approving reconciliation:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch reconciliation summary data
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise} - Promise with reconciliation summary data
   */
  getReconciliationSummary: async (startDate, endDate) => {
    try {
      const response = await axios.get('/api/accounting/reconciliation-summary', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reconciliation summary:', error);
      throw error;
    }
  },

  getReconciliationSummaryDetails: async (category, params) => {
    try {
      const response = await axios.get(`/api/accounting/reconciliation-summary-details/${category}`, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get matched payment details
  getMatchedPaymentDetails: async (applicationId, paymentId) => {
    try {
      const response = await axios.get(`/accounting/matched-payment-details`, {
        params: { application_id: applicationId, payment_id: paymentId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching matched payment details:', error);
      throw error;
    }
  },

  // Confirm payment match
  confirmPaymentMatch: async (applicationId, paymentId) => {
    try {
      const response = await axios.post(`/accounting/confirm-payment-match`, {
        application_id: applicationId,
        payment_id: paymentId
      });
      return response.data;
    } catch (error) {
      console.error('Error confirming payment match:', error);
      throw error;
    }
  },

  // Reject payment match
  rejectPaymentMatch: async (applicationId, paymentId) => {
    try {
      const response = await axios.post(`/accounting/reject-payment-match`, {
        application_id: applicationId,
        payment_id: paymentId
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting payment match:', error);
      throw error;
    }
  },

  // Get payment history for a specific user
  getPaymentHistory: async (userId) => {
    try {
      const response = await axios.get(`/api/accounting/payment-history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await axios.get('/api/accounting/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Fetch general accounting report data
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise} - Promise with general report data
   */
  getGeneralReport: async (startDate, endDate) => {
    try {
      const response = await axios.get('/api/accounting/reports/general', {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching general report:', error);
      throw error;
    }
  }
};

export default accountingService; 