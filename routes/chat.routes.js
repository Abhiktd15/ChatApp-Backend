import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { newGroupChat } from "../controllers/chat.controller.js";

const app = express.Router();

//After her user must be logged in to access the routes
app.use(isAuthenticated);//This ensures below this line every route isAuthenticated 

app.post('/new',newGroupChat);

export default app;