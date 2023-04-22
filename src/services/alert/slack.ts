import { PSIStrategy } from '../../types';
import { defaultStrategy } from '../pagespeed';

/**
 * Generates the section for each URL in the report
 */
export const generateSectionForURL = (
  url: string,
  category: Record<string, Record<string, string | number | boolean>>,
  onlyAlertIfBelowBaseline = false
) => {
  let performanceString = '';
  for (const c in category) {
    if (onlyAlertIfBelowBaseline && !category[c].alertRequired) continue;
    performanceString += `\t⁃ ${c} ‣ score : ${category[c].score} | baseline : ${category[c].baselineScore} | result : \`${category[c].message}\`\n`;
  }
  if (!performanceString) return null;
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `◦ URL :<${url}>\n${performanceString}`,
    },
  };
};

/**
 * Generates the heading section for each device in the report
 */
export const generateHeadingSection = (device: string) => {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${device}*\n\n`,
    },
  };
};

/**
 * Generates the section for each device in the report with heading and urls
 */
export const generateSectionForDevice = (
  result: Record<string, any>,
  device: string,
  onlyAlertIfBelowBaseline = false
) => {
  const sections = [];
  for (const url in result) {
    if (!result[url].failed) {
      const section = generateSectionForURL(url, result[url], onlyAlertIfBelowBaseline);
      if (section) {
        sections.push(section);
      }
    }
  }
  if (sections.length === 0) return null;
  sections.unshift(generateHeadingSection(device));
  return sections;
};
/**
 * Posts the final data to slack channel
 */
export const sendAlertToSlackChannel = async (
  alertConfig: Record<string, any> | undefined,
  result: Record<string, any>,
  strategy: PSIStrategy = defaultStrategy,
  onlyAlertIfBelowBaseline = false
) => {
  if (!alertConfig) {
    return {
      message: 'Alert config not found, generate one by /POST to /alert',
      failed: true,
    };
  }
  const { slack } = alertConfig;
  if (!slack) {
    return {
      message: 'Slack Channel in alertConfig not found, add one by /PATCH to /alert',
      failed: true,
    };
  }
  try {
    const sections = generateSectionForDevice(result, strategy, onlyAlertIfBelowBaseline);
    if (!sections)
      return {
        message: `No alert required for this report`,
      };
    const response = await fetch(slack, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*LIGHTHOUSE SCORE REPORT : ${new Date().toDateString()}*\n\n`,
            },
          },
          ...sections,
        ],
      }),
    });
    if (response.ok) {
      return {
        message: 'Successfully posted data to slack channel',
      };
    } else {
      return {
        message: 'Failed to post data to slack channel, status code : ' + response.status,
        failed: true,
      };
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};
