import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import 'dotenv/config';
import { LoggerUtils } from './logger.utils'; // Ensure this import is correct.
import { client } from './redis.utils';

export interface JwtPayload extends Record<string, unknown> {
    id: string;
    username: string;
    imageUri: string | null;
    name: string;
    email: string;
    role: Role;
}

export default class JwtUtils {
    static sign(payload: JwtPayload, options?: SignOptions): string {
        const secretKey = process.env.JWT_SECRET_KEY;
        const expiresIn = process.env.JWT_EXPIRES_IN; // Default expiration set to 1 day
        const refreshSecretKey = process.env.REFRESH_JWT_SECRET_KEY;
        const refreshExpiresIn = process.env.REFRESH_JWT_EXPIRES_IN; // Default expiration set to 7 days
        
        if (!secretKey || !refreshSecretKey) {
            LoggerUtils.error('JWT_SECRET_KEY or REFRESH_JWT_SECRET_KEY is not defined'); // Log error message
            throw new Error('JWT_SECRET_KEY or REFRESH_JWT_SECRET_KEY is not defined');
        }

        if (!expiresIn || !refreshExpiresIn) {
            LoggerUtils.error('JWT_EXPIRES_IN or REFRESH_JWT_EXPIRES_IN is not defined'); // Log error message
            throw new Error('JWT_EXPIRES_IN or REFRESH_JWT_EXPIRES_IN is not defined');
        }

        const refreshToken = jwt.sign(payload, refreshSecretKey, { expiresIn: refreshExpiresIn, ...options });

        // Store refresh token in Redis
        client.set(`refreshToken:${payload.id}`, refreshToken, {
            EX: parseInt(refreshExpiresIn),
        });
       

        return jwt.sign(payload, secretKey, { expiresIn, ...options });
    }

    static verify(token: string): JwtPayload {
        const secretKey = process.env.JWT_SECRET_KEY;

        if (!secretKey) {
            LoggerUtils.error('JWT_SECRET_KEY is not defined'); // Log error message
            throw new Error('JWT_SECRET_KEY is not defined');
        }

        try {
            return jwt.verify(token, secretKey) as JwtPayload;
        } catch (error) {
            LoggerUtils.error('JWT verification failed!'); // Log error message and error object
            throw error;
        }
    }
}
