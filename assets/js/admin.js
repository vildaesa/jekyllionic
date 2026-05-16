// Ganti dengan URL API Worker Anda
const API_BASE_URL = 'https://admin-dashboard.vildaesa.workers.dev';

let products = [];
let currentDeleteId = null;

// Helper: ambil token dari localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = './login';
    throw new Error('No token');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Fetch semua produk
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 403) throw new Error('Sesi habis, silakan login ulang');
      throw new Error('Gagal memuat produk');
    }
    products = await res.json();
    renderProductTable();
  } catch (err) {
    alert(err.message);
    if (err.message.includes('login ulang')) logout();
  }
}

// Render tabel produk
function renderProductTable() {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  products.forEach(prod => {
    const row = tbody.insertRow();
    // Gambar thumbnail
    const imgCell = row.insertCell(0);
    const img = document.createElement('img');
    img.src = prod.featured_image_path || 'https://placehold.co/50';
    img.className = 'w-12 h-12 object-cover rounded';
    imgCell.appendChild(img);
    
    row.insertCell(1).innerText = prod.title || prod.name || 'No title';
    row.insertCell(2).innerText = prod.price;
    row.insertCell(3).innerText = (prod.categories || []).join(', ');
    
    const actionCell = row.insertCell(4);
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.className = 'text-blue-600 hover:text-blue-800 mr-2';
    editBtn.onclick = () => openEditModal(prod);
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = 'text-red-600 hover:text-red-800';
    deleteBtn.onclick = () => openDeleteModal(prod.id);
    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
  });
}

// Modal create/edit
const modal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const productForm = document.getElementById('productForm');
const productId = document.getElementById('productId');
const titleInput = document.getElementById('title');
const priceInput = document.getElementById('price');
const descriptionInput = document.getElementById('description');
const modelInput = document.getElementById('model');
const categoriesInput = document.getElementById('categories');
const tagsInput = document.getElementById('tags');
const featuredImageInput = document.getElementById('featured_image_path');
const facebookImageInput = document.getElementById('facebook_image_path');

let stylesArray = []; // untuk menyimpan styles sementara

function renderStyles() {
  const container = document.getElementById('stylesContainer');
  if (!container) return;
  container.innerHTML = '';
  stylesArray.forEach((style, idx) => {
    const div = document.createElement('div');
    div.className = 'border p-2 rounded mb-2 flex flex-wrap gap-2 items-end';
    div.innerHTML = `
      <input type="text" placeholder="Nama warna (ex: Navi)" value="${style.color}" data-style-color="${idx}" class="border rounded p-1 w-28">
      <input type="text" placeholder="Kode warna (ex: #4a5265)" value="${style.name}" data-style-name="${idx}" class="border rounded p-1 w-28">
      <input type="text" placeholder="URL gambar" value="${style.image_path}" data-style-image="${idx}" class="border rounded p-1 flex-1">
      <button type="button" data-remove="${idx}" class="bg-red-500 text-white px-2 py-1 rounded">Hapus</button>
    `;
    container.appendChild(div);
  });
  // attach event listener untuk update & remove
  document.querySelectorAll('[data-style-color]').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(inp.dataset.styleColor);
      stylesArray[idx].color = inp.value;
    });
  });
  document.querySelectorAll('[data-style-name]').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(inp.dataset.styleName);
      stylesArray[idx].name = inp.value;
    });
  });
  document.querySelectorAll('[data-style-image]').forEach(inp => {
    inp.addEventListener('change', (e) => {
      const idx = parseInt(inp.dataset.styleImage);
      stylesArray[idx].image_path = inp.value;
    });
  });
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.remove);
      stylesArray.splice(idx, 1);
      renderStyles();
    });
  });
}

function resetForm() {
  productId.value = '';
  titleInput.value = '';
  priceInput.value = '';
  descriptionInput.value = '';
  modelInput.value = '';
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
  modalTitle.innerText = 'Tambah Produk Baru';
  modal.classList.remove('hidden');
}

function openEditModal(product) {
  resetForm();
  productId.value = product.id;
  titleInput.value = product.title || '';
  priceInput.value = product.price || '';
  descriptionInput.value = product.description || '';
  modelInput.value = (product.model || []).join(',');
  categoriesInput.value = (product.categories || []).join(',');
  tagsInput.value = (product.tags || []).join(',');
  featuredImageInput.value = product.featured_image_path || '';
  facebookImageInput.value = product.facebook_image_path || '';
  stylesArray = [...(product.styles || [])];
  renderStyles();
  modalTitle.innerText = 'Edit Produk';
  modal.classList.remove('hidden');
}

async function saveProduct(e) {
  e.preventDefault();
  const id = productId.value;
  const productData = {
    title: titleInput.value.trim(),
    price: priceInput.value.trim(),
    description: descriptionInput.value.trim(),
    model: modelInput.value.split(',').map(s => s.trim()).filter(Boolean),
    categories: categoriesInput.value.split(',').map(s => s.trim()).filter(Boolean),
    tags: tagsInput.value.split(',').map(s => s.trim()).filter(Boolean),
    featured_image_path: featuredImageInput.value.trim() || null,
    facebook_image_path: facebookImageInput.value.trim() || null,
    styles: stylesArray
  };
  try {
    const headers = getAuthHeaders();
    let url = `${API_BASE_URL}/api/products`;
    let method = 'POST';
    if (id) {
      url += `/${id}`;
      method = 'PUT';
    }
    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan');
    }
    alert('Produk tersimpan');
    modal.classList.add('hidden');
    loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

// Upload gambar multiple
const imageUploadInput = document.getElementById('imageUpload');
const uploadImagesBtn = document.getElementById('uploadImagesBtn');
const uploadedUrlsDiv = document.getElementById('uploadedUrls');
const uploadPreview = document.getElementById('uploadPreview');

imageUploadInput.addEventListener('change', () => {
  uploadPreview.innerHTML = '';
  const files = Array.from(imageUploadInput.files);
  files.forEach(file => {
    if (file.size > 1 * 1024 * 1024) {
      alert(`File ${file.name} melebihi 1MB`);
      return;
    }
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.className = 'w-16 h-16 object-cover rounded border';
    uploadPreview.appendChild(img);
  });
});

uploadImagesBtn.addEventListener('click', async () => {
  const files = imageUploadInput.files;
  if (!files.length) {
    alert('Pilih file dulu');
    return;
  }
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error('Upload gagal');
    const data = await res.json();
    uploadedUrlsDiv.innerHTML = data.urls.map(url => `<a href="${url}" target="_blank" class="block text-blue-600">${url}</a>`).join('');
    alert('Upload berhasil, copy URL ke field gambar');
  } catch (err) {
    alert(err.message);
  }
});

// Delete modal
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
    const res = await fetch(`${API_BASE_URL}/api/products/${currentDeleteId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Gagal hapus');
    alert('Produk dihapus');
    deleteModal.classList.add('hidden');
    loadProducts();
  } catch (err) {
    alert(err.message);
  } finally {
    currentDeleteId = null;
  }
}
cancelDeleteBtn.addEventListener('click', () => {
  deleteModal.classList.add('hidden');
  currentDeleteId = null;
});
confirmDeleteBtn.addEventListener('click', confirmDelete);

// Logout
function logout() {
  localStorage.removeItem('adminToken');
  window.location.href = './login';
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);
document.getElementById('openCreateModal')?.addEventListener('click', openCreateModal);
document.getElementById('closeModalBtn')?.addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('cancelModalBtn')?.addEventListener('click', () => modal.classList.add('hidden'));
document.getElementById('addStyleBtn')?.addEventListener('click', () => {
  stylesArray.push({ color: '', name: '', image_path: '' });
  renderStyles();
});
productForm?.addEventListener('submit', saveProduct);

// Initial load
if (window.location.pathname.includes('./')) {
  loadProducts().catch(console.error);
}