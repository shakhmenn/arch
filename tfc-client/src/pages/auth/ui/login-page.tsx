import { FC, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '@features/auth/api/auth-api';

const LoginPage: FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { mutateAsync, isPending, error } = useLoginMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await mutateAsync({ phone, password });
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setLocalError(message);
    }
  };

  const shownError = localError ?? (error instanceof Error ? error.message : null);

  return (
    <div className="py-8 px-4 md:px-8">
      <h2 className="text-3xl font-bold mb-6 text-foreground">Вход</h2>
      <form onSubmit={(e) => { void onSubmit(e); }} className="max-w-md space-y-4 bg-card text-card-foreground p-6 rounded-lg border border-border">
        <div>
          <label className="block text-sm mb-1" htmlFor="phone">Телефон</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); }}
            placeholder="+79990000000"
            className="w-full p-2 rounded-md border border-border bg-background text-foreground"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); }}
            className="w-full p-2 rounded-md border border-border bg-background text-foreground"
            required
          />
        </div>
        {shownError && <div className="text-red-500 text-sm">{shownError}</div>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-70"
        >
          {isPending ? 'Входим...' : 'Войти'}
        </button>
        <div className="text-sm text-muted-foreground">
          Нет аккаунта? <Link to="/register" className="text-primary underline">Зарегистрироваться</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
