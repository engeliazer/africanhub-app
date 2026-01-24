import axios from './axios';
import { SUBJECTS_RESOURCE, SUBJECTS_WITH_TOPIC_SUBTOPIC_RESOURCE } from './constants/endpoints';

const subjectsService = {
  getSubjects: async (page = 1, perPage = 10) => {
    try {
      const url = `${SUBJECTS_RESOURCE}?page=${page}&per_page=${perPage}`;
      
      console.log('API request URL:', url);
      const response = await axios.get(url);
      console.log('API response:', response.data);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createSubject: async (subjectData) => {
    try {
      const response = await axios.post(SUBJECTS_WITH_TOPIC_SUBTOPIC_RESOURCE, subjectData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateSubject: async (subjectId, subjectData) => {
    try {
      const response = await axios.put(`${SUBJECTS_RESOURCE}/${subjectId}`, subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteSubject: async (subjectId) => {
    try {
      const response = await axios.delete(`${SUBJECTS_RESOURCE}/${subjectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSubjectById: async (subjectId) => {
    try {
      const response = await axios.get(`/api/subjects/${subjectId}`);
      console.log('Subject by ID response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAvailableSubjects: async () => {
    try {
      const response = await axios.get('/api/available-subjects');
      return {
        status: response.data.status,
        data: response.data.data || []
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default subjectsService; 