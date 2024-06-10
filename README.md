# 🚀 Quirx Backend 🚀

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

## 🚀 Setup

To run this project, install it locally using npm:

```sh
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
