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
export async function sendEmail({ email, subject, message, discription, }) {
    // Send email
    try {
        const info = await transporter.sendMail({
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
