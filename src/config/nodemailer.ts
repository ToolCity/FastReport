import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import dotenv from 'dotenv'
dotenv.config()

const transportConfig: SMTPTransport.Options = {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 0,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
}

const defaultConfig =  {
    from: process.env.EMAIL_FROM,
    subject: 'Alert : Your lighthouse scores are below the baseline.',
}
export const transporter = nodemailer.createTransport(transportConfig, defaultConfig)

