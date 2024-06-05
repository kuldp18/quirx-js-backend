import connectDB from './db/index.js';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config({
  path: './.env',
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port: ${process.env.PORT || 8000}`);
    });

    // check for errors
    app.on('error', (err) => {
      console.error('Express error:', err);
    });
  })
  .catch((err) => console.log(`MongoDB connection error: ${err}`));
