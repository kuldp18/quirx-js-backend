import mongoose, { isValidObjectId } from 'mongoose';
import { Playlist } from '../models/playlist.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';

const createPlaylist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, 'Name is required');
  }

  const playlist = await Playlist.create({
    name,
    description: description || '',
    owner: user._id,
  });

  if (!playlist) {
    throw new ApiError(500, 'Something went wrong while creating playlist');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, 'Playlist created successfully'));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const loggedInUser = await User.findById(req.user._id);
  if (!loggedInUser) {
    throw new ApiError(404, 'User not found or unauthorized');
  }
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user ID');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const userPlaylists = await Playlist.find({ owner: userId });
  if (!userPlaylists) {
    throw new ApiError(404, 'No playlists found for this user');
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPlaylists,
        'User playlists retrieved successfully'
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }

  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, 'Playlist ID is required');
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  return res.status(200).json(new ApiResponse(200, playlist, 'Playlist found'));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }

  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, 'Playlist ID is required');
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  // check if the user is the owner of the playlist
  if (playlist.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this playlist');
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(500, 'Something went wrong while deleting playlist');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, 'Playlist deleted successfully')
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found or unauthorized');
  }

  const { playlistId } = req.params;
  if (!playlistId) {
    throw new ApiError(400, 'Playlist ID is required');
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist ID');
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found');
  }

  const { name, description } = req.body;

  if (!name && !description) {
    throw new ApiError(
      400,
      'Name or description is required to update playlist'
    );
  }

  // check if the user is the owner of the playlist
  if (playlist.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this playlist');
  }

  const newPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name: name || playlist.name,
      description: description || playlist.description,
    },
    { new: true }
  );

  if (!newPlaylist) {
    throw new ApiError(500, 'Something went wrong while updating playlist');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, 'Playlist updated successfully'));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
