const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

const DB_FILE = path.join(__dirname, 'videos.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const VIDEOS_DIR = path.join(PUBLIC_DIR, 'videos');
const THUMBNAILS_DIR = path.join(PUBLIC_DIR, 'thumbnails');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

fs.ensureDirSync(VIDEOS_DIR);
fs.ensureDirSync(THUMBNAILS_DIR);

function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeJsonSync(DB_FILE, { videos: [], channels: [], comments: {}, users: [] });
  }
  return fs.readJsonSync(DB_FILE);
}
function saveDB(db) {
  fs.writeJsonSync(DB_FILE, db, { spaces: 2 });
}
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'tipweyt_salt_2026').digest('hex');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'video') cb(null, VIDEOS_DIR);
    else cb(null, THUMBNAILS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const videoTypes = /mp4|webm|avi|mkv|mov/;
    const imageTypes = /jpg|jpeg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'video' && videoTypes.test(ext)) return cb(null, true);
    if (imageTypes.test(ext)) return cb(null, true);
    cb(new Error('Неподдерживаемый формат'));
  }
});

// ============ РЕГИСТРАЦИЯ И ВХОД ============
app.post('/api/auth/register', (req, res) => {
  const db = getDB();
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  if (username.length < 3) return res.status(400).json({ error: 'Имя минимум 3 символа' });
  if (password.length < 6) return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  if (db.users.find(u => u.username === username)) return res.status(400).json({ error: 'Имя занято' });
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email занят' });
  const user = { id: uuidv4(), username, email, password: hashPassword(password), avatarUrl: null, hasChannel: false, channelId: null, createdAt: new Date().toISOString() };
  db.users.push(user);
  saveDB(db);
  res.json({ success: true, user: { id: user.id, username, email, hasChannel: false } });
});

app.post('/api/auth/login', (req, res) => {
  const db = getDB();
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Заполните все поля' });
  const user = db.users.find(u => u.username === login || u.email === login);
  if (!user || user.password !== hashPassword(password)) return res.status(401).json({ error: 'Неверный логин или пароль' });
  res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, hasChannel: user.hasChannel, channelId: user.channelId, avatarUrl: user.avatarUrl } });
});

app.post('/api/auth/user', (req, res) => {
  const db = getDB();
  const user = db.users.find(u => u.id === req.body.userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json({ user: { id: user.id, username: user.username, email: user.email, hasChannel: user.hasChannel, channelId: user.channelId, avatarUrl: user.avatarUrl } });
});

// ============ КАНАЛЫ ============
app.post('/api/channels/create', upload.single('avatar'), (req, res) => {
  const db = getDB();
  const { userId, channelName, description } = req.body;
  if (!userId || !channelName) return res.status(400).json({ error: 'Заполните название канала' });
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
  if (user.hasChannel) return res.status(400).json({ error: 'Канал уже есть' });
  if (db.channels.find(c => c.name === channelName)) return res.status(400).json({ error: 'Канал с таким названием уже существует' });
  const avatarUrl = req.file ? `/thumbnails/${req.file.filename}` : null;
  const channel = { id: uuidv4(), ownerId: userId, name: channelName, description: description || '', avatarUrl, subscribers: 0, createdAt: new Date().toISOString() };
  db.channels.push(channel);
  user.hasChannel = true;
  user.channelId = channel.id;
  user.avatarUrl = avatarUrl;
  saveDB(db);
  res.json({ success: true, channel, user: { id: user.id, username: user.username, hasChannel: true, channelId: channel.id, avatarUrl } });
});

app.get('/api/channels/:id', (req, res) => {
  const db = getDB();
  const channel = db.channels.find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: 'Канал не найден' });
  const videos = db.videos.filter(v => v.channelId === channel.id);
  res.json({ channel, videoCount: videos.length, videos });
});

app.post('/api/channels/update', upload.single('avatar'), (req, res) => {
  const db = getDB();
  const { channelId, name, description, userId } = req.body;
  const channel = db.channels.find(c => c.id === channelId);
  if (!channel) return res.status(404).json({ error: 'Канал не найден' });
  if (channel.ownerId !== userId) return res.status(403).json({ error: 'Нет доступа' });
  if (name) channel.name = name;
  if (description !== undefined) channel.description = description;
  if (req.file) {
    channel.avatarUrl = `/thumbnails/${req.file.filename}`;
    const user = db.users.find(u => u.id === userId);
    if (user) user.avatarUrl = channel.avatarUrl;
  }
  saveDB(db);
  res.json({ success: true, channel });
});

// ============ ВИДЕО ============
app.get('/api/videos', (req, res) => {
  const db = getDB();
  const sort = req.query.sort || 'date';
  let videos = [...db.videos];
  if (sort === 'views') videos.sort((a, b) => b.views - a.views);
  else if (sort === 'likes') videos.sort((a, b) => b.likes - a.likes);
  else videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    videos = videos.filter(v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.channelName.toLowerCase().includes(q));
  }
  if (req.query.category) videos = videos.filter(v => v.category === req.query.category);
  if (req.query.channelId) videos = videos.filter(v => v.channelId === req.query.channelId);
  res.json({ videos });
});

app.get('/api/videos/:id', (req, res) => {
  const db = getDB();
  const video = db.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Видео не найдено' });
  video.views = (video.views || 0) + 1;
  saveDB(db);
  res.json({ video });
});

app.post('/api/upload', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
  try {
    if (!req.files || !req.files.video) return res.status(400).json({ error: 'Видео не загружено' });
    const db = getDB();
    const videoFile = req.files.video[0];
    const thumbFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
    let channelId = null;
    let channelName = 'Мой канал';
    if (req.body.userId) {
      const user = db.users.find(u => u.id === req.body.userId);
      if (user && user.hasChannel) {
        const channel = db.channels.find(c => c.id === user.channelId);
        if (channel) { channelId = channel.id; channelName = channel.name; }
      }
    }
    const newVideo = {
      id: uuidv4(), title: req.body.title || 'Без названия', description: req.body.description || '',
      channelName, channelId, userId: req.body.userId || null, category: req.body.category || 'Разное',
      videoUrl: `/videos/${videoFile.filename}`,
      thumbnailUrl: thumbFile ? `/thumbnails/${thumbFile.filename}` : '/thumbnails/default-thumb.jpg',
      views: 0, likes: 0, dislikes: 0, likedBy: [], dislikedBy: [],
      duration: req.body.duration || '00:00', resolution: req.body.resolution || '1920x1080',
      createdAt: new Date().toISOString(),
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : []
    };
    db.videos.unshift(newVideo);
    saveDB(db);
    res.json({ success: true, video: newVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

// Лайк/дизлайк TOGGLE
app.post('/api/videos/:id/:action', (req, res) => {
  const db = getDB();
  const video = db.videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: 'Видео не найдено' });
  const clientId = req.body.clientId;
  if (!clientId) return res.status(400).json({ error: 'clientId не указан' });
  if (!video.likedBy) video.likedBy = [];
  if (!video.dislikedBy) video.dislikedBy = [];

  const action = req.params.action;
  let userAction = 'none';
  if (video.likedBy.includes(clientId)) userAction = 'like';
  else if (video.dislikedBy.includes(clientId)) userAction = 'dislike';

  if (action === 'like') {
    if (userAction === 'like') {
      video.likedBy = video.likedBy.filter(id => id !== clientId);
      video.likes = Math.max(0, (video.likes || 0) - 1);
      userAction = 'none';
    } else {
      if (userAction === 'dislike') {
        video.dislikedBy = video.dislikedBy.filter(id => id !== clientId);
        video.dislikes = Math.max(0, (video.dislikes || 0) - 1);
      }
      video.likedBy.push(clientId);
      video.likes = (video.likes || 0) + 1;
      userAction = 'like';
    }
  } else if (action === 'dislike') {
    if (userAction === 'dislike') {
      video.dislikedBy = video.dislikedBy.filter(id => id !== clientId);
      video.dislikes = Math.max(0, (video.dislikes || 0) - 1);
      userAction = 'none';
    } else {
      if (userAction === 'like') {
        video.likedBy = video.likedBy.filter(id => id !== clientId);
        video.likes = Math.max(0, (video.likes || 0) - 1);
      }
      video.dislikedBy.push(clientId);
      video.dislikes = (video.dislikes || 0) + 1;
      userAction = 'dislike';
    }
  }
  saveDB(db);
  res.json({ likes: video.likes, dislikes: video.dislikes, userAction });
});

// Комментарии
app.get('/api/videos/:id/comments', (req, res) => {
  const db = getDB();
  const comments = db.comments[req.params.id] || [];
  res.json({ comments: comments.sort((a, b) => new Date(b.date) - new Date(a.date)) });
});
app.post('/api/videos/:id/comments', (req, res) => {
  const db = getDB();
  if (!db.comments[req.params.id]) db.comments[req.params.id] = [];
  const comment = { id: uuidv4(), userId: req.body.userId || null, username: req.body.username || 'Аноним', text: req.body.text, date: new Date().toISOString(), likes: 0 };
  db.comments[req.params.id].unshift(comment);
  saveDB(db);
  res.json({ success: true, comment });
});

app.delete('/api/videos/:id', (req, res) => {
  const db = getDB();
  const index = db.videos.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Видео не найдено' });
  const video = db.videos[index];
  try {
    const vp = path.join(PUBLIC_DIR, video.videoUrl);
    if (fs.existsSync(vp)) fs.unlinkSync(vp);
    const tp = path.join(PUBLIC_DIR, video.thumbnailUrl);
    if (fs.existsSync(tp) && !video.thumbnailUrl.includes('default')) fs.unlinkSync(tp);
  } catch (e) {}
  db.videos.splice(index, 1);
  delete db.comments[video.id];
  saveDB(db);
  res.json({ success: true });
});

app.get('/api/categories', (req, res) => {
  res.json({ categories: ['Разное', 'Музыка', 'Игры', 'Образование', 'Новости', 'Спорт', 'Фильмы', 'Юмор', 'Технологии', 'Путешествия', 'Кулинария', 'Наука', 'Авто', 'Животные', 'Лайфхак'] });
});

app.get('/thumbnails/default-thumb.jpg', (req, res) => {
  res.type('image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#333"/><text x="160" y="95" text-anchor="middle" fill="#666" font-size="40" font-family="Arial">▶</text><text x="160" y="130" text-anchor="middle" fill="#555" font-size="14" font-family="Arial">Нет превью</text></svg>`);
});

app.listen(PORT, () => {
  console.log(`🚀 TipweYT запущен на http://localhost:${PORT}`);
});