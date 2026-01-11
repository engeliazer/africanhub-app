import axios from '../utils/axios';
import { API_URL, API_ENDPOINTS } from '../config';

const chatService = {
  // Send a new message
  sendMessage: async (message) => {
    try {
      const response = await axios.post(`${API_URL}${API_ENDPOINTS.chat.send}`, {
        message,
        is_from_user: true
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get chat history
  getChatHistory: async (chatId) => {
    try {
      const endpoint = chatId ? `/chat/${chatId}` : '/chat';
      console.log(`Calling API endpoint: ${API_URL}${endpoint}`);
      
      const response = await axios.get(`${API_URL}${endpoint}`);
      console.log('Raw API response:', response.data);
      
      // Transform the response to match our expected format
      return {
        chat_id: response.data.chat_id,
        messages: response.data.messages.map(msg => ({
          id: msg.id,
          message: msg.message,
          is_from_user: msg.is_from_user,
          is_read: msg.is_read,
          created_at: msg.created_at,
          sender_id: msg.sender_id
        })),
        rating: response.data.rating,
        rating_request: response.data.rating_request,
        user: response.data.user
      };
    } catch (error) {
      console.error('Error fetching chat history:', error.response || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Get all chats (for admin/support)
  getAllChats: async () => {
    try {
      const response = await axios.get(`${API_URL}${API_ENDPOINTS.chat.all}`);
      // Transform the response to match our expected format
      return {
        data: response.data.chats.map(chat => ({
          id: chat.id,
          user: chat.user,
          messages: chat.messages.map(msg => ({
            id: msg.id,
            message: msg.message,
            isFromUser: msg.is_from_user,
            isRead: msg.is_read,
            createdAt: msg.created_at,
            senderId: msg.sender_id
          })),
          createdAt: chat.created_at,
          userId: chat.user_id,
          rating_requested: chat.rating_requested,
          rating_submitted: chat.rating_submitted
        }))
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reply to a specific chat (for admin/support)
  replyToChat: async (chatId, message) => {
    try {
      const response = await axios.post(`${API_URL}${API_ENDPOINTS.chat.reply(chatId)}`, {
        message,
        is_from_user: false
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Request rating from user
  requestRating: async (chatId) => {
    try {
      const response = await axios.post(`${API_URL}/chat/${chatId}/request-rating`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Submit rating
  submitRating: async (chatId, rating, comment) => {
    try {
      const response = await axios.post(`${API_URL}/chat/${chatId}/rate`, {
        rating,
        comment
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Decline rating
  declineRating: async (chatId) => {
    try {
      const response = await axios.post(`${API_URL}/chat/${chatId}/decline-rating`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default chatService; 