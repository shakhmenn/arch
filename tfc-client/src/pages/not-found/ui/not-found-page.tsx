import { FC } from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: FC = () => {
  return (
    <div className="py-12 flex flex-col items-center justify-center">
      <h2 className="text-4xl font-bold mb-4 text-indigo-700">404</h2>
      <p className="text-2xl font-semibold mb-6">Страница не найдена</p>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Извините, страница, которую вы ищете, не существует или была перемещена.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
      >
        Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFoundPage;
