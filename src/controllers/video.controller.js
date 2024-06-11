import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.model.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';

const removeLocalFiles = (files) => {
  if (files) {
    files.forEach((file) => {
      if (!file) return;
      fs.unlinkSync(file);
    });
  }
};

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    removeLocalFiles([
      req.files?.videoFile[0]?.path,
      req.files?.thumbnail[0]?.path,
    ]);
    throw new ApiError(404, 'User not found or unauthorized');
  }

  const { title, description } = req.body;
  const videoFile =
    req.files && req.files.videoFile ? req.files?.videoFile[0]?.path : '';
  const thumbnail =
    req.files && req.files.thumbnail ? req.files?.thumbnail[0]?.path : '';

  if (
    [title, description, videoFile, thumbnail].some(
      (field) => field === undefined || field === ''
    )
  ) {
    removeLocalFiles([videoFile, thumbnail]);
    throw new ApiError(
      400,
      'Please provide all the required fields: title, description, video, thumbnail'
    );
  }

  // check if videoFile is a video
  const getExtension = (filename) => filename.split('.').pop();
  if (getExtension(videoFile) !== 'mp4') {
    removeLocalFiles([videoFile, thumbnail]);
    throw new ApiError(400, 'Please upload a video file in mp4 valid format');
  }

  // check if thumbnail is an image
  if (
    getExtension(thumbnail) !== 'jpg' &&
    getExtension(thumbnail) !== 'jpeg' &&
    getExtension(thumbnail) !== 'png'
  ) {
    removeLocalFiles([videoFile, thumbnail]);
    throw new ApiError(
      400,
      'Please upload a thumbnail in jpg, jpeg, or png format'
    );
  }

  const videoResponse = await uploadToCloudinary(videoFile);
  const thumbnailResponse = await uploadToCloudinary(thumbnail);

  const videoUrl = videoResponse?.url || null;
  const thumbnailUrl = thumbnailResponse?.url || null;
  const videoDuration = videoResponse?.duration || null;

  const video = await Video.create({
    videoFile: videoUrl || null,
    thumbnail: thumbnailUrl || null,
    owner: user._id,
    title,
    description,
    duration: Math.round(videoDuration),
    isPublished: true,
  });

  if (!video) {
    removeLocalFiles([videoFile, thumbnail]);
    throw new ApiError(500, 'Something went wrong while publishing the video');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, 'Video published successfully'));
});

const getVideoById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, 'Please provide a video id');
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, 'Video not found');
  }
  return res.status(200).json(new ApiResponse(200, video, 'Video found'));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
