import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Something went wrong while generating tokens');
  }
};

const renewAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded?._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or invalid');
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie('accessToken', accessToken, cookieOptions)
      .cookie('refreshToken', refreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          'Access token renewed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const removeLocalFiles = (files) => {
  if (files) {
    files.forEach((file) => {
      fs.unlinkSync(file);
    });
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, 'Email or username is required');
  }

  if (!password) {
    throw new ApiError(400, 'Password is required');
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, 'User does not exist');
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordVerified = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordVerified) {
    throw new ApiError(401, 'Invalid old password');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'You are not logged in');
  }
  // remove password and refresh token from user object
  req.user.password = undefined;
  req.user.refreshToken = undefined;
  return res.status(200).json(new ApiResponse(200, req.user, 'User found'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { username, email, fullName } = req.body;
  const user = await User.findById(req.user?._id).select(
    '-password -refreshToken'
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!username && !email && !fullName) {
    throw new ApiError(
      400,
      'At least one field (username or email or fullname) is required to update user'
    );
  }

  if (username && username !== user.username) {
    user.username = username;
  }
  if (email && email !== user.email) {
    user.email = email;
  }
  if (fullName && fullName !== user.fullName) {
    user.fullName = fullName;
  }

  await user.save({ validateBeforeSave: false });

  const newUser = await User.findById(req.body._id).select(
    '-password -refreshToken'
  );
  return res
    .status(200)
    .json(new ApiResponse(200, newUser, 'User updated successfully'));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localAvatarPath = req.file?.path;

  if (!localAvatarPath) {
    throw new ApiError(400, 'New avatar image is required');
  }

  const newAvatar = await uploadToCloudinary(localAvatarPath);

  if (!newAvatar.url) {
    throw new ApiError(500, 'Error while uploading new avatar image');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: newAvatar.url,
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(500, 'Something went wrong while updating avatar');
  }

  removeLocalFiles([localAvatarPath]);

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Avatar updated successfully'));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const localCoverImagePath = req.file?.path;

  if (!localCoverImagePath) {
    throw new ApiError(400, 'New cover image is required');
  }

  const newCoverImage = await uploadToCloudinary(localCoverImagePath);

  if (!newCoverImage.url) {
    throw new ApiError(500, 'Error while uploading new cover image');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: newCoverImage.url,
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(500, 'Something went wrong while updating cover image');
  }

  removeLocalFiles([localCoverImagePath]);

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Cover image updated successfully'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  renewAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
};
