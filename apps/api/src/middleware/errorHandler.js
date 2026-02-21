function errorHandler(error, request, response, next) {
  response.status(500).json({
    error: error.message || 'Internal server error'
  });
}

export default errorHandler;
