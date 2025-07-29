import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'your-secret-key-change-this-in-production';

// Ensure the key is 32 bytes for AES-256
const getKey = (): Buffer => {
    return crypto.createHash('sha256').update(SECRET_KEY).digest();
};

export async function encryptToken(token: string): Promise<string> {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

        let encrypted = cipher.update(token, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Combine iv + encrypted data
        const result = iv.toString('hex') + ':' + encrypted;
        return result;
    } catch (error) {
        console.error('Error encrypting token:', error);
        throw new Error('Failed to encrypt token');
    }
}

export async function decryptToken(encryptedToken: string): Promise<string> {
    try {
        // Handle case where token might not be encrypted (for backward compatibility)
        if (!encryptedToken.includes(':')) {
            console.warn('Token appears to not be encrypted, returning as-is');
            return encryptedToken;
        }

        const parts = encryptedToken.split(':');
        if (parts.length !== 2) {
            console.warn('Invalid encrypted token format, returning as-is');
            return encryptedToken;
        }

        const [ivHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Error decrypting token:', error);
        // For backward compatibility, return the token as-is if decryption fails
        console.warn('Decryption failed, returning token as-is');
        return encryptedToken;
    }
}