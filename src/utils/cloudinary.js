import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try {
        if(!filePath) {
            throw new Error('File path is required for upload');
        }
        //upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' });
        console.log("response : ", response);

        // file had been uploaded successfully
        //console.log('File uploaded successfully to Cloudinary', response.url);
        fs.unlinkSync(filePath); // remove the file from local storage after upload
        return response;

    } catch (error) {
        fs.unlinkSync(filePath); // remove the file from local storage as the upload failed
        return null;
    }
}

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        if (!publicId) {
            throw new Error('Public ID is required for deletion');
        }

        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

        console.log("Deletion response:", result);

        if (result.result === 'ok') {
            return result;
        } else {
            console.error('Failed to delete file from Cloudinary:', result);
            return null;
        }
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return null;
    }
};



export {uploadOnCloudinary, deleteFromCloudinary};