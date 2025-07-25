import mongoose, { Schema, Types } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const VideoSchema = new Schema(

    {
        VideoFile: {
            type: String,
            required: true
        },

        thumbnail: {
            type: String,
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
        },

        duration: {
            type: Number,
            required: true
        },

        views: {
            type: Number,
            default: 0
        },

        isPublished: {
            type: Boolean,
            required: true,

        },

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true

        }
    },

    { timestamps: true }
)

VideoSchema.plugin(mongooseAggregatePaginate);

VideoSchema.index({ title: "text", description: "text" });



export const Video = mongoose.model("Video", VideoSchema)