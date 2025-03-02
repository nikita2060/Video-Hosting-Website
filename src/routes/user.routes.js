import {Router} from "express";
import {logoutUser,loginUser,registerUser} from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"

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

export default router