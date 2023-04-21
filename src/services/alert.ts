import { transporter } from "../config/nodemailer.js";
import { getConfigService } from "./config.js";

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
const generateDataRows = (
  url: string,
  scores: Number[],
  baselines: Number[]
) => {
  return `<tr>
                <td>${url}</td>
                ${scores.map((score, index) => {
                  return `<td class=${
                    score < baselines[index] ? "red-color" : "green-color"
                  }>${score}</td>
                            <td>${baselines[index]}</td>`;
                })}
            </tr>`;
};
const generateTableHeader = (categories: string[]) => {
  return `<tr>
                <th>URL</th>
                ${categories.map((category) => {
                  return `<th colspan="2">${category}</th>`;
                })}
            </tr>`;
};

const generateHTMLReport = (result: Record<string, any>) => {
  const styles = getStyles();
  const tableRows = [];
  const categories: Set<string> = new Set();
  for (const url in result) {
    const scores = [];
    const baselines = [];
    for (const category in result[url]) {
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
                    <table width="100%">
                        <thead>
                            ${tableHeader}
                        </thead>
                        <tbody>
                            ${tableRows.join("\n")}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
        `;
};

export const sendAlertMail = async (
  apiKey: string,
  result: Record<string, any>,
  onlyAlertIfBelowBaseline: boolean = false
) => {
  try {
    const config = getConfigService(apiKey);
    if (!config) {
      return {
        status: "Error : config not found",
        failed: true,
      };
    }
    const { email } = config.alertConfig;
    if (!email) {
      return {
        status: "Error : email not found",
        failed: true,
      };
    }
    let alertResults: Record<string, any> = {};
    if (onlyAlertIfBelowBaseline) {
      for (const url in result) {
        if (result[url].failed || !result[url].category) {
          continue;
        }
        for (const category in result[url]) {
          if (result[url][category].failed) {
            continue;
          }
          if (result[url][category].alertRequired) {
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
    const mailOptions = {
      to: email,
      html: generateHTMLReport(alertResults),
    };
    let info = await transporter.sendMail(mailOptions);
    return {
      status: `Alert email sent to ${email} with message id : ${info.messageId}`,
    };
  } catch (e) {
    return {
      status: `Error : Failed to send alert email, ${(e as Error).message}`,
      failed: true,
    };
  }
};
