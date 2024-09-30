import { Router } from "express";
import { userControllers } from "../controllers/user-controller.js";
import { body } from "express-validator"

const router = new Router();

router.post("/registration",
  body("email").isEmail(),
  body("password").isLength({ min: 3, max: 32 }),
  userControllers.registration
)
router.post("/login", userControllers.login)
router.post("/logout", userControllers.logout)
router.get("/activate/:link", userControllers.activate)
router.get("/refresh", userControllers.refresh)
router.get("/users", userControllers.getUsers)


export const routers = router