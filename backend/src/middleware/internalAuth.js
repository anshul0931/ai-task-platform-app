// Simple shared-secret auth for worker -> backend internal calls
const internalAuth = (req, res, next) => {
  const key = req.headers['x-internal-api-key'];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    res.status(401);
    return next(new Error('Invalid internal API key'));
  }
  next();
};

module.exports = internalAuth;
