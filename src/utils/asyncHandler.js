// try catch method
// promise method can also be used
// this is used to handle async errors in express.js
// it will catch any error that occurs in the async function and pass it to the next middleware

const asyncHandler = (fn) => async (req,res,next) => {
    try {
        await fn(req, res, next); // making a wrapped function to handle async operations
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message || "Internal Server Error",});
    }
}



export default asyncHandler;