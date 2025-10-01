import { FC } from "react";

const MainPage: FC = () => {
  return (
    <div className="py-8 px-4 md:px-8">
      <h2 className="text-3xl font-bold mb-6 text-foreground">Главная страница</h2>
      <p className="text-foreground mb-4">
        Добро пожаловать в The Arch Club - место, где архитектура встречается с инновациями.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
          <h3 className="text-xl font-semibold mb-3">Наша миссия</h3>
          <p className="text-muted-foreground">
            Создавать пространства, вдохновляющие на творчество и сотрудничество.
          </p>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border transition-colors duration-300">
          <h3 className="text-xl font-semibold mb-3">Наши ценности</h3>
          <p className="text-muted-foreground">
            Инновации, качество и устойчивое развитие - основы нашей работы.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
