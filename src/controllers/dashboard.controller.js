import { Video } from '../models/video.model.js';
import { Subscription } from '../models/subscription.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';

const getChannelStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }

  // get total subscribers
  const totalSubscribers = await Subscription.aggregate([
    {
      $match: { channel: user._id },
    },
    {
      $count: 'totalSubscribers',
    },
  ]);

  if (!totalSubscribers) {
    throw new ApiError(
      404,
      'No subscribers found for this channel or unknown error'
    );
  }

  // get video stats: total videos, total views, total likes
  const videoStats = await Video.aggregate([
    {
      $match: { owner: user._id },
    },

    // get total likes
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'likes',
      },
    },

    // get total stats

    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: { $size: '$likes' } },
      },
    },
  ]);

  if (!videoStats) {
    throw new ApiError(
      404,
      'No video stats found for this channel or unknown error'
    );
  }

  const channelStats = {
    channel_id: user._id,
    totalSubscribers: totalSubscribers[0].totalSubscribers || 0,
    totalVideos: videoStats[0].totalVideos || 0,
    totalViews: videoStats[0].totalViews || 0,
    totalLikes: videoStats[0].totalLikes || 0,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, 'Channel stats retrieved successfully')
    );
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
