import type { CategoryInput } from '../lib/content/schemas';

// Все цены — демонстрационные значения в BYN (// demo).
export const categoriesData: CategoryInput[] = [
  {
    slug: 'santehnika',
    title: 'Сантехника',
    shortTitle: 'Сантехника',
    icon: '🔧',
    description: 'Замена смесителей, устранение течей, установка сантехники.',
    seo: {
      title: 'Сантехника в Гродно — The Master Time',
      description:
        'Замена смесителя, устранение течи, установка унитаза в Гродно. Прозрачные цены, выезд мастера.'
    },
    works: [
      {
        id: 'zamena-smesitelya',
        title: 'Замена смесителя',
        priceFrom: 40, // demo
        priceTo: 60, // demo
        duration: '30–60 мин',
        popular: true
      },
      {
        id: 'ustranenie-techi',
        title: 'Устранение течи крана',
        priceFrom: 30, // demo
        priceTo: 50, // demo
        duration: '30–60 мин'
      },
      {
        id: 'ustanovka-unitaza',
        title: 'Установка унитаза',
        priceFrom: 80, // demo
        priceTo: 120, // demo
        duration: '1–2 ч'
      }
    ]
  },
  {
    slug: 'elektrika',
    title: 'Электрика',
    shortTitle: 'Электрика',
    icon: '⚡',
    description: 'Розетки, светильники, автоматы — мелкий электромонтаж.',
    seo: {
      title: 'Электрика в Гродно — The Master Time',
      description:
        'Замена розеток, установка светильников, монтаж автоматов в Гродно. Мастер на час, прозрачные цены.'
    },
    works: [
      {
        id: 'zamena-rozetki',
        title: 'Замена розетки',
        priceFrom: 30, // demo
        priceTo: 50, // demo
        duration: '20–40 мин',
        popular: true
      },
      {
        id: 'ustanovka-svetilnika',
        title: 'Установка светильника',
        priceFrom: 40, // demo
        priceTo: 80, // demo
        duration: '30–60 мин'
      },
      {
        id: 'montazh-avtomata',
        title: 'Монтаж автомата',
        priceFrom: 50, // demo
        priceTo: 90, // demo
        duration: '30–60 мин'
      }
    ]
  },
  {
    slug: 'remont-otdelka',
    title: 'Ремонт и отделка',
    shortTitle: 'Ремонт',
    icon: '🎨',
    description: 'Мелкий ремонт стен, гипсокартон, укладка плитки.',
    seo: {
      title: 'Ремонт и отделка в Гродно — The Master Time',
      description:
        'Мелкий ремонт стен, установка гипсокартона, укладка плитки в Гродно. Мастер на час, прозрачные цены.'
    },
    works: [
      {
        id: 'melkiy-remont-steny',
        title: 'Мелкий ремонт стены',
        priceFrom: 50, // demo
        priceTo: 100, // demo
        duration: '1–2 ч',
        popular: true
      },
      {
        id: 'ustanovka-gipsokartona',
        title: 'Установка листа гипсокартона',
        priceFrom: 60, // demo
        priceTo: 100, // demo
        duration: '1–2 ч'
      },
      {
        id: 'ukladka-plitki',
        title: 'Укладка плитки (м²)',
        priceFrom: 25, // demo
        priceTo: 40, // demo
        unit: 'м2',
        duration: '1 м²'
      }
    ]
  },
  {
    slug: 'mebel',
    title: 'Мебельные работы',
    shortTitle: 'Мебель',
    icon: '🪑',
    description: 'Сборка и ремонт мебели, установка фурнитуры.',
    seo: {
      title: 'Мебельные работы в Гродно — The Master Time',
      description:
        'Сборка шкафов, ремонт мебели, установка фурнитуры в Гродно. Мастер на час, прозрачные цены.'
    },
    works: [
      {
        id: 'sborka-shkafa',
        title: 'Сборка шкафа',
        priceFrom: 60, // demo
        priceTo: 120, // demo
        duration: '1–3 ч',
        popular: true
      },
      {
        id: 'remont-mebeli',
        title: 'Ремонт мебели',
        priceFrom: 40, // demo
        priceTo: 80, // demo
        duration: '1–2 ч'
      },
      {
        id: 'ustanovka-furnitury',
        title: 'Установка фурнитуры',
        priceFrom: 30, // demo
        priceTo: 60, // demo
        duration: '30–60 мин'
      }
    ]
  },
  {
    slug: 'bytovaya-tehnika',
    title: 'Бытовая техника',
    shortTitle: 'Техника',
    icon: '🔌',
    description: 'Ремонт и установка бытовой техники.',
    seo: {
      title: 'Ремонт бытовой техники в Гродно — The Master Time',
      description:
        'Ремонт стиральной машины, холодильника, установка плиты в Гродно. Мастер на час, прозрачные цены.'
    },
    works: [
      {
        id: 'remont-stiralnoy-mashiny',
        title: 'Ремонт стиральной машины',
        priceFrom: 60, // demo
        priceTo: 120, // demo
        duration: '1–2 ч',
        popular: true
      },
      {
        id: 'remont-holodilnika',
        title: 'Ремонт холодильника',
        priceFrom: 80, // demo
        priceTo: 150, // demo
        duration: '1–2 ч'
      },
      {
        id: 'ustanovka-plitty',
        title: 'Установка плиты',
        priceFrom: 60, // demo
        priceTo: 100, // demo
        duration: '1–2 ч'
      }
    ]
  },
  {
    slug: 'melkie-raboty',
    title: 'Мелкие работы',
    shortTitle: 'Мелкие работы',
    icon: '🛠️',
    description: 'Повесить полку, карниз, собрать комод и другие мелочи.',
    seo: {
      title: 'Мелкие работы по дому в Гродно — The Master Time',
      description: 'Повесить полку, карниз, собрать комод в Гродно. Мастер на час, прозрачные цены.'
    },
    works: [
      {
        id: 'povesit-polku',
        title: 'Повесить полку',
        priceFrom: 30, // demo
        priceTo: 50, // demo
        duration: '20–40 мин',
        popular: true
      },
      {
        id: 'povesit-karniz',
        title: 'Повесить карниз',
        priceFrom: 40, // demo
        priceTo: 60, // demo
        duration: '30–60 мин'
      },
      {
        id: 'sborka-komoda',
        title: 'Сборка комода',
        priceFrom: 50, // demo
        priceTo: 90, // demo
        duration: '1–2 ч'
      }
    ]
  }
];
