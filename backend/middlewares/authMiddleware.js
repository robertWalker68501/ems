import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        message: 'Not token provided.',
      });
    }

    const actualToken = token.startsWith('Bearer ')
      ? token.split(' ')[1]
      : token;

    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    console.warn('Verify token warning:', err.name, err.message);
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token Expired'
        : err.name === 'JsonwebtokenError'
          ? 'Invalid token signature'
          : 'Invalid token';

    return res.status(401).json({
      message,
    });
  }
};

// Make sure logged-in use is an admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied.',
    });
  }

  next();

  try {
  } catch (error) {}
};
