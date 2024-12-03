import { json } from "express";
import { ALERT, NEW_ATTACHMENTS, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js"
import {Chat} from '../models/chat.model.js'
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { deleteFilesFromCloudinary, emitEvent } from "../utils/features.js";
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
            members: members.reduce((prev,curr) => {
                if(curr._id.toString() !== req.user.toString()){
                    prev.push(curr._id);
                }
                return prev;
            },[])
        }
    })
    
    
    return res.status(200).json({
        success: true,
        chats: transformedChats
    });
});

const getMyGroups = TryCatch(async (req,res,next) => {
    const chats = await Chat.find({
        members: req.user,
        groupChat: true,
        creator: req.user
    }).populate(
        "members",
        "name avatar"
    );

    const groups = chats.map(({members,_id,groupChat,name})  => (
        {
            _id,
            groupChat,
            name,
            avatar: members.slice(0,3).map(({avatar}) => avatar.url),
        }
    ))  
    
    
    return res.status(200).json({
        success: true,
        groups
    });
})

const addMembers = TryCatch(async (req,res,next) => {
    const {chatId,members} = req.body;
    if(!members || members.length < 1)
    {
        return next(new ErrorHandler("Please provide members to add ",400));
    }
    const chat = await Chat.findById(chatId);

    if(!chat){
        return next(new ErrorHandler("Chat not found",404));
    }
    if(!chat.groupChat){
        return next(new ErrorHandler("This is not a group chat",400));
    }
    if(chat.creator.toString() !== req.user.toString()){
        return next(new ErrorHandler("Only the creator can add members to a group chat",403));
    }
    
    const allNewMembersPromise = members.map( (i) => User.findById(i,"name") );

    const allNewMembers = await Promise.all(allNewMembersPromise);
    
    const uniqueMembers = allNewMembers
                            .filter((i) => !chat.members.includes(i._id.toString()))
                            .map((i) => i._id);

    chat.members.push(...uniqueMembers);



    if(chat.members.length > 100){
        return next(new ErrorHandler("Group Members limit reached",400));
    }
    
    await chat.save();

    const allUsersName = allNewMembers.map((i) => i.name).join(',');
    
    emitEvent(
        req,
        ALERT,
        chat.members,
        `${allUsersName} has been added to the group `
    );
    emitEvent(req,REFETCH_CHATS,chat.members);

    return res.status(200).json({
        success: true,
        message : "Members added successfully"
    });
})

const removeMembers = TryCatch(async (req,res,next) => {
    const {userId,chatId} = req.body;

    const [chat,userThatWillbeRemoved] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId,"name")
    ])

    if(!chat){
        return next(new ErrorHandler("Chat not found",404));
    }
    if(!chat.groupChat){
        return next(new ErrorHandler("This is not a group chat",400));
    }
    if(chat.creator.toString() !== req.user.toString()){
        return next(new ErrorHandler("Only the creator can remove members from a group chat",403));
    }

    if(chat.members.length<=3){
        return next(new ErrorHandler("Group must have at least 3 members",400));
    }

    chat.members = chat.members.filter(
        (member) => member.toString() !== userId.toString()
    )

    await chat.save();
    emitEvent(
        req,
        ALERT,
        chat.members,
        `${userThatWillbeRemoved.name} has been removed from the group `
    )
    emitEvent(req,REFETCH_CHATS,chat.members)

    return res.status(200).json({
        success: true,
        message : "Member removed successfully"
    });
})

const leaveGroup = TryCatch(async (req,res,next) => {
    
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);



    if(!chat){
        return next(new ErrorHandler("Chat not found",404));
    }
    
    if(!chat.groupChat){
        return next(new ErrorHandler("This is not a group chat",400));
    }
    if(chat.members.length < 3){
        return next(new ErrorHandler("Group must have at least 3 members",400));
    }

    //other members except me
    const remainingMembers = chat.members.filter(
        (member) => member.toString()!== req.user.toString()
    )

    if(chat.creator.toString() === req.user.toString()){
        const randomElement = Math.floor(Math.random() * remainingMembers.length);
        const newCreator = remainingMembers[randomElement];
        chat.creator = newCreator;
    }

    chat.members = remainingMembers;

    await chat.save();

    const name = await User.findById(req.user,"name");
    console.log(name)

    emitEvent(
        req,
        ALERT,
        chat.members,
        `User ${name} has left the gorup`
    )

    return res.status(200).json({
        success: true,
        message : "Leaved the group successfully"
    });
} )

const sendAttachements = TryCatch(async (req,res,next) => {
    
    const {chatId} = req.body;

    const [chat,me] = await Promise.all([Chat.findById(chatId),User.findById(req.user,"name")]);

    if(!chat){
        return next(new ErrorHandler("Chat not found",404));
    }

    const files = req.files || [];
    if(files.length < 1) { 
        return next(new ErrorHandler("No files provided",400));
    }
    
    // Upload files here 
    const attachments = [];

    

    const messageForDB = {content : "",attachments,sender:me._id,chat:chatId};

    const messageForRealtime = {
        ...messageForDB,
        sender:{
            _id:me._id,
            name: me.name,
        }
    }

    const message = await Message.create(messageForDB);

    emitEvent(req,NEW_ATTACHMENTS,chat.members,{
        message:messageForRealtime,
        chatId,
    })

    emitEvent(req,NEW_MESSAGE_ALERT,chat.members,{
        chatId
    })

    return res.status(200).json({
        success: true,
        message
    });
})


const getChatDetails = TryCatch(async (req,res,next) => {
    if(req.query.populate){

        const chatId = req.params.id;

        const chat = await Chat.findById(chatId).populate("members", "name avatar").lean();

        if(!chat){
            return next(new ErrorHandler("Chat not found",404));
        }

        chat.members = chat.members.map(({_id,name,avatar}) => (
            {
                _id,
                name,
                avatar: avatar.url
            }
        ))

        return res.status(200).json({
            success: true,
            chat
        });
    }
    else{
        const chat = await Chat.findById(req.params.id);
        if(!chat){
            return next(new ErrorHandler("Chat not found",404));
        }

        return res.status(200).json({
            success: true,
            chat
        });
    }
})

const renameGroup = TryCatch(async (req,res,next) => {
    const chatId = req.params.id;
    const {name} = req.body;

    const chat = await Chat.findById(chatId);

    if(!chat){
        return next(new ErrorHandler("Chat not found",404));
    }
    if(!chat.groupChat){
        return next(new ErrorHandler("This is not a group chat",400));
    }
    if(chat.creator.toString()!== req.user.toString()){
        return next(new ErrorHandler("Only the creator can rename a group chat",403));
    }

    chat.name = name;
    await chat.save();
    emitEvent(req,REFETCH_CHATS,chat.members)

    return res.status(200).json({
        success: true,
        message : "Group renamed successfully"
    });
})

const deleteChat = TryCatch(async (req,res,next) => {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);

    if(!chat){
        return next(new ErrorHandler("Chat not found",404));
    }
    const members = chat.members;

    if(chat.groupChat && chat.creator.toString()!== req.user.toString()){
        return next(new ErrorHandler("Only the creator can delete a chat",403));
    }

    if(!chat.groupChat && !chat.members.includes(req.user.toString())){
        return next(new ErrorHandler("You are not a member of this chat",403));
    }

    // Here we have to delete all the messages as well as attachments from the cloudinary 
    const messagesWithAttachments = await Message.find({
        chat:chatId,
        attachments: { $exists: true ,$ne : []}
    });

    const public_id = [];
    messagesWithAttachments.forEach(({attachment}) => {
        attachment.forEach(({public_id}) => {
            public_id.push(public_id);
        });
    });


    await Promise.all([
        //delete files from cloudinary
        deleteFilesFromCloudinary(public_id),
        Chat.deleteOne(),
        Message.deleteMany({chat:chatId})
    ])

    emitEvent(req, REFETCH_CHATS,members)

    return res.status(200).json({
        success: true,
        message : "Chat deleted successfully"
    });

})

const getMessages = TryCatch(async (req,res,next) => {
    const chatId = req.params.id;

    const {page =1 } = req.query;
    const resultPerPage = 20;
    const skip = (page-1) * resultPerPage;

    const [messages,totolMessagesCount] = await Promise.all([
        Message.find({chat:chatId})
            .sort({createdAt: -1})
            .skip(skip)
            .limit(resultPerPage)
            .populate("sender","name avatar")
            .lean(),
            Message.countDocuments({chat:chatId})
    ])
    const totalPages = Math.ceil(totolMessagesCount/resultPerPage) || 0
    
    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages
    })
})

export {
    newGroupChat,
    getMyChats,
    getMyGroups,
    addMembers,
    removeMembers,
    leaveGroup,
    sendAttachements,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages,
}


