import type { CalculatorTaskInput } from '../lib/content/schemas';

// Задачи калькулятора ссылаются на работы из categories.ts.
// Работы с unit 'м2'/'час' (например, укладка плитки) в калькулятор не включаются.
export const calculatorTasksData: CalculatorTaskInput[] = [
  {
    id: 'zamena-smesitelya',
    categorySlug: 'santehnika',
    label: 'Замена смесителя',
    workId: 'zamena-smesitelya'
  },
  {
    id: 'ustranenie-techi',
    categorySlug: 'santehnika',
    label: 'Устранение течи крана',
    workId: 'ustranenie-techi'
  },
  {
    id: 'ustanovka-unitaza',
    categorySlug: 'santehnika',
    label: 'Установка унитаза',
    workId: 'ustanovka-unitaza'
  },

  {
    id: 'zamena-rozetki',
    categorySlug: 'elektrika',
    label: 'Замена розетки',
    workId: 'zamena-rozetki'
  },
  {
    id: 'ustanovka-svetilnika',
    categorySlug: 'elektrika',
    label: 'Установка светильника',
    workId: 'ustanovka-svetilnika'
  },

  {
    id: 'melkiy-remont-steny',
    categorySlug: 'remont-otdelka',
    label: 'Мелкий ремонт стены',
    workId: 'melkiy-remont-steny'
  },
  {
    id: 'ustanovka-gipsokartona',
    categorySlug: 'remont-otdelka',
    label: 'Установка листа гипсокартона',
    workId: 'ustanovka-gipsokartona'
  },

  { id: 'sborka-shkafa', categorySlug: 'mebel', label: 'Сборка шкафа', workId: 'sborka-shkafa' },
  { id: 'remont-mebeli', categorySlug: 'mebel', label: 'Ремонт мебели', workId: 'remont-mebeli' },

  {
    id: 'remont-stiralnoy-mashiny',
    categorySlug: 'bytovaya-tehnika',
    label: 'Ремонт стиральной машины',
    workId: 'remont-stiralnoy-mashiny'
  },
  {
    id: 'remont-holodilnika',
    categorySlug: 'bytovaya-tehnika',
    label: 'Ремонт холодильника',
    workId: 'remont-holodilnika'
  },

  {
    id: 'povesit-polku',
    categorySlug: 'melkie-raboty',
    label: 'Повесить полку',
    workId: 'povesit-polku'
  },
  {
    id: 'povesit-karniz',
    categorySlug: 'melkie-raboty',
    label: 'Повесить карниз',
    workId: 'povesit-karniz'
  }
];
