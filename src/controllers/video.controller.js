import mongoose, { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.model.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  uploadToCloudinary,
  deleteCloudinaryImage,
  deleteCloudinaryVideo,
} from '../utils/cloudinary.js';
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
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }

  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  let pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        index: 'search-videos',
        text: {
          query: query,
          path: ['title', 'description'],
        },
      },
    });
  }

  if (!userId) {
    throw new ApiError(400, 'Please provide a user id');
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  pipeline.push({
    $match: {
      owner: new mongoose.Types.ObjectId(userId),
    },
  });

  // get only public videos
  pipeline.push({
    $match: {
      isPublished: true,
    },
  });

  //sortBy can be views, createdAt, duration
  //sortType can be ascending(-1) or descending(1)

  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === 'asc' ? 1 : -1,
      },
    });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  // get owner details
  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerDetails',
        pipeline: [
          {
            $project: {
              username: 1,
              'avatar.url': 1,
            },
          },
        ],
      },
    },
    {
      $unwind: '$ownerDetails',
    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const videos = await Video.aggregatePaginate(videoAggregate, options);

  if (!videos) {
    throw new ApiError(404, 'No videos found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, 'Videos retrieved successfully'));
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

const updateVideoDetails = asyncHandler(async (req, res) => {
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

  const { title, description } = req.body;

  if (!title && !description) {
    throw new ApiError(400, 'Please provide title or description to update');
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title: title || video.title,
      description: description || video.description,
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(
      500,
      'Something went wrong while updating the video details'
    );
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video updated'));
});

const updateVideoThumbnail = asyncHandler(async (req, res) => {
  // TODO: update video thumbnail
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

  const localThumbnail = req.file ? req.file?.path : '';
  if (!localThumbnail) {
    throw new ApiError(400, 'Please upload a thumbnail to update');
  }
  // check if thumbnail is an image
  const getExtension = (filename) => filename.split('.').pop();
  if (
    getExtension(localThumbnail) !== 'jpg' &&
    getExtension(localThumbnail) !== 'jpeg' &&
    getExtension(localThumbnail) !== 'png'
  ) {
    throw new ApiError(
      400,
      'Please upload a thumbnail in jpg, jpeg, or png format'
    );
  }

  // remove old thumbnail from cloudinary
  const deletedThumbnail = await deleteCloudinaryImage(video.thumbnail);
  if (!deletedThumbnail) {
    throw new ApiError(
      500,
      'Something went wrong while deleting the old thumbnail'
    );
  }
  // upload new thumbnail to cloudinary
  const newThumbnail = await uploadToCloudinary(localThumbnail);
  if (!newThumbnail) {
    throw new ApiError(
      500,
      'Something went wrong while updating the new thumbnail'
    );
  }

  const newThumbnailUrl = newThumbnail?.url;

  // update the video with the new thumbnail
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      thumbnail: newThumbnailUrl,
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(
      500,
      'Something went wrong while updating the video thumbnail in db'
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, 'Video thumbnail updated successfully')
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
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

  if (video.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to delete this video');
  }

  // delete video from cloudinary
  const deletedVideo = await deleteCloudinaryVideo(video.videoFile);
  const deletedThumbnail = await deleteCloudinaryImage(video.thumbnail);

  if (!deletedVideo || !deletedThumbnail) {
    throw new ApiError(
      500,
      'Something went wrong while deleting the video files from cloudinary'
    );
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Video deleted successfully'));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
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

  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId, isPublished: video.isPublished },
        'Video publish status updated'
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideoDetails,
  updateVideoThumbnail,
  deleteVideo,
  togglePublishStatus,
};
