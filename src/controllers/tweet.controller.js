import mongoose, { isValidObjectId } from 'mongoose';
import { Tweet } from '../models/tweet.model.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createTweet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }

  const tweet = await Tweet.create({
    owner: user._id,
    content,
  });

  if (!tweet) {
    throw new ApiError(500, 'Something went wrong while creating your tweet');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, 'Tweet created successfully'));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'Unauthorized user');
  }

  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid User ID');
  }

  const userTweets = await Tweet.find({ owner: userId });
  if (!userTweets) {
    throw new ApiError(404, 'User tweets not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userTweets, 'User tweets fetched successfully'));
});

const updateTweet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(400, 'Tweet ID is required');
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid Tweet ID');
  }

  if (!content) {
    throw new ApiError(400, 'Content is required');
  }

  const oldTweet = await Tweet.findById(tweetId);

  if (oldTweet.content === content) {
    throw new ApiError(400, 'Content is same as the previous one');
  }

  const newTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content },
    { new: true }
  );

  if (!newTweet) {
    throw new ApiError(500, 'Something went wrong while updating your tweet');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newTweet, 'Tweet updated successfully'));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
