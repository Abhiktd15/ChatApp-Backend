import mongoose from "mongoose";
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/user.model.js";
import {v4 as uuid} from 'uuid'
import { getBase64 } from "../lib/helper.js";

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

const emitEvent = (req,event,users,data) => {
    console.log("emmitting event",event);
}

const uploadFilesToCloudinary = async (files = []) => {
        const uploadPromises = files.map((file) => {
            return new Promise((resolve, reject) => {
                cloudinary.uploader.upload(
                getBase64(file),
                {
                    resource_type: "auto",
                    public_id: uuid(),
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
                );
            });
            });

    try {
    const results = await Promise.all(uploadPromises);
    const formattedResults = results.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
    }));
    return formattedResults;
    } catch (err) {
    throw new Error("Error uploading files to cloudinary");
    }
    };

const deleteFilesFromCloudinary = async(public_ids) => {
    //Delete files from cloudinary
}




export {connectDB,sendToken,cookieOptions,emitEvent,deleteFilesFromCloudinary,uploadFilesToCloudinary}