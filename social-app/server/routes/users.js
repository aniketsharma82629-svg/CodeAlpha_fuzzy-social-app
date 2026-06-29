const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// =====================
// GET USER PROFILE BY ID
// =====================
router.get('/:id', async (req, res) => {
  try {
    // User info lo
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, full_name, bio, avatar_url, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User nahi mila.' });
    }

    // User ke posts lo
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false });

    // Followers count lo
    const { data: followers } = await supabase
      .from('followers')
      .select('id')
      .eq('following_id', req.params.id);

    // Following count lo
    const { data: following } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', req.params.id);

    res.json({
      user,
      posts: posts || [],
      followers_count: followers ? followers.length : 0,
      following_count: following ? following.length : 0,
      posts_count: posts ? posts.length : 0
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// GET USER PROFILE BY USERNAME
// =====================
router.get('/username/:username', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, full_name, bio, avatar_url, created_at')
      .eq('username', req.params.username)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User nahi mila.' });
    }

    // User ke posts lo
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Followers count lo
    const { data: followers } = await supabase
      .from('followers')
      .select('id')
      .eq('following_id', user.id);

    // Following count lo
    const { data: following } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id);

    res.json({
      user,
      posts: posts || [],
      followers_count: followers ? followers.length : 0,
      following_count: following ? following.length : 0,
      posts_count: posts ? posts.length : 0
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// UPDATE OWN PROFILE
// =====================
router.put('/me', auth, async (req, res) => {
  try {
    const { full_name, bio, avatar_url } = req.body;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        full_name: full_name,
        bio: bio,
        avatar_url: avatar_url
      })
      .eq('id', req.user.id)
      .select('id, username, full_name, bio, avatar_url')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Profile update ho gaya!', user: updatedUser });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// SEARCH USERS
// =====================
router.get('/search/:query', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url')
      .ilike('username', `%${req.params.query}%`)
      .limit(10);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ users });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;