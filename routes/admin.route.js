import express, { application } from 'express';
import { allChats, allMessages, getAllUsers } from '../controllers/admin.controller.js';

const app = express();

app.get('/')
app.get('/verify')
app.get('/logout')

app.get('/users',getAllUsers)
app.get('/chats',allChats)
app.get('/messages',allMessages)
app.get('/stats')


export default  app;


