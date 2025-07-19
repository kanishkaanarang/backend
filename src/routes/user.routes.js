

import { Router } from "express";
import registerUser from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

export default router;

// Define your user routes here
// Example: router.get('/users', userController.getAllUsers);