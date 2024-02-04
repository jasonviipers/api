import { object, string } from 'yup';

export const createMessageSchema = object({
    content: string().required('Content is required.').min(1, 'Content must be at least 1 character long.'),
    senderId: string().required('Sender is required.'),
});

export const getMessagesBySenderIdSchema = object({
    senderId: string().required('Sender is required.'),
});