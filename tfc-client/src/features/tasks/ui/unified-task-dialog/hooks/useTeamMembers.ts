import { useQuery } from '@tanstack/react-query';
import { TeamMember } from '../types';

// Mock API function - replace with actual API call
const fetchTeamMembers = async (teamId?: number): Promise<TeamMember[]> => {
  // If no teamId provided, return empty array
  if (!teamId) {
    return [];
  }

  // Mock data for development - replace with actual API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 1,
      name: 'Иван Петров',
      email: 'ivan.petrov@example.com',
      avatar: undefined,
    },
    {
      id: 2,
      name: 'Мария Сидорова',
      email: 'maria.sidorova@example.com',
      avatar: undefined,
    },
    {
      id: 3,
      name: 'Алексей Козлов',
      email: 'alexey.kozlov@example.com',
      avatar: undefined,
    },
  ];
};

export const useTeamMembers = (teamId?: number) => {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => fetchTeamMembers(teamId),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};