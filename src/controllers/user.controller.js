import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import fs from "fs"

const generateAccessAndRefreshTokens = async (userId) =>
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {
            accessToken,
            refreshToken
        };

    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
    }
}

const registerUser = asyncHandler (async (req, res) => {
    // get user details from frontend

    //validate user details -> not empty, valid email, password length, etc.

    //check if user already exists in the database : username & email

    //check for images, avatar

    //upload image to cloudinary

    // create user object - creatw encrypt password

    // remove password & refresh token from response

    // if created then return success response 


    const {fullname, email, username, password} = req.body
    console.log("req.body : ", req.body);
    console.log("email : ", email);

    if(
        [
            fullname,
            email,
            username,
            password
        ].some((field) => field?.trim() === "" )
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists with this email or username");
    }

    console.log("req.files : ", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
let coverImage;

if (coverImageLocalPath) {
  coverImage = await uploadOnCloudinary(coverImageLocalPath);
}


    if(!avatar){
        throw new ApiError(500, "Avatar upload failed");
    }

const user = await User.create({
  fullname,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  username: username.toLowerCase(),
  password
});

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
);



    if(!createdUser){
        throw new ApiError(500, "User creation failed");
    }

    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User registered successfully"
        )
    )

});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email for login 
    //find the user in the database
    // check password
    // if true, access and refresh token send to user 
    //send through secure cookies 

    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken");

    if(!loggedInUser){
        throw new ApiError(500, "User login failed");
    }



    const options = {
        httpOnly: true,
        secure: true, // true if using https
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User loggged In Successfully"
        )
    )

  
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "user logged out")
    )
})

const refreshAccessToken = asyncHandler (async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unautharized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, " invalid refresh token ")
        }
    
        if(incomingRefreshToken !== refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, " invalid information ")
    }

    user.password= newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json( 
        new ApiResponse (200,req.user,"current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body

    if (!(fullname || email)) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment



    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // Step 1: Get the existing user and their current cover image
    const existingUser = await User.findById(req.user?._id);
    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }

    // Step 2: Upload the new cover image to Cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) {
        throw new ApiError(400, "Error while uploading cover image");
    }

    // Step 3: Extract public_id from the old image URL if it exists
    let oldImagePublicId = null;
    if (existingUser.coverImage) {
        const urlParts = existingUser.coverImage.split('/');
        const publicIdWithExt = urlParts.slice(urlParts.indexOf('upload') + 1).join('/');
        oldImagePublicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // remove extension
    }

    // Step 4: Update the user's cover image URL in the database
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");

    // Step 5: Delete the old image from Cloudinary if it existed
    if (oldImagePublicId) {
        await deleteFromCloudinary(oldImagePublicId, 'image');
    }

    // Step 6: Return response
    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

export { registerUser, 
    loginUser,
     logoutUser,
      refreshAccessToken,
       changeCurrentPassword,
        getCurrentUser,
         updateAccountDetails,
          updateUserAvatar,
           updateUserCoverImage
    };