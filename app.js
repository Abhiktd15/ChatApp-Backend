import express from 'express';
import dotenv from 'dotenv';

import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import cookieParser from 'cookie-parser'

import userRoute from './routes/user.routes.js';
import chatRoute from './routes/chat.routes.js';
import { createUser } from './seeders/user.seed.js';
import { createGroupChats, createMessagesInAChat } from './seeders/chat.seed.js';


dotenv.config({
    path: './.env'
});
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = 3000 || process.env.PORT;

connectDB(MONGODB_URI);

// createUser(10);
// createGroupChats(10);
// createMessagesInAChat("674f16c7219fb20409489c0d",50)


const app = express();

//Using Middlewares here
app.use(express.json());
app.use(cookieParser());

app.use('/user',userRoute);
app.use('/chat',chatRoute);


app.get('/', function(req, res){
    res.send("This is a test")
});


app.use(errorMiddleware);
app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
});