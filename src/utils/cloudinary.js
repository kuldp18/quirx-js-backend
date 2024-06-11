import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload file to cloudinary
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    // remove local file after uploading
    fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    // remove bad local file
    fs.unlinkSync(localFilePath);
    console.log(`Error while uploading file to cloudinary: ${error}`);
    return null;
  }
};

const deleteCloudinaryImage = async (url) => {
  try {
    const publicId = extractPublicId(url);
    const res = await cloudinary.uploader.destroy(publicId);
    return res;
  } catch (error) {
    console.log(`Error while deleting image from cloudinary: ${error}`);
    return null;
  }
};

const deleteCloudinaryVideo = async (url) => {
  try {
    const publicId = extractPublicId(url);
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video',
    });
    return res;
  } catch (error) {
    console.log(`Error while deleting video from cloudinary: ${error}`);
    return null;
  }
};

const extractPublicId = (url) => {
  const parts = url.split('/');
  const publicId = parts[parts.length - 1].split('.')[0];
  return publicId;
};

export { uploadToCloudinary, deleteCloudinaryImage, deleteCloudinaryVideo };
