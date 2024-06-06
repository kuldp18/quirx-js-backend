import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  if (
    [username, email, fullName, password].some(
      (field) => field === undefined || field === ''
    )
  ) {
    removeLocalFiles([
      req.files?.avatar[0]?.path,
      req.files?.coverImage[0]?.path,
    ]);
    throw new ApiError(400, 'All fields are required');
  }

  // validate email using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    removeLocalFiles([
      req.files?.avatar[0]?.path,
      req.files?.coverImage[0]?.path,
    ]);
    throw new ApiError(400, 'Invalid email format');
  }

  const doesUserExist = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (doesUserExist) {
    removeLocalFiles([
      req.files?.avatar[0]?.path,
      req.files?.coverImage[0]?.path,
    ]);
    throw new ApiError(409, 'User with this email or username already exists');
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    removeLocalFiles([req.files?.coverImage[0]?.path]);
    throw new ApiError(400, 'Avatar image is required');
  }

  // get extension from path
  const getExtension = (path) => path.split('.').pop();
  const avatarExtension = getExtension(avatarLocalPath);

  if (!['jpg', 'jpeg', 'png'].includes(avatarExtension)) {
    removeLocalFiles([avatarLocalPath, coverImageLocalPath]);
    throw new ApiError(400, 'Avatar image must be jpg, jpeg or png');
  }

  if (coverImageLocalPath) {
    const coverImageExtension = getExtension(coverImageLocalPath);
    if (!['jpg', 'jpeg', 'png'].includes(coverImageExtension)) {
      removeLocalFiles([avatarLocalPath, coverImageLocalPath]);

      throw new ApiError(400, 'Cover image must be jpg, jpeg or png');
    }
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadToCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    removeLocalFiles([avatarLocalPath, coverImageLocalPath]);

    throw new ApiError(500, 'Error while uploading avatar image');
  }

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  if (!createdUser) {
    removeLocalFiles([avatarLocalPath, coverImageLocalPath]);

    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

const removeLocalFiles = (files) => {
  if (files) {
    files.forEach((file) => {
      fs.unlinkSync(file);
    });
  }
};

export { registerUser };
