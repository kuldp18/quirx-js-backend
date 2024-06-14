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
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) {
    throw new ApiError(400, 'Comment ID is required');
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (!content || content === comment.content) {
    throw new ApiError(400, 'Comment cannot be empty or same as previous');
  }

  // check if user is the owner of the comment
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to update this comment');
  }

  const newComment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );

  if (!newComment) {
    throw new ApiError(500, 'Something went wrong while updating your comment');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, 'Comment updated successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, 'Comment ID is required');
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'Invalid comment ID');
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to delete this comment');
  }

  try {
    await Comment.findByIdAndDelete(commentId);
  } catch (error) {
    console.log(`Error deleting comment: ${error}`);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          'Something went wrong while deleting comment'
        )
      );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: commentId,
      },
      'Comment deleted successfully'
    )
  );
});

export { getVideoComments, addComment, updateComment, deleteComment };
