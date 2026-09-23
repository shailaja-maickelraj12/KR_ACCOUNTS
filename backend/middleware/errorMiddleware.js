export const errorMiddleware = (error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || "Internal server error"
  });
};
