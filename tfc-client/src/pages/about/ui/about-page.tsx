import { FC } from 'react';

const AboutPage: FC = () => {
  return (
    <div className="py-8 px-4 md:px-8">
      <h2 className="text-3xl font-bold mb-6 text-foreground">О нас</h2>
      <p className="text-foreground mb-4">
        The Arch Club - это сообщество архитекторов и дизайнеров, объединенных общей страстью к созданию красивых и функциональных пространств.
      </p>
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border mt-6 transition-colors duration-300">
        <h3 className="text-xl font-semibold mb-3">Наша история</h3>
        <p className="text-muted-foreground">
          Основанный в 2020 году, The Arch Club быстро стал ведущим центром инноваций в области архитектуры и дизайна. 
          Мы стремимся объединять талантливых профессионалов и предоставлять платформу для обмена идеями и опытом.
        </p>
      </div>
      <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border mt-6 transition-colors duration-300">
        <h3 className="text-xl font-semibold mb-3">Команда</h3>
        <p className="text-muted-foreground">
          Наша команда состоит из опытных архитекторов, дизайнеров и инженеров, каждый из которых привносит уникальную перспективу в наши проекты.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
