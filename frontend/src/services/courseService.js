import axios from 'axios';
import { API_BASE_URL } from '../config';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const courseService = {
  // Logout current session
  logout: async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/auth/logout`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  // Get all courses
  getAllCourses: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Admin: list all users
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Admin: list enrollments for a course
  getEnrollmentsByCourse: async (courseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/enrollments`, {
        headers: getAuthHeaders(),
        params: { courseId },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollments by course:', error);
      throw error;
    }
  },

  // Admin: enroll a specific user in a course
  enrollUserInCourse: async (courseId, userId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/enrollments`,
        { courseId, userId },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error enrolling user in course:', error);
      throw error;
    }
  },

  // Create a new course (admin)
  createCourse: async (course) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/courses`,
        course,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },

  // Get user's enrollments
  getMyEnrollments: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/enrollments`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  },

  // Enroll in a course
  enrollCourse: async (courseId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/enrollments`,
        { courseId },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  },

  // Unenroll from a course
  unenrollCourse: async (enrollmentId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/enrollments/${enrollmentId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      throw error;
    }
  },

  // Update a course (admin)
  updateCourse: async (courseId, course) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/courses/${courseId}`,
        course,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  },

  // Delete a course (admin)
  deleteCourse: async (courseId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/courses/${courseId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },

  // List files for a course
  getFilesByCourse: async (courseId, sortBy, direction) => {
    try {
      const params = { courseId };
      if (sortBy) params.sortBy = sortBy;
      if (direction) params.direction = direction;
      const response = await axios.get(
        `${API_BASE_URL}/files`,
        {
          headers: getAuthHeaders(),
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },

  // List ratings for a file
  getRatingsByFile: async (fileId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/files/${fileId}/ratings`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching ratings:', error);
      throw error;
    }
  },

  // Get average rating for a file
  getAverageRating: async (fileId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/files/${fileId}/ratings/average`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching rating average:', error);
      throw error;
    }
  },

  // Upsert a rating for a file
  upsertRating: async (fileId, userId, value) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/files/${fileId}/ratings`,
        { userId, value },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error saving rating:', error);
      throw error;
    }
  },

  // Delete a rating for a file
  deleteRating: async (fileId, userId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/files/${fileId}/ratings`,
        {
          headers: getAuthHeaders(),
          params: { userId },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting rating:', error);
      throw error;
    }
  },

  // Upload a file to a course
  uploadCourseFile: async (courseId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/files/upload`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data',
          },
          params: { courseId },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Delete a file
  deleteFile: async (fileId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/files/${fileId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // List online users for a course
  getOnlineUsersByCourse: async (courseId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/online-users`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  },

  // Load the in-session chat history for a peer conversation
  getChatHistory: async (courseId, peerUserId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/chat`,
        {
          headers: getAuthHeaders(),
          params: { peerUserId },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // Load the active chats for the current user in a course
  getMyChats: async (courseId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/chats`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching my chats:', error);
      throw error;
    }
  },
};
