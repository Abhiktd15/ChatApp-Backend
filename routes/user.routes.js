import express from "express";
import {singleAvatar} from '../middlewares/multer.js'
import {getMyProfile, login,logout,newUser, searchUser} from '../controllers/user.controller.js'
import { isAuthenticated } from "../middlewares/auth.js";
import { registerValidator,  validateHandler, validateLogin } from "../lib/validator.js";

const app = express.Router();

app.post("/new",singleAvatar,registerValidator(),validateHandler, newUser);
app.post("/login",validateLogin(),validateHandler, login);

//After her user must be logged in to access the routes
app.use(isAuthenticated);//This ensures below this line every route isAuthenticated 

app.get('/my',getMyProfile);
app.get('/logout',logout);
app.get('/search',searchUser);

export default app;