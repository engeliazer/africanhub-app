import axios from './axios';
import { SEASON_SUBJECTS_RESOURCE } from './constants/endpoints';

const seasonSubjectsService = {
  getSeasonSubjects: async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`${SEASON_SUBJECTS_RESOURCE}?page=${page}&per_page=${perPage}`);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching season subjects';
    }
  },

  getSeasonSubjectsBySeason: async (seasonId, page = 1, perPage = 10) => {
    try {
      const response = await axios.get(`${SEASON_SUBJECTS_RESOURCE}/season/${seasonId}?page=${page}&per_page=${perPage}`);
      // Return full response with status and data structure for component compatibility
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching season subjects';
    }
  },

  createSeasonSubject: async (data) => {
    try {
      const response = await axios.post(SEASON_SUBJECTS_RESOURCE, data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error creating season subject';
    }
  },

  updateSeasonSubject: async (id, data) => {
    try {
      const response = await axios.put(`${SEASON_SUBJECTS_RESOURCE}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error updating season subject';
    }
  },

  deleteSeasonSubject: async (id) => {
    try {
      const response = await axios.delete(`${SEASON_SUBJECTS_RESOURCE}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error deleting season subject';
    }
  },

  getPendingSubjectsForSeason: async (seasonId) => {
    try {
      const response = await axios.get(`/api/season-pending-subjects/${seasonId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default seasonSubjectsService; 