import { useQuery } from '@tanstack/react-query';
import { getHealthStatus } from '../services/healthService';

export default function Placeholder() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealthStatus,
  });

  return (
    <>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Server is unreachable</p>}
      {data && <p>Connected successfully</p>}
    </>
  );
}
