import axios from '../utils/axios';

const studyMaterialCategoriesService = {
  getStudyMaterialCategories: async (page = 1, perPage = 10) => {
    try {
      const response = await axios.get('/study-materials/categories', {
        params: {
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createStudyMaterialCategory: async (data) => {
    try {
      const response = await axios.post('/study-materials/categories', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateStudyMaterialCategory: async (id, data) => {
    try {
      const response = await axios.put(`/study-materials/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteStudyMaterialCategory: async (id) => {
    try {
      const response = await axios.delete(`/study-materials/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default studyMaterialCategoriesService; 