import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { cookieOptions, sendToken } from "../utils/features.js";
import bcryptjs from 'bcryptjs'
import { ErrorHandler } from "../utils/utility.js";
import { errorMiddleware, TryCatch } from "../middlewares/error.js";

//create a new user and save it to the database and save in the cookie
const newUser = async (req, res) => {
    const {name,username,password,bio} = req.body;

    const avatar = {
        public_id: "public_id",
        url: "url",
    };
    
    const user = await  User.create({
        name,
        username,
        password,
        bio,
        avatar
    });
    
    sendToken(res,user,201,"User Created");    
};

// login user

const login = TryCatch(async (req, res, next) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select("+password");

    if (!user) 
        return next(new ErrorHandler("Invalid Username or Password",404));
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch)
        return next(new ErrorHandler("Invalid Username or Password", 404));

    sendToken(res, user, 200, `Welcome Back, ${user.name}`);
});

//find profile 
const getMyProfile = TryCatch(async (req,res) => {
    const user = await User.findById(req.user);

    res.status(200).json({
        status: true,
        user
    })
})
const logout = TryCatch(async (req,res) => {
    //remove saved cookie 
    return res
    .status(200)
    .cookie("chatapp-token","",{...cookieOptions,maxAge:0})
    .json({
        success: true,
        message: "Logged out successfully",
    });
});

const searchUser = TryCatch(async (req,res) => {
    
    const {name} = req.query;
    const myChats = await Chat.find({
        groupChat: false
    })
    

    return res
    .status(200)
    .json({
        success: true,
        message: name,
    });
});

export { newUser, login, getMyProfile,logout,searchUser };
