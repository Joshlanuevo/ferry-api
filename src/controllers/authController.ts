import { Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import AuthService from "../services/authService";
import { getSecretKey, hash } from '../utils/sodium';
import admin from "../utils/firebase";
import { sendResponse } from "../utils/response";
import logger from '../utils/logger';
import { FirebaseCollections } from "../enums/FirebaseCollections";

class AuthController {
    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const user = await AuthService.validateUser(email, password);
            console.log("User returned by validateUser:", user);

            if (!user) {
                return sendResponse(req, res, false, 401, "Invalid credentials");
            }
            req.session.user = {
                id: user.id,
                agentId: user?.agency_id || "",
                user_name: user.username || "",
            };
            const token = AuthService.generateAuthToken(user);
            return sendResponse(req, res, true, 200, "User Authenticated", { token });
        } catch (error) {
            console.error("Login Error:", error);
            return sendResponse(req, res, false, 500, "Internal server error.");
        }
    }

    public async updateUserPassword(req: Request, res: Response): Promise<void> {
        try {
            const { userId, bcryptPassword } = req.body;
            if (!userId || !bcryptPassword) {
                return sendResponse(req, res, false, 400, "Missing userId or bcryptPassword");
            }
            const result = await AuthService.updateUserPassword(userId, bcryptPassword);
            if (!result) {
                return sendResponse(req, res, false, 500, "Error updating password");
            }
            return sendResponse(req, res, true, 200, "Password updated successfully");
        } catch (error) {
            console.error("Update password error:", error);
            return sendResponse(req, res, false, 500, "Internal server error.");
        }
    }
}

function stripUndefined(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
}

export default new AuthController();