const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      token,
    };

    // Attach RLS-authenticated Supabase client instance scoped to user's Bearer token
    req.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      }
    );

    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticateToken };
