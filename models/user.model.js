import mongoose, { model, Schema } from "mongoose";
import bcryptjs from 'bcryptjs'

const schema = new Schema({
    name:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        select:false,
    },
    avatar:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        },
    }
},{timestamps:true})

schema.pre("save",async function(next){
    if(!this.isModified("password")) next();
    this.password = await bcryptjs.hash(this.password,10);
})

export const User = mongoose.models.User || model('User',schema);
