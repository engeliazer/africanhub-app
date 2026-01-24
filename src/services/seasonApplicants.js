import axios from './axios';
import { SEASON_APPLICANTS_RESOURCE } from './constants/endpoints';

const seasonApplicantsService = {
  getSeasonApplicants: async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`/api/my-applications?page=${page}&per_page=${perPage}`);
      return {
        status: response.data.status,
        data: response.data.data
      };
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching my applications';
    }
  },

  getSeasonApplicantsBySeason: async (seasonId, page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`/api/season-applicants/season/${seasonId}?page=${page}&per_page=${perPage}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching season applications';
    }
  },

  createSeasonApplicant: async (data) => {
    try {
      // Get user_id from localStorage
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      const userId = userInfo.id || userInfo.user_id;
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      // If we're getting individual subject applications, convert to batch format
      if (data.subject_id) {
        // Single subject application - no longer requires season_id
        const payload = {
          user_id: userId,
          subject_ids: [data.subject_id],
          payment_status: data.payment_status || 'pending_payment',
          status: data.status || 'pending',
          details: [
            {
              subject_id: data.subject_id,
              fee: data.fee || 0
            }
          ]
        };
        
        // Only include optional fields if they exist
        if (data.payment_method) payload.payment_method = data.payment_method;
        if (data.mobile_number) payload.mobile_number = data.mobile_number;
        if (data.transaction_id) payload.transaction_id = data.transaction_id;
        if (data.payment_date) payload.payment_date = data.payment_date;
        
        const response = await axios.post('/api/applications', payload);
        return response.data;
      } else if (Array.isArray(data.subject_ids)) {
        // Batch format - create details array from subject_ids and fees
        const details = data.subject_ids.map((subjectId, index) => ({
          subject_id: subjectId,
          fee: Array.isArray(data.fees) ? data.fees[index] : (data.fee || 0)
        }));
        
        const payload = {
          user_id: userId,
          subject_ids: data.subject_ids,
          payment_status: data.payment_status || 'pending_payment',
          status: data.status || 'pending',
          details: details
        };
        
        // Only include optional fields if they exist
        if (data.payment_method) payload.payment_method = data.payment_method;
        if (data.mobile_number) payload.mobile_number = data.mobile_number;
        if (data.transaction_id) payload.transaction_id = data.transaction_id;
        if (data.payment_date) payload.payment_date = data.payment_date;
        
        const response = await axios.post('/api/applications', payload);
        return response.data;
      } else {
        throw new Error('Invalid application data: missing subject_id or subject_ids');
      }
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Error creating application';
    }
  },

  // Create multiple applications in batch
  createBatchApplications: async (seasonId, userId, subjectIds, paymentStatus = 'pending_payment') => {
    try {
      // The updated API creates a single application with multiple subjects
      const response = await axios.post('/api/season-applications', {
        user_id: userId,
        season_id: seasonId,
        subject_ids: subjectIds,
        payment_status: paymentStatus,
        status: 'pending'
      });
      
      // The response should now include an application_id instead of application_ids array
      // if the API returns multiple applications, it will be in application_ids
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error creating batch applications';
    }
  },

  updateSeasonApplicant: async (id, data) => {
    try {
      const response = await axios.put(`${SEASON_APPLICANTS_RESOURCE}/${id}`, {
        // Only include fields that are provided in the update
        ...(data.payment_status && { payment_status: data.payment_status }),
        ...(data.payment_method && { payment_method: data.payment_method }),
        ...(data.mobile_number && { mobile_number: data.mobile_number }),
        ...(data.transaction_id && { transaction_id: data.transaction_id }),
        ...(data.status && { status: data.status }),
        ...(data.payment_date && { payment_date: data.payment_date })
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error updating application';
    }
  },

  // Update applications by transaction ID
  updateApplicationsByTransaction: async (transactionId, data) => {
    try {
      const response = await axios.put(`/api/season-applications/transaction/${transactionId}`, {
        // Only include fields that are provided in the update
        ...(data.payment_status && { payment_status: data.payment_status }),
        ...(data.payment_method && { payment_method: data.payment_method }),
        ...(data.mobile_number && { mobile_number: data.mobile_number }),
        ...(data.status && { status: data.status }),
        ...(data.payment_date && { payment_date: data.payment_date })
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error updating applications by transaction';
    }
  },

  deleteSeasonApplicant: async (id) => {
    try {
      const response = await axios.delete(`${SEASON_APPLICANTS_RESOURCE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error deleting application';
    }
  },

  // Cancel application
  cancelApplication: async (applicationId) => {
    try {
      const response = await axios.put(`/api/my-applications/${applicationId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error canceling application';
    }
  },
  
  // Submit payment for applications
  submitPayment: async (paymentData) => {
    try {
      console.log('Service: Submitting payment data:', paymentData);
      
      // Simplified payload - backend will handle transaction ID, date and status
      const payload = {
        application_ids: paymentData.application_ids,
        payment_method: paymentData.payment_method,
        mobile_number: paymentData.mobile_number,
        amount: paymentData.amount
      };

      // Add bank reference if provided
      if (paymentData.bank_reference) {
        payload.bank_reference = paymentData.bank_reference;
      }
      
      const response = await axios.post('/api/season-applications/payment', payload);
      
      console.log('Service: Payment API response:', response);
      
      // 201 Created is a success status
      return response;
    } catch (error) {
      console.error('Service: Payment submission error:', error);
      
      // If in development mode, provide a dummy successful response
      if (window.location.hostname === 'localhost') {
        console.log('Using dummy payment implementation for local development');
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create a dummy successful response
        const dummyResponse = {
          status: 201,
          data: {
            status: 'success',
            message: 'Payment processed successfully (DUMMY)',
            transaction_id: `DUMMY-TXN-${Date.now()}`,
            payment: {
              id: Math.floor(Math.random() * 10000),
              application_ids: paymentData.application_ids,
              payment_method: paymentData.payment_method,
              mobile_number: paymentData.mobile_number,
              amount: paymentData.amount,
              status: 'paid',
              transaction_id: `DUMMY-TXN-${Date.now()}`,
              payment_date: new Date().toISOString(),
              bank_reference: paymentData.bank_reference
            }
          }
        };
        
        return dummyResponse;
      }
      
      throw error.response?.data?.message || 'Error processing payment';
    }
  },

  // Check payment status of an application
  checkPaymentStatus: async (applicationId) => {
    try {
      console.log('Checking payment status for application:', applicationId);
      const response = await axios.get(`/api/season-applications/${applicationId}/payment-status`);
      console.log('Payment status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      
      // If in development mode, provide a dummy successful response
      if (window.location.hostname === 'localhost') {
        console.log('Using dummy payment status implementation for local development');
        
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create a dummy successful response for testing
        const dummyResponse = {
          data: {
            application_id: applicationId,
            payment_status: 'paid',
            payment_method: 'M-Pesa',
            mobile_number: '255XXXXXXXXX',
            amount: 50000,
            transaction_id: `DUMMY-TXN-${Date.now()}`,
            payment_date: new Date().toISOString()
          }
        };
        
        return dummyResponse;
      }
      
      throw error.response?.data?.message || 'Error checking payment status';
    }
  }
};

export default seasonApplicantsService; 