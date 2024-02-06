import { Request, Response, NextFunction } from 'express';
import MessageRepository from '../repositories/message.repository';
import UserRepository from '../repositories/user.repository';
import { HttpStatusCodes } from '../utils/httpStatusCodes.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { createMessageSchema, getMessagesBySenderIdSchema } from '../schema/message.schema';
import { Message, MessageStatus } from '@prisma/client';
import { client } from '../utils/redis.utils';
import Encryptor from '../utils/encryptor.utils';

export default class MessageController {
    protected request: Request;
    protected response: Response;
    protected next: NextFunction;
    protected messageRepo: MessageRepository;
    protected userRepo: UserRepository;
    protected encryptor: Encryptor;

    constructor(request: Request, response: Response, next: NextFunction) {
        this.request = request;
        this.response = response;
        this.next = next;
        this.messageRepo = new MessageRepository();
        this.userRepo = new UserRepository();
        this.encryptor = new Encryptor(
            process.env.ENCRYPTION_KEY as string,
            process.env.ENCRYPTION_IV as string
        ); // Initialize your encryption utility
    }

    private async handleErrors(methodName: string, error: Error): Promise<Response> {
        LoggerUtils.error(`Error during ${methodName}: ${error.message}`);
        return await this.response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: `An error occurred during ${methodName}.`,
        });
    }

    /**
     * Retrieves cached messages from Redis for a specific sender.
     *
     * @param {string} senderId - The ID of the sender.
     * @returns {Promise<Message[]>} A Promise that resolves with an array of cached messages.
     * @throws {Error} If there is an issue during the retrieval process.
     */
    private static async getCacheMessages(senderId: string): Promise<Message[]> {
        try {
            const cachedMessages = await client.get(`messages:${senderId}`);
            if (cachedMessages) {
                return JSON.parse(cachedMessages);
            }
            return [];
        } catch (error) {
            LoggerUtils.error(`Error getting cached messages: ${error}`);
            return [];
        }
    }

    /**
     * Caches messages in Redis for a specific sender.
     *
     * @param {string} senderId - The ID of the sender.
     * @param {Message[]} messages - The messages to be cached.
     * @returns {Promise<void>} A Promise that resolves when the caching is complete.
     * @throws {Error} If there is an issue during the caching process.
     */
    private static async cacheMessages(senderId: string, messages: Message[]): Promise<void> {
        const cacheKey = `messages:${senderId}`;
        await client.set(cacheKey, JSON.stringify(messages)); // cache the messages
    }

    private async updateStatusForReceivedMessages(messages: Message[], senderId: string): Promise<void> {
        const updatePromises = messages
            .filter((message) => message.senderId !== senderId)
            .map(async (message) => {
                try {
                    await this.messageRepo.updateMessage(
                        {
                            id: message.id,
                        },
                        {
                            status: MessageStatus.READ,
                            readAt: new Date(),
                        },
                    );
                } catch (error) {
                    LoggerUtils.error(`Error updating message status: ${error}`);
                    // Handle the error, log it, or take appropriate action
                }
            });

        await Promise.all(updatePromises);
    }

    async createMessage() {
        try {
            // Validate Input
            const validatedInput = await createMessageSchema.validateSync(this.request.body);

            // Check if the sender exists
            const sender = await this.userRepo.getUserById({ id: validatedInput.senderId });
            if (!sender) {
                return this.response.status(HttpStatusCodes.NOT_FOUND).json({
                    message: 'Sender not found.',
                });
            }

            // Encrypt the message content
            const encryptedContent = this.encryptor.encrypt(validatedInput.content);

            // Create the message without specifying a community
            const message = await this.messageRepo.createMessage({
                content: encryptedContent,
                sender: {
                    connect: { id: validatedInput.senderId },
                },
            });

            // Return the message
            return this.response.status(HttpStatusCodes.CREATED).json({
                message: 'Message created.',
                data: message,
            });
        } catch (error) {
            return this.handleErrors('createMessage', error as Error);
        }
    }

    async getMessagesBySenderId() {
        try {
            // Get the senderId from the request params
            const validateData = { senderId: this.request.params.id };
            const params = await getMessagesBySenderIdSchema.validateSync(validateData);

            // Use Redis cache if available
            const cacheKey = `messages:${params.senderId}`;
            const cachedMessages = await MessageController.getCacheMessages(cacheKey);

            if (cachedMessages.length > 0) {
                return this.response.status(HttpStatusCodes.OK).json({
                    message: 'Messages retrieved from cache.',
                    data: cachedMessages,
                });
            }

            // If not in cache, fetch messages from the database
            const messages = await this.messageRepo.getMessagesBySenderId({
                sender: {
                    id: params.senderId,
                },
            });

            // Decrypt and update message status
            messages.forEach(message => {
                message.content = this.encryptor.decrypt(message.content);
            });

            // Update message status and cache the messages
            await this.updateStatusForReceivedMessages(messages, params.senderId);
            await MessageController.cacheMessages(cacheKey, messages);

            // Return the messages
            return this.response.status(HttpStatusCodes.OK).json({
                message: 'Messages retrieved.',
                data: messages,
            });
        } catch (error) {
            LoggerUtils.error(`Error in getMessagesBySenderId: ${error}`);
            return this.response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'An error occurred.',
            });
        }
    }

    async getAllMessages() {
        try {
            const filter = this.request.query.filter as string;
            const limit = parseInt(this.request.query.limit as string) || undefined;
            const filterObject = filter ? JSON.parse(filter) : undefined;

            const messages = await this.messageRepo.getAllMessages(filterObject, limit);
            return this.response.status(HttpStatusCodes.OK).json(messages);
        } catch (error) {
            return this.handleErrors('getAllMessages', error as Error);
        }
    }

    async getMessage() {
        try {
            const messageId = this.request.params.id;
            const message = await this.messageRepo.getMessage({ id: messageId });
            if (!message) {
                return this.response.status(HttpStatusCodes.NOT_FOUND).json({ message: 'Message not found.' });
            }
            return this.response.status(HttpStatusCodes.OK).json(message);
        } catch (error) {
            return this.handleErrors('getMessage', error as Error);
        }
    }

    async updateMessage() {
        try {
            const messageId = this.request.params.id;
            const messageData = this.request.body;
            const updatedMessage = await this.messageRepo.updateMessage({ id: messageId }, messageData);
            return this.response.status(HttpStatusCodes.OK).json(updatedMessage);
        } catch (error) {
            return this.handleErrors('updateMessage', error as Error);
        }
    }

    async deleteMessage() {
        try {
            const messageId = this.request.params.id;
            const deletedMessage = await this.messageRepo.deleteMessageById({ id: messageId });
            return this.response.status(HttpStatusCodes.OK).json(deletedMessage);
        } catch (error) {
            return this.handleErrors('deleteMessage', error as Error);
        }
    }

    async deleteAllMessages() {
        try {
            const deletedMessages = await this.messageRepo.deleteAllMessages();
            return this.response.status(HttpStatusCodes.OK).json(deletedMessages);
        } catch (error) {
            return this.handleErrors('deleteAllMessages', error as Error);
        }
    }
}
