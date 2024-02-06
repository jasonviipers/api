import crypto from 'crypto';

export default class Encryptor {
    private readonly algorithm: string;
    private readonly key: string;
    private readonly iv: string;

    constructor(key: string, iv: string) {
        this.algorithm = 'aes-256-cbc'; // AES encryption algorithm with 256-bit key in CBC mode
        this.key = key; // 32 bytes (256 bits) key for AES-256 encryption
        this.iv = iv; // 16 bytes (128 bits) initialization vector for AES-256 encryption
    }

    /**
     * Encrypts the given plaintext message.
     * @param plaintext The message to encrypt.
     * @returns The encrypted message as a base64-encoded string.
     */
    encrypt(plaintext: string): string {
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), Buffer.from(this.iv, 'hex'));
        let encrypted = cipher.update(plaintext, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    /**
     * Decrypts the given encrypted message.
     * @param encryptedText The encrypted message as a base64-encoded string.
     * @returns The decrypted plaintext message.
     */
    decrypt(encryptedText: string): string {
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), Buffer.from(this.iv, 'hex'));
        let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
