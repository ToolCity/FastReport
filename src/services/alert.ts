import { transporter } from "../config/nodemailer.js";
import { getConfigService } from "./config.js";

const generateHTMLReport = (result:Record<string, any>) => {
    const styles = `
        <style>
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
        </style>`
    
    const generateDataRows = (uri:string, scores: Number[], baselines: Number[]) => {
        return (
            `<tr>
                <td>${uri}</td>
                ${
                    scores.map((score, index) => {
                        return (
                            `<td>${score}</td>
                            <td>${baselines[index]}</td>`
                        )
                    })
                }
            </tr>`
        )
    }
    const generateTableHeader = (categories:string[]) => {
        return (
            `<tr>
                <th>URL</th>
                ${
                    categories.map((category) => {
                        return (
                            `<th colspan="2">${category}</th>`
                        )
                    })
                }
            </tr>`
        )
    }
    const tableRows = []
    // extract data from result 
    let categories:Set<string> = new Set()
    for(let uri in result){
        // get uri and category for each uri
        let scores = []
        let baselines = []
        for(let category in result[uri]){
            categories.add(category)
            scores.push(result[uri][category].score)
            baselines.push(result[uri][category].baseline)
        }
        tableRows.push(generateDataRows(uri, scores, baselines))
    }
    const tableHeader = generateTableHeader(Array.from(categories))
    return (
        `
        <html>
            <head>
                ${styles}
            </head>
            <body>
                <div>
                    <h2>Your lighthouse performance report!</h2>
                    <table>
                        <thead>
                            ${tableHeader}
                        </thead>
                        <tbody>
                            ${tableRows.join('')}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>
        `
    )
}

export const sendAlertMail = async (apiKey:string, result: Record<string, any>, onlyAlertIfBelowBaseline:boolean = false) => {
    try{
        const config = getConfigService(apiKey)
        if(!config){
            return {
                status : 'Error : config not found',
                failed : true
            }
        }
        const { email } = config.alert
        if(!email){
            return {
                status : 'Error : email not found',
                failed : true
            }
        }
        let alertResults:Record<string, any> = {}
        if(onlyAlertIfBelowBaseline) { 
            for(let uri in result) { 
                if(result[uri].failed){
                    continue;
                }
                for(let category in result[uri]){
                    if(result[uri][category].failed){
                        continue;
                    }
                    if(result[uri][category].alertRequired){
                        // send this in alert
                        alertResults[uri] = {
                            ...alertResults[uri],
                            [category] : result[uri][category]
                        }
                    }
                }
            }
        }else{
            alertResults = result
        }
        const mailOptions = {
            to: email,
            html: generateHTMLReport(alertResults)
        }
        let info = await transporter.sendMail(mailOptions)
        return {
            status : `Alert email sent to ${email} with message id : ${info.messageId}`
        }
    }catch(e){
        return {
            status : `Error : Failed to send alert email, ${(e as Error).message}`,
            failed : true
        }
    }
    
}