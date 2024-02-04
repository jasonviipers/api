import { createClient } from 'redis';
import 'dotenv/config';
import { LoggerUtils } from './logger.utils';

export const client = createClient({ url: process.env.REDIS_URL });
client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => LoggerUtils.info('Redis Client Connected'));
