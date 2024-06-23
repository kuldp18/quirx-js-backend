# 🚀 Quirx Backend

This is the backend written in Node.js for Quirx, a video sharing platform.

## 💻 Technologies

This project is created with:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token
- Bcrypt
- Cloudinary
- Cors
- Dotenv
- Cookie-parser
- Multer

## Improvements

Some improvements I added or will add to the project:

- Delete existing avatar and cover images in cloudinary also when user edits them, to save cloud storage.
- Delete existing thumbnail first while editing a video thumbnail

## Known Bugs

- In register user controller, files are not deleted if user already exists while registering

## 🚀 Setup

To run this project, install it locally using npm:

```sh
git clone https://github.com/kuldp18/quirx-js-backend.git
cd quirx-js-backend
npm install
npm run dev
```

.env.example

```env
PORT=8000
MONGODB_URI=your_MONGO_URI
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=YOUR_SECRET
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=YOUR_SECRET
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=YOUR_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
```

## 🌐 API Routes (v1)

This project includes the following main routes:

### User Routes

- `POST /api/v1/users/register`: Register a new user
- `POST /api/v1/users/login`: Login a user
- `POST /api/v1/users/renew-token`: Renew the user's token
- `POST /api/v1/users/logout`: Logout a user
- `POST /api/v1/users/change-password`: Change current user's password
- `GET /api/v1/users/current-user`: Get current user profile
- `PATCH /api/v1/users/update-profile`: Update user's profile
- `PATCH /api/v1/users/avatar`: Update user's avatar
- `PATCH /api/v1/users/coverImage`: Update user's cover image
- `GET /api/v1/users/c/:username`: Get user's channel profile
- `GET /api/v1/users/history`: Get user's watch history

### Video Routes

- `GET /api/v1/videos/:videoId`: Get video by id
- `DELETE /api/v1/videos/:videoId`: Delete video by id
- `PATCH /api/v1/videos/:videoId`: Update video by id
- `PATCH /api/v1/videos/thumbnail/:videoId`: Update video thumbnail by id
- `PATCH /api/v1/videos/toggle/publish/:videoId`: Toggle video view status by id

### Subscription Routes

- `GET /api/v1/subscriptions/c/:channelId`: Get user channel subscribers by channel id
- `GET /api/v1/subscriptions/u/:subscriberId`: Get subscribed channels of user by subscriber id
- `POST /api/v1/subscriptions/c/:channelId`: Toggle subscribe and unsubscribe by channel id

### Playlist Routes

- `GET /api/v1/playlist/:playlistId`: Get playlist by id
- `GET /api/v1/playlist/user/:userId`: Get user playlists from user id
- `POST /api/v1/playlist`: Create new user playlist
- `PATCH /api/v1/playlist/:playlistId`: Update playlist by id
- `DELETE /api/v1/playlist/:playlistId`: Delete playlist by id
- `PATCH /api/v1/playlist/add/:videoId/:playlistId`: Add video to playlist with video id and playlist id
- `PATCH /api/v1/playlist/remove/:videoId/:playlistId`: Remove video from playlist with video id and playlist id

### Tweet Routes

- `POST /api/v1/tweets`: Create new tweet
- `GET /api/v1/tweets/user/:userId`: Get user tweets by user id
- `PATCH /api/v1/tweets/:tweetId`: Update user tweet by tweet id
- `DELETE /api/v1/tweets/:tweetId`: Delete user tweet by tweet id

### Like Routes

- `GET /api/v1/likes/videos`: Get all liked videos by user
- `POST /api/v1/likes/toggle/v/:videoId`: Toggle video like by video id
- `POST /api/v1/likes/toggle/c/:commentId`: Toggle comment like by comment id
- `POST /api/v1/likes/toggle/t/:tweetId`: Toggle tweet like by tweet id

### Dashboard Routes

- `GET /api/v1/dashboard/stats`: Get user channel stats
- `GET /api/v1/dashboard/videos`: Get user channel videos

### Comment Routes

- `GET /api/v1/comments/:videoId`: Get video comments by video id
- `POST /api/v1/comments/:videoId`: Add new comment on video with video id
- `DELETE /api/v1/comments/c/:commentId`: Delete comment by comment id
- `PATCH /api/v1/comments/c/:commentId`: Update comment by comment id

### Health check

- `GET /api/v1/healtcheck`: Check app health status
