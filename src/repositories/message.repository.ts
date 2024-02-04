import { Prisma } from '@prisma/client';
import { DatabaseClient } from '../database';

export default class MessageRepository {
    private prisma: DatabaseClient;

    constructor() {
        this.prisma = DatabaseClient.getInstance();
    }

    async createMessage(data: Prisma.MessageCreateInput) {
        return await this.prisma.message.create({
            data,
        });
    }

    async getAllMessages(filter?: Prisma.MessageWhereInput,limit?: number, select?: Prisma.MessageSelect) {
        return await this.prisma.message.findMany(
            {
                where: filter,
                take: limit,
                select,
            }
        );
    }

    async getMessage(where: Partial<Prisma.MessageWhereUniqueInput>, select?: Prisma.MessageSelect) {
        return await this.prisma.message.findFirst({
            where,
            select,
        });
    }

    async getMessageById(where: Prisma.MessageWhereUniqueInput, select?: Prisma.MessageSelect) {
        return await this.prisma.message.findUnique({
            where,
            select,
        });
    }

    async getMessagesBySenderId(where: Prisma.MessageWhereInput, select?: Prisma.MessageSelect) {
        return await this.prisma.message.findMany({
            where,
            select,
        });
    }

    async updateMessage(
        where: Prisma.MessageWhereUniqueInput,
        data: Prisma.MessageUpdateInput,
        select?: Prisma.MessageSelect,
    ) {
        return await this.prisma.message.update({
            where,
            data,
            select,
        });
    }

    async deleteMessageById(where: Prisma.MessageWhereUniqueInput) {
        return await this.prisma.message.delete({
            where,
        });
    }

    async deleteAllMessages() {
        return await this.prisma.message.deleteMany();
    }
}
