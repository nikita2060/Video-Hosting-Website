import {Router} from "express";
import {logoutUser,loginUser,registerUser,refreshAccessToken, updateUserAvatar,changePassword,getCurrentUser,getUserChannelProfile,updateUserCoverImage,updateUserDetails} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import verifyJWT from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([

        {name:"avatar",maxCount:1},
        {name:"coverImage", maxCount:1}
    ])
    ,
    registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changePassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-profile").patch(verifyJWT,updateUserDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

export default router