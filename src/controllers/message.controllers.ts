import { Request, Response, NextFunction } from 'express';
import MessageRepository from '../repositories/message.repository';
import UserRepository from '../repositories/user.repository';
import { HttpStatusCodes } from '../utils/httpStatusCodes.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { createMessageSchema, getMessagesBySenderIdSchema } from '../schema/message.schema';
import { Message, MessageStatus } from '@prisma/client';
import { client } from '../utils/redis.utils';

export default class MessageController {
    protected request: Request;
    protected response: Response;
    protected next: NextFunction;
    protected messageRepo: MessageRepository;
    protected userRepo: UserRepository;

    constructor(request: Request, response: Response, next: NextFunction) {
        this.request = request;
        this.response = response;
        this.next = next;
        this.messageRepo = new MessageRepository();
        this.userRepo = new UserRepository();
    }

    private async handleErrors(methodName: string, error: Error): Promise<Response> {
        LoggerUtils.error(`Error during ${methodName}: ${error.message}`);
        return this.response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: `An error occurred during ${methodName}.`,
        });
    }

    private async getCacheMessages(senderId: string): Promise<Message[]> {
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

    private async cacheMessages(senderId: string, messages: Message[]): Promise<void> {
        const cacheKey = `messages:${senderId}`;
        await client.set(cacheKey, JSON.stringify(messages)); // cache the messages
    }

    private async updateStatusForReceivedMessages(messages: Message[], senderId: string): Promise<void> {
        const updatePromises = messages
            .filter((message) => message.receiverId === senderId)
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

            // Create the message without specifying a community
            const message = await this.messageRepo.createMessage({
                body: validatedInput.body,
                senderId: validatedInput.senderId,
                receiverId: validatedInput.receiverId,
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
            const cachedMessages = await this.getCacheMessages(cacheKey);

            if (cachedMessages.length > 0) {
                return this.response.status(HttpStatusCodes.OK).json({
                    message: 'Messages retrieved from cache.',
                    data: cachedMessages,
                });
            }

            // If not in cache, fetch messages from the database
            const messages = await this.messageRepo.getMessagesBySenderId({ receiverId: params.senderId });

            // Update message status and cache the messages
            await this.updateStatusForReceivedMessages(messages, params.senderId);
            await this.cacheMessages(cacheKey, messages);

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
}
