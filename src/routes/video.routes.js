import { Router } from "express";
import {
    uploadVideo,
    getAllVideos,
    getVideoById
} from "../controllers/video.controller.js";
import {
    toggleVideoLike,
    toggleCommentLike
} from "../controllers/like.controller.js";
import {
    addComment,
    getVideoComments
} from "../controllers/comment.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            { name: "video", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        uploadVideo
    );

router.route("/:videoId")
    .get(getVideoById);

router.route("/:videoId/like")
    .post(verifyJWT, toggleVideoLike);

router.route("/:videoId/comments")
    .get(getVideoComments)
    .post(verifyJWT, addComment);

router.route("/comments/:commentId/like")
    .post(verifyJWT, toggleCommentLike);

export default router;