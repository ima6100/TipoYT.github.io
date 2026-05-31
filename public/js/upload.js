// ============ ЗАГРУЗКА ВИДЕО ============
const API_BASE = window.location.origin;
const dropzone = document.getElementById('dropzone');
const dropzoneContent = document.getElementById('dropzoneContent');
const dropzonePreview = document.getElementById('dropzonePreview');
const videoFile = document.getElementById('videoFile');
const thumbnailFile = document.getElementById('thumbnailFile');
const thumbnailPlaceholder = document.getElementById('thumbnailPlaceholder');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const removeThumbBtn = document.getElementById('removeThumbBtn');
const uploadForm = document.getElementById('uploadForm');
const publishBtn = document.getElementById('publishBtn');
const publishText = document.getElementById('publishText');
const btnSpinner = document.getElementById('btnSpinner');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const uploadResult = document.getElementById('uploadResult');
const resultTitle = document.getElementById('resultTitle');
const resultLink = document.getElementById('resultLink');
const noChannelBlock = document.getElementById('noChannelBlock');
const channelInfo = document.getElementById('channelInfo');
const channelNameDisplay = document.getElementById('channelNameDisplay');

let selectedVideo = null;
let selectedThumb = null;

function checkChannel() {
  const user = getSavedUser();
  if (!user) {
    noChannelBlock.style.display = 'block';
    noChannelBlock.innerHTML = `<h3>Требуется вход</h3><p>Войдите и создайте канал</p><a href="/auth/login.html">Войти</a>`;
    return;
  }
  if (!user.hasChannel) {
    noChannelBlock.style.display = 'block';
    uploadForm.style.display = 'none';
    return;
  }
  noChannelBlock.style.display = 'none';
  uploadForm.style.display = 'flex';
  channelInfo.style.display = 'block';
  channelNameDisplay.textContent = `Канал: ${user.username}`;
}

dropzone.addEventListener('click', (e) => { if (!e.target.closest('.btn-remove-file')) videoFile.click(); });
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); });
dropzone.addEventListener('drop', (e) => {
  e.preventDefault(); dropzone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('video/')) { videoFile.files = files; handleVideoSelect(files[0]); }
});
videoFile.addEventListener('change', (e) => { if (e.target.files.length > 0) handleVideoSelect(e.target.files[0]); });
thumbnailFile.addEventListener('change', (e) => { if (e.target.files.length > 0) handleThumbSelect(e.target.files[0]); });

function handleVideoSelect(file) {
  selectedVideo = file;
  if (file.size > 500 * 1024 * 1024) { alert('Файл слишком большой. Максимум 500 МБ'); videoFile.value = ''; return; }
  dropzoneContent.style.display = 'none'; dropzonePreview.style.display = 'block';
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = formatFileSize(file.size);
}
function handleThumbSelect(file) {
  selectedThumb = file;
  const r = new FileReader();
  r.onload = (e) => { thumbnailPlaceholder.style.display = 'none'; thumbnailPreview.style.display = 'block'; thumbnailPreview.src = e.target.result; removeThumbBtn.style.display = 'block'; };
  r.readAsDataURL(file);
}
function removeFile() { selectedVideo = null; videoFile.value = ''; dropzoneContent.style.display = 'block'; dropzonePreview.style.display = 'none'; }
function removeThumb() { selectedThumb = null; thumbnailFile.value = ''; thumbnailPlaceholder.style.display = 'flex'; thumbnailPreview.style.display = 'none'; removeThumbBtn.style.display = 'none'; }
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' КБ';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' МБ';
  return (bytes / 1073741824).toFixed(2) + ' ГБ';
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedVideo) { alert('Выберите видео'); return; }
  const title = document.getElementById('title').value.trim();
  if (!title) { alert('Введите название'); return; }
  const user = getSavedUser();
  if (!user || !user.hasChannel) { alert('Сначала создайте канал'); return; }

  publishBtn.disabled = true; publishText.style.display = 'none'; btnSpinner.style.display = 'flex';
  uploadProgress.style.display = 'block'; uploadResult.style.display = 'none';

  const fd = new FormData();
  fd.append('userId', user.id);
  fd.append('video', selectedVideo);
  fd.append('title', title);
  fd.append('description', document.getElementById('description').value.trim());
  fd.append('category', document.getElementById('category').value);
  if (selectedThumb) fd.append('thumbnail', selectedThumb);

  try {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) { const p = Math.round((e.loaded / e.total) * 100); progressFill.style.width = p + '%'; progressText.textContent = `Загрузка: ${p}%`; }
    };
    const result = await new Promise((resolve, reject) => {
      xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText)); else reject(new Error('Ошибка загрузки')); };
      xhr.onerror = () => reject(new Error('Ошибка сети'));
      xhr.open('POST', `${API_BASE}/api/upload`);
      xhr.send(fd);
    });
    if (result.success) {
      progressFill.style.width = '100%'; progressText.textContent = 'Готово!';
      setTimeout(() => { uploadProgress.style.display = 'none'; uploadForm.style.display = 'none'; uploadResult.style.display = 'flex'; resultTitle.textContent = `"${result.video.title}" загружено`; resultLink.href = `/watch.html?id=${result.video.id}`; }, 500);
    } else throw new Error(result.error || 'Ошибка');
  } catch (err) { alert('Ошибка: ' + err.message); publishBtn.disabled = false; publishText.style.display = 'inline'; btnSpinner.style.display = 'none'; uploadProgress.style.display = 'none'; }
});

document.addEventListener('DOMContentLoaded', checkChannel);