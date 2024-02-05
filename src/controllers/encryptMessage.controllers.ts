import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { HttpStatusCodes } from '../utils/httpStatusCodes.utils';
import { LoggerUtils } from '../utils/logger.utils';

export default class EncryptMessageController {
    protected request: Request;
    protected response: Response;
    protected next: NextFunction;

    constructor(request: Request, response: Response, next: NextFunction) {
        this.request = request;
        this.response = response;
        this.next = next;
    }

    private async handleErrors(methodName: string, error: Error): Promise<Response> {
        LoggerUtils.error(`Error during ${methodName}: ${error.message}`);
        return await this.response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: `An error occurred during ${methodName}. Check the logs for details.`,
        });
    }

    /**
     * Encrypts the provided message using AES-256-CBC algorithm.
     * @param {string} message - The message to be encrypted.
     * @returns {Object} An object containing encrypted data, key, and IV.
     */
    async encryptMessage() {
        try {
            const { message } = this.request.body;
            if (!message) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({
                    message: 'The request body must include a "message" property.',
                });
            }

            // Generate a random key and IV
            const key = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);

            // Create a cipher using AES-256-CBC algorithm
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

            // Encrypt the message
            let encrypted = cipher.update(message, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            return this.response.status(HttpStatusCodes.OK).json({
                data: {
                    encrypted,
                    key: key.toString('hex'),
                    iv: iv.toString('hex'),
                },
            });
        } catch (error) {
            return this.handleErrors('encrypting message', error as Error);
        }
    }

    /**
     * Decrypts the provided encrypted data using AES-256-CBC algorithm.
     * @param {Object} encryptedData - The encrypted data along with key and IV.
     * @returns {string} The decrypted message.
     */
    async decryptMessage() {
        try {
            const { message, key, iv } = this.request.body;
            if (!message || !key || !iv) {
                return this.response.status(HttpStatusCodes.BAD_REQUEST).json({
                    message: 'The request body must include "message", "key", and "iv" properties.',
                });
            }

            // Convert key and IV from hex to Buffer
            const keyBuffer = Buffer.from(key, 'hex');
            const ivBuffer = Buffer.from(iv, 'hex');

            // Create a decipher using AES-256-CBC algorithm
            const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);

            // Decrypt the message
            let decrypted = decipher.update(message, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return this.response.status(HttpStatusCodes.OK).json({
                data: {
                    decrypted,
                },
            });
        } catch (error) {
            return this.handleErrors('decrypting message', error as Error);
        }
    }
}
