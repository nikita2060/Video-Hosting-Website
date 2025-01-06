import express from "express"
import cors from "cors"  //It stands for cross-origin-resource-sharing ,to safely allow or block requests from other websites, preventing unauthorized access to our data.
import cookieParser from "cookie-parser"
const app = express()


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true    
}))
//  configurations for parsing request body using express middlewares
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"})) //parses URL-encoded data (like form submissions). The extended: true option allows for complex objects and arrays to be encoded in the URL
app.use(express.static("public"))
app.use(cookieParser())

//routers import
import router from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",router)  //it will be seen as http://localhost:8000/api/v1/users/register


export {app}