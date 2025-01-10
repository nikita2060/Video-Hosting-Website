import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) => {
    //ask username ,email,password and confirm password and save  
    const{fullName,email,username,password} = req.body
    // console.log(fullname)
    //validation if any fields are empty or not
    if(!fullName || !email || !username || !password){
        throw new ApiError("Please fill all the fields")
    }

    //check if user already exists and again registering
    const existedUser = User.findOne({
        $or:[{email:email},{username:username}]
    })
    if(existedUser){
        throw new ApiError(409,"User already exists!")
    }
    //check for images,avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload  avatar image!")
    }

    //if available then upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar){
        throw new ApiError(500,"Something went wrong while uploading avatar image!")
    }

    //create a new user
    User.create({
        fullName,
        email,
        username:username.toLowerCase(),
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url,

    })
    //check user creation
    const createdUser = await User.findById(username._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while creating user!")
    }

    return res.status(201).json(new ApiResponse(201,createdUser,"User created successfully!"))
})

export { registerUser,}