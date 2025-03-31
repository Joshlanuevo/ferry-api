import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET_PROD;

if (!SECRET_KEY) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
}

const jwtUtil = {
    generateToken(data: object): string {
        return jwt.sign({ data }, SECRET_KEY, { expiresIn: '24h' });
    },

    verifyToken(token: string) {
        try {
            return jwt.verify(token, SECRET_KEY);
        } catch (error) {
            throw new Error("Invalid or expired token.");
        }
    }
}

export default jwtUtil;