import axios from 'axios';

export type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: string;
  name: string;
  email: string;
};

export const registerUser = async (data: RegisterData) => {
  const response = await axios.post<RegisterResponse>('/api/auth/register', data);
  return response.data;
};