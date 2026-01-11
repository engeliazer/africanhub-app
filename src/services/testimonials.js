import axios from 'axios';
import { BASE_URL } from '../config';
import { getTokenLocal } from './utils/authorization';

const API_BASE_URL = BASE_URL;

const testimonialsService = {
  // Get all testimonials (admin)
  async getTestimonials() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/testimonials`, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      throw error;
    }
  },

  // Get pending testimonials (admin)
  async getPendingTestimonials() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/testimonials/pending`, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending testimonials:', error);
      throw error;
    }
  },

  // Get public testimonials (no auth required)
  async getPublicTestimonials() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/testimonials/public`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public testimonials:', error);
      throw error;
    }
  },

  // Get specific testimonial
  async getTestimonial(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/testimonials/${id}`, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching testimonial:', error);
      throw error;
    }
  },

  // Create new testimonial (student submission with photo upload)
  async createTestimonial(testimonialData, photoFile = null) {
    try {
      const formData = new FormData();
      
      // Add testimonial data
      formData.append('user_id', testimonialData.user_id);
      formData.append('role', testimonialData.role);
      formData.append('text', testimonialData.text);
      formData.append('rating', testimonialData.rating);
      formData.append('is_active', testimonialData.is_active);
      
      // Add photo file
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      // Debug logging
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post(`${API_BASE_URL}/api/testimonials`, formData, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`
          // Don't set Content-Type for FormData - browser will set it with boundary
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating testimonial:', error);
      throw error;
    }
  },

  // Update testimonial (with photo upload)
  async updateTestimonial(id, testimonialData, photoFile = null) {
    try {
      const formData = new FormData();
      
      // Add testimonial data
      formData.append('role', testimonialData.role);
      formData.append('text', testimonialData.text);
      formData.append('rating', testimonialData.rating);
      formData.append('is_active', testimonialData.is_active);
      
      // Add photo file
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await axios.put(`${API_BASE_URL}/api/testimonials/${id}`, formData, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`
          // Don't set Content-Type for FormData - browser will set it with boundary
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating testimonial:', error);
      throw error;
    }
  },

  // Review testimonial (approve/reject)
  async reviewTestimonial(id, reviewData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/testimonials/${id}/review`, reviewData, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error reviewing testimonial:', error);
      throw error;
    }
  },

  // Delete testimonial (soft delete)
  async deleteTestimonial(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/testimonials/${id}`, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      throw error;
    }
  },

  // Upload testimonial photo
  async uploadPhoto(testimonialId, file) {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('testimonial_id', testimonialId);

      const response = await axios.post(`${API_BASE_URL}/api/testimonials/upload-photo`, formData, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }
};

export default testimonialsService;