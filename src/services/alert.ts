import { transporter } from "../config/nodemailer.js";
import { getConfigService } from "./config.js";

export const sendAlertMail = async (apiKey:string, result: Record<string, any>) => {
    try{
        const config = getConfigService(apiKey)
        if(!config){
            return {
                status : 'config not found',
                failed : true
            }
        }
        const { email } = config.alert
        if(!email){
            return {
                status : 'email not found',
                failed : true
            }
        }
        let alertResults:Record<string, any> = {}
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
        const mailOptions = {
            to: email,
            html: `<div>
                    <h2>Alert : Your lighthouse scores are below the baseline.</h2>
                    <div>Result : ${JSON.stringify(alertResults)}</div>
                </div>`
        }
        let info = await transporter.sendMail(mailOptions)
        return {
            status : `Alert email sent to ${email} with message id : ${info.messageId}`
        }
    }catch(e){
        return {
            status : `Failed to send alert email, error occured: ${(e as Error).message}`,
            failed : true
        }
    }
    
}