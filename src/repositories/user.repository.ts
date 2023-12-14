import { Prisma, User } from '@prisma/client';
import { DatabaseClient } from '../database';

export default class UserRepository {
    private prisma: DatabaseClient;

    constructor() {
        this.prisma = DatabaseClient.getInstance();
    }

    async createUser(data: Prisma.UserCreateInput) {
        return await this.prisma.user.create({
            data,
        });
    }

    async getAllUsers() {
        return await this.prisma.user.findMany();
    }

    async getUser(where: Partial<Prisma.UserWhereUniqueInput>, select?: Prisma.UserSelect) {
        return await this.prisma.user.findFirst({
            where,
            select,
        });
    }

    async getUserByResetToken(where: Prisma.UserWhereUniqueInput, select?: Prisma.UserSelect) {
        return await this.prisma.user.findUnique({
            where,
            select,
        });
    }

    async getUserById(where: Prisma.UserWhereUniqueInput, select?: Prisma.UserSelect) {
        return await this.prisma.user.findUnique({
            where,
            select,
        });
    }

    async getUserByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    async getUserByVerifyToken(where: Prisma.UserWhereUniqueInput, select?: Prisma.UserSelect) {
        return await this.prisma.user.findUnique({
            where,
            select,
        });
    }

    async updateUser(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput, select?: Prisma.UserSelect) {
        return await this.prisma.user.update({
            where,
            data,
            select,
        });
    }

    async deleteUserById(where: Prisma.UserWhereUniqueInput) {
        return await this.prisma.user.delete({
            where,
        });
    }

    async updateUserToken(id: string, data: { resetToken?: string | null; resetExpires?: Date | null }) {
        return await this.prisma.user.update({
            where: { id },
            data,
        });
    }
}
