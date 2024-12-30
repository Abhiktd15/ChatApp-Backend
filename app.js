import express from 'express';
import dotenv from 'dotenv';
import {createServer} from 'http'
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io';
import cors from 'cors'
import { v4 as uuid } from 'uuid';

import {v2 as cloudinary} from "cloudinary"

import userRoute from './routes/user.routes.js';
import chatRoute from './routes/chat.routes.js';
import adminRoute from './routes/admin.route.js';
import { createUser } from './seeders/user.seed.js';
import { createGroupChats, createMessagesInAChat, createSingleChats } from './seeders/chat.seed.js';
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from './constants/events.js';
import { getSockets } from './lib/helper.js';
import { Message } from './models/message.model.js';
import { corsOptions } from './constants/config.js';
import { socketAuthenticator } from './middlewares/auth.js';


dotenv.config({
    path: './.env'
});
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = 3000 || process.env.PORT;
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION"
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "674f16c7219fb20409489c0d"

const userSocketIDs = new Map();

connectDB(MONGODB_URI);

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_SECRET_KEY
})

const app = express();
const server = createServer(app)
const io = new Server(server,{cors:corsOptions})

//Using Middlewares here
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions))

app.use('/api/v1/user',userRoute);
app.use('/api/v1/chat',chatRoute);
app.use('/api/v1/admin',adminRoute);


app.get('/', function(req, res){
    res.send("This is a test")
});


io.use((socket,next) => {
    cookieParser()(socket.request,socket.request.res,async (err) => {
        await socketAuthenticator(err,socket,next)
    })

})
//SOCKET IO
io.on("connection" ,(socket) => {
    const user = socket.user
    userSocketIDs.set(user._id.toString(),socket.id)

    socket.on(NEW_MESSAGE,async ({chatId,members,message}) => {
        const messageForRealTime = {
            content: message,
            _id:uuid(),
            sender:{
                _id:user._id,
                name:user.name
            },
            chat: chatId,
            createdAt: new Date().toISOString(),
        }
        const messageForDB = {
            content: message,
            sender: user._id,
            chat:chatId,        
        }

        const membersSocket  = getSockets(members)
        io.to(membersSocket).emit(NEW_MESSAGE,{
            chatId,
            message:messageForRealTime
        })
        io.to(membersSocket).emit(NEW_MESSAGE_ALERT,{chatId});

        try {
            await  Message.create(messageForDB)
            console.log("messgae created")
        } catch (error) {
            console.error(error)
        }

        console.log("New Message",messageForRealTime)
        console.log("New Message",messageForDB)
    })

    socket.on("disconnect" ,() =>{
        console.log("A user disconnected ")
        userSocketIDs.delete(user._id.toString());
    })
})


app.use(errorMiddleware);
server.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} Mode`);
});


export {
    envMode,
    adminSecretKey,
    userSocketIDs
}