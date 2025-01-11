// import mongoose from "mongoose";
// import {DB_NAME} from "./constants"
import express from "express"
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config(
{
    path:'./.env'
}
)




connectDB()
.then(()=>{

    app.on("error",(error)=>{
        console.log("Error is :",error)
        throw(error)
    })

    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running on port : ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.error("Database Connection Failed:",error)
}
)




// const app = express()

// (async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.error("Error:",error);
//             throw error
//         })

//         app.listen(process.env.PORT,(req,res)=>{
//             console.log(`App running on port ${process.env.PORT} `);
//         })
//     }
//     catch(error){
//         console.error("ERROR:",error);
//         throw error
//     }
// })()
