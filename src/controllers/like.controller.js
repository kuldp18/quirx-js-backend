import mongoose, { isValidObjectId } from 'mongoose';
import { Like } from '../models/like.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { Video } from '../models/video.model.js';

const toggleVideoLike = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, 'Invalid video id');
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video id');
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  const like = await Like.findOne({ video: videoId, likedBy: user._id });

  if (!like) {
    const newLike = await Like.create({
      video: videoId,
      likedBy: user._id,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, newLike, 'Video liked successfully'));
  }

  // delete like
  await Like.findByIdAndDelete(like._id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Video like removed successfully'));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
