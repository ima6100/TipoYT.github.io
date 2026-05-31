const menu = document.getElementById('menu');
const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const commandInput = document.getElementById('command-input');
const terminalBtn = document.getElementById('terminal-btn');
const chatBtn = document.getElementById('chat-btn');
const weatherBtn = document.getElementById('weather-btn');

const authButtons = document.querySelector('.auth-buttons');
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const switchToRegister = document.getElementById('switch-to-register');
const switchToLogin = document.getElementById('switch-to-login');
const closeAuth = document.getElementById('close-auth');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const adminBtn = document.getElementById('admin-btn');
const adminModal = document.getElementById('admin-modal');
const manageUsersBtn = document.getElementById('manage-users-btn');
const siteSettingsBtn = document.getElementById('site-settings-btn');
const toggleSiteBtn = document.getElementById('toggle-site-btn');
const closeAdmin = document.getElementById('close-admin');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const changePasswordBtn = document.getElementById('change-password-btn');
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
const closeChangePassword = document.getElementById('close-change-password');
const changeVersionBtn = document.getElementById('change-version-btn');
const changeVersionModal = document.getElementById('change-version-modal');
const changeVersionForm = document.getElementById('change-version-form');
const closeChangeVersion = document.getElementById('close-change-version');
const blockUserBtn = document.getElementById('block-user-btn');
const blockUserModal = document.getElementById('block-user-modal');
const blockUserForm = document.getElementById('block-user-form');
const closeBlockUser = document.getElementById('close-block-user');
const deleteUserBtn = document.getElementById('delete-user-btn');
const deleteUserModal = document.getElementById('delete-user-modal');
const deleteUserForm = document.getElementById('delete-user-form');
const closeDeleteUser = document.getElementById('close-delete-user');
const unblockUserBtn = document.getElementById('unblock-user-btn');
const unblockUserModal = document.getElementById('unblock-user-modal');
const unblockUserForm = document.getElementById('unblock-user-form');
const closeUnblockUser = document.getElementById('close-unblock-user');
const siteDisabledOverlay = document.getElementById('site-disabled-overlay');
const enableSiteForm = document.getElementById('enable-site-form');
const usersModal = document.getElementById('users-modal');
const usersList = document.getElementById('users-list');
const closeUsers = document.getElementById('close-users');
const userSettingsBtn = document.getElementById('user-settings-btn');
const userSettingsModal = document.getElementById('user-settings-modal');
const closeUserSettings = document.getElementById('close-user-settings');
const toggleUserSavingBtn = document.getElementById('toggle-user-saving-btn');
const weatherModal = document.getElementById('weather-modal');
const weatherCity = document.getElementById('weather-city');
const getWeatherBtn = document.getElementById('get-weather-btn');
const weatherResult = document.getElementById('weather-result');
const closeWeather = document.getElementById('close-weather');
const bottomMessage = document.getElementById('bottom-message');

let appData = {};

function loadAppData() {
    const data = localStorage.getItem('appData');
    if (data) {
        appData = JSON.parse(data);
    } else {
        // Инициализация по умолчанию
        appData = {
            users: {},
            currentUser: null,
            adminUser: null,
            siteDisabled: false,
            enablePassword: '123456789',
            appVersion: '1.01.1',
            userSavingEnabled: true
        };
        saveAppData();
    }
}

function saveAppData() {
    localStorage.setItem('appData', JSON.stringify(appData));
}

loadAppData();

let currentUser = appData.currentUser;
let userSavingEnabled = appData.userSavingEnabled;

function getUsers() {
    return appData.users || {};
}

function saveUsers(users) {
    appData.users = users;
    saveAppData();
}

function showModal() {
    authModal.style.display = 'flex';
}

function hideModal() {
    authModal.style.display = 'none';
    loginForm.reset();
    registerForm.reset();
}

function showLogin() {
    authTitle.textContent = 'Вход';
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    switchToRegister.style.display = 'inline';
    switchToLogin.style.display = 'none';
}

function showRegister() {
    authTitle.textContent = 'Регистрация';
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    switchToRegister.style.display = 'none';
    switchToLogin.style.display = 'inline';
}

function loginUser(username, password) {
    const users = getUsers();
    const adminUser = appData.adminUser;
    if (users[username] && users[username].password === password) {
        if (users[username].blocked) {
            showBottomMessage('Ваш аккаунт заблокирован.');
            return;
        }
        currentUser = username;
        appData.currentUser = username;
        saveAppData();
        authButtons.style.display = 'none';
        menu.style.display = 'flex';
        logoutBtn.style.display = 'inline-block';
        userInfo.style.display = 'block';
        userInfo.textContent = `Пользователь: ${username}`;
        if (username === adminUser) {
            adminBtn.style.display = 'inline-block';
        } else {
            adminBtn.style.display = 'none';
        }
        hideModal();
        setBackground();
        addLine(`Добро пожаловать, ${username}!`);
        // Воспроизвести звук входа
        const loginSound = new Audio('sounds/startup-sound.mp3');
        loginSound.play().catch(e => console.log('Звук не воспроизведен:', e));
    } else {
        showBottomMessage('Неверное имя пользователя или пароль.');
    }
}

function registerUser(username, password) {
    if (!userSavingEnabled) {
        showBottomMessage('Регистрация новых пользователей временно отключена.');
        return;
    }
    const users = getUsers();
    if (users[username]) {
        showBottomMessage('Пользователь уже существует.');
    } else {
        users[username] = { password: password, registeredAt: new Date().toISOString() };
        if (username === 'USER_228') {
            appData.adminUser = 'USER_228';
        }
        saveUsers(users);
        showBottomMessage('Регистрация успешна. Теперь войдите.');
        showLogin();
    }
}

function logout() {
    currentUser = null;
    appData.currentUser = null;
    saveAppData();
    authButtons.style.display = 'flex';
    menu.style.display = 'none';
    logoutBtn.style.display = 'none';
    userInfo.style.display = 'none';
    userInfo.textContent = '';
    adminBtn.style.display = 'none';
    terminal.style.display = 'none'; // Скрыть терминал при выходе
    setBackground();
}

function showAdminPanel() {
    adminModal.style.display = 'flex';
}

function hideAdminPanel() {
    adminModal.style.display = 'none';
}

function manageUsers() {
    showUsersModal();
}

let usersUpdateInterval;

function showUsersModal() {
    updateUsersList();
    usersModal.style.display = 'flex';
    usersUpdateInterval = setInterval(updateUsersList, 5000); // Обновление каждые 5 секунд
}

function hideUsersModal() {
    usersModal.style.display = 'none';
    clearInterval(usersUpdateInterval);
}

function showUserSettingsModal() {
    userSettingsModal.style.display = 'flex';
}

function hideUserSettingsModal() {
    userSettingsModal.style.display = 'none';
}

function updateUsersList() {
    const users = getUsers();
    usersList.innerHTML = '<h3>Зарегистрированные пользователи:</h3>';
    if (Object.keys(users).length === 0) {
        usersList.innerHTML += '<p>Нет зарегистрированных пользователей.</p>';
        return;
    }
    const ul = document.createElement('ul');
    for (const username in users) {
        const li = document.createElement('li');
        const registeredAt = new Date(users[username].registeredAt).toLocaleString('ru-RU');
        const status = users[username].blocked ? ' (заблокирован)' : '';
        li.textContent = `${username} - Зарегистрирован: ${registeredAt}${status}`;
        ul.appendChild(li);
    }
    usersList.appendChild(ul);
}

function showSettingsModal() {
    settingsModal.style.display = 'flex';
}

function hideSettingsModal() {
    settingsModal.style.display = 'none';
}

function showChangePasswordModal() {
    changePasswordModal.style.display = 'flex';
}

function hideChangePasswordModal() {
    changePasswordModal.style.display = 'none';
    changePasswordForm.reset();
}

function showChangeVersionModal() {
    changeVersionModal.style.display = 'flex';
}

function hideChangeVersionModal() {
    changeVersionModal.style.display = 'none';
    changeVersionForm.reset();
}

function showBlockUserModal() {
    blockUserModal.style.display = 'flex';
}

function hideBlockUserModal() {
    blockUserModal.style.display = 'none';
    blockUserForm.reset();
}

function showDeleteUserModal() {
    deleteUserModal.style.display = 'flex';
}

function hideDeleteUserModal() {
    deleteUserModal.style.display = 'none';
    deleteUserForm.reset();
}

function showUnblockUserModal() {
    unblockUserModal.style.display = 'flex';
}

function hideUnblockUserModal() {
    unblockUserModal.style.display = 'none';
    unblockUserForm.reset();
}

function changeEnablePassword(newPassword) {
    appData.enablePassword = newPassword;
    saveAppData();
    showBottomMessage('Пароль для включения сайта изменен.');
    hideChangePasswordModal();
}

function changeVersion(newVersion) {
    appData.appVersion = newVersion;
    saveAppData();
    showBottomMessage('Версия изменена.');
    hideChangeVersionModal();
}

function blockUser(username) {
    const users = getUsers();
    if (users[username]) {
        users[username].blocked = true;
        saveUsers(users);
        showBottomMessage('Пользователь заблокирован.');
        hideBlockUserModal();
    } else {
        showBottomMessage('Пользователь не найден.');
    }
}

function deleteUser(username) {
    const users = getUsers();
    if (users[username]) {
        delete users[username];
        saveUsers(users);
        showBottomMessage('Пользователь удален.');
        hideDeleteUserModal();
        // Обновить список, если модал открыт
        if (usersModal.style.display === 'flex') {
            updateUsersList();
        }
    } else {
        showBottomMessage('Пользователь не найден.');
    }
}

function unblockUser(username) {
    const users = getUsers();
    if (users[username]) {
        users[username].blocked = false;
        saveUsers(users);
        showBottomMessage('Пользователь разблокирован.');
        hideUnblockUserModal();
    } else {
        showBottomMessage('Пользователь не найден.');
    }
}

function siteSettings() {
    showSettingsModal();
}

function toggleSite() {
    const isDisabled = appData.siteDisabled;
    if (isDisabled) {
        appData.siteDisabled = false;
        siteDisabledOverlay.style.display = 'none';
        showBottomMessage('Сайт включен.');
    } else {
        appData.siteDisabled = true;
        siteDisabledOverlay.style.display = 'flex';
        showBottomMessage('Сайт отключен.');
    }
    saveAppData();
}

function toggleUserSaving() {
    userSavingEnabled = !userSavingEnabled;
    appData.userSavingEnabled = userSavingEnabled;
    saveAppData();
    showBottomMessage(userSavingEnabled ? 'Сохранение пользователей включено.' : 'Сохранение пользователей выключено.');
}

function checkSiteStatus() {
    const isDisabled = appData.siteDisabled;
    if (isDisabled && currentUser !== 'USER_228') {
        siteDisabledOverlay.style.display = 'flex';
    } else {
        siteDisabledOverlay.style.display = 'none';
    }
}

function enableSiteByPassword(password) {
    const enablePassword = appData.enablePassword || '123456789';
    if (password === enablePassword) {
        appData.siteDisabled = false;
        siteDisabledOverlay.style.display = 'none';
        enableSiteForm.reset();
        showBottomMessage('Сайт включен.');
    } else {
        showBottomMessage('Неверный пароль администратора.');
    }
}

function setBackground() {
    if (currentUser === 'USER_228') {
        document.body.style.background = 'linear-gradient(45deg, #800080, #0000FF)';
        document.body.style.color = '#FFFFFF'; // Белый текст для контраста
    } else {
        document.body.style.background = '#000';
        document.body.style.color = '#00ff00';
    }
}

function showBottomMessage(text, duration = 3000) {
    bottomMessage.textContent = text;
    bottomMessage.classList.add('show');
    setTimeout(() => {
        bottomMessage.classList.remove('show');
    }, duration);
}

async function getWeather(city = 'Moscow') {
    const apiKey = '58a69458dd58af9ae3e3686ad54e108f';
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`);
        const data = await response.json();
        if (data.cod === 200) {
            const temp = Math.round(data.main.temp);
            const description = data.weather[0].description;
            const message = `Погода в ${city}: ${temp}°C, ${description}`;
            weatherResult.textContent = message;
        } else {
            weatherResult.textContent = 'Не удалось получить погоду.';
        }
    } catch (error) {
        weatherResult.textContent = 'Ошибка при получении погоды.';
    }
}

function checkAuth() {
    const savedUser = appData.currentUser;
    const adminUser = appData.adminUser;
    if (savedUser) {
        currentUser = savedUser;
        authButtons.style.display = 'none';
        menu.style.display = 'flex';
        logoutBtn.style.display = 'inline-block';
        userInfo.style.display = 'block';
        userInfo.textContent = `Пользователь: ${savedUser}`;
        if (savedUser === adminUser) {
            adminBtn.style.display = 'inline-block';
        } else {
            adminBtn.style.display = 'none';
        }
        setBackground();
    } else {
        currentUser = null;
        authButtons.style.display = 'flex';
        menu.style.display = 'none';
        logoutBtn.style.display = 'none';
        userInfo.style.display = 'none';
        adminBtn.style.display = 'none';
        setBackground();
    }
    checkSiteStatus();
}

function addLine(text) {
    const line = document.createElement('div');
    line.className = 'line';
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function processCommand(command) {
    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
        case 'help':
            addLine('Доступные команды:');
            addLine('  help - показать эту справку');
            addLine('  clear - очистить экран');
            addLine('  echo [текст] - вывести текст');
            addLine('  date - показать текущую дату');
            addLine('  whoami - показать имя пользователя');
            addLine('  pwd - текущий путь');
            addLine('  chat - открыть чат в новом окне');
            addLine('  info - показать информацию о системе');
            addLine('  menu - вернуться в меню');
            if (currentUser === appData.adminUser) {
                addLine('  users - показать список пользователей (только для админа)');
            }
            break;
        case 'clear':
            output.innerHTML = '';
            break;
        case 'echo':
            addLine(args.join(' '));
            break;
        case 'date':
            addLine(new Date().toLocaleString('ru-RU'));
            break;
        case 'whoami':
            addLine('user');
            break;
        case 'pwd':
            addLine('/home/user/terminal');
            break;
        case 'chat':
            window.open('chat.html', '_blank');
            addLine('Открыто новое окно с чатом.');
            break;
        case 'info':
            const users = getUsers();
            const userCount = Object.keys(users).length;
            const version = appData.appVersion || '1.01.1';
            addLine(`Версия: ${version}`);
            addLine(`Зарегистрированных пользователей: ${userCount}`);
            break;
        case 'menu':
            menu.style.display = 'flex';
            terminal.style.display = 'none';
            break;
        case 'users':
            if (currentUser === appData.adminUser) {
                const users = getUsers();
                addLine('Зарегистрированные пользователи:');
                for (const username in users) {
                    const status = users[username].blocked ? ' (заблокирован)' : '';
                    addLine(`- ${username}${status}`);
                }
            } else {
                addLine('Доступ запрещен.');
            }
            break;
        default:
            addLine(`bash: ${cmd}: команда не найдена`);
    }
}

commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = commandInput.value;
        if (command.trim()) {
            addLine('$ ' + command);
            processCommand(command);
        }
        commandInput.value = '';
    }
});

terminalBtn.addEventListener('click', () => {
    menu.style.display = 'none';
    terminal.style.display = 'block';
    commandInput.focus();
});

chatBtn.addEventListener('click', () => {
    window.open('chat.html', '_blank');
});

weatherBtn.addEventListener('click', () => {
    weatherModal.style.display = 'flex';
    weatherCity.focus();
});

const registerBtn = document.getElementById('register-btn');
const loginBtn = document.getElementById('login-btn');

registerBtn.addEventListener('click', () => {
    showModal();
    showRegister();
});

loginBtn.addEventListener('click', () => {
    showModal();
    showLogin();
});

switchToRegister.addEventListener('click', showRegister);
switchToLogin.addEventListener('click', showLogin);
closeAuth.addEventListener('click', hideModal);

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    loginUser(username, password);
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    registerUser(username, password);
});

// Проверка аутентификации при загрузке
checkAuth();

logoutBtn.addEventListener('click', logout);

adminBtn.addEventListener('click', showAdminPanel);
closeAdmin.addEventListener('click', hideAdminPanel);
userSettingsBtn.addEventListener('click', showUserSettingsModal);
closeUserSettings.addEventListener('click', hideUserSettingsModal);
manageUsersBtn.addEventListener('click', manageUsers);
siteSettingsBtn.addEventListener('click', siteSettings);
closeSettings.addEventListener('click', hideSettingsModal);
changePasswordBtn.addEventListener('click', showChangePasswordModal);
closeChangePassword.addEventListener('click', hideChangePasswordModal);
toggleSiteBtn.addEventListener('click', toggleSite);
toggleUserSavingBtn.addEventListener('click', toggleUserSaving);
changeVersionBtn.addEventListener('click', showChangeVersionModal);
closeChangeVersion.addEventListener('click', hideChangeVersionModal);
blockUserBtn.addEventListener('click', showBlockUserModal);
closeBlockUser.addEventListener('click', hideBlockUserModal);
deleteUserBtn.addEventListener('click', showDeleteUserModal);
closeDeleteUser.addEventListener('click', hideDeleteUserModal);
unblockUserBtn.addEventListener('click', showUnblockUserModal);
closeUnblockUser.addEventListener('click', hideUnblockUserModal);

changePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    changeEnablePassword(newPassword);
});

changeVersionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newVersion = document.getElementById('new-version').value;
    changeVersion(newVersion);
});

blockUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('block-username').value;
    blockUser(username);
});

deleteUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('delete-username').value;
    deleteUser(username);
});

unblockUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('unblock-username').value;
    unblockUser(username);
});

enableSiteForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    enableSiteByPassword(password);
});

closeUsers.addEventListener('click', hideUsersModal);

getWeatherBtn.addEventListener('click', () => {
    const city = weatherCity.value.trim();
    if (city) {
        getWeather(city);
    } else {
        weatherResult.textContent = 'Введите город.';
    }
});

closeWeather.addEventListener('click', () => {
    weatherModal.style.display = 'none';
    weatherCity.value = '';
    weatherResult.textContent = '';
});