import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription.models.js";

const registerUser = asyncHandler(async (req,res) =>
{
    //ask username ,email,password and confirm password and save
    console.log("registerUser route hit");
    try {
        const{fullName,email,username,password} = req.body
        console.log("Request body:", req.body);
    
    //username is undefined (falsy)
    // email is "nikky@example.com" (truthy)

    // !username || !email => true || false => true
    // !(username || email) => !(undefined || "nikky@example.com") => !true => false so we cannot give this syntax as it wont throw error even if name is missing
        if(!(fullName && email && username && password)){    // or just write !fullName && !email .. which means if both are not available then only error will be thrown
          // but i need to throw error if any of the field is not available so i need to give && in between them if all are present then it will be false and error won't be thrown
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
    if(!(email && username && password)){
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

    return res
    .status(200)//res.status code is chainable. You can call other methods after it.
    .cookie("accessToken",accessToken,options)//options allows to set cookie properties like httpOnly,secure etc i.e. for security purpose
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse
        (200,
        {user:loggedInUser,accessToken,refreshToken},
        "User logged in successfully!")
    )
    //if password does not match then send error message
    //send response of successful login


})

const logoutUser = asyncHandler(async(req,res)=>{
    await user.findByIdAndUpdate(
        req.user._id,
        {
            $set:
            {
                refreshToken : undefined
            }
        },
            {
                new:true
            }

        )
        const options={
            httpOnly :true,
            secure : true
        }
    
        return res
        .statusCode(200)//res.status code is chainable. You can call other methods after it.
        .clearCookie("accessToken",options)//options allows to set cookie properties like httpOnly,secure etc i.e. for security purpose
        .clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"User logged out successfully!"))
    //remove refresh token from database
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    //check refresh token of database and user matches or not 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthenticated request!")
    }

    const decoded_token = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decoded_token?._id)

    if(!user){
        throw new ApiError(401,"Invalid refresh token!")
    }   
    //if user exists then generate new access token and refresh token

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Invalid refresh token!")
    }  
    
    const options={
        httpOnly :true,
        secure : true
    }
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()  

    res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)    
    .json(new ApiResponse(200,{accessToken,refreshToken},"Access token refreshed successfully!"))




})

const changePassword = asyncHandler(async(req,res)=>{
    //Take password as input
    const{oldpassword,newpassword,confirmpassword} = req.body

    if(newpassword !== confirmpassword){
        throw new ApiError(400,"Password donot match!")
    }
    
    //If user is asking for changing password it means user is logged in that means
    //  we have authenticated the user in auth middleware after authentication we have set req.user = user 
    // so we have user details in req.user and we will access it here
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404,"User not found!")
    }
    //check if old password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)
    if(!isPasswordCorrect){
        throw new ApiError("Invalid Password!")
    }
    user.password = newpassword
    await user.save({validateBeforeSave:false}) //since presave will be triggered only when we call save command
    
    res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully!"))


})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json( new ApiResponse(200,req.user,"User details fetched successfully!"))
})

const updateUserDetails = asyncHandler(async(req,res)=>{
    //For now only take name and email for updating
    const{fullname,email} = req.body
    if(!(fullname || email)){
        throw new ApiError(400,"Please fill all the fields!")
    }
    const user = User.findByIdAndUpdate(
        req.user._id,
        {
        $set:
            {
                fullName:fullname,
                email:email
            }
        },
        { new : true}
    ).select("-password") //new:true will return updated document


    return res
    .status(200)
    .json(new ApiResponse(200,user,"User details updated successfully!"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Please upload avatar image!")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath) //new avatar image uploaded to cloudinary and url is returned  

    if(!avatar.url){
        throw new ApiError(500,"Something went wrong while uploading avatar image!")
    }

    const user = User.findOneByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                avatar:avatar.url
            }
        },
        {new : true} //new:true will return updated document
    ).select("-password ")

    //TODO: Delete old avatar from cloudinary
    

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully!"))
}
)


const updateUserCoverImage = asyncHandler(async(req,res)=>{
        const coverImageLocalPath = req.file?.path
        if(!coverImageLocalPath){
            throw new ApiError(400,"Please upload cover image!")
        }
        const coverImage = await uploadOnCloudinary(coverImageLocalPath) //new avatar image uploaded to cloudinary and url is returned  
    
        if(!coverImage.url){
            throw new ApiError(500,"Something went wrong while uploading cover image!")
        }
    
        const user = User.findOneByIdAndUpdate(
            req.user?._id,
            {
                $set:
                {
                    coverImage:coverImage.url
                }
            },
            {new : true} //new:true will return updated document
        ).select("-password ")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Cover image updated successfully!"))




})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params
    if(!username?.trim()){  // trim is important because if user enters space instead of name then it will be considered as truthy value and db will look for spaces in database that is useless
        throw new ApiError(400,"Please provide username!")
    }

    const channel = User.aggregate([   //channel just stores the result temporarily which has subscribers array appended in users collection ,no change is made in db, it is just for fetching purpose
        {
            $match:{
                username : username?.toLowerCase()  //it is important to fetch _id . we can also directly compare id 
                                                    //since i need subscriber count of given username only so i am using match like where username="nikita" in sql
            },
            $lookup:{
                from:"subscriptions",
                localField:"_id",  // this id is got only when we match above username and _id of that user is passed here for comparision
                foreignField:"channel", //it takes channel from subsceiptions collection
                as:"subscribers" // it creates new array subscribers and stores the document that matches of subscription collection 
            },
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            },
            $addFields:{
                subscriberCount:{ $size:"$subscribers"},
                channelSubscribedCount:{ $size:"$subsribedTo" },
                isSubscribed:{
                    $cond:{  //MongoDB aggregation operator.its syntax is $cond: { if: <condition>, then: <true_value>, else: <false_value> }
                       if: { $in: [req.user?._id,"$subscribers.subscriber"]}, //req.user._id gives the user that is browsing channel with username in req.header above and 
                          // $in is used in subscribers array which has  { "subscriber": "", "channel": "" }as it is like in subscription model so if user
                          //subscribes channel then his id will be in subscriber field of this array as channel is only one so channel shouldnot be checked
                          then:true,
                          else:false    

                    }
                }
            },
            $project:{
                username:1,
                fullName:1,
                email:1,
                avatar:1,
                coverImage:1,
                subscriberCount:1,
                channelSubscribedCount:1,
            }
        }

    ])
    // console.log("Channel:",channel);

    if(!channel?.length){
        throw new ApiError(404,"Channel not found!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"Channel details fetched successfully!"))

})


export { registerUser,
    loginUser,
    logoutUser ,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}