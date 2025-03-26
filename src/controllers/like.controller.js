import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video unliked successfully"));
    }

    await Like.create({
        video: videoId,
        likedBy: req.user._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment unliked successfully"));
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment liked successfully"));
});

export {
    toggleVideoLike,
    toggleCommentLike
};