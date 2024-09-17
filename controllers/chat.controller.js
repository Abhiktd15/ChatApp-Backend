import { ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js"
import {Chat} from '../models/chat.model.js'
import { emitEvent } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";

const newGroupChat = TryCatch(async (req,res,next) => {
    const {name,members} = req.body;
    if(members.length <2){
        return next(new ErrorHandler("At least two members are required to create a group chat",400));
    }
    const allMembers = [...members,req.user];

    await Chat.create({
        name,
        groupChat:true,
        creator: req.user,
        members: allMembers,
    }) 
    emitEvent(req,ALERT,allMembers,`Welcom to ${name} group `);
    emitEvent(req,REFETCH_CHATS,members);
    return res.status(201).json({
        success: true,
        message:"Group created successfully"
    })
})

const getMyChats = TryCatch(async (req,res,next) => {

    const chats = await Chat.find({members:req.user}).populate(
        "members",
        "name avatar"
    );
    const transformedChats = chats.map(({ _id, name, members, groupChat }) => {
        const otherMember = getOtherMember(members, req.user);
    
        return {
            _id,
            groupChat,
            avatar: groupChat
                ? members.slice(0, 3).map(({ avatar }) => avatar.url)
                : [otherMember.avatar.url],
            name: groupChat ? name : otherMember.name,
            members: members
        }
    })
    
    
    return res.status(200).json({
        success: true,
        chats: transformedChats
    });
});

export {newGroupChat,getMyChats}