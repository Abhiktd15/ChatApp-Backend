import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { Request } from "../models/request.model.js";
import { cookieOptions, emitEvent, sendToken } from "../utils/features.js";
import bcryptjs from 'bcryptjs'
import { ErrorHandler } from "../utils/utility.js";
import { errorMiddleware, TryCatch } from "../middlewares/error.js";
import { NEW_REQUEST } from "../constants/events.js";

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
    
    const {name = ""} = req.query;
    const myChats = await Chat.find({
        groupChat: false,
        members:req.user
    })

    //All users from myChats including me
    const allUsersFromMyChat = myChats.map((chat) => chat.members).flat();
    
    //All users except myself and myFriends
    const allUsersExceptMeAndFriends = await User.find({
        _id:{$nin: allUsersFromMyChat},
        name: {$regex:name,$options:"i"}
    })

    const users = allUsersExceptMeAndFriends.map(({_id,name,avatar}) => ({
        _id,
        name,
        avatar:avatar.url
    }))

    return res
    .status(200)
    .json({
        success: true,
        users,
    });
});

const sendFriendRequest = TryCatch(async (req,res,next) => {
    const {userId} = req.body;

    const request = await Request.findOne({
        $or:[
            {sender:req.user,receiver:userId},
            {sender:userId,receiver:req.user}
        ]
    })
    
    if(request) 
        return next(new ErrorHandler("Friend Request already sent",400));

    await Request.create({
        sender: req.user,
        receiver: userId
    })

    emitEvent(req,NEW_REQUEST,[userId],"request");

    return res
    .status(200)
    .cookie("chatapp-token","",{...cookieOptions,maxAge:0})
    .json({
        success: true,
        message: "Request Send Successfully",
    });
});

const acceptFriendRequest = TryCatch(async (req,res) => {
    const {requestId,accept} = req.body;

    const request = await Request.findById(requestId).populate("sender","name").populate("receiver","name")
    
    if(!request){
        return next(new ErrorHandler("Invalid Request",404));
    }

    if(request.receiver.toString() !== req.user.toString()){
        return next(new ErrorHandler("You are not authorized to accept this request",401));
    }

    if(!accept){
        await request.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Friend Request Rejected"
        })
    }


    //notify all the members
    const members = [request.sender._id,request.receiver._id]

    await Promise.all([
        Chat.create({
            members,
            name:`${request.sender.name} - ${request.receiver.name}`
        }),
        request.deleteOne()
    ])

    emitEvent(req,REFETCH_CHATS,members);

    return res
    .status(200)
    .json({
        success: true,
        message:"Friend Request Accepted",
        senderId: request.sender._id
    });
})

const getAllNotifications = TryCatch(async (req,res) => {
    const requests = await Request.find({
        receiver : req.user
    }).populate("sender","name avatar")

    const allRequests = requests.map(({_id,sender}) => ({
        _id,
        senderId: sender._id,
        name: sender.name,
        avatar: sender.avatar.url
    }))

    return res.status(200).json({
        success: true,
        requests: allRequests,
    })

})


export { newUser, login, getMyProfile,logout,searchUser,sendFriendRequest,acceptFriendRequest ,getAllNotifications};
