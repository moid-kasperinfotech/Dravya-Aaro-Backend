import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

interface SendEmailOptions {
    email: string;
    subject: string;
    message: string;
    discription: string;
}

export async function sendEmail({ email, subject, message, discription }: SendEmailOptions) {
    // Send email
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject,
            text: message,
            html: discription,
        });
    }
    catch (error) {
        console.log(error);
    }
}
