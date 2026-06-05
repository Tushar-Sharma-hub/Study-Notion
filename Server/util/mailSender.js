const nodemailer = require('nodemailer');
require('dotenv').config();

const mailSender = async (email, title, body) => {
    try{
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: "Study Notion",
            to: `${email}`,
            subject: `${title}`,
            text: `${body}`
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

module.exports = mailSender;