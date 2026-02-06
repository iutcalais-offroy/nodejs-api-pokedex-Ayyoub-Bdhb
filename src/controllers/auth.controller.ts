import { Request, Response } from "express";
import { signIn, signUp } from "../services/auth.service";  
import { HttpError } from "../errors/HttpError";

export async function signUpController(req: Request, res: Response) {
    try {
        const result = await signUp(req.body);
        return res.status(201).json(result);
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }

        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function signInController(req: Request, res: Response) {
    try {
        const result = await signIn(req.body);
        return res.status(200).json(result);
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.status).json({ error: error.message });
        }

        return res.status(500).json({ error: "Erreur serveur" });
    }
}
