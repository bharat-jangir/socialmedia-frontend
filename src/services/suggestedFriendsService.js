import { api } from '../config/api';

class SuggestedFriendsService {
  /**
   * Get all suggested friends for a user
   * @param {number} userId - The user ID
   * @returns {Promise} API response with all suggestions
   */
  async getAllSuggestions(userId) {
    try {
      const response = await api.get(`/api/suggested-friends/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all suggestions:', error);
      throw error;
    }
  }

  /**
   * Get mutual following suggestions only
   * @param {number} userId - The user ID
   * @returns {Promise} API response with mutual suggestions
   */
  async getMutualSuggestions(userId) {
    try {
      const response = await api.get(`/api/suggested-friends/${userId}/mutual`);
      return response.data;
    } catch (error) {
      console.error('Error fetching mutual suggestions:', error);
      throw error;
    }
  }

  /**
   * Get gender-based suggestions
   * @param {number} userId - The user ID
   * @returns {Promise} API response with gender-based suggestions
   */
  async getGenderBasedSuggestions(userId) {
    try {
      const response = await api.get(`/api/suggested-friends/${userId}/gender`);
      return response.data;
    } catch (error) {
      console.error('Error fetching gender-based suggestions:', error);
      throw error;
    }
  }

  /**
   * Get all types of suggestions with detailed information
   * @param {number} userId - The user ID
   * @returns {Promise} API response with detailed suggestions
   */
  async getAllTypesDetailed(userId) {
    try {
      const response = await api.get(`/api/suggested-friends/${userId}/all`);
      return response.data;
    } catch (error) {
      console.error('Error fetching detailed suggestions:', error);
      throw error;
    }
  }

  /**
   * Follow a suggested user
   * @param {number} userId - The user ID to follow
   * @returns {Promise} API response
   */
  async followUser(userId) {
    try {
      const response = await api.put(`/api/users/follow/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   * @param {number} userId - The user ID to unfollow
   * @returns {Promise} API response
   */
  async unfollowUser(userId) {
    try {
      const response = await api.put(`/api/users/unfollow/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }
}

export default new SuggestedFriendsService();
