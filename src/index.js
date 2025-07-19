import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: "./env"
});

connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
    app.on("error", (error) => {
        console.error("Error in Express app:", error);
        throw error;
    });
})
.catch((error) => {
    console.log("Error connecting to MongoDB:", error );
});




























/*

// this approach includes iffy, database try catch is used to handle errors in connecting to the database
& snce the database could be in another continent, we have used async await to wait for the connection to be established before starting the server

import express from "express";

const app = express();

;( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", () => {
            console.error("Error in Express app");
            throw error;
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
})()
    */