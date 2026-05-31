// ============ ПЛЕЕР ============
const API_BASE = window.location.origin;
const player = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('id');

if (!videoId) {
  document.body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:20px;padding:40px;text-align:center;background:#0f0f0f;color:#f1f1f1;"><h1 style="font-size:28px;">Видео не выбрано</h1><p style="color:#aaa;">Пожалуйста, выберите видео</p><a href="/" style="padding:12px 28px;background:#ff4d4d;color:white;border-radius:20px;font-weight:600;">На главную</a></div>`;
}

function getClientId() {
  let id = localStorage.getItem('tipweyt_clientId');
  if (!id) {
    id = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('tipweyt_clientId', id);
  }
  return id;
}
const CLIENT_ID = getClientId();

let currentVideo = null;
let currentUserAction = 'none';

async function loadVideo() {
  try {
    const resp = await fetch(`${API_BASE}/api/videos/${videoId}`);
    if (!resp.ok) throw new Error('Not found');
    const data = await resp.json();
    currentVideo = data.video;
    updatePage(currentVideo);
    loadRecommendations();
    loadComments();
  } catch (err) {
    document.getElementById('videoTitle').textContent = 'Видео не найдено';
    document.getElementById('videoInfo').innerHTML = `<div style="text-align:center;padding:40px;"><h2>Видео не найдено</h2><p style="color:#aaa;margin:12px 0;">Возможно, оно было удалено</p><a href="/" style="padding:10px 24px;background:#ff4d4d;color:white;border-radius:20px;display:inline-block;font-weight:500;">На главную</a></div>`;
  }
}

function updatePage(video) {
  document.title = `${video.title} - TipweYT`;
  document.getElementById('videoTitle').textContent = video.title;
  if (video.videoUrl) {
    videoSource.src = video.videoUrl;
    player.load();
  }
  document.getElementById('videoViews').textContent = formatViews(video.views);
  document.getElementById('videoDate').textContent = formatDate(video.createdAt);
  document.getElementById('likesCount').textContent = video.likes || 0;
  document.getElementById('dislikesCount').textContent = video.dislikes || 0;
  document.getElementById('videoResolution').textContent = video.resolution || '1920x1080';
  const avatarLetter = video.channelName ? video.channelName.charAt(0).toUpperCase() : 'К';
  document.getElementById('channelAvatar').textContent = avatarLetter;
  document.getElementById('channelName').textContent = video.channelName || 'Мой канал';
  document.getElementById('videoDescription').innerHTML = video.description ? `<p>${escapeHtml(video.description)}</p>` : '<p style="color:#717171;">Нет описания</p>';
  document.getElementById('videoCategory').textContent = video.category || 'Разное';
  if (video.channelId) {
    document.getElementById('channelName').style.cursor = 'pointer';
    document.getElementById('channelName').onclick = () => window.location.href = `/channel/settings.html`;
  }
}

function formatViews(views) {
  if (!views) return '0';
  if (views >= 1000000) return (views / 1000000).toFixed(1) + ' млн';
  if (views >= 1000) return (views / 1000).toFixed(1) + ' тыс';
  return views.toString();
}
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'сегодня';
  if (days === 1) return 'вчера';
  if (days < 7) return `${days} дней назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  if (days < 365) return `${Math.floor(days / 30)} мес. назад`;
  return `${Math.floor(days / 365)} г. назад`;
}
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Лайк TOGGLE
async function likeVideo() {
  if (!currentVideo) return;
  const likeBtn = document.getElementById('likeBtn');
  const dislikeBtn = document.getElementById('dislikeBtn');
  try {
    const resp = await fetch(`${API_BASE}/api/videos/${videoId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT_ID })
    });
    const data = await resp.json();
    document.getElementById('likesCount').textContent = data.likes;
    document.getElementById('dislikesCount').textContent = data.dislikes;
    currentVideo.likes = data.likes;
    currentVideo.dislikes = data.dislikes;
    currentUserAction = data.userAction;
    if (data.userAction === 'like') { likeBtn.style.color = '#3ea6ff'; dislikeBtn.style.color = 'var(--text-primary)'; }
    else if (data.userAction === 'dislike') { likeBtn.style.color = 'var(--text-primary)'; dislikeBtn.style.color = '#ff4d4d'; }
    else { likeBtn.style.color = 'var(--text-primary)'; dislikeBtn.style.color = 'var(--text-primary)'; }
  } catch (err) { console.error(err); }
}

async function dislikeVideo() {
  if (!currentVideo) return;
  const likeBtn = document.getElementById('likeBtn');
  const dislikeBtn = document.getElementById('dislikeBtn');
  try {
    const resp = await fetch(`${API_BASE}/api/videos/${videoId}/dislike`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT_ID })
    });
    const data = await resp.json();
    document.getElementById('likesCount').textContent = data.likes;
    document.getElementById('dislikesCount').textContent = data.dislikes;
    currentVideo.likes = data.likes;
    currentVideo.dislikes = data.dislikes;
    currentUserAction = data.userAction;
    if (data.userAction === 'like') { likeBtn.style.color = '#3ea6ff'; dislikeBtn.style.color = 'var(--text-primary)'; }
    else if (data.userAction === 'dislike') { likeBtn.style.color = 'var(--text-primary)'; dislikeBtn.style.color = '#ff4d4d'; }
    else { likeBtn.style.color = 'var(--text-primary)'; dislikeBtn.style.color = 'var(--text-primary)'; }
  } catch (err) { console.error(err); }
}

// RECOMMENDATIONS
async function loadRecommendations() {
  const container = document.getElementById('recommendedVideos');
  try {
    const resp = await fetch(`${API_BASE}/api/videos?sort=views`);
    const data = await resp.json();
    const videos = (data.videos || []).filter(v => v.id !== videoId).slice(0, 15);
    if (videos.length === 0) { container.innerHTML = '<p style="color:#717171;font-size:14px;">Нет рекомендованных видео</p>'; return; }
    container.innerHTML = '';
    videos.forEach(v => {
      const el = document.createElement('div');
      el.className = 'rec-video';
      el.onclick = () => { window.location.href = `/watch.html?id=${v.id}`; };
      el.innerHTML = `<div class="rec-video-thumb"><img src="${v.thumbnailUrl || '/thumbnails/default-thumb.jpg'}" alt="${v.title}" loading="lazy" onerror="this.src='/thumbnails/default-thumb.jpg'"></div><div class="rec-video-info"><div class="rec-video-title">${v.title}</div><div class="rec-video-channel">${v.channelName || 'Мой канал'}</div><div class="rec-video-meta">${formatViews(v.views)} просмотров</div></div>`;
      container.appendChild(el);
    });
  } catch (err) { container.innerHTML = '<p style="color:#717171;font-size:14px;">Не удалось загрузить</p>'; }
}

// COMMENTS
async function loadComments() {
  const container = document.getElementById('commentsList');
  const countEl = document.getElementById('commentsCount');
  try {
    const resp = await fetch(`${API_BASE}/api/videos/${videoId}/comments`);
    const data = await resp.json();
    const comments = data.comments || [];
    countEl.textContent = comments.length;
    if (comments.length === 0) { container.innerHTML = '<div class="loading-comments">Комментариев пока нет</div>'; return; }
    container.innerHTML = '';
    const colors = ['#ff4d4d', '#3ea6ff', '#4CAF50', '#ff9800', '#9c27b0', '#00bcd4'];
    comments.forEach(c => {
      const el = document.createElement('div');
      el.className = 'comment';
      const color = colors[c.username.charCodeAt(0) % colors.length];
      el.innerHTML = `<div class="comment-avatar" style="background:${color}">${c.username.charAt(0).toUpperCase()}</div><div class="comment-body"><div class="comment-author">${escapeHtml(c.username)}<span class="comment-time">${formatDate(c.date)}</span></div><div class="comment-text">${escapeHtml(c.text)}</div></div>`;
      container.appendChild(el);
    });
  } catch (err) { document.getElementById('commentsList').innerHTML = '<div class="loading-comments">Ошибка загрузки</div>'; }
}

async function addComment() {
  const username = document.getElementById('commentName').value.trim() || 'Пользователь';
  const text = document.getElementById('commentText').value.trim();
  if (!text) { alert('Введите текст'); return; }
  try {
    const user = getSavedUser();
    const resp = await fetch(`${API_BASE}/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user ? user.id : null, username, text })
    });
    const data = await resp.json();
    if (data.success) { document.getElementById('commentText').value = ''; loadComments(); }
  } catch (err) { alert('Ошибка'); }
}

if (videoId) loadVideo();