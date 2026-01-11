import axios from './axios';
import { SEASONS_RESOURCE } from './constants/endpoints';

const seasonsService = {
  getSeasons: async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`/api/seasons?page=${page}&per_page=${perPage}`);
      return {
        status: response.data.status,
        data: response.data.data || []
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createSeason: async (seasonData) => {
    try {
      const response = await axios.post(SEASONS_RESOURCE, seasonData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateSeason: async (seasonId, seasonData) => {
    try {
      const response = await axios.put(`${SEASONS_RESOURCE}/${seasonId}`, seasonData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteSeason: async (seasonId) => {
    try {
      const response = await axios.delete(`${SEASONS_RESOURCE}/${seasonId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get seasons that have available subjects for the current user
  getAvailableSeasons: async () => {
    try {
      const response = await axios.get(`${SEASONS_RESOURCE}/available-seasons`);
      return {
        status: response.data.status,
        data: response.data.data || []
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get courses that have available subjects for a specific season
  getSeasonAvailableCourses: async (seasonId) => {
    try {
      const response = await axios.get(`${SEASONS_RESOURCE}/${seasonId}/available-courses`);
      return {
        status: response.data.status,
        data: response.data.data || []
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get available subjects for a specific course in a season
  getSeasonCourseAvailableSubjects: async (seasonId, courseId) => {
    try {
      const response = await axios.get(`${SEASONS_RESOURCE}/${seasonId}/courses/${courseId}/available-subjects`);
      return {
        status: response.data.status,
        data: response.data.data || []
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default seasonsService; 