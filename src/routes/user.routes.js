import { Router } from 'express';
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory,
  loginUser,
  logoutUser,
  registerUser,
  renewAccessToken,
  updateAccountDetails,
  updateCoverImage,
  updateUserAvatar,
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route('/login').post(loginUser);
router.route('/renew-token').post(renewAccessToken);

//secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/update-profile').patch(verifyJWT, updateAccountDetails);

router
  .route('/avatar')
  .patch(verifyJWT, upload.single('avatar'), updateUserAvatar);

router
  .route('/coverImage')
  .patch(verifyJWT, upload.single('coverImage'), updateCoverImage);

router.route('/c/:username').get(verifyJWT, getUserChannelProfile);

router.route('/history').get(verifyJWT, getUserWatchHistory);

export default router;
