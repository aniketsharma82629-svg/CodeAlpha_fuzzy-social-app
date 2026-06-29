const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Set token to localStorage
function setToken(token) {
  localStorage.setItem('token', token);
}

// Get current user from localStorage
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || '{}');
}

// Set current user to localStorage
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// Show message
function showMessage(message, type) {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;
  
  messageEl.textContent = message;
  messageEl.className = `message show ${type}`;
  
  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 3000);
}

// Auth Functions
function showLogin() {
  document.getElementById('login-form').classList.add('active');
  document.getElementById('register-form').classList.remove('active');
  document.querySelectorAll('.toggle-btn')[0].classList.add('active');
  document.querySelectorAll('.toggle-btn')[1].classList.remove('active');
}

function showRegister() {
  document.getElementById('register-form').classList.add('active');
  document.getElementById('login-form').classList.remove('active');
  document.querySelectorAll('.toggle-btn')[0].classList.remove('active');
  document.querySelectorAll('.toggle-btn')[1].classList.add('active');
}

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(data.error || 'Login failed', 'error');
      return;
    }
    
    setToken(data.token);
    setCurrentUser(data.user);
    showMessage('Login successful!', 'success');
    
    setTimeout(() => {
      window.location.href = 'feed.html';
    }, 1500);
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(data.error || 'Registration failed', 'error');
      return;
    }
    
    setToken(data.token);
    setCurrentUser(data.user);
    showMessage('Registration successful!', 'success');
    
    setTimeout(() => {
      window.location.href = 'feed.html';
    }, 1500);
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  window.location.href = 'index.html';
}

// Feed Functions
async function loadFeed() {
  try {
    const response = await fetch(`${API_URL}/posts/feed`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const posts = await response.json();
    const feedEl = document.getElementById('feed');
    
    feedEl.innerHTML = posts.map(post => `
      <div class="post" onclick="viewPost(${post.id})">
        <div class="post-header">
          <div class="post-author">
            <img src="https://via.placeholder.com/36" alt="Avatar" class="avatar">
            <div class="author-info">
              <h3>${post.users?.username || 'Unknown'}</h3>
              <p>${new Date(post.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div class="post-content">${post.content}</div>
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
        <div class="post-actions">
          <button class="action-btn" onclick="toggleLike(event, ${post.id})">
            <span>❤️</span> Like
          </button>
          <button class="action-btn" onclick="viewComments(event, ${post.id})">
            <span>💬</span> Comment
          </button>
          <button class="action-btn">
            <span>📤</span> Share
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading feed:', error);
  }
}

async function createPost() {
  const content = document.getElementById('post-content').value;
  const image_url = document.getElementById('post-image').value;
  
  if (!content.trim()) {
    showMessage('Post content cannot be empty', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ content, image_url })
    });
    
    if (!response.ok) {
      const error = await response.json();
      showMessage(error.error || 'Failed to create post', 'error');
      return;
    }
    
    document.getElementById('post-content').value = '';
    document.getElementById('post-image').value = '';
    showMessage('Post created!', 'success');
    loadFeed();
  } catch (error) {
    showMessage('Network error: ' + error.message, 'error');
  }
}

async function toggleLike(event, postId) {
  event.stopPropagation();
  
  try {
    const response = await fetch(`${API_URL}/likes/post/${postId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    if (response.ok) {
      event.target.closest('.action-btn').classList.add('liked');
    }
  } catch (error) {
    console.error('Error liking post:', error);
  }
}

async function viewComments(event, postId) {
  event.stopPropagation();
  
  try {
    const response = await fetch(`${API_URL}/comments/post/${postId}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const comments = await response.json();
    const modalContent = document.getElementById('modal-post-content');
    
    modalContent.innerHTML = `
      <h2>Comments</h2>
      <div id="comments-list" class="comments-list">
        ${comments.map(comment => `
          <div class="comment">
            <strong>${comment.users?.username || 'Unknown'}</strong>
            <p>${comment.content}</p>
          </div>
        `).join('')}
      </div>
      <div class="add-comment">
        <textarea id="comment-input" placeholder="Add a comment..."></textarea>
        <button onclick="addComment(${postId})" class="btn-primary">Comment</button>
      </div>
    `;
    
    document.getElementById('post-modal').classList.remove('hidden');
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

async function addComment(postId) {
  const content = document.getElementById('comment-input').value;
  
  if (!content.trim()) return;
  
  try {
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ post_id: postId, content })
    });
    
    if (response.ok) {
      showMessage('Comment added!', 'success');
      viewComments({ stopPropagation: () => {} }, postId);
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

function viewPost(postId) {
  // Placeholder for viewing full post
  console.log('View post:', postId);
}

function closePostModal() {
  document.getElementById('post-modal').classList.add('hidden');
}

// Profile Functions
async function loadProfile() {
  try {
    const user = getCurrentUser();
    const response = await fetch(`${API_URL}/users/${user.id}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const profileData = await response.json();
    
    document.getElementById('profile-username').textContent = profileData.username;
    document.getElementById('profile-bio').textContent = profileData.bio || 'No bio added yet';
    document.getElementById('profile-avatar').src = profileData.avatar_url || 'https://via.placeholder.com/120';
    
    loadUserPosts();
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadUserPosts() {
  try {
    const user = getCurrentUser();
    const response = await fetch(`${API_URL}/users/${user.id}/posts`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    const posts = await response.json();
    const postsEl = document.getElementById('user-posts-feed');
    
    postsEl.innerHTML = posts.map(post => `
      <div class="post">
        <div class="post-content">${post.content}</div>
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
        <div class="post-actions">
          <button class="action-btn" onclick="deletePost(${post.id})">
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading user posts:', error);
  }
}

async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
    if (response.ok) {
      showMessage('Post deleted!', 'success');
      loadUserPosts();
    }
  } catch (error) {
    console.error('Error deleting post:', error);
  }
}

function editProfile() {
  const user = getCurrentUser();
  
  document.getElementById('edit-username').value = user.username || '';
  document.getElementById('edit-bio').value = user.bio || '';
  document.getElementById('edit-avatar').value = user.avatar_url || '';
  
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function saveProfile(event) {
  event.preventDefault();
  
  const user = getCurrentUser();
  const username = document.getElementById('edit-username').value;
  const bio = document.getElementById('edit-bio').value;
  const avatar_url = document.getElementById('edit-avatar').value;
  
  try {
    const response = await fetch(`${API_URL}/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ username, bio, avatar_url })
    });
    
    if (response.ok) {
      const updatedUser = await response.json();
      setCurrentUser(updatedUser);
      showMessage('Profile updated!', 'success');
      closeEditModal();
      loadProfile();
    }
  } catch (error) {
    console.error('Error updating profile:', error);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  
  if (window.location.pathname.includes('feed.html') || window.location.pathname.includes('profile.html')) {
    if (!token) {
      window.location.href = 'index.html';
      return;
    }
    
    if (window.location.pathname.includes('feed.html')) {
      loadFeed();
    } else if (window.location.pathname.includes('profile.html')) {
      loadProfile();
    }
  }
});
