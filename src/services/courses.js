import axios from './axios';
import { COURSES_RESOURCE } from './constants/endpoints';

const coursesService = {
  // Get all courses with pagination and search
  getCourses: async (params = {}) => {
    try {
      const response = await axios.get(COURSES_RESOURCE, {
        params: params
      });
      // The courses API returns data in { data: [...], status: "success" } format
      // Return the data array directly for CoursesList compatibility
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get a single course by ID
  getCourseById: async (courseId) => {
    try {
      const response = await axios.get(`${COURSES_RESOURCE}/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create a new course
  createCourse: async (courseData) => {
    try {
      // Include created_by and updated_by fields
      const payload = {
        ...courseData,
        created_by: 1, // Default to user ID 1 or use a dynamic value
        updated_by: 1
      };
      
      const response = await axios.post(COURSES_RESOURCE, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error.response?.data || error.message;
    }
  },

  // Update an existing course
  updateCourse: async (courseId, courseData) => {
    try {
      // Include updated_by field
      const payload = {
        ...courseData,
        updated_by: 1 // Default to user ID 1 or use a dynamic value
      };
      
      const response = await axios.put(`${COURSES_RESOURCE}/${courseId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error.response?.data || error.message;
    }
  },

  // Delete a course
  deleteCourse: async (courseId) => {
    try {
      const response = await axios.delete(`${COURSES_RESOURCE}/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error.response?.data || error.message;
    }
  },

  getApprovedCourses: async () => {
    try {
      const response = await axios.get(`${COURSES_RESOURCE}/approved`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default coursesService; 