import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';



const app = express();
// Middleware setup
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({
    limit: '16mb',
}));

app.use(express.urlencoded({
    limit: '16mb',
    extended: true,
}));

app.use(express.static('public'));

app.use(cookieParser());



// Import routes


app.use("/api/v1/users", userRoutes);


export default app;