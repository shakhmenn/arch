import { FC, ReactElement, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@entities/user/model/slice';
import { Role } from '@shared/types/role';
import { RoutePath } from '../config/route-config';
import { getToken as getPersistedToken, getUser as getPersistedUser } from '@shared/api/base-api.ts';

interface RequireAuthProps {
  children: ReactElement;
  roles?: Role[];
}

export const RequireAuth: FC<RequireAuthProps> = ({ children, roles }) => {
  const location = useLocation();
  const { data: user, token, isLoading, setToken, setUser } = useUserStore();

  useEffect(() => {
    if (!token) {
      const persisted = getPersistedToken();
      if (persisted) setToken(persisted);
    }
  }, [token, setToken]);

  useEffect(() => {
    if (!user) {
      const persistedUser = getPersistedUser();
      if (persistedUser && typeof persistedUser === 'object') {
        setUser(persistedUser as import('@entities/user/model/types').User);
      }
    }
  }, [user, setUser]);

  const effectiveToken = token ?? getPersistedToken();
  const isAuthed = Boolean(effectiveToken ?? user);
  if (!isAuthed) {
    return <Navigate to={RoutePath.login} state={{ from: location }} replace />;
  }

  const allowedRoles: Role[] = roles && roles.length > 0 ? roles : [Role.USER];

  if (isLoading) {
    return <div className="flex justify-center items-center h-40">Загрузка...</div>;
  }

  const userRole = user?.role;

  if (!roles?.length) {
    return children;
  }

  if (!userRole || allowedRoles.includes(userRole)) {
    return children;
  }

  return <Navigate to={RoutePath.main} replace />;
};
