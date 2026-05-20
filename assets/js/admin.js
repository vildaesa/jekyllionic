const API_BASE_URL = 'https://admin-dashboard.vildaesa.workers.dev';

let items = [];
let currentCollection = 'products'; // 'products' atau 'posts'
let currentDeleteId = null;

// Helper: ambil token dari localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/login';
    throw new Error('No token');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Switch Collection
const showProductsBtn = document.getElementById('showProductsBtn');
const showPostsBtn = document.getElementById('showPostsBtn');
const priceHeader = document.getElementById('priceHeader');
const priceGroup = document.getElementById('priceGroup');
const modelGroup = document.getElementById('modelGroup');
const authorGroup = document.getElementById('authorGroup');

function switchCollection(collection) {
  currentCollection = collection;
  if (collection === 'products') {
    showProductsBtn.classList.add('active-segment');
    showPostsBtn.classList.remove('active-segment');
    priceHeader.innerText = 'Harga';
    priceGroup?.classList.remove('ion-hide');
    modelGroup?.classList.remove('ion-hide');
    authorGroup?.classList.add('ion-hide');
  } else {
    showPostsBtn.classList.add('active-segment');
    showProductsBtn.classList.remove('active-segment');
    priceHeader.innerText = 'Info';
    priceGroup?.classList.add('ion-hide');
    modelGroup?.classList.add('ion-hide');
    authorGroup?.classList.remove('ion-hide');
  }
  loadItems();
}

showProductsBtn?.addEventListener('click', () => switchCollection('products'));
showPostsBtn?.addEventListener('click', () => switchCollection('posts'));

// Fetch items
async function loadItems() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/${currentCollection}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 403) throw new Error('Sesi habis, silakan login ulang');
      throw new Error(`Gagal memuat ${currentCollection}`);
    }
    items = await res.json();
    renderTable();
  } catch (err) {
    showAlert(err.message);
    if (err.message.includes('login ulang')) logout();
  }
}

// Render tabel
function renderTable() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <img src="${item.featured_image_path || item.img || 'https://placehold.co/50'}" 
             style="width: 50px; height: 50px; border-radius: 4px; object-fit: cover;">
      </td>
      <td>
        <div style="font-weight: 500; color: #111827;">${item.title || 'No title'}</div>
        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">${item.id}.md</div>
      </td>
      <td style="color: #4B5563;">${item.price || item.author || '-'}</td>
      <td>
        <div style="font-size: 13px; color: #4B5563;">
          ${(item.categories || []).join(', ') || '-'}
        </div>
        <div style="font-size: 12px; color: #9CA3AF; margin-top: 2px;">
          ${(item.tags || []).join(', ') || '-'}
        </div>
      </td>
      <td>
        <ion-button fill="clear" color="primary" onclick='openEditModal(${JSON.stringify(item).replace(/'/g, "&apos;")})' size="small">
          <ion-icon name="create-outline" slot="icon-only"></ion-icon>
        </ion-button>
        <ion-button fill="clear" color="danger" onclick="openDeleteModal(${item.id})" size="small">
          <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
        </ion-button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Modal logic
const modal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const productForm = document.getElementById('productForm');
const productId = document.getElementById('productId');
const productSha = document.getElementById('productSha');
const titleInput = document.getElementById('title');
const priceInput = document.getElementById('price');
const descriptionInput = document.getElementById('description');
const modelInput = document.getElementById('model');
const authorInput = document.getElementById('author');
const categoriesInput = document.getElementById('categories');
const tagsInput = document.getElementById('tags');
const featuredImageInput = document.getElementById('featured_image_path');
const facebookImageInput = document.getElementById('facebook_image_path');

let stylesArray = [];

function renderStyles() {
  const container = document.getElementById('stylesContainer');
  if (!container) return;
  
  // Sembunyikan styles jika bukan produk
  if (currentCollection !== 'products') {
    container.parentElement?.classList.add('ion-hide');
    return;
  }
  container.parentElement?.classList.remove('ion-hide');

  container.innerHTML = '';
  stylesArray.forEach((style, idx) => {
    const div = document.createElement('div');
    div.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-end;
      background: #F3F4F6;
      border: 1px solid #E5E7EB;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    `;
    div.innerHTML = `
      <div style="flex: 1; min-width: 120px;">
        <label style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6B7280; margin-bottom: 4px;">Warna</label>
        <ion-input type="text" placeholder="Navi" value="${style.color || ''}" data-style-color="${idx}" mode="md" style="--padding-start: 8px; --padding-end: 8px;"></ion-input>
      </div>
      <div style="flex: 1; min-width: 120px;">
        <label style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6B7280; margin-bottom: 4px;">Kode/Nama</label>
        <ion-input type="text" placeholder="#4a5265" value="${style.name || ''}" data-style-name="${idx}" mode="md" style="--padding-start: 8px; --padding-end: 8px;"></ion-input>
      </div>
      <div style="flex: 2; min-width: 200px;">
        <label style="display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6B7280; margin-bottom: 4px;">URL Gambar</label>
        <ion-input type="text" placeholder="https://..." value="${style.image_path || ''}" data-style-image="${idx}" mode="md" style="--padding-start: 8px; --padding-end: 8px;"></ion-input>
      </div>
      <ion-button color="danger" fill="outline" data-remove="${idx}" size="small">
        <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
      </ion-button>
    `;
    container.appendChild(div);
  });

  // Event Listeners for Styles
  document.querySelectorAll('[data-style-color]').forEach(inp => {
    inp.addEventListener('ionChange', (e) => { 
      stylesArray[parseInt(inp.dataset.styleColor)].color = e.detail.value; 
    });
  });
  document.querySelectorAll('[data-style-name]').forEach(inp => {
    inp.addEventListener('ionChange', (e) => { 
      stylesArray[parseInt(inp.dataset.styleName)].name = e.detail.value; 
    });
  });
  document.querySelectorAll('[data-style-image]').forEach(inp => {
    inp.addEventListener('ionChange', (e) => { 
      stylesArray[parseInt(inp.dataset.styleImage)].image_path = e.detail.value; 
    });
  });
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      stylesArray.splice(parseInt(btn.dataset.remove), 1);
      renderStyles();
    });
  });
}

function resetForm() {
  productId.value = '';
  productSha.value = '';
  titleInput.value = '';
  priceInput.value = '';
  descriptionInput.value = '';
  modelInput.value = '';
  authorInput.value = '';
  categoriesInput.value = '';
  tagsInput.value = '';
  featuredImageInput.value = '';
  facebookImageInput.value = '';
  stylesArray = [];
  renderStyles();
  document.getElementById('uploadedUrls').innerHTML = '';
  document.getElementById('uploadPreview').innerHTML = '';
}

function openCreateModal() {
  resetForm();
  modalTitle.innerText = `Tambah ${currentCollection === 'products' ? 'Produk' : 'Post'} Baru`;
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
  modal.present();
}

async function saveItem(e) {
  e.preventDefault();
  const id = productId.value;
  const sha = productSha.value;
  
  const data = {
    title: titleInput.value.trim(),
    body: descriptionInput.value.trim(),
    categories: categoriesInput.value.split(',').map(s => s.trim()).filter(Boolean),
    tags: tagsInput.value.split(',').map(s => s.trim()).filter(Boolean),
    facebook_image_path: facebookImageInput.value.trim() || null,
    sha: sha || undefined
  };

  if (currentCollection === 'products') {
    data.price = priceInput.value.trim();
    data.model = modelInput.value.split(',').map(s => s.trim()).filter(Boolean);
    data.featured_image_path = featuredImageInput.value.trim() || null;
    data.styles = stylesArray;
  } else {
    data.author = authorInput.value.trim();
    data.img = featuredImageInput.value.trim() || null;
    data.excerpt_separator = '<!--more-->';
  }

  try {
    const headers = getAuthHeaders();
    let url = `${API_BASE_URL}/api/${currentCollection}`;
    let method = 'POST';
    if (id) {
      url += `/${id}`;
      method = 'PUT';
    }
    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan');
    }
    showAlert('Tersimpan!', 'Sukses');
    modal.dismiss();
    loadItems();
  } catch (err) {
    showAlert(err.message);
  }
}

// Image Upload
const imageUploadInput = document.getElementById('imageUpload');
const uploadImagesBtn = document.getElementById('uploadImagesBtn');
const uploadedUrlsDiv = document.getElementById('uploadedUrls');
const uploadPreview = document.getElementById('uploadPreview');

imageUploadInput?.addEventListener('change', () => {
  uploadPreview.innerHTML = '';
  Array.from(imageUploadInput.files).forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.cssText = 'width: 64px; height: 64px; object-fit: cover; border-radius: 4px; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin-right: 8px;';
    uploadPreview.appendChild(img);
  });
});

uploadImagesBtn?.addEventListener('click', async () => {
  const files = imageUploadInput.files;
  if (!files.length) return showAlert('Pilih file dulu');
  
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/upload?type=${currentCollection}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData
    });
    if (!res.ok) throw new Error('Upload gagal');
    const data = await res.json();
    uploadedUrlsDiv.innerHTML = data.urls.map(url => `
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
        <ion-input readonly value="${url}" mode="md" style="--padding-start: 8px; --padding-end: 8px; flex: 1;"></ion-input>
        <ion-button fill="outline" size="small" onclick="navigator.clipboard.writeText('${url}'); showAlert('Copied!')">
          <ion-icon name="copy-outline" slot="start"></ion-icon>
          Copy
        </ion-button>
      </div>
    `).join('');
    showAlert('Upload berhasil!', 'Sukses');
  } catch (err) {
    showAlert(err.message);
  }
});

// Delete logic
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

function openDeleteModal(id) {
  currentDeleteId = id;
  deleteModal.present();
}

async function confirmDelete() {
  if (!currentDeleteId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/${currentCollection}/${currentDeleteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus');
    showAlert('Terhapus', 'Sukses');
    deleteModal.dismiss();
    loadItems();
  } catch (err) {
    showAlert(err.message);
  } finally {
    currentDeleteId = null;
  }
}

// Global actions
function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/login';
}

function showAlert(message, header = "Info") {
  const alert = document.getElementById('globalAlert');
  if (alert) {
    alert.header = header;
    alert.message = message;
    alert.buttons = ['OK'];
    alert.present();
  }
}

// Event Listeners
document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('openCreateModal')?.addEventListener('click', openCreateModal);
document.getElementById('closeModalBtn')?.addEventListener('click', () => modal.dismiss());
document.getElementById('cancelModalBtn')?.addEventListener('click', () => modal.dismiss());
document.getElementById('addStyleBtn')?.addEventListener('click', () => {
  stylesArray.push({ color: '', name: '', image_path: '' });
  renderStyles();
});
productForm?.addEventListener('submit', saveItem);
cancelDeleteBtn?.addEventListener('click', () => { deleteModal.dismiss(); currentDeleteId = null; });
confirmDeleteBtn?.addEventListener('click', confirmDelete);

// Init
if (document.getElementById('productTableBody')) {
  loadItems().catch(console.error);
}
