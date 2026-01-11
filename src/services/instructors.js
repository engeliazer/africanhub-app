import axios from 'axios';
import { BASE_URL } from '../config';
import { getTokenLocal } from './utils/authorization';

const API_BASE_URL = BASE_URL;

const instructorsService = {
  // Get all instructors (admin)
  async getInstructors() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/instructors`, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching instructors:', error);
      throw error;
    }
  },

  // Get public instructors (no auth required)
  async getPublicInstructors() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/instructors/public`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public instructors:', error);
      throw error;
    }
  },

  // Get specific instructor
  async getInstructor(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/instructors/${id}`, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching instructor:', error);
      throw error;
    }
  },

  // Create new instructor (with photo upload)
  async createInstructor(instructorData, photoFile = null) {
    try {
      let response;
      
      if (photoFile) {
        // Create with photo upload (multipart/form-data)
        const formData = new FormData();
        formData.append('name', instructorData.name);
        formData.append('title', instructorData.title);
        formData.append('bio', instructorData.bio);
        formData.append('is_active', instructorData.is_active);
        formData.append('photo', photoFile);

        response = await axios.post(`${API_BASE_URL}/api/instructors`, formData, {
          headers: {
            'Authorization': `Bearer ${getTokenLocal()}`
            // Don't set Content-Type for FormData - browser will set it with boundary
          }
        });
      } else {
        // Create with photo URL (application/json)
        response = await axios.post(`${API_BASE_URL}/api/instructors`, instructorData, {
          headers: {
            'Authorization': `Bearer ${getTokenLocal()}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating instructor:', error);
      throw error;
    }
  },

  // Update instructor (with photo upload)
  async updateInstructor(id, instructorData, photoFile = null) {
    try {
      let response;
      
      if (photoFile) {
        // Update with photo upload (multipart/form-data)
        const formData = new FormData();
        formData.append('name', instructorData.name);
        formData.append('title', instructorData.title);
        formData.append('bio', instructorData.bio);
        formData.append('is_active', instructorData.is_active);
        formData.append('photo', photoFile);

        response = await axios.put(`${API_BASE_URL}/api/instructors/${id}`, formData, {
          headers: {
            'Authorization': `Bearer ${getTokenLocal()}`
            // Don't set Content-Type for FormData - browser will set it with boundary
          }
        });
      } else {
        // Update with photo URL (application/json)
        response = await axios.put(`${API_BASE_URL}/api/instructors/${id}`, instructorData, {
          headers: {
            'Authorization': `Bearer ${getTokenLocal()}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating instructor:', error);
      throw error;
    }
  },

  // Delete instructor (soft delete)
  async deleteInstructor(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/instructors/${id}`, {
        headers: {
          'Authorization': `Bearer ${getTokenLocal()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting instructor:', error);
      throw error;
    }
  },

  // Upload instructor photo
  async uploadPhoto(file, instructorId) {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('instructor_id', instructorId);

      const response = await axios.post(`${API_BASE_URL}/api/instructors/upload-photo`, formData, {
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

export default instructorsService;
