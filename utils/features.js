import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js";
const cookieOptions = {
    maxAge:15*24*60*60*1000,
    sameSite:"none",
    secure:true,
    httpOnly:true
}

const connectDB = (uri) => {
    mongoose.connect(uri, {dbName: 'ChatApp'})
        .then(() => console.log(`Connected to MongoDB:`))
        .catch(err => console.error('Failed to connect to MongoDB', err));
};

const sendToken =  (res,user, code, message) => {
    const token =  jwt.sign({_id:user._id},process.env.JWT_SECRET);

    return res.status(code)
            .cookie("chatapp-token",token,cookieOptions)
            .json({
                    success:true,
                    message,
                })
}

export {connectDB,sendToken,cookieOptions}