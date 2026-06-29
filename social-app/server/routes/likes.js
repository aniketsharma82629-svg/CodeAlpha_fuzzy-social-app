const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// =====================
// LIKE A POST
// =====================
router.post('/', auth, async (req, res) => {
  try {
    const { post_id } = req.body;

    if (!post_id) {
      return res.status(400).json({ error: 'Post ID zaroori hai.' });
    }

    // Check karo already like kiya hai kya
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', req.user.id)
      .single();

    if (existingLike) {
      return res.status(400).json({ error: 'Already like kar chuke ho.' });
    }

    const { data: like, error } = await supabase
      .from('likes')
      .insert([{
        post_id,
        user_id: req.user.id
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Post like ho gaya!', like });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// UNLIKE A POST
// =====================
router.delete('/', auth, async (req, res) => {
  try {
    const { post_id } = req.body;

    if (!post_id) {
      return res.status(400).json({ error: 'Post ID zaroori hai.' });
    }

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Like remove ho gaya!' });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// GET LIKES COUNT OF A POST
// =====================
router.get('/:post_id', async (req, res) => {
  try {
    const { data: likes, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', req.params.post_id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ likes_count: likes.length });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;