// ============ УПРАВЛЕНИЕ КАНАЛОМ ============
const API = window.location.origin;

async function initSettings() {
  const user = getSavedUser();
  const noChannel = document.getElementById('noChannel');
  const hasChannel = document.getElementById('hasChannel');
  const notLoggedIn = document.getElementById('notLoggedIn');
  if (!user) { notLoggedIn.style.display = 'block'; return; }
  try {
    const resp = await fetch(`${API}/api/auth/user`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
    const data = await resp.json();
    if (data.user) {
      updateSavedUser(data.user);
      if (data.user.hasChannel) loadChannel(data.user.channelId);
      else noChannel.style.display = 'block';
    }
  } catch (err) {
    if (user.hasChannel) loadChannel(user.channelId);
    else noChannel.style.display = 'block';
  }
}

async function loadChannel(channelId) {
  document.getElementById('hasChannel').style.display = 'block';
  try {
    const resp = await fetch(`${API}/api/channels/${channelId}`);
    const data = await resp.json();
    const ch = data.channel;
    document.getElementById('editChannelName').value = ch.name;
    document.getElementById('editChannelDesc').value = ch.description || '';
    document.getElementById('channelNameDisplay').textContent = ch.name;
    document.getElementById('statVideos').textContent = data.videoCount || 0;
    document.getElementById('statSubs').textContent = ch.subscribers || 0;
    const av = document.getElementById('channelAvatarPreview');
    if (ch.avatarUrl) { av.style.backgroundImage = `url(${ch.avatarUrl})`; av.style.backgroundSize = 'cover'; av.textContent = ''; }
    else av.textContent = ch.name.charAt(0).toUpperCase();
    let tv = 0;
    if (data.videos) tv = data.videos.reduce((s, v) => s + (v.views || 0), 0);
    document.getElementById('statViews').textContent = tv;
  } catch (err) { console.error(err); }
}

// Создание канала с аватаром
const createForm = document.getElementById('createChannelForm');
if (createForm) {
  const avatarInput = document.createElement('input');
  avatarInput.type = 'file'; avatarInput.id = 'channelAvatarInput'; avatarInput.accept = 'image/*'; avatarInput.style.display = 'none';
  const avatarRow = document.createElement('div');
  avatarRow.className = 'settings-avatar';
  avatarRow.innerHTML = `<div class="channel-settings-avatar" id="createAvatarPreview">Ф</div><div><p>Аватар канала</p><button type="button" class="btn-change-avatar" onclick="document.getElementById('channelAvatarInput').click()">Выбрать</button></div>`;
  const descField = document.querySelector('#createChannelForm .auth-field:last-child');
  if (descField) descField.parentNode.insertBefore(avatarRow, descField.nextSibling);
  createForm.appendChild(avatarInput);
  avatarInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const r = new FileReader();
      r.onload = (ev) => { const el = document.getElementById('createAvatarPreview'); el.style.backgroundImage = `url(${ev.target.result})`; el.style.backgroundSize = 'cover'; el.textContent = ''; };
      r.readAsDataURL(e.target.files[0]);
    }
  });
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getSavedUser();
    if (!user) return;
    const errorEl = document.getElementById('channelError');
    const btn = createForm.querySelector('.auth-btn');
    btn.disabled = true;
    const fd = new FormData();
    fd.append('userId', user.id);
    fd.append('channelName', document.getElementById('channelNameInput').value);
    fd.append('description', document.getElementById('channelDescInput').value);
    if (avatarInput.files.length > 0) fd.append('avatar', avatarInput.files[0]);
    try {
      const resp = await fetch(`${API}/api/channels/create`, { method: 'POST', body: fd });
      const data = await resp.json();
      if (data.success) { updateSavedUser({ hasChannel: true, channelId: data.channel.id }); window.location.reload(); }
      else { errorEl.textContent = data.error || 'Ошибка'; errorEl.style.display = 'block'; }
    } catch (err) { errorEl.textContent = 'Ошибка соединения'; errorEl.style.display = 'block'; }
    btn.disabled = false;
  });
}

// Обновление
const updateForm = document.getElementById('updateChannelForm');
if (updateForm) {
  updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = getSavedUser();
    if (!user) return;
    const errorEl = document.getElementById('updateError');
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; btn.textContent = 'Сохранение...';
    const fd = new FormData();
    fd.append('channelId', user.channelId); fd.append('userId', user.id);
    fd.append('name', document.getElementById('editChannelName').value);
    fd.append('description', document.getElementById('editChannelDesc').value);
    const af = document.getElementById('avatarInput');
    if (af.files.length > 0) fd.append('avatar', af.files[0]);
    try {
      const resp = await fetch(`${API}/api/channels/update`, { method: 'POST', body: fd });
      const data = await resp.json();
      if (data.success) window.location.reload();
      else { errorEl.textContent = data.error || 'Ошибка'; errorEl.style.display = 'block'; btn.disabled = false; btn.textContent = 'Сохранить'; }
    } catch (err) { errorEl.textContent = 'Ошибка соединения'; errorEl.style.display = 'block'; btn.disabled = false; btn.textContent = 'Сохранить'; }
  });
}

const avatarInput = document.getElementById('avatarInput');
if (avatarInput) {
  avatarInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const r = new FileReader();
      r.onload = (ev) => { const el = document.getElementById('channelAvatarPreview'); el.style.backgroundImage = `url(${ev.target.result})`; el.style.backgroundSize = 'cover'; el.textContent = ''; };
      r.readAsDataURL(e.target.files[0]);
    }
  });
}

document.addEventListener('DOMContentLoaded', initSettings);