import jwt from 'jsonwebtoken';

const loggerMiddleware = (req, res, next) => {
  console.log(`[${new Date().toISOString()} ${req.method} ${req.url}]`);
  next();
};

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'auth error' });
  }

  const [type, token] = header.split(' ');

  if (type !== 'Bearer') {
    return res.status(401).json({ message: 'invalid auth format' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    console.log('JWT payload:', payload);

    req.user = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ message: 'invalid token' });
  }
};

export { loggerMiddleware, authMiddleware };
