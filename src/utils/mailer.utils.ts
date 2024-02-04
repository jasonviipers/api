import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import 'dotenv/config';
import { LoggerUtils } from './logger.utils';

export default class MailerUtils {
    protected transporter: Mail;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    /**
     * Send an email using the configured transporter.
     *
     * @param to - Recipient email address
     * @param subject - Email subject
     * @param html - Email HTML content (optional)
     */
    async sendMail(to: string, subject: string, html?: string) {
        try {
            // Validate transporter and environment variable
            if (!this.transporter) {
                throw new Error('Mail transporter is not initialized');
            }
            if (!process.env.MAIL_FROM) {
                throw new Error('MAIL_FROM environment variable is not defined');
            }
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject,
                html,
            });
        } catch (error) {
            LoggerUtils.error(`Error sending mail: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendWelcomeEmail(to: string, name: string) {
        const subject = 'Welcome to Our Platform!';
        const html = `<p>Hi "${name}",</p><p>Thank you for joining us! We're thrilled to have you.</p>`;
        await this.sendMail(to, subject, html);
    }

    async sendPasswordResetEmail(to: string, resetToken: string) {
        const subject = 'Password Reset Request';
        const html = `<p>To reset your password, please click the link below:</p><a href="${process.env.CORS_ORIGINS}/reset-password/${resetToken}">Reset Password</a>`;
        await this.sendMail(to, subject, html);
    }

    async sendPasswordResetConfirmationEmail(to: string) {
        const subject = 'Your Password Has Been Changed';
        const html = `<p>Your password has been successfully changed. If you did not initiate this change, please contact support immediately.</p>`;
        await this.sendMail(to, subject, html);
    }

    async sendEmailVerification(to: string, verificationToken: string) {
        const subject = 'Verify Your Email Address';
        const html = `<p>Please click the link below to verify your email address:</p><a href="${process.env.CORS_ORIGINS}/verify-email/${verificationToken}">Verify Email</a>`;
        await this.sendMail(to, subject, html);
    }

    async sendPasswordlessLoginLink(to: string, loginToken: string) {
        const subject = 'Passwordless Login Request';
        const html = `
        <p>To log in to your account, please click the link below:</p>
        <a href="${process.env.CORS_ORIGINS}/login-with-token/${loginToken}">Login</a>
        <p>If you did not request this, please ignore this email.</p>
    `;
        await this.sendMail(to, subject, html);
    }
}
