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
      // If we're getting individual subject applications, convert to batch format
      if (data.subject_id) {
        // Single subject application
        const response = await axios.post('/api/season-applications', {
          user_id: data.user_id,
          season_id: data.season_id,
          subject_ids: [data.subject_id],
          payment_status: data.payment_status || 'pending_payment',
          status: data.status || 'pending',
          // Only include these fields if they exist
          ...(data.payment_method && { payment_method: data.payment_method }),
          ...(data.mobile_number && { mobile_number: data.mobile_number }),
          ...(data.transaction_id && { transaction_id: data.transaction_id }),
          ...(data.payment_date && { payment_date: data.payment_date })
        });
        return response.data;
      } else if (Array.isArray(data.subject_ids)) {
        // Already in batch format
        const response = await axios.post('/api/season-applications', data);
        return response.data;
      } else {
        throw new Error('Invalid application data: missing subject_id or subject_ids');
      }
    } catch (error) {
      throw error.response?.data?.message || 'Error creating application';
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