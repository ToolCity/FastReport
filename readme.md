<p align="center">
  <img src="docs/hero.png" height="400" />
</p>

## Features

- Define your test suites with multiple urls and baseline configs
- Get a complete score report and alerts on email and slack by just calling a single endpoint.
- Detect what changes are causing the performance drops by adding the tool to your CI/CD workflows.
- Open source, Highly customisable 🚀

## Sample alerts

### Email

![email-report.png](./docs/email-report.png)

### Slack

![slack-report.png](./docs/slack-report.png)

## How to use

1. Create a `.env` file by copying contents from `sample.env` and provide the required env variables.
2. Set the config for your website in the `store/index.ts` file, add the urls you want to test and set a baseline score for different urls based on devices, set alert config for email and slack. Sample config below to use as a reference.
3. Start the server : `npm run build` and `node dist/index.js`.
4. GET `/api/trigger/{id}` to trigger the performance tests, once the performance tests are done you will
   receive reports on your alertConfigs like email and slack channel.

## Defaults

The tool is pre configured to use `Performance` as the default category for test and `Desktop` as the default startegy, you can provide query params in API Get Request to change the behaviour.

For eg : `GET /api/trigger/YOUR_CONFIG_ID?category=performance,seo&startegy=mobile`, this will respond with a report containing both performance and seo score of the urls for mobile strategy.

## Sample Config

```ts
import { PSIStrategy } from '../types';

export const baselineStore = [
  {
    id: 'DA0524CF-3073-4346-ACDA-F5816650FE8A', // acts like a primary key for a test suite
    [PSIStrategy.MOBILE]: {
      baselineConfig: [
        {
          url: 'https://www.google.com', // url from configStore urls array
          performance: 0.9, // score category key like performance, seo, accessibility , best-practises
        },
        {
          url: 'https://www.docs.google.com',
          performance: 0.75,
          seo: 0.8,
        },
      ],
    },
    [PSIStrategy.DESKTOP]: {
      baselineConfig: [
        {
          url: 'https://www.google.com',
          performance: 0.8,
        },
        {
          url: 'https://www.docs.google.com',
          performance: 0.65,
          seo: 0.8,
        },
      ],
    },
  },
];

export const configStore = [
  {
    id: 'DA0524CF-3073-4346-ACDA-F5816650FE8A', // ID (can be any string) for associating baseline with config
    urls: ['https://www.google.com', 'https://docs.google.com'], // urls to be included in the test suite
    alertConfig: {
      email: {
        id: 'your@email.com', // insert a valid email ID where you would like to get alerts
        enabled: true, // email alerts enabled
      },
      slack: {
        id: 'slack_channel_url', // insert a slack webhook url to post data to
        enabled: false, // slack alerts disabled
      },
    },
  },
];
```
