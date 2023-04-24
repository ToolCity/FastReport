import { PSIStrategy } from '../types';

export const baselineStore = [
  {
    id: 'DA0524CF-3073-4346-ACDA-F5816650FE8A',
    [PSIStrategy.MOBILE]: {
      baselineConfig: [
        {
          url: 'https://www.builder.io',
          performance: 0.9,
          seo: 0.9,
          accessibility: undefined,
          'best-practices': undefined,
        },
        {
          url: 'https://www.builder.io/c/docs/getting-started',
          performance: 0.75,
          seo: 0.8,
          accessibility: undefined,
          'best-practices': undefined,
        },
        {
          url: 'https://www.builder.io/c/docs/developers',
          performance: 0.75,
          seo: 0.8,
          accessibility: undefined,
          'best-practices': undefined,
        },
      ],
    },
    [PSIStrategy.DESKTOP]: {
      baselineConfig: [
        {
          url: 'https://www.builder.io',
          performance: 0.9,
          seo: 0.9,
          accessibility: undefined,
          'best-practices': undefined,
        },
        {
          url: 'https://www.builder.io/c/docs/getting-started',
          performance: 0.75,
          seo: 0.8,
          accessibility: undefined,
          'best-practices': undefined,
        },
        {
          url: 'https://www.builder.io/c/docs/developers',
          performance: 0.75,
          seo: 0.8,
          accessibility: undefined,
          'best-practices': undefined,
        },
      ],
    },
  },
];

export const configStore = [
  {
    id: 'DA0524CF-3073-4346-ACDA-F5816650FE8A',
    urls: [
      'https://www.builder.io',
      'https://www.builder.io/c/docs/getting-started',
      'https://www.builder.io/c/docs/developers',
    ],
    alertConfig: {
      email: {
        id: 'akshat@builder.io',
        enabled: true,
      },
      slack: {
        id: '',
        enabled: false,
      },
    },
  },
];
