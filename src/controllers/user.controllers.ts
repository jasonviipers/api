import { Request, Response, NextFunction } from 'express';
import UserService from '../repositories/user.repository';
import { HttpStatusCodes } from '../utils/httpStatusCodes.utils';
import { LoggerUtils } from '../utils/logger.utils';

export default class UserController {
    protected request: Request;
    protected response: Response;
    protected next: NextFunction;
    protected userService: UserService;

    constructor(request: Request, response: Response, next: NextFunction) {
        this.request = request;
        this.response = response;
        this.next = next;
        this.userService = new UserService();
    }

    private async handleErrors(methodName: string, error: Error): Promise<Response> {
        LoggerUtils.error(`Error during ${methodName}: ${error.message}`);
        return await this.response.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
            message: `An error occurred during ${methodName}.`,
        });
    }

    async getMe() {
        try {
            const user = await this.userService.getUserById({ id: this.request.user.id });
            if (!user) {
                return this.response.status(HttpStatusCodes.NOT_FOUND).json({ message: 'User not found.' });
            }
            return this.response.status(HttpStatusCodes.OK).json({
                data: {
                    user,
                },
            });
        } catch (error) {
            return this.handleErrors('fetching user', error as Error);
        }
    }

    async getAllUsers() {
        try {
            const filterString = this.request.query.filter as string;
            const limit = parseInt(this.request.query.limit as string) || undefined;

            const filter = filterString ? JSON.parse(filterString) : undefined;

            const users = await this.userService.getAllUsers(filter, limit);
            return this.response.status(HttpStatusCodes.OK).json(users);
        } catch (error) {
            return this.handleErrors('fetching all users', error as Error);
        }
    }

    async getUserById() {
        try {
            const userId = this.request.params.id;
            const user = await this.userService.getUserById({ id: userId });
            if (!user) {
                return this.response.status(HttpStatusCodes.NOT_FOUND).json({ message: 'User not found.' });
            }
            return this.response.status(HttpStatusCodes.OK).json(user);
        } catch (error) {
            return this.handleErrors('fetching user by id', error as Error);
        }
    }

    async updateUser() {
        try {
            const userId = this.request.params.id;
            const userData = this.request.body;
            const updatedUser = await this.userService.updateUser({ id: userId }, userData);
            return this.response.status(HttpStatusCodes.OK).json(updatedUser);
        } catch (error) {
            return this.handleErrors('updating user', error as Error);
        }
    }

    async deleteUser() {
        try {
            const userId = this.request.params.id;
            const deletedUser = await this.userService.deleteUserById({ id: userId });
            return this.response.status(HttpStatusCodes.OK).json(deletedUser);
        } catch (error) {
            return this.handleErrors('deleting user', error as Error);
        }
    }
}
