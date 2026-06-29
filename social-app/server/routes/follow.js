const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// =====================
// FOLLOW A USER
// =====================
router.post('/', auth, async (req, res) => {
  try {
    const { following_id } = req.body;

    if (!following_id) {
      return res.status(400).json({ error: 'Following ID zaroori hai.' });
    }

    // Khud ko follow nahi kar sakte
    if (following_id === req.user.id) {
      return res.status(400).json({ error: 'Khud ko follow nahi kar sakte.' });
    }

    // Already follow kiya hai kya
    const { data: existingFollow } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', req.user.id)
      .eq('following_id', following_id)
      .single();

    if (existingFollow) {
      return res.status(400).json({ error: 'Already follow kar rahe ho.' });
    }

    const { data: follow, error } = await supabase
      .from('followers')
      .insert([{
        follower_id: req.user.id,
        following_id
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'User follow ho gaya!', follow });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// UNFOLLOW A USER
// =====================
router.delete('/', auth, async (req, res) => {
  try {
    const { following_id } = req.body;

    if (!following_id) {
      return res.status(400).json({ error: 'Following ID zaroori hai.' });
    }

    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', req.user.id)
      .eq('following_id', following_id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Unfollow ho gaya!' });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// GET FOLLOWERS OF A USER
// =====================
router.get('/followers/:user_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('follower_id, users!followers_follower_id_fkey(id, username, full_name, avatar_url)')
      .eq('following_id', req.params.user_id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ followers: data });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// GET FOLLOWING OF A USER
// =====================
router.get('/following/:user_id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('followers')
      .select('following_id, users!followers_following_id_fkey(id, username, full_name, avatar_url)')
      .eq('follower_id', req.params.user_id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ following: data });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;