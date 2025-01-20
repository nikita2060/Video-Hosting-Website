import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) =>
{
    //ask username ,email,password and confirm password and save
    console.log("registerUser route hit");
    try {
        const{fullName,email,username,password} = req.body
        console.log("Request body:", req.body);
    // console.log(fullname)
    //validation if any fields are empty or not
        if(!fullName || !email || !username || !password){
            throw new ApiError("Please fill all the fields")
        }
     
        //check if user already exists and again registering
        const existedUser = await User.findOne({
            $or:[{email:email},{username:username}]
        })
        if(existedUser){
            console.log("User already exists:", existedUser);
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
        const newUser = await User.create({
            fullName,
            email,
            username:username.toLowerCase(),
            password,
            avatar:avatar.url,
            coverImage:coverImage?.url,

        })
        //check user creation
        const createdUser = await User.findById(newUser._id).select(
            "-password -refreshToken"
        )
        console.log("New user created:", newUser);

        if(!createdUser){
            console.error("Created user not found in database");
            throw new ApiError(500,"Something went wrong while creating user!")
        }

        return res.status(201).json(new ApiResponse(201,createdUser,"User created successfully!"))
    
} 
    catch (error) {
        console.log("Error while validating request body:", error);
    } 
})

const loginUser = asyncHandler(async(req,res)=>{
    //ask username or email and password 
    const {username,email,password} = req.body
    if(!email || !username || !password){
        throw new ApiError(400,"Please fill all the fields")
    }
    //check if user exits
    const user = await User.findOne({
        $or : [{email},{username}]
    })
    if(!user){
        throw new ApiError(404,"User doesnot exists!")
    }

    //if user exists then check if password is correct ,if doesnot exists send error message
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Password")

    }
    //if password matches then create a access token and refresh token  
    //declaring in global scope so that we can use variables outside try catch block
    let accessToken,refreshToken,loggedInUser;
    try
    {
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    }
    catch(error){
        console.error("Error while generating tokens:",error);
        throw new ApiError(500,"Something went wrong while generating tokens!")
    }
    //send it to user thorugh cookies
    const options={
        httpOnly :true,
        secure : true
    }

    res.
    statusCode(200).//res.status code is chainable. You can call other methods after it.
    cookie("accessToken",accessToken,options). //options allows to set cookie properties like httpOnly,secure etc i.e. for security purpose
    cookie("refreshToken",refreshToken,options).
    json(new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User logged in successfully!"))
    //if password does not match then send error message
    //send response of successful login


})

export { registerUser,loginUser }