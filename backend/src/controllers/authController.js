const supabase = require('../config/supabase');

const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

const setRefreshCookie = (res, refreshToken) => {
  if (!refreshToken) return;
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

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // 1. Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { name: cleanName },
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;
    if (!user) {
      return res.status(400).json({ error: 'User registration failed' });
    }

    // 2. Auto-confirm user email so sign in works immediately without manual email verification
    try {
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
    } catch (confirmErr) {
      console.warn('Auto email confirmation warning:', confirmErr.message || confirmErr);
    }

    // 3. Idempotent Upsert into profiles table (handles existing profile gracefully without 23505 error)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, name: cleanName },
        { onConflict: 'id', ignoreDuplicates: false }
      );

    if (profileError && profileError.code !== '23505') {
      console.error('Error upserting profile:', profileError);
    }

    // 4. Resolve session (obtain session via signInWithPassword if signUp session is null)
    let session = data.session;
    if (!session) {
      try {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInData?.session) {
          session = signInData.session;
        }
      } catch (signInErr) {
        console.warn('Post-register sign in attempt warning:', signInErr);
      }
    }

    if (session?.refresh_token) {
      setRefreshCookie(res, session.refresh_token);
    }

    return res.status(201).json({
      accessToken: session?.access_token || null,
      user: {
        id: user.id,
        name: cleanName,
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const user = data.user;

    // 2. Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const name = profile?.name || user.user_metadata?.name || '';

    // 3. Set refresh cookie
    if (data.session?.refresh_token) {
      setRefreshCookie(res, data.session.refresh_token);
    }

    return res.status(200).json({
      accessToken: data.session?.access_token || null,
      user: {
        id: user.id,
        name,
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

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = data.user;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    if (data.session?.refresh_token) {
      setRefreshCookie(res, data.session.refresh_token);
    }

    return res.status(200).json({
      accessToken: data.session.access_token,
      user: {
        id: user.id,
        name: profile?.name || user.user_metadata?.name || '',
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
};

const logout = async (req, res) => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Supabase signOut error:', err);
  }

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
