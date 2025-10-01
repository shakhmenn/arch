import { FC } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeamQuery } from '@features/teams/api/teams-api';
import { useUsersQuery } from '@features/users/api/users-api';
import { getUserFullName } from '@/shared/types/user';

const TeamPage: FC = () => {
  const params = useParams();
  const idParam = params.id;
  const teamId = idParam ? Number(idParam) : undefined;

  const { data: team, isLoading, isError, error, refetch } = useTeamQuery(teamId);
  const { data: allUsers } = useUsersQuery();

  if (!teamId || Number.isNaN(teamId) || teamId <= 0) {
    return <div className="py-8 px-4 md:px-8">Неверный идентификатор команды</div>;
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="mb-4 text-sm text-muted-foreground">
        <Link to="/teams" className="hover:underline">← Все команды</Link>
      </div>

      {isLoading && <div>Загрузка команды...</div>}
      {isError && (
        <div className="text-destructive">
          Не удалось загрузить команду{error instanceof Error ? `: ${error.message}` : ''}
          <button onClick={() => { void refetch(); }} className="ml-2 underline">Повторить</button>
        </div>
      )}

      {team && (
        <div>
          <h2 className="text-3xl font-bold mb-2 text-foreground">{team.name}</h2>
          {team.description && (
            <div className="text-base text-muted-foreground mb-2">{team.description}</div>
          )}
          <div className="text-xs text-muted-foreground mb-6">Создано: {new Date(team.createdAt).toLocaleString()}</div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Участники</h3>
            {(() => {
              const participants = team.members ?? team.users ?? [];
              return participants.length > 0 ? (
                <ul className="space-y-2">
                  {participants.map((u) => (
                    <li key={u.id} className="p-3 rounded-md border border-border bg-card text-card-foreground">
                      <div className="font-medium">{getUserFullName(u)}</div>
                      <div className="text-sm text-muted-foreground">{u.phone}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">В команде пока нет участников</div>
              );
            })()}
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Задачи</h3>
            {(() => {
              const tasks = team.tasks ?? [];
              return tasks.length > 0 ? (
                <ul className="space-y-2">
                  {tasks.map((t) => (
                    <li key={t.id} className="p-3 rounded-md border border-border bg-card text-card-foreground">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Создатель:{' '}
                        {(() => {
                          const participants = team.members ?? team.users ?? [];
                          const u = participants.find((member) => member.id === t.createdById)
                            ?? (allUsers ?? []).find((user) => user.id === t.createdById);
                          return u ? `${getUserFullName(u)}${u.phone ? ` (${u.phone})` : ''}` : 'Неизвестно';
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Назначена:{' '}
                        {(() => {
                          if (t.assigneeId == null) return 'Не назначена';
                          const participants = team.members ?? team.users ?? [];
                          const u = participants.find((member) => member.id === t.assigneeId)
                            ?? (allUsers ?? []).find((user) => user.id === t.assigneeId);
                          return u ? `${getUserFullName(u)}${u.phone ? ` (${u.phone})` : ''}` : 'Неизвестно';
                        })()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Статус: {t.status}
                        {t.dueDate ? ` • Дедлайн: ${new Date(t.dueDate).toLocaleDateString()}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">В этой команде пока нет задач</div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
