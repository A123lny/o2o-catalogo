import express from "express";
import { getEmailConfig, updateEmailConfig, testEmailSending } from "../controllers/integrations";
import { isAdmin, isAuthenticated } from "../middleware/auth";

const router = express.Router();

// Email configurations
router.get("/email", isAuthenticated, isAdmin, getEmailConfig);
router.patch("/email", isAuthenticated, isAdmin, updateEmailConfig);
router.post("/email/test", isAuthenticated, isAdmin, testEmailSending);

export default router;