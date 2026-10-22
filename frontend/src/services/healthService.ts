import axios from 'axios';

type THealthResponse = {
  status: number;
};

export const getHealthStatus = async () => {
  const response = await axios.get<THealthResponse>('api/health');
  return response.data;
};
