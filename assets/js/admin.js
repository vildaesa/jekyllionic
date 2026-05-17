const API_BASE_URL = 'https://admin-dashboard.vildaesa.workers.dev';

let items = [];
let currentCollection = 'products'; // 'products' atau 'posts'
let currentDeleteId = null;

// Helper: ambil token dari localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin/login';
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
    showProductsBtn.classList.add('border-blue-600', 'text-blue-600', 'font-bold');
    showProductsBtn.classList.remove('border-transparent', 'text-gray-500');
    showPostsBtn.classList.remove('border-blue-600', 'text-blue-600', 'font-bold');
    showPostsBtn.classList.add('border-transparent', 'text-gray-500');
    priceHeader.innerText = 'Harga';
    priceGroup.classList.remove('hidden');
    modelGroup.classList.remove('hidden');
    authorGroup.classList.add('hidden');
  } else {
    showPostsBtn.classList.add('border-blue-600', 'text-blue-600', 'font-bold');
    showPostsBtn.classList.remove('border-transparent', 'text-gray-500');
    showProductsBtn.classList.remove('border-blue-600', 'text-blue-600', 'font-bold');
    showProductsBtn.classList.add('border-transparent', 'text-gray-500');
    priceHeader.innerText = 'Info';
    priceGroup.classList.add('hidden');
    modelGroup.classList.add('hidden');
    authorGroup.classList.remove('hidden');
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
    alert(err.message);
    if (err.message.includes('login ulang')) logout();
  }
}

// Render tabel
function renderTable() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  items.forEach(item => {
    const row = tbody.insertRow();
    
    // Gambar thumbnail
    const imgCell = row.insertCell(0);
    const img = document.createElement('img');
    img.src = item.featured_image_path || item.img || 'https://placehold.co/50';
    img.className = 'w-12 h-12 object-cover rounded shadow-sm';
    imgCell.appendChild(img);
    
    row.insertCell(1).innerHTML = `
      <div class="text-sm font-medium text-gray-900">${item.title || 'No title'}</div>
      <div class="text-xs text-gray-500">${item.id}.md</div>
    `;
    
    const infoCell = row.insertCell(2);
    if (currentCollection === 'products') {
      infoCell.innerText = item.price || '-';
    } else {
      infoCell.innerText = item.author || '-';
    }
    
    const metaCell = row.insertCell(3);
    const categories = (item.categories || []).join(', ');
    const tags = (item.tags || []).join(', ');
    metaCell.innerHTML = `
      <div class="text-xs text-gray-600">Cat: ${categories || '-'}</div>
      <div class="text-xs text-gray-400">Tags: ${tags || '-'}</div>
    `;
    
    const actionCell = row.insertCell(4);
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.className = 'text-blue-600 hover:text-blue-800 mr-3 transition';
    editBtn.onclick = () => openEditModal(item);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = 'text-red-600 hover:text-red-800 transition';
    deleteBtn.onclick = () => openDeleteModal(item.id);
    
    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
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
    container.parentElement.classList.add('hidden');
    return;
  }
  container.parentElement.classList.remove('hidden');

  container.innerHTML = '';
  stylesArray.forEach((style, idx) => {
    const div = document.createElement('div');
    div.className = 'bg-gray-50 border p-3 rounded mb-2 flex flex-wrap gap-2 items-end shadow-sm';
    div.innerHTML = `
      <div class="flex-1 min-w-[120px]">
        <label class="block text-[10px] uppercase font-bold text-gray-500">Warna</label>
        <input type="text" placeholder="Navi" value="${style.color || ''}" data-style-color="${idx}" class="w-full border rounded p-1 text-sm">
      </div>
      <div class="flex-1 min-w-[120px]">
        <label class="block text-[10px] uppercase font-bold text-gray-500">Kode/Nama</label>
        <input type="text" placeholder="#4a5265" value="${style.name || ''}" data-style-name="${idx}" class="w-full border rounded p-1 text-sm">
      </div>
      <div class="flex-[2] min-w-[200px]">
        <label class="block text-[10px] uppercase font-bold text-gray-500">URL Gambar</label>
        <input type="text" placeholder="https://..." value="${style.image_path || ''}" data-style-image="${idx}" class="w-full border rounded p-1 text-sm">
      </div>
      <button type="button" data-remove="${idx}" class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition h-[30px]">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(div);
  });

  // Event Listeners for Styles
  document.querySelectorAll('[data-style-color]').forEach(inp => {
    inp.addEventListener('change', (e) => { stylesArray[parseInt(inp.dataset.styleColor)].color = inp.value; });
  });
  document.querySelectorAll('[data-style-name]').forEach(inp => {
    inp.addEventListener('change', (e) => { stylesArray[parseInt(inp.dataset.styleName)].name = inp.value; });
  });
  document.querySelectorAll('[data-style-image]').forEach(inp => {
    inp.addEventListener('change', (e) => { stylesArray[parseInt(inp.dataset.styleImage)].image_path = inp.value; });
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
  modal.classList.remove('hidden');
}

function openEditModal(item) {
  resetForm();
  productId.value = item.id;
  productSha.value = item.sha || '';
  titleInput.value = item.title || '';
  priceInput.value = item.price || '';
  descriptionInput.value = item.body || item.description || '';
  modelInput.value = (item.model || []).join(',');
  authorInput.value = item.author || '';
  categoriesInput.value = (item.categories || []).join(',');
  tagsInput.value = (item.tags || []).join(',');
  featuredImageInput.value = item.featured_image_path || item.img || '';
  facebookImageInput.value = item.facebook_image_path || '';
  stylesArray = [...(item.styles || [])];
  renderStyles();
  modalTitle.innerText = `Edit ${currentCollection === 'products' ? 'Produk' : 'Post'}`;
  modal.classList.remove('hidden');
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
    alert('Tersimpan!');
    modal.classList.add('hidden');
    loadItems();
  } catch (err) {
    alert(err.message);
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
    img.className = 'w-16 h-16 object-cover rounded border shadow-sm';
    uploadPreview.appendChild(img);
  });
});

uploadImagesBtn?.addEventListener('click', async () => {
  const files = imageUploadInput.files;
  if (!files.length) return alert('Pilih file dulu');
  
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData
    });
    if (!res.ok) throw new Error('Upload gagal');
    const data = await res.json();
    uploadedUrlsDiv.innerHTML = data.urls.map(url => `
      <div class="flex items-center gap-2 mt-1">
        <input type="text" readonly value="${url}" class="flex-1 text-xs border rounded p-1 bg-gray-50">
        <button type="button" onclick="navigator.clipboard.writeText('${url}'); alert('Copied!')" class="text-blue-500 text-xs">Copy</button>
      </div>
    `).join('');
    alert('Upload berhasil!');
  } catch (err) {
    alert(err.message);
  }
});

// Delete logic
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

function openDeleteModal(id) {
  currentDeleteId = id;
  deleteModal.classList.remove('hidden');
  deleteModal.style.display = 'flex';
}
async function confirmDelete() {
  if (!currentDeleteId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/${currentCollection}/${currentDeleteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus');
    alert('Terhapus');
    deleteModal.classList.add('hidden');
    loadItems();
  } catch (err) {
    alert(err.message);
  } finally {
    currentDeleteId = null;
  }
}
cancelDeleteBtn?.addEventListener('click', () => { deleteModal.classList.add('hidden'); currentDeleteId = null; });
confirmDeleteBtn?.addEventListener('click', confirmDelete);

// Global actions
function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/admin/login';
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('openCreateModal')?.addEventListener('click', openCreateModal);
document.getElementById('closeModalBtn')?.addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('cancelModalBtn')?.addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('addStyleBtn')?.addEventListener('click', () => {
  stylesArray.push({ color: '', name: '', image_path: '' });
  renderStyles();
});
productForm?.addEventListener('submit', saveItem);

// Init
if (window.location.pathname.includes('/admin')) {
  loadItems().catch(console.error);
}
