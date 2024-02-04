import { NextFunction, Request, Response } from 'express';
import * as crypto from 'crypto';
import { HashServices } from '../services/hash.services';
import JwtUtils from '../utils/jwt.uitls';
import { LoggerUtils } from '../utils/logger.utils';
import MailerUtils from '../utils/mailer.utils';
import { HttpStatusCodes } from '../utils/httpStatusCodes.utils';
import UserRepository from '../repositories/user.repository';
import {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailResendSchema,
    verifyEmailSchema,
} from '../schema/user.schema';

export default class AuthController {
    protected request: Request;
    protected response: Response;
    protected next: NextFunction;
    protected userService: UserRepository;
    protected mailerService: MailerUtils;

    constructor(request: Request, response: Response, next: NextFunction) {
        this.request = request;
        this.response = response;
        this.next = next;
        this.userService = new UserRepository();
        this.mailerService = new MailerUtils();
    }

    private async handleErrors(methodName: string, error: Error): Promise<Response> {
        LoggerUtils.error(`Error during ${methodName}: ${error.message}`);
        return this.response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: `An error occurred during ${methodName}.`,
        });
    }

    async register() {
        try {
            // Validate user input
            const validateData = registerSchema.validateSync(this.request.body);

            // Check if the user already exists
            const existingUser = await this.userService.getUserByEmail(validateData.email!);
            if (existingUser) {
                return this.response
                    .status(HttpStatusCodes.BAD_REQUEST)
                    .json({ message: 'User with this email already exists.' });

            }

            // Check if the username already exists
            const existingUsername = await this.userService.getUserByUsername(validateData.username);
            if (existingUsername) {
                return this.response
                    .status(HttpStatusCodes.BAD_REQUEST)
                    .json({ message: 'User with this username already exists.' });
            }

            // Hash the password
            const hashService = new HashServices(validateData.password);
            const hashedPassword = await hashService.hash();

            // Generate token for email verification
            const code = crypto.randomBytes(10).toString('hex');
            const verifyCode = crypto.createHash('sha256').update(code).digest('hex');
            const verifyCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Token valid for 10 minutes

            // Create the user
            const { confirmPassword, ...userData } = validateData;
            const user = await this.userService.createUser({
                ...userData,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpiresAt,
            });

            if (!user) {
                return this.response
                    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: 'An error occurred during registration.' });
            }

            // Send verification email
            await this.mailerService.sendEmailVerification(user.email, verifyCode);

            // Send response
            return this.response.status(HttpStatusCodes.OK).json({
                message: 'User registered successfully.',
                data: user,
            });
        } catch (error) {
            return this.handleErrors('registration', error as Error);
        }
    }

    async login() {
        try {
            // Validate user input
            const validateData = loginSchema.validateSync(this.request.body);

            // Check if validation failed
            if (!validateData) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Invalid input data.' });
            }

            // Retrieve the user from the database
            const user = await this.userService.getUserByIdentifier(validateData.identifier);

            // Check if the user exists
            if (!user) {
                return this.response
                    .status(HttpStatusCodes.UNAUTHORIZED)
                    .json({ message: 'Invalid email or password.' });
            }

            // Check the password
            const hashService = new HashServices(validateData.password);
            if (!hashService.compare(user.password)) {
                return this.response
                    .status(HttpStatusCodes.UNAUTHORIZED)
                    .json({ message: 'Invalid email or password.' });
            }

            // Check if the user is verified
            if (!user.isVerified) {
                return this.response
                    .status(HttpStatusCodes.UNAUTHORIZED)
                    .json({ message: 'Please verify your email.' });
            }

            // Generate access token
            const token = JwtUtils.sign({
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                imageUri: user.imageUri,
                role: user.role,
            });

            // Send response
            return this.response.status(HttpStatusCodes.OK).json({
                message: 'User logged in successfully.',
                token,
            });
        } catch (error) {
            return this.handleErrors('login', error as Error);
        }
    }

    async verifyEmail() {
        try {
            // Validate user input
            const validateData = { token: this.request.params.verifyToken };
            verifyEmailSchema.validateSync(validateData, { abortEarly: false });

            if (!validateData) {
                return this.response
                    .status(HttpStatusCodes.BAD_REQUEST)
                    .json({ message: 'Verification token is required.' });
            }

            // Retrieve the user from the database
            const user = await this.userService.getUserByVerifyToken({ verifyCode: validateData.token });

            if (!user) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Invalid token.' });
            }

            // Check if the token has expired
            const isExpired = user.verifyCodeExpiresAt && user.verifyCodeExpiresAt < new Date();
            if (isExpired) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Token has expired.' });
            }

            if (user.isVerified) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Email already verified.🛵' });
            }

            // Update user verification status
            const updatedUser = await this.userService.updateUser(
                { id: user.id },
                { isVerified: true, verifyCode: null, verifyCodeExpiresAt: null },
                { email: true },
            );

            if (!updatedUser) {
                return this.response
                    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: 'An error occurred during email verification.' });
            }

            // Send welcome email
            await this.mailerService.sendWelcomeEmail(user.email, user.name);

            // Send response
            return this.response.status(HttpStatusCodes.OK).json({ message: 'Email verified successfully.' });
        } catch (error) {
            return this.handleErrors('email verification', error as Error);
        }
    }

    async resendEmailVerification() {
        try {
            // Validate user input
            const validateData = verifyEmailResendSchema.validateSync(this.request.body);

            // Retrieve the user from the database
            const user = await this.userService.getUserByEmail(validateData.email);
            if (!user) {
                return this.response
                    .status(HttpStatusCodes.BAD_REQUEST)
                    .json({ message: 'User with this email does not exist.' });
            }

            if (user.isVerified) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Email already verified.🛵' });
            }

            // Generate token for email verification
            const code = crypto.randomBytes(10).toString('hex');
            const verifyCode = crypto.createHash('sha256').update(code).digest('hex');
            const verifyCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // Token valid for 10 minutes

            // Update user verification status
            const updatedUser = await this.userService.updateUser(
                { id: user.id },
                { verifyCode, verifyCodeExpiresAt },
                { email: true },
            );

            if (!updatedUser) {
                return this.response
                    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: 'An error occurred during email verification.' });
            }

            // Send verification email
            await this.mailerService.sendEmailVerification(user.email, verifyCode);

            // Send response
            return this.response.status(HttpStatusCodes.OK).json({ message: 'Email sent successfully.' });
        } catch (error) {
            return this.handleErrors('email verification', error as Error);
        }
    }

    async forgotPassword() {
        try {
            // Validate user input
            const validateData = forgotPasswordSchema.validateSync(this.request.body);

            // Retrieve the user from the database
            const user = await this.userService.getUserByEmail(validateData.email);
            if (!user) {
                return this.response
                    .status(HttpStatusCodes.BAD_REQUEST)
                    .json({ message: 'User with this email does not exist.' });
            }

            // Generate token for password reset
            const code = crypto.randomBytes(10).toString('hex');
            const passwordResetToken = crypto.createHash('sha256').update(code).digest('hex');
            const passwordResetAt = new Date(Date.now() + 15 * 60 * 1000); // Token valid for 15 minutes

            // Update user reset token
            const updatedUser = await this.userService.updateUser(
                { id: user.id },
                { passwordResetToken, passwordResetAt },
                { email: true },
            );

            if (!updatedUser) {
                return this.response
                    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: 'An error occurred during password reset.' });
            }

            // Send password reset email
            await this.mailerService.sendPasswordResetEmail(user.email, passwordResetToken);

            // Send response
            return this.response.status(HttpStatusCodes.OK).json({ message: 'Email sent successfully.' });
        } catch (error) {
            return this.handleErrors('forgot password', error as Error);
        }
    }

    async resetPassword() {
        try {
            const token = this.request.params.resetToken;

            const validateData = resetPasswordSchema.validateSync(this.request.body);

            // Retrieve the user from the database
            const user = await this.userService.getUserByResetToken({ passwordResetToken: token });
            if (!user) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Invalid token.' });
            }

            // Check if the token has expired
            const isExpired = user.passwordResetAt && user.passwordResetAt < new Date();
            if (isExpired) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({ message: 'Token has expired.' });
            }

            // Hash the password
            const hashService = new HashServices(validateData.password);
            const hashedPassword = await hashService.hash();

            // Update user password
            const updatedUser = await this.userService.updateUser(
                { id: user.id },
                { password: hashedPassword, passwordResetToken: null, passwordResetAt: null },
            );

            if (!updatedUser) {
                return this.response
                    .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ message: 'An error occurred during password reset.' });
            }

            // Send password reset confirmation email
            await this.mailerService.sendPasswordResetConfirmationEmail(user.email);

            // Send response
            return this.response.status(HttpStatusCodes.OK).json({ message: 'Password reset successfully.' });
        } catch (error) {
            console.error(error);
            return this.handleErrors('password reset', error as Error);
        }
    }

    async logout(): Promise<Response> {
        try {
            return await Promise.resolve(this.response.status(HttpStatusCodes.OK).json({ message: 'Logged out.' }));
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
