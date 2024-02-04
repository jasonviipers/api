import { NextFunction, Request, Response } from 'express';
import AuthController from '../controllers/auth.controllers';
import AuthMiddleware from '../middlewares/AuthMiddleware';
import MessageController from '../controllers/message.controllers';
import UserController from '../controllers/user.controllers';

export default [
    // Auth
    {
        method: 'post',
        path: '/auth/login',
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new AuthController(req, res, next).login();
        },
    },
    {
        method: 'post',
        path: '/auth/register',
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new AuthController(req, res, next).register();
        },
    },
    {
        method: 'get',
        path: '/auth/verify-email/:verifyToken',
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new AuthController(req, res, next).verifyEmail();
        },
    },
    {
        method: 'post',
        path: '/auth/forgot-password',
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new AuthController(req, res, next).forgotPassword();
        },
    },
    {
        method: 'post',
        path: '/auth/reset-password/:resetToken',
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new AuthController(req, res, next).resetPassword();
        },
    },
    // Messages
    {
        method: 'post',
        path: '/messages',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new MessageController(req, res, next).createMessage();
        },
    },
    {
        method: 'get',
        path: '/messages',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new MessageController(req, res, next).getAllMessages();
        },
    },
    {
        method: 'get',
        path: '/messages/:id',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new MessageController(req, res, next).getMessage();
        },
    },
    {
        method: 'get',
        path: '/messages/sender/:id',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new MessageController(req, res, next).getMessagesBySenderId();
        },
    },
    {
        method: 'put',
        path: '/messages/:id',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new MessageController(req, res, next).updateMessage();
        },
    },
    {
        method: 'delete',
        path: '/messages/:id',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new MessageController(req, res, next).deleteMessage();
        },
    },

    // Users
    {
        method: 'get',
        path: '/users/me',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new UserController(req, res, next).getMe();
        },
    },
    {
        method: 'get',
        path: '/users',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new UserController(req, res, next).getAllUsers();
        },
    },
    {
        method: 'get',
        path: '/users/:id',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new UserController(req, res, next).getUserById();
        },
    },
    {
        method: 'put',
        path: '/users/:id',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new UserController(req, res, next).updateUser();
        },
    },
    {
        method: 'delete',
        path: '/users/:id',
        middleware: [AuthMiddleware.authenticate, AuthMiddleware.authorize(['USER', 'ADMIN'])],
        controller: (req: Request, res: Response, next: NextFunction) => {
            return new UserController(req, res, next).deleteUser();
        },
    },
];
