import { Router } from "express";
import { userControllers } from "../controllers/user-controller.js";
import { body } from "express-validator"
import { authMiddleware } from "../middlewares/auth-middleware.js";
import { socketController } from "../controllers/socket-controller.js";
import { imageController } from "../controllers/image-controller.js";

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

router.post("/room", body("lastMessage").isLength({ min: 1 }), socketController.createRoom)
router.post("/login", userControllers.login)
router.post("/logout", userControllers.logout)
router.post("/upload", body("description").isLength({ min: 1, max: 700 }), imageController.uploadImage)
router.post("/subscribe", userControllers.subscribeUser)
router.post("/update_subscriptions", imageController.loadMore)

router.get("/posts/home", authMiddleware, imageController.getPosts)
router.get("/room/user", authMiddleware, socketController.getRoom)
router.get("/profile/:user", authMiddleware, userControllers.getProfile)
router.get("/messages/user", authMiddleware, socketController.getAllMessages)
router.get("/rooms", authMiddleware, socketController.getAllRooms)
router.get("/activate/:link", userControllers.activate)
router.get("/refresh", userControllers.refresh)
router.get("/users", authMiddleware, userControllers.getUsers)


export const routers = router