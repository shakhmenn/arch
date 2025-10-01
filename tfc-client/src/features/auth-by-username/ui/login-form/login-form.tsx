import { FC, useState } from 'react';

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm: FC<LoginFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    console.log('Login attempt:', { username, password });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

      <div>
        <label htmlFor="username" className="block mb-1">Имя пользователя</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); }}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="password" className="block mb-1">Пароль</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); }}
          className="w-full p-2 border rounded"
        />
      </div>

      <button 
        type="submit" 
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Войти
      </button>
    </form>
  );
};
