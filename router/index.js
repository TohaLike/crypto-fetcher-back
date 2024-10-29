import { Router } from "express";
import { userControllers } from "../controllers/user-controller.js";
import { body } from "express-validator"
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { socketController } from "../controllers/socket-controller.js";

const router = new Router();

router.post("/registration",
  body("name").isLength({ min: 2, max: 55 }),
  body("email").isEmail(),
  body("password").isLength({ min: 3, max: 32 }),
  body("day").isLength({ min: 1 }),
  body("month").isLength({ min: 1 }),
  body("year").isLength({ min: 1 }),
  userControllers.registration
)

router.post("/room", socketController.createRoom)
router.post("/login", userControllers.login)
router.post("/logout", userControllers.logout)

router.get("/messages", socketController.getMessages)
router.get("/rooms", authMiddleware, socketController.getAllRooms)
router.get("/activate/:link", userControllers.activate)
router.get("/refresh", userControllers.refresh)
router.get("/users", authMiddleware, userControllers.getUsers)


export const routers = router