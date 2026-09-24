// js/api.js
// Shared helpers used across every page: talking to the backend,
// and reading/writing the logged-in user's info.

const API_BASE =
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api'
        : 'https://ruet-book-swap.onrender.com/api';

// ---- Auth token storage (in-memory + localStorage) ----
function saveSession(token, user) {
  localStorage.setItem('bookswap_token', token);
  localStorage.setItem('bookswap_user', JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem('bookswap_token');
}

function getUser() {
  const raw = localStorage.getItem('bookswap_user');
  return raw ? JSON.parse(raw) : null;
}

function logout() {
  localStorage.removeItem('bookswap_token');
  localStorage.removeItem('bookswap_user');
  window.location.href = 'login.html';
}

function isLoggedIn() {
  return !!getToken();
}

// ---- Generic API call helper ----
async function apiCall(path, { method = 'GET', body = null, isFormData = false, auth = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (auth) headers['Authorization'] = 'Bearer ' + getToken();

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

// ---- Updates the top navigation bar based on login state ----
function renderNav() {
  const nav = document.getElementById('nav-links');
  if (!nav) return;

  if (isLoggedIn()) {
    const user = getUser();
    nav.innerHTML = `
      <a href="index.html">Browse</a>
      <a href="create-listing.html">List a book</a>
      <span style="margin-left:20px;color:#5c554a;">${user.name}</span>
      <a href="#" id="logout-link">Logout</a>
    `;
    document.getElementById('logout-link').addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    nav.innerHTML = `
      <a href="index.html">Browse</a>
      <a href="login.html">Login</a>
      <a href="register.html">Register</a>
    `;
  }
}
