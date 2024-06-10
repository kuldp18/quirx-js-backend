import mongoose, { isValidObjectId } from 'mongoose';
import { User } from '../models/user.model.js';
import { Subscription } from '../models/subscription.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toggleSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'Unauthorized user or user not found');
  }
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, 'Channel ID is required');
  }
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid Channel ID');
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Subscription removed successfully'));
  }

  const subscription = new Subscription({
    subscriber: user._id,
    channel: channelId,
  });

  await subscription.save();

  return res
    .status(201)
    .json(new ApiResponse(201, subscription, 'Subscription successful'));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
