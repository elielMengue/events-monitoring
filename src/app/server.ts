
import express from "express";
import loadUserModule from "../features/users";
import loadEventModule from "../features/events";
import loadFavoriteModule from "../features/favorites"; 
import { AuthService } from "../lib/port.auth"; 
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const JWT_SECRET = process.env.JWT_SECRET; 
const authService = new AuthService(JWT_SECRET as string);

app.use("/users", loadUserModule());
app.use("/events", loadEventModule(authService)); 
app.use("/favorites", loadFavoriteModule(authService)); 


export default app;

