import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMembers, renameGroup, sendAttachements } from "../controllers/chat.controller.js";
import { attachmentsMulter } from "../middlewares/multer.js";

const app = express.Router();

//After her user must be logged in to access the routes
app.use(isAuthenticated);//This ensures below this line every route isAuthenticated 

app.post('/new',newGroupChat);

app.get('/my',getMyChats);

app.get('/my/groups',getMyGroups);

app.put('/addMembers',addMembers);

app.delete('/removeMembers',removeMembers);

app.delete('/leave/:id',leaveGroup);

//Send attachment
app.post('/message',attachmentsMulter,sendAttachements);

app.get('/message/:id',getMessages);

app.route('/:id').get(getChatDetails).put(renameGroup).delete(deleteChat);

export default app;