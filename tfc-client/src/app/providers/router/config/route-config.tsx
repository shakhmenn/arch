import { RouteProps } from 'react-router-dom';
import { MainPage } from '@pages/main';
import { AboutPage } from '@pages/about';
import { NotFoundPage } from '@pages/not-found';
import { LoginPage, RegisterPage } from '@pages/auth';
import { TeamsPage, OrganizerTeamsPage, TeamLeaderPage } from '@pages/teams';
import { TasksPage } from '@features/tasks/ui';
import { TeamPage } from '@pages/team';
import { ProfilePage } from '@pages/profile';
import { PersonalEditForm } from '@features/profile-management/PersonalEditForm';
import { BusinessEditForm } from '@features/profile-management/BusinessEditForm';
import { CreateMetricPage, EditMetricPage, MetricsPage, MetricsHistoryPage } from '@pages/metrics';
import { BusinessContextPage } from '@pages/business-context';
import { UnifiedTaskDialogTest } from '@pages/UnifiedTaskDialogTest';
import { Role } from '@shared/types/role';

export enum AppRoutes {
  MAIN = 'main',
  ABOUT = 'about',
  LOGIN = 'login',
  REGISTER = 'register',
  TEAMS = 'teams',
  ORGANIZER_TEAMS = 'organizer_teams',
  TEAM_LEADER = 'team_leader',
  TEAM = 'team',
  TASKS = 'tasks',
  PROFILE = 'profile',

  PROFILE_EDIT_PERSONAL = 'profile_edit_personal',
  PROFILE_EDIT_BUSINESS = 'profile_edit_business',
  METRICS = 'metrics',
  CREATE_METRIC = 'create_metric',
  EDIT_METRIC = 'edit_metric',
  METRICS_HISTORY = 'metrics_history',
  BUSINESS_CONTEXT = 'business_context',
  UNIFIED_TASK_DIALOG_TEST = 'unified_task_dialog_test',
  NOT_FOUND = 'not_found',
}

export type AppRouteProps = RouteProps & {
  isPublic?: boolean;
  roles?: Role[];
};

export const RoutePath: Record<AppRoutes, string> = {
  [AppRoutes.MAIN]: '/',
  [AppRoutes.ABOUT]: '/about',
  [AppRoutes.LOGIN]: '/login',
  [AppRoutes.REGISTER]: '/register',
  [AppRoutes.TEAMS]: '/teams',
  [AppRoutes.ORGANIZER_TEAMS]: '/teams/manage',
  [AppRoutes.TEAM_LEADER]: '/teams/leader',
  [AppRoutes.TEAM]: '/teams/:id',
  [AppRoutes.TASKS]: '/tasks',
  [AppRoutes.PROFILE]: '/profile',

  [AppRoutes.PROFILE_EDIT_PERSONAL]: '/profile/edit-personal',
  [AppRoutes.PROFILE_EDIT_BUSINESS]: '/profile/edit-business',
  [AppRoutes.METRICS]: '/metrics',
  [AppRoutes.CREATE_METRIC]: '/metrics/create',
  [AppRoutes.EDIT_METRIC]: '/metrics/edit/:id',
  [AppRoutes.METRICS_HISTORY]: '/metrics/history',
  [AppRoutes.BUSINESS_CONTEXT]: '/business-context',
  [AppRoutes.UNIFIED_TASK_DIALOG_TEST]: '/test/unified-task-dialog',
  [AppRoutes.NOT_FOUND]: '*',
};

export const routeConfig: Record<AppRoutes, AppRouteProps> = {
  [AppRoutes.MAIN]: {
    path: RoutePath.main,
    element: <MainPage />,
    isPublic: true,
  },
  [AppRoutes.ABOUT]: {
    path: RoutePath.about,
    element: <AboutPage />,
    isPublic: true,
  },
  [AppRoutes.LOGIN]: {
    path: RoutePath.login,
    element: <LoginPage />,
    isPublic: true,
  },
  [AppRoutes.REGISTER]: {
    path: RoutePath.register,
    element: <RegisterPage />,
    isPublic: true,
  },
  [AppRoutes.TEAMS]: {
    path: RoutePath.teams,
    element: <TeamsPage />,
    roles: [Role.ADMIN, Role.TEAM_LEADER, Role.USER],
  },
  [AppRoutes.ORGANIZER_TEAMS]: {
    path: RoutePath.organizer_teams,
    element: <OrganizerTeamsPage />,
    roles: [Role.ADMIN],
  },
  [AppRoutes.TEAM_LEADER]: {
    path: RoutePath.team_leader,
    element: <TeamLeaderPage />,
    roles: [Role.TEAM_LEADER],
  },
  [AppRoutes.TEAM]: {
    path: RoutePath.team,
    element: <TeamPage />,
    roles: [Role.ADMIN],
  },
  [AppRoutes.TASKS]: {
    path: RoutePath.tasks,
    element: <TasksPage />,
    roles: [Role.USER, Role.ADMIN],
  },
  [AppRoutes.PROFILE]: {
    path: RoutePath.profile,
    element: <ProfilePage />,
    roles: [Role.USER, Role.ADMIN],
  },

  [AppRoutes.PROFILE_EDIT_PERSONAL]: {
    path: RoutePath.profile_edit_personal,
    element: <PersonalEditForm />,
    roles: [Role.USER, Role.ADMIN],
  },
  [AppRoutes.PROFILE_EDIT_BUSINESS]: {
    path: RoutePath.profile_edit_business,
    element: <BusinessEditForm />,
    roles: [Role.USER, Role.ADMIN],
  },
  [AppRoutes.METRICS]: {
    path: RoutePath.metrics,
    element: <MetricsPage />,
    roles: [Role.USER, Role.ADMIN],
  },
  [AppRoutes.CREATE_METRIC]: {
    path: RoutePath.create_metric,
    element: <CreateMetricPage />,
    isPublic: true, // Временно для тестирования
  },
  [AppRoutes.EDIT_METRIC]: {
    path: RoutePath.edit_metric,
    element: <EditMetricPage />,
    roles: [Role.USER, Role.ADMIN],
  },
  [AppRoutes.METRICS_HISTORY]: {
    path: RoutePath.metrics_history,
    element: <MetricsHistoryPage />,
    roles: [Role.USER, Role.ADMIN],
  },
  [AppRoutes.BUSINESS_CONTEXT]: {
    path: RoutePath.business_context,
    element: <BusinessContextPage />,
    isPublic: true, // Временно для тестирования
  },
  [AppRoutes.UNIFIED_TASK_DIALOG_TEST]: {
    path: RoutePath.unified_task_dialog_test,
    element: <UnifiedTaskDialogTest />,
    isPublic: true, // Для тестирования
  },
  [AppRoutes.NOT_FOUND]: {
    path: RoutePath.not_found,
    element: <NotFoundPage />,
    isPublic: true,
  },
};
