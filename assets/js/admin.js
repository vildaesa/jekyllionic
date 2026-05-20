const API_BASE_URL = 'https://admin-dashboard.vildaesa.workers.dev';

let items = [];
let currentCollection = 'products'; 
let currentDeleteId = null;

// Helper: ambil token
function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  if (!token) { window.location.href = '/login'; throw new Error('No token'); }
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// Switch Collection
const showProductsBtn = document.getElementById('showProductsBtn');
const showPostsBtn = document.getElementById('showPostsBtn');

function switchCollection(collection) {
  currentCollection = collection;
  // Perbarui UI Segment Ionic
  document.getElementById('tabSwitcher').value = collection;
  
  // Logika toggle field form
  const priceGroup = document.getElementById('priceGroup')?.parentElement;
  const modelGroup = document.getElementById('modelGroup')?.parentElement;
  const authorGroup = document.getElementById('authorGroup')?.parentElement;

  if (collection === 'products') {
    priceGroup?.classList.remove('ion-hide');
    modelGroup?.classList.remove('ion-hide');
    authorGroup?.classList.add('ion-hide');
  } else {
    priceGroup?.classList.add('ion-hide');
    modelGroup?.classList.add('ion-hide');
    authorGroup?.classList.remove('ion-hide');
  }
  loadItems();
}

showProductsBtn?.addEventListener('click', () => switchCollection('products'));
showPostsBtn?.addEventListener('click', () => switchCollection('posts'));

// Load Items
async function loadItems() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/${currentCollection}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Gagal memuat ${currentCollection}`);
    items = await res.json();
    renderTable();
  } catch (err) { showAlert(err.message); }
}

// Render Tabel
function renderTable() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><img src="${item.featured_image_path || item.img || 'https://placehold.co/50'}" style="width: 50px; border-radius: 4px;"></td>
      <td>${item.title || 'No title'}</td>
      <td>${item.price || item.author || '-'}</td>
      <td>${(item.categories || []).join(', ')}</td>
      <td>
        <ion-button fill="clear" onclick='openEditModal(${JSON.stringify(item)})'><ion-icon name="create-outline"></ion-icon></ion-button>
        <ion-button fill="clear" color="danger" onclick="openDeleteModal(${item.id})"><ion-icon name="trash-outline"></ion-icon></ion-button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Modal Logic Ionic
const modal = document.getElementById('productModal');

function openCreateModal() {
  resetForm();
  document.getElementById('modalTitle').innerText = "Tambah Baru";
  modal.present();
}

function openEditModal(item) {
  resetForm();
  productId.value = item.id;
  productSha.value = item.sha || '';
  titleInput.value = item.title || '';
  priceInput.value = item.price || '';
  descriptionInput.value = item.body || item.description || '';
  modelInput.value = Array.isArray(item.model) ? item.model.join(',') : (item.model || '');
  authorInput.value = item.author || '';
  categoriesInput.value = Array.isArray(item.categories) ? item.categories.join(',') : (item.categories || '');
  tagsInput.value = Array.isArray(item.tags) ? item.tags.join(',') : (item.tags || '');
  featuredImageInput.value = item.featured_image_path || item.img || '';
  facebookImageInput.value = item.facebook_image_path || '';
  stylesArray = [...(item.styles || [])];
  renderStyles();
  modalTitle.innerText = `Edit ${currentCollection === 'products' ? 'Produk' : 'Post'}`;
  modal.classList.remove('hidden');
}

// Logout & Helpers
function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/login';
}

function showAlert(message, header = "Info") {
  const alert = document.getElementById('globalAlert');
  alert.header = header;
  alert.message = message;
  alert.buttons = ['OK'];
  alert.present();
}

// Event Listeners
document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('closeModalBtn')?.addEventListener('click', () => modal.dismiss());

// Tambahkan inisialisasi
if (document.getElementById('productTableBody')) {
  loadItems();
}
