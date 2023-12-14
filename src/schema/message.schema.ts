import { object, string, ref } from 'yup';

export const createMessageSchema = object({
    body: string().required('Content is required.').min(1, 'Content must be at least 1 character long.'),
    senderId: string().required('Sender is required.'),
});