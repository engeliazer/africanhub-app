import axios from './axios';
import { SUBTOPICS_RESOURCE } from './constants/endpoints';

const subtopicsService = {
  getSubtopics: async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`${SUBTOPICS_RESOURCE}?page=${page}&per_page=${perPage}`);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSubtopicsBySubject: async (subjectId) => {
    try {
      const response = await axios.get(`${SUBTOPICS_RESOURCE}?subject_id=${subjectId}`);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSubtopicsByTopic: async (topicId, page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`${SUBTOPICS_RESOURCE}?topic_id=${topicId}&page=${page}&per_page=${perPage}`);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createSubtopic: async (subtopicData) => {
    try {
      const response = await axios.post(SUBTOPICS_RESOURCE, subtopicData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateSubtopic: async (subtopicId, subtopicData) => {
    try {
      const response = await axios.put(`${SUBTOPICS_RESOURCE}/${subtopicId}`, subtopicData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteSubtopic: async (subtopicId) => {
    try {
      const response = await axios.delete(`${SUBTOPICS_RESOURCE}/${subtopicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default subtopicsService; 