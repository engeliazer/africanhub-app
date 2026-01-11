import axiosInstance from './axios';

const getPaymentMethods = async () => {
  try {
    console.log('Fetching payment methods...');
    const response = await axiosInstance.get('/api/accounting/payment-methods');
    console.log('Payment methods response:', response);
    
    if (response.data?.status === 'success' && Array.isArray(response.data?.payment_methods)) {
      return response.data;
    } else {
      console.error('Invalid response format:', response.data);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Error in getPaymentMethods:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw error;
  }
};

const paymentService = {
  getPaymentMethods
};

export default paymentService; 