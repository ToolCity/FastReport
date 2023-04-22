import { transporter } from '../../config/nodemailer';
import { PSIStrategy } from '../../types';
import { defaultStrategy } from '../pagespeed';

const getStyles = () =>
  `<style>
        table, th, td {
            border: 1px solid black;
            border-collapse: collapse;
        }
        .red-color { 
            color : red;
        }
        .green-color {
            color : green;
        }
    </style>`;
const generateDataRows = (url: string, scores: number[], baselines: number[]) => {
  return `<tr>
                <td>${url}</td>
                ${scores.map((score, index) => {
                  return `<td class=${
                    score < baselines[index] ? 'red-color' : 'green-color'
                  }>${score}</td>
                            <td>${baselines[index]}</td>`;
                })}
            </tr>`;
};
const generateTableHeader = (categories: string[]) => {
  return `<tr>
            <th>URL</th>
                ${categories.map(category => {
                  return `<th colspan="2">${category}</th>`;
                })}
            </tr>`;
};

const generateHTMLReport = (
  result: Record<string, any>,
  chosenStartegy: PSIStrategy = defaultStrategy
) => {
  const styles = getStyles();
  const tableRows: string[] = [];
  const categories: Set<string> = new Set();
  for (const url in result) {
    const scores: number[] = [];
    const baselines: number[] = [];
    for (const category in result[url]) {
      if (result[url].failed) continue;
      categories.add(category);
      scores.push(result[url][category].score);
      baselines.push(result[url][category].baselineScore);
    }
    tableRows.push(generateDataRows(url, scores, baselines));
  }
  const tableHeader = generateTableHeader(Array.from(categories));
  return `
        <html>
            <head>
                ${styles}
            </head>
            <body>
                <div>
                    <h2>Your lighthouse performance report!</h2>
                    <h4>Strategy : ${chosenStartegy}</h4>
                    <table width="100%">
                        <thead>
                            ${tableHeader}
                        </thead>
                        <tbody>
                            ${tableRows.join('\n')}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
        `;
};

export const sendAlertMail = async (
  alertConfig: Record<string, any> | undefined,
  result: Record<string, any>,
  chosenStartegy: PSIStrategy = defaultStrategy,
  onlyAlertIfBelowBaseline = false
) => {
  try {
    if (!alertConfig) {
      return {
        message: 'Alert config not found, generate one by /POST to /alert',
        failed: true,
      };
    }
    const { email } = alertConfig;
    if (!email.enabled) {
      return {
        message: 'Email alert not enabled in config',
      };
    }
    if (!email.id) {
      return {
        message: 'Email in alertConfig not found, add one by /PATCH to /alert',
        failed: true,
      };
    }
    let alertResults: Record<string, any> | null = null;
    if (onlyAlertIfBelowBaseline) {
      for (const url in result) {
        if (result[url].failed) {
          continue;
        }
        for (const category in result[url]) {
          if (result[url][category].failed) {
            continue;
          }
          if (result[url][category].alertRequired) {
            if (!alertResults) {
              alertResults = {};
            }
            alertResults[url] = {
              ...alertResults[url],
              [category]: result[url][category],
            };
          }
        }
      }
    } else {
      alertResults = result;
    }
    if (!alertResults) {
      return {
        message: `No alert required for this report`,
      };
    }
    const mailOptions = {
      to: email.id,
      html: generateHTMLReport(alertResults, chosenStartegy),
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      message: `Alert email sent to ${email.id} with message id : ${info.messageId}`,
    };
  } catch (e) {
    return {
      message: `Error : Failed to send alert email, ${(e as Error).message}`,
      failed: true,
    };
  }
};
