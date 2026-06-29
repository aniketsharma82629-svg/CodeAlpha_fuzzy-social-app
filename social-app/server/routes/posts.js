const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// =====================
// GET ALL POSTS (Feed)
// =====================
router.get('/', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (id, username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ posts });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// GET SINGLE POST
// =====================
router.get('/:id', async (req, res) => {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (id, username, full_name, avatar_url)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !post) return res.status(404).json({ error: 'Post nahi mila.' });

    res.json({ post });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// CREATE POST
// =====================
router.post('/', auth, async (req, res) => {
  try {
    const { content, image_url } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content zaroori hai.' });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert([{
        user_id: req.user.id,
        content,
        image_url: image_url || ''
      }])
      .select(`
        *,
        users (id, username, full_name, avatar_url)
      `)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Post ban gaya!', post });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// DELETE POST
// =====================
router.delete('/:id', auth, async (req, res) => {
  try {
    // Pehle check karo post is user ki hai ya nahi
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!post) return res.status(404).json({ error: 'Post nahi mila.' });

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Yeh tumhari post nahi hai.' });
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Post delete ho gaya!' });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;