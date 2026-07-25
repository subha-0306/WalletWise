const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

const generateTokens = (user) => {
  const payload = { userId: user._id.toString(), email: user.email };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'super_secret_access_key_walletwise_2026',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_walletwise_2026',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/',
  });
};

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Cost factor 12 as required
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
    });

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in' });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token cookie missing' });
    }

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_walletwise_2026',
      async (err, decoded) => {
        if (err) {
          return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(401).json({ error: 'User no longer exists' });
        }

        const tokens = generateTokens(user);
        setRefreshCookie(res, tokens.refreshToken);

        return res.status(200).json({
          accessToken: tokens.accessToken,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        });
      }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
};

const logout = async (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
