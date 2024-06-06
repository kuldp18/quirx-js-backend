// const asyncHandler = (fn) => {()=>{}};
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     return res.status(err.code || 500).json({
//       success: false,
//       message: err.message || 'Internal server error',
//     });
//   }
// };

// using promises
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
