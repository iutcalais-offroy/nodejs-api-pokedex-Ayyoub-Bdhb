import { Router } from "express";
import { signInController, signUpController } from "../controllers/auth.controller";

const router = Router();

router.post("/sign-up", signUpController);
router.post("/sign-in", signInController);

export default router;
