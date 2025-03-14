import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// A user can like either a video or a comment, not both
likeSchema.pre('save', function(next) {
    if (!this.video && !this.comment) {
        next(new Error('Like must be associated with either a video or a comment'));
    }
    if (this.video && this.comment) {
        next(new Error('Like cannot be associated with both video and comment'));
    }
    next();
});

export const Like = mongoose.model("Like", likeSchema);