import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Перехватчик запросов для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик ответов для обработки ошибок и обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh/', { refresh: refreshToken });
          if (response.data.access && response.data.refresh) {
            // Сохраняем оба токена
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            api.defaults.headers.Authorization = `Bearer ${response.data.access}`;
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          // Очищаем токены и перенаправляем на логин
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_id');
          localStorage.removeItem('full_name');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Если нет refresh_token, перенаправляем на логин
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      console.log('Server response:', response.data);
      
      if (!response.data) {
        throw new Error('Нет ответа от сервера');
      }

      if (!response.data.access) {
        throw new Error('Токен доступа отсутствует в ответе');
      }

      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Response data:', error.response?.data);
      
      if (error.response?.status === 404) {
        throw new Error('Пользователь с таким email не найден.');
      } else if (error.response?.status === 401) {
        throw new Error('Неверный пароль.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error('Произошла ошибка при входе в систему.');
    }
  },

  register: async (userData) => {
    try {
      const registerData = {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role.toUpperCase(),
        phone: userData.phone,
        specialty: userData.specialization || '',
        inn: userData.inn || '',
      };
      const response = await axios.post(`${API_URL}/users/`, registerData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      throw error.response?.data?.detail || error.message;
    }
  },

  refreshToken: async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      const response = await api.post('/auth/refresh/', { refresh });
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      return response.data;
    } catch (error) {
      console.error('Refresh token error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },
};

export const doctorApi = {
  getUpcomingAppointments: async () => {
    try {
      const response = await api.get('/doctor/dashboard/appointments/upcoming/');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      throw error.response?.data || error.message;
    }
  },

  getAppointmentHistory: async () => {
    try {
      const response = await api.get('/doctor/dashboard/appointments/history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      throw error.response?.data || error.message;
    }
  },

  getTimeSlots: async (date) => {
    try {
      const formattedDate = date ? date.toISOString().split('T')[0] : '';
      const response = await api.get(`/doctor/time-slots/${formattedDate ? `?date=${formattedDate}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error.response?.data || error.message;
    }
  },

  createTimeSlot: async (timeSlotData) => {
    try {
      const response = await api.post('/doctor/time-slots/', timeSlotData);
      return response.data;
    } catch (error) {
      console.error('Error creating time slot:', error);
      throw error.response?.data || error.message;
    }
  },

  createMedicalRecord: async (recordData) => {
    try {
      const response = await api.post('/medical-records/', recordData);
      return response.data;
    } catch (error) {
      console.error('Error creating medical record:', error);
      throw error.response?.data || error.message;
    }
  },

  createAnalysis: async (analysisData) => {
    try {
      const response = await api.post('/analyses/', analysisData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error.response?.data || error.message;
    }
  },

  updateDoctorProfile: async (doctorData) => {
    try {
      const formData = new FormData();
      if (doctorData.experience) formData.append('experience', doctorData.experience);
      if (doctorData.description) formData.append('description', doctorData.description);
      if (doctorData.specialty) formData.append('specialty', doctorData.specialty);
      if (doctorData.photo instanceof File) formData.append('photo', doctorData.photo);

      const response = await api.put('/doctors/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      throw error.response?.data || error.message;
    }
  },

  getDoctorProfile: async (doctorId) => {
    try {
      const response = await api.get(`/doctors/${doctorId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      throw error.response?.data || error.message;
    }
  },

  deleteTimeSlot: async (slotId) => {
    try {
      const response = await api.delete(`/doctor/time-slots/${slotId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting time slot:', error);
      throw error.response?.data || error.message;
    }
  },

  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error.response?.data || error.message;
    }
  },

  getMyTimeSlots: async (date) => {
    try {
      const formattedDate = date ? date.toISOString().split('T')[0] : '';
      const response = await api.get(`/doctor/time-slots/${formattedDate ? `?date=${formattedDate}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my time slots:', error);
      throw error.response?.data || error.message;
    }
  },

  getMyAppointments: async (date) => {
    try {
      const formattedDate = date ? date.toISOString().split('T')[0] : '';
      const response = await api.get(`/doctor/appointments/${formattedDate ? `?date=${formattedDate}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching my appointments:', error);
      throw error.response?.data || error.message;
    }
  },
};

export const patientApi = {
  getDoctors: async (specialty = '') => {
    try {
      const response = await api.get('/doctors/', { params: { specialty } });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error.response?.data || error.message;
    }
  },

  bookAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments/', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error.response?.data || error.message;
    }
  },

  getUpcomingAppointments: async () => {
    try {
      const response = await api.get('/patient/dashboard/appointments/upcoming/');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error.response?.data || error.message;
    }
  },

  getAppointmentHistory: async () => {
    try {
      const response = await api.get('/patient/dashboard/appointments/history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      throw error.response?.data || error.message;
    }
  },

  getMedicalRecords: async () => {
    try {
      const response = await api.get('/medical-records/');
      return response.data;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error.response?.data || error.message;
    }
  },

  getAnalyses: async () => {
    try {
      const response = await api.get('/analyses/');
      return response.data;
    } catch (error) {
      console.error('Error fetching analyses:', error);
      throw error.response?.data || error.message;
    }
  },

  getDoctorTimeSlots: async (doctorId) => {
    try {
      const response = await api.get(`/doctor/time-slots/?doctor=${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor time slots:', error);
      throw error.response?.data || error.message;
    }
  },
};

export const profileApi = {
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error.response?.data || error.message;
    }
  },

  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/users/me/', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error.response?.data || error.message;
    }
  },
};

export const commonApi = {
  getDoctors: async (specialty = '') => {
    try {
      const response = await api.get(`/doctors/${specialty ? `?specialty=${specialty}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error.response?.data || error.message;
    }
  },
};

export const getAnalyses = async () => {
  try {
    const response = await api.get('/analyses/');
    return response.data;
  } catch (error) {
    console.error('Error fetching analyses:', error);
    throw error.response?.data || error.message;
  }
};

export const ratingApi = {
  getAllRatings: async () => {
    try {
      const response = await api.get('/ratings/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all ratings:', error);
      throw error.response?.data || error.message;
    }
  },

  getDoctorRating: async (doctorId) => {
    try {
      const response = await api.get(`/ratings/average-rating/?doctor_id=${doctorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor specific rating:', error);
      if (error.response?.status === 404) {
        return { average_rating: 0, rating_count: 0 };
      }
      throw error.response?.data || error.message;
    }
  },

  createRating: async (ratingData) => {
    try {
      const response = await api.post('/ratings/', ratingData);
      return response.data;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error.response?.data || error.message;
    }
  },

  rateDoctorVisit: async (doctorId, appointmentId, rating, comment = '') => {
    try {
      const response = await api.post('/ratings/', {
        appointment: appointmentId,
        rating,
        comment
      });
      return response.data;
    } catch (error) {
      console.error('Error rating doctor:', error);
      throw error.response?.data || error.message;
    }
  },
};

export default api;