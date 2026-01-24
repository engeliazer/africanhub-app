import axios from './axios';
import { COURSES_RESOURCE } from './constants/endpoints';

const coursesService = {
  getApprovedCourses: async () => {
    try {
      const response = await axios.get(`${COURSES_RESOURCE}/approved`);
      console.log('Approved courses response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching approved courses:', error);
      throw error.response?.data || error.message;
    }
  }
};

export default coursesService;