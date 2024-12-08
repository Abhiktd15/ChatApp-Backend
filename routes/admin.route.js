import express, { application } from 'express';
import { adminLogin, adminLogout, allChats, allMessages, getAdminData, getAllUsers, getDashboardStats } from '../controllers/admin.controller.js';
import { adminLoginValidator, validateHandler } from '../lib/validator.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express();

app.post('/verify',adminLoginValidator(),validateHandler,adminLogin)
app.get('/logout',adminLogout)

//Only admin can access these routes
app.use(adminOnly)

app.get('/',getAdminData)
app.get('/users',getAllUsers)
app.get('/chats',allChats)
app.get('/messages',allMessages)
app.get('/stats',getDashboardStats)


export default  app;


