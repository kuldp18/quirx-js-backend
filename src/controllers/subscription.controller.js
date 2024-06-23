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
  // check if user is logged in
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'Unauthorized user or user not found');
  }
  // get channel id from request params
  const { channelId } = req.params;
  // validate channel id
  if (!channelId) {
    throw new ApiError(400, 'Channel ID is required');
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, 'Invalid Channel ID');
  }
  // find all subscribers of the channel
  const subscribers = await Subscription.find({ channel: channelId });

  if (!subscribers) {
    throw new ApiError(
      404,
      'No subscribers found for this channel or error while fetching subscribers'
    );
  }
  // return the list of subscribers
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, 'Subscribers fetched successfully')
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  // check if user is logged in
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'Unauthorized user or user not found');
  }
  // get subscriber id from request params
  const { subscriberId } = req.params;
  // validate subscriber id
  if (!subscriberId) {
    throw new ApiError(400, 'Subscriber ID is required');
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, 'Invalid Subscriber ID');
  }
  // find all channels subscribed by the user
  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  });

  if (!subscribedChannels) {
    throw new ApiError(
      404,
      'No subscribed channels found for this user or error while fetching subscribed channels'
    );
  }
  // return the list of channels
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        'Subscribed channels fetched successfully'
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
