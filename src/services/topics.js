import axios from './axios';
import { TOPICS_RESOURCE } from './constants/endpoints';

const topicsService = {
  getTopics: async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`${TOPICS_RESOURCE}?page=${page}&per_page=${perPage}`);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTopicsBySubject: async (subjectId, page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`${TOPICS_RESOURCE}?subject_id=${subjectId}&page=${page}&per_page=${perPage}`);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createTopic: async (topicData) => {
    try {
      const response = await axios.post(TOPICS_RESOURCE, topicData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateTopic: async (topicId, topicData) => {
    try {
      const response = await axios.put(`${TOPICS_RESOURCE}/${topicId}`, topicData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteTopic: async (topicId) => {
    try {
      const response = await axios.delete(`${TOPICS_RESOURCE}/${topicId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default topicsService; 