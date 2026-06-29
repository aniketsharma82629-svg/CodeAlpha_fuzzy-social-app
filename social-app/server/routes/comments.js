const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// =====================
// GET COMMENTS OF A POST
// =====================
router.get('/:post_id', async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (id, username, full_name, avatar_url)
      `)
      .eq('post_id', req.params.post_id)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ comments });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// ADD COMMENT
// =====================
router.post('/', auth, async (req, res) => {
  try {
    const { post_id, content } = req.body;

    if (!post_id || !content) {
      return res.status(400).json({ error: 'Post ID aur content zaroori hai.' });
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        post_id,
        user_id: req.user.id,
        content
      }])
      .select(`
        *,
        users (id, username, full_name, avatar_url)
      `)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({ message: 'Comment add ho gaya!', comment });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// =====================
// DELETE COMMENT
// =====================
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (!comment) return res.status(404).json({ error: 'Comment nahi mila.' });

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Yeh tumhara comment nahi hai.' });
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: 'Comment delete ho gaya!' });

  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;