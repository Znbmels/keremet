import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Замените на ваш адрес backend

export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login/`, { email, password });
  return response.data;
}; 