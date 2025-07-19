import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';

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


export default registerUser;