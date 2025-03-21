import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    owner: {  //References the User who posted the comment.
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    parent: {    //	If this comment is a reply, it references the parent comment.
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema);