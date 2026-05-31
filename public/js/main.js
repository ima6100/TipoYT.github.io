// ============ ГЛАВНЫЙ СКРИПТ - Главная страница ============

const API_BASE = window.location.origin;
const videoGrid = document.getElementById('videoGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const categoriesBar = document.getElementById('categoriesBar');

let currentCategory = 'all';
let currentSort = 'date';
let currentQuery = '';

// Получить параметры из URL
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  currentQuery = params.get('q') || '';
  currentSort = params.get('sort') || 'date';
  currentCategory = params.get('category') || 'all';
  
  // Установить значение поиска
  if (currentQuery) {
    document.getElementById('searchInput').value = currentQuery;
  }
}

// Форматировать число просмотров
function formatViews(views) {
  if (!views) return '0';
  if (views >= 1000000) return (views / 1000000).toFixed(1) + ' млн';
  if (views >= 1000) return (views / 1000).toFixed(1) + ' тыс';
  return views.toString();
}

// Форматировать дату
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

// Получить первую букву названия для аватара
function getAvatarLetter(channelName) {
  if (!channelName) return 'К';
  return channelName.trim().charAt(0).toUpperCase();
}

// Создать карточку видео
function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.onclick = () => {
    window.location.href = `/watch.html?id=${video.id}`;
  };

  const randomColor = ['#ff4d4d', '#3ea6ff', '#4CAF50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#ff5722'][
    Math.floor(Math.random() * 8)
  ];

  card.innerHTML = `
    <div class="video-card-thumbnail">
      <img src="${video.thumbnailUrl || '/thumbnails/default-thumb.jpg'}" 
           alt="${video.title}" 
           loading="lazy"
           onerror="this.src='/thumbnails/default-thumb.jpg'">
      <span class="video-card-duration">${video.duration || '00:00'}</span>
    </div>
    <div class="video-card-info">
      <div class="video-card-avatar" style="background: ${randomColor}">
        ${getAvatarLetter(video.channelName)}
      </div>
      <div class="video-card-details">
        <div class="video-card-title">${video.title}</div>
        <div class="video-card-channel">${video.channelName || 'Мой канал'}</div>
        <div class="video-card-meta">
          ${formatViews(video.views)} просмотров • ${formatDate(video.createdAt)}
        </div>
      </div>
    </div>
  `;

  return card;
}

// Загрузить видео
async function loadVideos() {
  // Показываем загрузку
  loadingIndicator.style.display = 'flex';
  emptyState.style.display = 'none';
  errorState.style.display = 'none';
  videoGrid.innerHTML = '';

  try {
    let url = `${API_BASE}/api/videos?sort=${currentSort}`;
    if (currentQuery) url += `&q=${encodeURIComponent(currentQuery)}`;
    if (currentCategory !== 'all') url += `&category=${encodeURIComponent(currentCategory)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка сервера');

    const data = await response.json();
    const videos = data.videos || [];

    // Скрываем загрузку
    loadingIndicator.style.display = 'none';

    if (videos.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    // Отрисовываем видео
    videos.forEach(video => {
      videoGrid.appendChild(createVideoCard(video));
    });

  } catch (err) {
    console.error('Ошибка загрузки видео:', err);
    loadingIndicator.style.display = 'none';
    errorState.style.display = 'flex';
  }
}

// Обработчик выбора категории
categoriesBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;

  const category = btn.dataset.category;
  
  // Обновляем активную кнопку
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  currentCategory = category;
  currentSort = 'date';
  
  // Обновляем URL без перезагрузки
  const url = new URL(window.location);
  if (category !== 'all') url.searchParams.set('category', category);
  else url.searchParams.delete('category');
  url.searchParams.delete('sort');
  url.searchParams.delete('q');
  window.history.pushState({}, '', url);

  loadVideos();
});

// Обработчик поиска
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const query = document.getElementById('searchInput').value.trim();
  
  const url = new URL(window.location);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  url.searchParams.delete('category');
  url.searchParams.delete('sort');
  window.location.href = url.toString();
});

// Работа с выбором категории из URL
function initCategories() {
  const catParam = currentCategory;
  if (catParam !== 'all') {
    const btns = document.querySelectorAll('.cat-btn');
    btns.forEach(b => {
      if (b.dataset.category === catParam) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }
}

// Прокрутка категорий колёсиком мыши
categoriesBar.addEventListener('wheel', (e) => {
  e.preventDefault();
  categoriesBar.scrollLeft += e.deltaY;
});

// Инициализация
getURLParams();
initCategories();
loadVideos();