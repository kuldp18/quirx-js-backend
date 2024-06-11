import { Comment } from '../models/comment.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { isValidObjectId } from 'mongoose';
import { Video } from '../models/video.model.js';

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { content } = req.body;
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, 'Video ID is required');
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID');
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, 'Video not found');
  }

  if (!content) {
    throw new ApiError(400, 'Comment cannot be empty');
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(500, 'Something went wrong while adding comment');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
