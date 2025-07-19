
import {upload} from "../middlewares/multer.middleware.js";
import { Router } from "express";
import registerUser from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

export default router;

// Define your user routes here
// Example: router.get('/users', userController.getAllUsers);