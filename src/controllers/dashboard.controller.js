import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';
import { Subscription } from '../models/subscription.model.js';
import { Like } from '../models/like.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }

  const videos = await Video.find({ owner: user._id });

  if (!videos) {
    throw new ApiError(404, 'No videos found for this channel');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, videos, 'Channel videos retrieved successfully')
    );
});

export { getChannelStats, getChannelVideos };
