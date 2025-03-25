import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!video) {
        throw new ApiError(500, "Error while uploading video");
    }
    if (!thumbnail) {
        throw new ApiError(500, "Error while uploading thumbnail");
    }

    const newVideo = await Video.create({
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        title,
        description,
        duration: video.duration
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newVideo, "Video uploaded successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const videos = await Video.aggregate([
        {
            $match: {
                isPublished: true
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ])
    .skip((page - 1) * limit)
    .limit(limit);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId).populate("owner", "fullName username avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Increment views
    video.views += 1;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});

export {
    uploadVideo,
    getAllVideos,
    getVideoById
};