import { FC, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RoutePath } from '@app/providers/router/config/route-config.tsx';
import { useTheme } from '@app/ui/providers/with-theme';
import { useUserStore } from '@entities/user/model/slice';
import { useLogoutMutation } from '@features/auth/api/auth-api';
import { getToken as getPersistedToken, getUser as getPersistedUser } from '@shared/api/base-api.ts';
import { Role } from '@shared/types/role';

export const Navbar: FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { data: user, token, setUser } = useUserStore();
  const effectiveToken = token ?? getPersistedToken();
  const isAuthed = Boolean(effectiveToken ?? user);


  const getTeamLabel = () => {
    switch (user?.role) {
      case Role.ADMIN:
        return 'Управление командами';
      case Role.TEAM_LEADER:
        return 'Моя команда';
      case Role.USER:
        return 'Команда';
      default:
        return 'Команда';
    }
  };

  const getTeamPath = () => {
    switch (user?.role) {
      case Role.ADMIN:
        return RoutePath.organizer_teams;
      case Role.TEAM_LEADER:
        return RoutePath.team_leader;
      case Role.USER:
        return RoutePath.team;
      default:
        return RoutePath.team;
    }
  };
  const { mutate: logout, isPending } = useLogoutMutation();

  useEffect(() => {
    if (!user) {
      const persistedUser = getPersistedUser();
      if (persistedUser && typeof persistedUser === 'object') {
        setUser(persistedUser as import('@entities/user/model/types').User);
      }
    }
  }, [user, setUser]);

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate(RoutePath.main);
      },
    });
  };

  console.log({user})

  return (
    <nav className="bg-primary text-primary-foreground p-4 transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">The Arch Club</div>
        <ul className="flex space-x-4 items-center">
          <li>
            <Link to={RoutePath.main} className="hover:opacity-80">Главная</Link>
          </li>
          <li>
            <Link to={RoutePath.about} className="hover:opacity-80">О нас</Link>
          </li>
          {!isAuthed && (
            <>
              <li>
                <Link to={RoutePath.login} className="hover:opacity-80">Вход</Link>
              </li>
              <li>
                <Link to={RoutePath.register} className="hover:opacity-80">Регистрация</Link>
              </li>
            </>
          )}
          {isAuthed && (
            <>
              {(user?.role === Role.ADMIN || user?.role === Role.TEAM_LEADER || user?.role === Role.USER) && (
                <li>
                  <Link to={getTeamPath()} className="hover:opacity-80">{getTeamLabel()}</Link>
                </li>
              )}
              <li>
                <Link to={RoutePath.tasks} className="hover:opacity-80">Задачи</Link>
              </li>
              <li>
                <Link to={RoutePath.profile} className="hover:opacity-80">Профиль</Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="p-2 rounded-md bg-secondary text-secondary-foreground hover:opacity-80 transition-colors duration-300"
                >
                  Выйти
                </button>
              </li>
            </>
          )}
          <li>
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-md bg-secondary text-secondary-foreground hover:opacity-80 transition-colors duration-300"
              aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};
