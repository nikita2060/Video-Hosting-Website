import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { response } from "express";
import {User} from "../models/user.models";

const verifyJWT = asyncHandler(async(req,response,next) => {
    req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

    if(!token){
        throw new ApiError(401,"Unauthenticated request!")
    }

    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?.id).select("-password -refreshToken")

    if(!user){
        throw new ApiError(401,"Invalid access Token!")
    }
})