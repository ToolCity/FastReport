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
                    <h4>Your lighthouse performance report!</h4>
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
  chosenStartegy: PSIStrategy = defaultStrategy
) => {
  try {
    if (!alertConfig) {
      throw new Error('Alert config not found, generate one by /POST to /alert');
    }
    const { email } = alertConfig;
    if (!email.enabled) {
      return {
        message: 'Email alert not enabled in config',
      };
    }
    if (!email.id) {
      throw new Error('Email id not found in alertConfig, add one by /PATCH to /alert');
    }
    if (!result) {
      return {
        message: `No alert required for this report`,
      };
    }
    const html = generateHTMLReport(result, chosenStartegy);
    const mailOptions = {
      to: email.id,
      html,
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      return {
        message: `Alert email sent to ${email.id} with message : ${JSON.stringify(info)}`,
        html,
      };
    } catch (e) {
      throw new Error('Error while sending email-alert');
    }
  } catch (e) {
    throw e;
  }
};
