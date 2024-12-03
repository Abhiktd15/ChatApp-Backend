import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMembers, renameGroup, sendAttachements } from "../controllers/chat.controller.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import { addMemberValidator, chatIdValidator, newGroupValidator, removeMemberValidtor, renameGroupValidator, sendAttachementsValidator, validateHandler } from "../lib/validator.js";

const app = express.Router();

//After her user must be logged in to access the routes
app.use(isAuthenticated);//This ensures below this line every route isAuthenticated 

app.post('/new',newGroupValidator(),validateHandler,newGroupChat);

app.get('/my',getMyChats);

app.get('/my/groups',getMyGroups);

app.put('/addMembers',addMemberValidator(),validateHandler,addMembers);

app.delete('/removeMembers',removeMemberValidtor(),validateHandler,removeMembers);

app.delete('/leave/:id',chatIdValidator(),validateHandler,leaveGroup);

//Send attachment
app.post('/message',attachmentsMulter,sendAttachementsValidator(),validateHandler,sendAttachements);

app.get('/message/:id',chatIdValidator(),validateHandler,getMessages);

app.route('/:id')
    .get(chatIdValidator(),validateHandler,getChatDetails)
    .put(renameGroupValidator(),validateHandler,renameGroup)
    .delete(chatIdValidator(),validateHandler,deleteChat);

export default app;