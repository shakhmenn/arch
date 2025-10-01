import {
  PrismaClient,
  MetricCategory,
  MetricUnit,
  MetricDirection,
  Role,
  MetricPeriodType,
  TaskType,
  TaskStatus,
  TaskPriority,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding metric definitions...');

  // Создание базовых определений метрик
  const metricDefinitions = [
    // Финансовые метрики
    {
      name: 'Выручка',
      description: 'Общий доход от продаж за период',
      category: MetricCategory.FINANCIAL,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Чистая прибыль',
      description: 'Прибыль после вычета всех расходов',
      category: MetricCategory.FINANCIAL,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Валовая прибыль',
      description: 'Прибыль до вычета операционных расходов',
      category: MetricCategory.FINANCIAL,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Денежный поток',
      description: 'Движение денежных средств за период',
      category: MetricCategory.FINANCIAL,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Рентабельность продаж',
      description: 'Отношение прибыли к выручке',
      category: MetricCategory.FINANCIAL,
      unit: MetricUnit.PERCENTAGE,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'EBITDA',
      description: 'Прибыль до вычета процентов, налогов, износа и амортизации',
      category: MetricCategory.FINANCIAL,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },

    // Операционные метрики
    {
      name: 'Количество клиентов',
      description: 'Общее число активных клиентов',
      category: MetricCategory.OPERATIONAL,
      unit: MetricUnit.COUNT,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Новые клиенты',
      description: 'Количество привлеченных клиентов за период',
      category: MetricCategory.OPERATIONAL,
      unit: MetricUnit.COUNT,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Потерянные клиенты',
      description: 'Количество ушедших клиентов за период',
      category: MetricCategory.OPERATIONAL,
      unit: MetricUnit.COUNT,
      direction: MetricDirection.LOWER_IS_BETTER,
    },
    {
      name: 'Средний чек',
      description: 'Средняя сумма покупки одного клиента',
      category: MetricCategory.OPERATIONAL,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Конверсия',
      description: 'Процент посетителей, ставших клиентами',
      category: MetricCategory.OPERATIONAL,
      unit: MetricUnit.PERCENTAGE,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Количество сотрудников',
      description: 'Общее число работников',
      category: MetricCategory.OPERATIONAL,
      unit: MetricUnit.COUNT,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },

    // Клиентские метрики
    {
      name: 'LTV (Lifetime Value)',
      description: 'Пожизненная ценность клиента',
      category: MetricCategory.CUSTOMER,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'CAC (Customer Acquisition Cost)',
      description: 'Стоимость привлечения одного клиента',
      category: MetricCategory.CUSTOMER,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.LOWER_IS_BETTER,
    },
    {
      name: 'Churn Rate',
      description: 'Процент оттока клиентов',
      category: MetricCategory.CUSTOMER,
      unit: MetricUnit.PERCENTAGE,
      direction: MetricDirection.LOWER_IS_BETTER,
    },
    {
      name: 'NPS (Net Promoter Score)',
      description: 'Индекс лояльности клиентов',
      category: MetricCategory.CUSTOMER,
      unit: MetricUnit.RATIO,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },

    // Продуктивность
    {
      name: 'Выручка на сотрудника',
      description: 'Доход, приходящийся на одного работника',
      category: MetricCategory.PRODUCTIVITY,
      unit: MetricUnit.CURRENCY,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Производительность труда',
      description: 'Объем производства на единицу времени',
      category: MetricCategory.PRODUCTIVITY,
      unit: MetricUnit.RATIO,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },

    // Стратегические метрики
    {
      name: 'Доля рынка',
      description: 'Процент от общего объема рынка',
      category: MetricCategory.STRATEGIC,
      unit: MetricUnit.PERCENTAGE,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'Рост выручки',
      description: 'Темп роста доходов по сравнению с предыдущим периодом',
      category: MetricCategory.STRATEGIC,
      unit: MetricUnit.PERCENTAGE,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
    {
      name: 'ROI (Return on Investment)',
      description: 'Возврат на инвестиции',
      category: MetricCategory.STRATEGIC,
      unit: MetricUnit.PERCENTAGE,
      direction: MetricDirection.HIGHER_IS_BETTER,
    },
  ];

  // Проверяем, есть ли уже определения метрик
  const existingCount = await prisma.metricDefinition.count();

  if (existingCount === 0) {
    // Создание определений метрик
    await prisma.metricDefinition.createMany({
      data: metricDefinitions,
    });
    console.log(`✅ Created ${metricDefinitions.length} metric definitions`);
  } else {
    console.log(`ℹ️ Metric definitions already exist (${existingCount} found)`);
  }

  // Создание дополнительных тестовых пользователей
  console.log('🌱 Creating additional test users...');

  const testUsers = [
    {
      phone: '+79161111111',
      password: '$2b$10$08Rn0fDITvJq.1DKQpx12.g1mNPBUOFVNH2AQ4l1xVdkD3z0SsR9y', // password: 'test123'
      name: 'Мария',
      surname: 'Иванова',
      patronymic: 'Сергеевна',
      birthDate: new Date('1990-07-22'),
      personalTelegram: '@maria_ivanova',
      personalInstagram: '@maria.business',
      personalPhone: '+79161111111',
      yearsInBusiness: 5,
      hobbies: 'Йога, фотография, кулинария',
      role: Role.USER,
      profile: {
        userName: 'Мария Иванова',
        userAge: 34,
        businessName: 'Красота и Здоровье',
        businessDescription:
          'Сеть салонов красоты и SPA-центров. Предоставляем полный спектр услуг по уходу за внешностью и здоровьем.',
        currentRevenue: '1800000',
        targetRevenue: '2500000',
        currentEmployees: 8,
        targetEmployees: 12,
        bio: 'Предприниматель в сфере красоты и здоровья. Основатель сети салонов "Красота и Здоровье".',
        workPhone: '+74951111111',
        website: 'https://beauty-health.ru',
        workInstagram: '@beauty_health_official',
        workTelegram: '@beauty_health_channel',
        workSchedule: 'Пн-Вс: 9:00-21:00',
        addresses: 'Москва, ул. Арбат, д. 25; Москва, ул. Тверская, д. 12',
      },
      businessContext: {
        industry: 'Красота и здоровье',
        businessStage: 'growth',
        foundedYear: 2019,
        location: 'Москва, Россия',
        mainProducts:
          'Парикмахерские услуги, косметология, массаж, SPA-процедуры',
        targetAudience: 'Женщины 25-45 лет, средний и высокий доход',
        businessModel: 'B2C услуги',
        marketSize: '5000000000',
        competitorCount: 200,
        dataRelevanceDate: new Date('2024-08-01'),
      },
    },
    {
      phone: '+79162222222',
      password: '$2b$10$08Rn0fDITvJq.1DKQpx12.g1mNPBUOFVNH2AQ4l1xVdkD3z0SsR9y',
      name: 'Дмитрий',
      surname: 'Козлов',
      patronymic: 'Александрович',
      birthDate: new Date('1982-11-10'),
      personalTelegram: '@dmitry_kozlov',
      personalInstagram: '@dmitry.food',
      personalPhone: '+79162222222',
      yearsInBusiness: 12,
      hobbies: 'Кулинария, рыбалка, автомобили',
      role: Role.USER,
      profile: {
        userName: 'Дмитрий Козлов',
        userAge: 42,
        businessName: 'Вкусная Еда',
        businessDescription:
          'Сеть ресторанов быстрого питания и доставки еды. Специализируемся на здоровой и вкусной пище.',
        currentRevenue: '3200000',
        targetRevenue: '4500000',
        currentEmployees: 25,
        targetEmployees: 35,
        bio: 'Ресторатор с 12-летним опытом. Основатель сети "Вкусная Еда".',
        workPhone: '+74952222222',
        website: 'https://vkusnaya-eda.ru',
        workInstagram: '@vkusnaya_eda_official',
        workTelegram: '@vkusnaya_eda_delivery',
        workSchedule: 'Пн-Вс: 8:00-23:00',
        addresses:
          'Москва, ул. Ленина, д. 45; Москва, пр. Мира, д. 78; Москва, ул. Садовая, д. 33',
      },
      businessContext: {
        industry: 'Общественное питание',
        businessStage: 'maturity',
        foundedYear: 2012,
        location: 'Москва, Россия',
        mainProducts: 'Быстрое питание, доставка еды, кейтеринг',
        targetAudience: 'Офисные работники, студенты, семьи с детьми',
        businessModel: 'B2C услуги + доставка',
        marketSize: '8000000000',
        competitorCount: 300,
        dataRelevanceDate: new Date('2024-08-01'),
      },
    },
    {
      phone: '+79163333333',
      password: '$2b$10$08Rn0fDITvJq.1DKQpx12.g1mNPBUOFVNH2AQ4l1xVdkD3z0SsR9y',
      name: 'Елена',
      surname: 'Смирнова',
      patronymic: 'Викторовна',
      birthDate: new Date('1988-04-18'),
      personalTelegram: '@elena_smirnova',
      personalInstagram: '@elena.education',
      personalPhone: '+79163333333',
      yearsInBusiness: 6,
      hobbies: 'Чтение, танцы, изучение языков',
      role: Role.USER,
      profile: {
        userName: 'Елена Смирнова',
        userAge: 36,
        businessName: 'Образовательный Центр "Знание"',
        businessDescription:
          'Частный образовательный центр для детей и взрослых. Курсы иностранных языков, подготовка к экзаменам, развивающие программы.',
        currentRevenue: '1200000',
        targetRevenue: '1800000',
        currentEmployees: 15,
        targetEmployees: 20,
        bio: 'Педагог и предприниматель в сфере образования. Основатель образовательного центра "Знание".',
        workPhone: '+74953333333',
        website: 'https://znanie-center.ru',
        workInstagram: '@znanie_center',
        workTelegram: '@znanie_education',
        workSchedule: 'Пн-Сб: 9:00-20:00, Вс: 10:00-18:00',
        addresses: 'Москва, ул. Пушкина, д. 15; Москва, ул. Гоголя, д. 28',
      },
      businessContext: {
        industry: 'Образование',
        businessStage: 'growth',
        foundedYear: 2018,
        location: 'Москва, Россия',
        mainProducts:
          'Курсы иностранных языков, подготовка к ЕГЭ/ОГЭ, развивающие программы для детей',
        targetAudience: 'Дети 5-17 лет, взрослые 18-50 лет',
        businessModel: 'B2C образовательные услуги',
        marketSize: '3000000000',
        competitorCount: 150,
        dataRelevanceDate: new Date('2024-08-01'),
      },
    },
    {
      phone: '+79164444444',
      password: '$2b$10$08Rn0fDITvJq.1DKQpx12.g1mNPBUOFVNH2AQ4l1xVdkD3z0SsR9y',
      name: 'Андрей',
      surname: 'Волков',
      patronymic: 'Михайлович',
      birthDate: new Date('1975-09-05'),
      personalTelegram: '@andrey_volkov',
      personalInstagram: '@andrey.construction',
      personalPhone: '+79164444444',
      yearsInBusiness: 15,
      hobbies: 'Строительство, охота, баня',
      role: Role.TEAM_LEADER,
      profile: {
        userName: 'Андрей Волков',
        userAge: 49,
        businessName: 'СтройМастер',
        businessDescription:
          'Строительная компания полного цикла. Строительство домов, ремонт квартир, коммерческое строительство.',
        currentRevenue: '5500000',
        targetRevenue: '7000000',
        currentEmployees: 45,
        targetEmployees: 60,
        bio: 'Опытный строитель и руководитель. Основатель компании "СтройМастер".',
        workPhone: '+74954444444',
        website: 'https://stroymaster.ru',
        workInstagram: '@stroymaster_official',
        workTelegram: '@stroymaster_channel',
        workSchedule: 'Пн-Пт: 8:00-18:00, Сб: 9:00-15:00',
        addresses:
          'Москва, ул. Строителей, д. 55; Московская область, г. Подольск, ул. Рабочая, д. 12',
      },
      businessContext: {
        industry: 'Строительство',
        businessStage: 'maturity',
        foundedYear: 2009,
        location: 'Москва и Московская область, Россия',
        mainProducts:
          'Строительство домов, ремонт квартир, коммерческое строительство',
        targetAudience: 'Частные лица, малый и средний бизнес',
        businessModel: 'B2C + B2B услуги',
        marketSize: '12000000000',
        competitorCount: 500,
        dataRelevanceDate: new Date('2024-08-01'),
      },
    },
    {
      phone: '+79165555555',
      password: '$2b$10$08Rn0fDITvJq.1DKQpx12.g1mNPBUOFVNH2AQ4l1xVdkD3z0SsR9y',
      name: 'Ольга',
      surname: 'Морозова',
      patronymic: 'Дмитриевна',
      birthDate: new Date('1992-12-03'),
      personalTelegram: '@olga_morozova',
      personalInstagram: '@olga.organizer',
      personalPhone: '+79165555555',
      yearsInBusiness: 3,
      hobbies: 'Организация мероприятий, дизайн, путешествия',
      role: Role.ADMIN,
      profile: {
        userName: 'Ольга Морозова',
        userAge: 32,
        businessName: 'Event Pro',
        businessDescription:
          'Агентство по организации мероприятий. Корпоративные события, свадьбы, дни рождения, конференции.',
        currentRevenue: '800000',
        targetRevenue: '1200000',
        currentEmployees: 5,
        targetEmployees: 8,
        bio: 'Event-менеджер и организатор мероприятий. Основатель агентства "Event Pro".',
        workPhone: '+74955555555',
        website: 'https://eventpro.ru',
        workInstagram: '@eventpro_official',
        workTelegram: '@eventpro_agency',
        workSchedule: 'Пн-Пт: 10:00-19:00, Сб-Вс: по договоренности',
        addresses: 'Москва, ул. Театральная, д. 8, офис 15',
      },
      businessContext: {
        industry: 'Организация мероприятий',
        businessStage: 'startup',
        foundedYear: 2021,
        location: 'Москва, Россия',
        mainProducts:
          'Организация корпоративных мероприятий, свадеб, частных праздников',
        targetAudience: 'Корпоративные клиенты, частные лица с высоким доходом',
        businessModel: 'B2B + B2C услуги',
        marketSize: '2000000000',
        competitorCount: 100,
        dataRelevanceDate: new Date('2024-08-01'),
      },
    },
  ];

  // Создаем каждого пользователя
  for (const userData of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: userData.phone },
    });

    if (!existingUser) {
      const { profile, businessContext, ...userCreateData } = userData;

      const newUser = await prisma.user.create({
        data: userCreateData,
      });

      // Создаем профиль пользователя
      await prisma.userProfile.create({
        data: {
          userId: newUser.id,
          ...profile,
        },
      });

      // Создаем бизнес-контекст
      await prisma.businessContext.create({
        data: {
          userId: newUser.id,
          ...businessContext,
        },
      });

      console.log(
        `✅ Created user '${newUser.name} ${newUser.surname}' (${newUser.role})`,
      );
    } else {
      console.log(
        `ℹ️ User '${userData.name} ${userData.surname}' already exists`,
      );
    }
  }

  // Создание основного тестового пользователя (оставляем для совместимости)
  console.log('🌱 Creating main test user...');

  const existingUser = await prisma.user.findUnique({
    where: { phone: '+79161234567' },
  });

  if (!existingUser) {
    // Создаем тестового пользователя
    const testUser = await prisma.user.create({
      data: {
        phone: '+79161234567',
        password:
          '$2b$10$08Rn0fDITvJq.1DKQpx12.g1mNPBUOFVNH2AQ4l1xVdkD3z0SsR9y', // password: 'test123'
        name: 'Александр',
        surname: 'Петров',
        patronymic: 'Иванович',
        birthDate: new Date('1985-03-15'),
        personalTelegram: '@alex_petrov',
        personalInstagram: '@alex.petrov.business',
        personalPhone: '+79161234567',
        yearsInBusiness: 8,
        hobbies: 'Теннис, чтение бизнес-литературы, путешествия',
        role: Role.USER,
      },
    });

    // Создаем профиль пользователя
    await prisma.userProfile.create({
      data: {
        userId: testUser.id,
        userName: 'Александр Петров',
        userAge: 39,
        businessName: 'ТехноСтарт',
        businessDescription:
          'Разработка и внедрение IT-решений для малого и среднего бизнеса. Специализируемся на автоматизации бизнес-процессов, создании веб-приложений и мобильных приложений.',
        currentRevenue: '2500000',
        targetRevenue: '5000000',
        currentEmployees: 12,
        targetEmployees: 25,
        bio: 'Предприниматель с 8-летним опытом в IT-сфере. Основатель и CEO компании ТехноСтарт. Специализируюсь на цифровой трансформации бизнеса.',
        workPhone: '+74951234567',
        website: 'https://technostart.ru',
        workInstagram: '@technostart_official',
        workTelegram: '@technostart_channel',
        workSchedule: 'Пн-Пт: 9:00-18:00, Сб: 10:00-15:00',
        addresses:
          'Москва, ул. Тверская, д. 15, офис 301; Санкт-Петербург, Невский пр., д. 28, офис 205',
      },
    });

    // Создаем бизнес-контекст
    await prisma.businessContext.create({
      data: {
        userId: testUser.id,
        industry: 'Информационные технологии',
        businessStage: 'growth',
        foundedYear: 2016,
        location: 'Москва, Россия',
        mainProducts:
          'CRM-системы, веб-приложения, мобильные приложения, консалтинг по цифровизации',
        targetAudience:
          'Малый и средний бизнес, стартапы, производственные компании',
        businessModel: 'B2B SaaS + разработка под заказ',
        marketSize: '15000000000',
        competitorCount: 150,
        dataRelevanceDate: new Date('2024-08-01'),
      },
    });

    // Получаем определения метрик для создания значений
    const definitions = await prisma.metricDefinition.findMany();

    // Создаем значения метрик
    const metricValues: {
      userId: number;
      metricDefinitionId: number;
      value: number;
      targetValue: number;
      periodType: MetricPeriodType;
      periodDate: Date;
      notes: string;
    }[] = [];
    const currentDate = new Date('2024-08-01');

    for (const definition of definitions) {
      let value: number, targetValue: number;

      switch (definition.name) {
        case 'Выручка':
          value = 2500000;
          targetValue = 3000000;
          break;
        case 'Чистая прибыль':
          value = 375000;
          targetValue = 500000;
          break;
        case 'Валовая прибыль':
          value = 1250000;
          targetValue = 1500000;
          break;
        case 'Денежный поток':
          value = 450000;
          targetValue = 600000;
          break;
        case 'Рентабельность продаж':
          value = 15;
          targetValue = 20;
          break;
        case 'EBITDA':
          value = 500000;
          targetValue = 700000;
          break;
        case 'Количество клиентов':
          value = 45;
          targetValue = 60;
          break;
        case 'Новые клиенты':
          value = 8;
          targetValue = 12;
          break;
        case 'Потерянные клиенты':
          value = 3;
          targetValue = 2;
          break;
        case 'Средний чек':
          value = 55555;
          targetValue = 50000;
          break;
        case 'Конверсия':
          value = 12;
          targetValue = 15;
          break;
        case 'Количество сотрудников':
          value = 12;
          targetValue = 15;
          break;
        case 'LTV (Lifetime Value)':
          value = 180000;
          targetValue = 200000;
          break;
        case 'CAC (Customer Acquisition Cost)':
          value = 25000;
          targetValue = 20000;
          break;
        case 'Churn Rate':
          value = 8;
          targetValue = 5;
          break;
        case 'NPS (Net Promoter Score)':
          value = 42;
          targetValue = 50;
          break;
        case 'Выручка на сотрудника':
          value = 208333;
          targetValue = 250000;
          break;
        case 'Производительность труда':
          value = 1.2;
          targetValue = 1.5;
          break;
        case 'Доля рынка':
          value = 0.8;
          targetValue = 1.2;
          break;
        case 'Рост выручки':
          value = 25;
          targetValue = 30;
          break;
        case 'ROI (Return on Investment)':
          value = 18;
          targetValue = 25;
          break;
        default:
          value = 100;
          targetValue = 120;
      }

      metricValues.push({
        userId: testUser.id,
        metricDefinitionId: definition.id,
        value,
        targetValue,
        periodType: MetricPeriodType.MONTHLY,
        periodDate: currentDate,
        notes: `Данные за август 2024 года`,
      });
    }

    // Создаем все значения метрик
    await prisma.metricValue.createMany({
      data: metricValues,
    });

    console.log(
      `✅ Created test user '${testUser.name}' with profile, business context and ${metricValues.length} metrics`,
    );
  } else {
    console.log(`ℹ️ Test user already exists`);
  }

  // Создание команд и проектов
  console.log('🌱 Creating teams and projects...');
  
  const users = await prisma.user.findMany();
  
  if (users.length >= 3) {
    // Создаем команды
    const teams = [
      {
        name: 'IT Development Team',
        description: 'Команда разработки IT-решений',
        leaderId: users[0].id,
      },
      {
        name: 'Marketing & Sales',
        description: 'Команда маркетинга и продаж',
        leaderId: users[1].id,
      },
      {
        name: 'Operations Team',
        description: 'Операционная команда',
        leaderId: users[2].id,
      },
    ];

    for (const teamData of teams) {
      const existingTeam = await prisma.team.findFirst({
        where: { name: teamData.name },
      });

      if (!existingTeam) {
        const team = await prisma.team.create({
          data: teamData,
        });

        // Добавляем участников в команды
        for (const user of users.slice(0, 3)) {
          // Проверяем, есть ли у пользователя уже активное членство в любой команде
          const existingActiveMembership = await prisma.userTeam.findFirst({
            where: {
              userId: user.id,
              isActive: true,
            },
          });

          // Проверяем конкретное членство в этой команде
          const existingTeamMembership = await prisma.userTeam.findFirst({
            where: {
              userId: user.id,
              teamId: team.id,
            },
          });

          if (!existingTeamMembership && !existingActiveMembership) {
            await prisma.userTeam.create({
              data: {
                userId: user.id,
                teamId: team.id,
                joinedAt: new Date(),
              },
            });
          }
        }

        const teamMembersCount = await prisma.userTeam.count({
          where: { teamId: team.id, isActive: true },
        });

        console.log(`✅ Created team '${team.name}' with ${teamMembersCount} members`);
      }
    }

    // Создаем проекты и задачи
    const createdTeams = await prisma.team.findMany();
    
    for (let i = 0; i < createdTeams.length && i < users.length; i++) {
      const team = createdTeams[i];
      const user = users[i];
      
      // Создаем проект для каждой команды
      const projectData = {
        name: `Проект ${team.name}`,
        description: `Основной проект команды ${team.name}`,
        createdById: user.id,
        teamId: team.id,
      };

      const existingProject = await prisma.task.findFirst({
        where: { 
          title: projectData.name,
          type: TaskType.TEAM
        },
      });

      if (!existingProject) {
        const project = await prisma.task.create({
          data: {
            title: projectData.name,
            description: projectData.description,
            type: TaskType.TEAM,
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            creatorId: user.id,
            assigneeId: user.id,
            teamId: team.id,
            startDate: new Date(),
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 дней
          },
        });

        // Создаем задачи для проекта
        const tasks = [
          {
            title: 'Анализ требований',
            description: 'Провести детальный анализ требований к проекту',
            type: TaskType.TEAM,
            status: TaskStatus.DONE,
            priority: TaskPriority.HIGH,
            parentTaskId: project.id,
          },
          {
            title: 'Планирование архитектуры',
            description: 'Спроектировать архитектуру решения',
            type: TaskType.TEAM,
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            parentTaskId: project.id,
          },
          {
            title: 'Разработка MVP',
            description: 'Создать минимально жизнеспособный продукт',
            type: TaskType.TEAM,
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            parentTaskId: project.id,
          },
          {
            title: 'Тестирование',
            description: 'Провести комплексное тестирование',
            type: TaskType.TEAM,
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            parentTaskId: project.id,
          },
          {
            title: 'Документация',
            description: 'Создать техническую документацию',
            type: TaskType.TEAM,
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            parentTaskId: project.id,
          },
        ];

        for (const taskData of tasks) {
          const assignedUser = users[Math.floor(Math.random() * Math.min(3, users.length))];
          
          const task = await prisma.task.create({
            data: {
              ...taskData,
              creatorId: user.id,
              assigneeId: assignedUser.id,
              teamId: team.id,
              startDate: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 дней
            },
          });

          // Создаем активность для задачи
          await prisma.taskActivity.create({
            data: {
              taskId: task.id,
              userId: user.id,
              action: 'CREATED',
              description: `Задача "${task.title}" была создана`,
            },
          });

          if (task.status === TaskStatus.DONE) {
            await prisma.taskActivity.create({
              data: {
                taskId: task.id,
                userId: assignedUser.id,
                action: 'STATUS_CHANGED',
                description: `Статус изменен на "Выполнено"`,
                oldValue: 'PENDING',
                newValue: 'DONE',
              },
            });
          }
        }

        console.log(`✅ Created project '${project.title}' with ${tasks.length} tasks`);
      }
    }
  }

  // Создание метрик для всех пользователей
  console.log('🌱 Creating metrics for all users...');
  
  const definitions = await prisma.metricDefinition.findMany();
  const allUsers = await prisma.user.findMany();
  
  for (const user of allUsers) {
    const existingMetrics = await prisma.metricValue.count({
      where: { userId: user.id },
    });
    
    if (existingMetrics === 0) {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      
      if (userProfile) {
        const currentRevenue = parseInt(userProfile.currentRevenue?.toString() || '1000000');
        const targetRevenue = parseInt(userProfile.targetRevenue?.toString() || '1500000');
        
        const metricValues = definitions.map(definition => {
          let value: number, targetValue: number;
          
          // Генерируем реалистичные значения на основе выручки пользователя
          const revenueRatio = currentRevenue / 2500000; // базовая выручка
          
          switch (definition.name) {
            case 'Выручка':
              value = currentRevenue;
              targetValue = targetRevenue;
              break;
            case 'Чистая прибыль':
              value = Math.round(currentRevenue * 0.15 * revenueRatio);
              targetValue = Math.round(targetRevenue * 0.18);
              break;
            case 'Валовая прибыль':
              value = Math.round(currentRevenue * 0.5 * revenueRatio);
              targetValue = Math.round(targetRevenue * 0.55);
              break;
            case 'Количество клиентов':
              value = Math.round(45 * revenueRatio);
              targetValue = Math.round(60 * (targetRevenue / currentRevenue));
              break;
            case 'Количество сотрудников':
              value = parseInt(userProfile.currentEmployees?.toString() || '10');
              targetValue = parseInt(userProfile.targetEmployees?.toString() || '15');
              break;
            case 'Рентабельность продаж':
              value = Math.round(15 + Math.random() * 10);
              targetValue = Math.round(20 + Math.random() * 10);
              break;
            case 'Конверсия':
              value = Math.round(8 + Math.random() * 8);
              targetValue = Math.round(12 + Math.random() * 8);
              break;
            default:
              value = Math.round(100 * revenueRatio + Math.random() * 50);
              targetValue = Math.round(value * 1.2 + Math.random() * 30);
          }
          
          return {
            userId: user.id,
            metricDefinitionId: definition.id,
            value,
            targetValue,
            periodType: 'MONTHLY' as MetricPeriodType,
            periodDate: new Date('2024-08-01'),
            notes: `Данные за август 2024 года для ${user.name} ${user.surname}`,
          };
        });
        
        await prisma.metricValue.createMany({
          data: metricValues,
        });
        
        console.log(`✅ Created ${metricValues.length} metrics for ${user.name} ${user.surname}`);
      }
    }
  }
}

void main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
