import { Router } from "express";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/c/:channelName")
    .post(verifyJWT, toggleSubscription)
    .get(getUserChannelSubscribers);

router.route("/u/:userId")
    .get(getSubscribedChannels);

export default router;