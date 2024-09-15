import mongoose, { model, models, Schema } from "mongoose";

const schema = new Schema({
    content:String,
    attachments:[
        {
            public_id:{
                type:String,
                required:true,
            },
            url:{
                type:String,
                required:true,
            }
        }
    ],
    sender:{
        type:mongoose.Types.ObjectId,
        ref: 'User',
        required:true
    },
    chat:{
        type:mongoose.Types.ObjectId,
        ref: 'Chat',
        required:true
    },
},{timestamps:true})

export const Message = mongoose.models.Message || model('Message',schema);
