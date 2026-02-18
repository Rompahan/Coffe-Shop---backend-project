// ============================================================
//  BrewHouse Coffee Shop — script.js
//  API: https://coffee-shop-api.onrender.com
// ============================================================

const API_URL = 'https://coffe-shop-backend-project.onrender.com';

// Font Awesome иконки для категорий
const CATEGORY_ICON = {
  Espresso:  '<i class="fas fa-coffee"></i>',
  Cappuccino:'<i class="fas fa-mug-hot"></i>',
  Latte:     '<i class="fas fa-glass-whiskey"></i>',
  Tea:       '<i class="fas fa-leaf"></i>',
  IceLatte:  '<i class="fas fa-ice-cream"></i>',
};

const CATEGORY_LABELS = {
  Espresso:  'Эспрессо',
  Cappuccino:'Капучино',
  Latte:     'Латте',
  Tea:       'Чай',
  IceLatte:  'Айс Латте',
};

// ===================== STATE =====================
let currentUser  = null;
let allProducts  = [];
let activeFilter = 'all';

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  // Loader
  setTimeout(() => {
    document.getElementById('page-loader').classList.add('hidden');
  }, 1500);

  // Restore session
  restoreSession();

  // Event listeners
  document.getElementById('nav-burger').addEventListener('click', toggleBurger);
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigate(link.dataset.page);
      closeBurger();
    });
  });
  document.querySelector('.nav-logo').addEventListener('click', () => navigate('home'));

  // Scroll navbar shadow
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
  });

  // Forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
  document.getElementById('product-form').addEventListener('submit', handleProductSave);

  // Category filter
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      renderMenuProducts();
    });
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        const id = overlay.id.replace('modal-', '');
        closeModal(id);
      }
    });
  });

  // Load home products
  loadHomeProducts();
});

// ===================== NAVIGATION =====================
function navigate(page) {
  if (page === 'profile' && !currentUser) {
    openModal('login');
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (page === 'menu') loadMenuProducts();
  if (page === 'profile') loadProfile();
}

// ===================== SESSION =====================
function restoreSession() {
  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('user');
  if (token && user) {
    currentUser = JSON.parse(user);
    updateNavForUser();
  }
}

function updateNavForUser() {
  const loggedIn = !!currentUser;
  document.getElementById('nav-login-btn').style.display  = loggedIn ? 'none' : '';
  document.getElementById('nav-logout-btn').style.display = loggedIn ? '' : 'none';
  document.getElementById('nav-profile').style.display    = loggedIn ? '' : 'none';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  updateNavForUser();
  navigate('home');
  showToast('success', 'Вы вышли из аккаунта');
}

// ===================== API HELPERS =====================
function getToken() {
  return localStorage.getItem('token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || `Ошибка ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к серверу. Проверьте интернет.');
    }
    throw err;
  }
}

// ===================== AUTH =====================
async function handleLogin(e) {
  e.preventDefault();
  const btn   = document.getElementById('login-submit-btn');
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;

  if (!email || !pass) { showToast('error', 'Заполните все поля'); return; }

  setButtonLoading(btn, 'Входим...');
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });

    // Сохраняем токен и пользователя
    const token = data.token || data.accessToken || data.data?.token;
    const user  = data.user  || data.data?.user  || data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    currentUser = user;

    updateNavForUser();
    closeModal('login');
    document.getElementById('login-form').reset();
    showToast('success', `Добро пожаловать, ${user.username || user.email}!`);
    navigate('menu');
  } catch (err) {
    showToast('error', err.message);
  } finally {
    resetButton(btn, 'Войти');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn      = document.getElementById('reg-submit-btn');
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const pass     = document.getElementById('reg-password').value;

  if (!username || !email || !pass) { showToast('error', 'Заполните все поля'); return; }
  if (pass.length < 6) { showToast('error', 'Пароль минимум 6 символов'); return; }

  setButtonLoading(btn, 'Создаём...');
  try {
    await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password: pass }),
    });

    closeModal('register');
    document.getElementById('register-form').reset();
    showToast('success', 'Аккаунт создан! Войдите в систему.');
    openModal('login');
  } catch (err) {
    showToast('error', err.message);
  } finally {
    resetButton(btn, 'Создать аккаунт');
  }
}

// ===================== PRODUCTS =====================
async function loadHomeProducts() {
  try {
    const data = await apiFetch('/api/products');
    const products = data.products || data.data || data;
    allProducts = Array.isArray(products) ? products : [];
    const preview = allProducts.slice(0, 3);
    renderProductGrid('home-products-grid', preview, false);
  } catch (err) {
    document.getElementById('home-products-grid').innerHTML =
      `<div class="empty-state"><div class="es-icon"><i class="fas fa-exclamation-triangle"></i></div><h3>Не удалось загрузить меню</h3><p>${err.message}</p></div>`;
  }
}

async function loadMenuProducts() {
  document.getElementById('menu-products-grid').innerHTML = skeletons(6);
  try {
    const data = await apiFetch('/api/products');
    const products = data.products || data.data || data;
    allProducts = Array.isArray(products) ? products : [];
    // Показать admin bar
    const isAdmin = currentUser?.role === 'admin';
    document.getElementById('admin-add-bar').style.display = isAdmin ? 'flex' : 'none';
    renderMenuProducts();
  } catch (err) {
    document.getElementById('menu-products-grid').innerHTML =
      `<div class="empty-state"><div class="es-icon"><i class="fas fa-mug-hot"></i></div><h3>Меню временно недоступно</h3><p>${err.message}</p></div>`;
  }
}

function renderMenuProducts() {
  const filtered = activeFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === activeFilter);
  const isAdmin = currentUser?.role === 'admin';
  renderProductGrid('menu-products-grid', filtered, isAdmin);
}

function renderProductGrid(containerId, products, showAdmin) {
  const container = document.getElementById(containerId);
  if (!products.length) {
    container.innerHTML = `<div class="empty-state"><div class="es-icon"><i class="fas fa-leaf"></i></div><h3>Продукты не найдены</h3><p>Попробуйте другую категорию</p></div>`;
    return;
  }
  container.innerHTML = products.map(p => productCard(p, showAdmin)).join('');
}

function productCard(p, showAdmin) {
  const icon    = CATEGORY_ICON[p.category] || '<i class="fas fa-mug-hot"></i>';
  const catLabel = CATEGORY_LABELS[p.category] || p.category;
  const avail  = p.available !== false;
  const adminHTML = showAdmin ? `
    <div class="product-admin-actions">
      <button class="btn-edit" onclick="openProductModal(${JSON.stringify(p).replace(/"/g,'&quot;')})">
        <i class="fas fa-edit"></i> Изменить
      </button>
      <button class="btn-danger" onclick="deleteProduct('${p._id}')">
        <i class="fas fa-trash-alt"></i> Удалить
      </button>
    </div>` : '';

  return `
    <div class="product-card">
      <div class="product-card-image">${icon}</div>
      <div class="product-card-body">
        <p class="product-category">${catLabel}</p>
        <h3 class="product-name">${escHtml(p.name)}</h3>
        <p class="product-desc">${escHtml(p.description || '')}</p>
        <div class="product-footer">
          <div class="product-price">${p.price} <span>₸</span></div>
          <span class="product-availability ${avail ? 'available' : 'unavailable'}">
            ${avail ? 'Есть' : 'Нет'}
          </span>
        </div>
        ${adminHTML}
      </div>
    </div>`;
}

// ===================== PROFILE =====================
async function loadProfile() {
  try {
    const data = await apiFetch('/api/users/profile');
    const user = data.user || data.data || data;
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));

    document.getElementById('profile-username').textContent = user.username || '—';
    document.getElementById('profile-email').textContent    = user.email    || '—';
    document.getElementById('profile-role-badge').innerHTML = user.role === 'admin'
      ? '<i class="fas fa-crown"></i> Администратор'
      : '<i class="fas fa-user"></i> Пользователь';
    document.getElementById('profile-avatar').innerHTML = user.role === 'admin'
      ? '<i class="fas fa-crown" style="color:var(--gold)"></i>'
      : '<i class="fas fa-user-circle"></i>';

    if (user.createdAt) {
      const d = new Date(user.createdAt);
      document.getElementById('profile-created').textContent = `Регистрация: ${d.toLocaleDateString('ru-RU')}`;
    }

    document.getElementById('edit-username').value = user.username || '';
    document.getElementById('edit-email').value    = user.email    || '';
  } catch (err) {
    showToast('error', 'Не удалось загрузить профиль: ' + err.message);
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const btn      = e.submitter || document.querySelector('#profile-form .btn-primary');
  const username = document.getElementById('edit-username').value.trim();
  const email    = document.getElementById('edit-email').value.trim();

  if (!username || !email) { showToast('error', 'Заполните все поля'); return; }

  setButtonLoading(btn, 'Сохраняем...');
  try {
    const data = await apiFetch('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ username, email }),
    });
    const user = data.user || data.data || data;
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    showToast('success', 'Профиль обновлён!');
    loadProfile();
  } catch (err) {
    showToast('error', err.message);
  } finally {
    resetButton(btn, 'Сохранить изменения');
  }
}

// ===================== PRODUCT CRUD (ADMIN) =====================
function openProductModal(product = null) {
  const form  = document.getElementById('product-form');
  const title = document.getElementById('product-modal-title');
  const btn   = document.getElementById('product-submit-btn');

  form.reset();
  document.getElementById('product-id').value = '';

  if (product && typeof product === 'object') {
    title.textContent = 'Редактировать продукт';
    btn.textContent   = 'Сохранить изменения';
    document.getElementById('product-id').value          = product._id;
    document.getElementById('product-name').value        = product.name || '';
    document.getElementById('product-price').value       = product.price || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-category').value    = product.category || 'espresso';
    document.getElementById('product-stock').value       = product.stock || '';
    document.getElementById('product-available').checked = product.available !== false;
  } else {
    title.textContent = 'Добавить продукт';
    btn.textContent   = 'Добавить';
  }

  openModal('product');
}

async function handleProductSave(e) {
  e.preventDefault();
  const btn = document.getElementById('product-submit-btn');
  const id  = document.getElementById('product-id').value;

  const body = {
    name:        document.getElementById('product-name').value.trim(),
    price:       Number(document.getElementById('product-price').value),
    description: document.getElementById('product-description').value.trim(),
    category:    document.getElementById('product-category').value,
    stock:       Number(document.getElementById('product-stock').value) || undefined,
    available:   document.getElementById('product-available').checked,
  };

  if (!body.name || !body.price) { showToast('error', 'Название и цена обязательны'); return; }

  setButtonLoading(btn, id ? 'Сохраняем...' : 'Добавляем...');
  try {
    if (id) {
      await apiFetch(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('success', 'Продукт обновлён!');
    } else {
      await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(body) });
      showToast('success', 'Продукт добавлен!');
    }
    closeModal('product');
    loadMenuProducts();
  } catch (err) {
    showToast('error', err.message);
  } finally {
    resetButton(btn, id ? 'Сохранить изменения' : 'Добавить');
  }
}

async function deleteProduct(id) {
  if (!confirm('Удалить этот продукт?')) return;
  try {
    await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    showToast('success', 'Продукт удалён');
    loadMenuProducts();
  } catch (err) {
    showToast('error', err.message);
  }
}

// ===================== MODALS =====================
function openModal(name) {
  document.getElementById(`modal-${name}`).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(name) {
  document.getElementById(`modal-${name}`).classList.remove('open');
  document.body.style.overflow = '';
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 150);
}

// ===================== BURGER =====================
function toggleBurger() {
  document.getElementById('nav-links').classList.toggle('open');
}

function closeBurger() {
  document.getElementById('nav-links').classList.remove('open');
}

// ===================== TOAST =====================
function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const icons = {
    success: '<i class="fas fa-check-circle"></i>',
    error:   '<i class="fas fa-exclamation-circle"></i>',
    info:    '<i class="fas fa-info-circle"></i>'
  };

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || '<i class="fas fa-info-circle"></i>'}</span><span>${escHtml(message)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3800);
}

// ===================== BUTTON HELPERS =====================
function setButtonLoading(btn, label) {
  btn.disabled   = true;
  btn.dataset.orig = btn.textContent;
  btn.innerHTML  = `<span class="spinner"></span> ${label}`;
}

function resetButton(btn, label) {
  btn.disabled  = false;
  btn.textContent = btn.dataset.orig || label;
}

// ===================== UTILS =====================
function skeletons(n) {
  return Array(n).fill('<div class="product-skeleton"></div>').join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}