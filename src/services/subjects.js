import axios from './axios';
import { SUBJECTS_RESOURCE, SUBJECTS_WITH_TOPIC_SUBTOPIC_RESOURCE } from './constants/endpoints';

const subjectsService = {
  getSubjects: async (page = 1, perPage = 10, courseId = null) => {
    try {
      let url = `${SUBJECTS_RESOURCE}?page=${page}&per_page=${perPage}`;
      
      if (courseId) {
        url += `&course_id=${parseInt(courseId, 10)}`;
      }
      
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
      const response = await axios.put(`${SUBJECTS_RESOURCE}/${subjectId}`, {
        ...subjectData,
        course_id: subjectData.course_id
      });
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
  }
};

export default subjectsService; 