const productsContainer = document.getElementById('productsContainer');
const sortSelect = document.getElementById('sortSelect');
let products = [];

// Load products
fetch('telegramProductDB.json')
  .then(res => res.json())
  .then(data => {
    products = data;
    renderProducts();
  });

function renderProducts() {
  const sortBy = sortSelect.value;
  products.sort((a,b) => {
    if(sortBy === 'price') return a.price - b.price;
    if(sortBy === 'likes') return b.likes - a.likes;
    if(sortBy === 'id') return b.id - a.id;
  });

  productsContainer.innerHTML = '';
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <h3>${p.name} <span class="likes" data-id="${p.id}">❤️ ${p.likes}</span></h3>
      <p class="price">${p.price} ETB</p>
      <p>${p.description}</p>
      <div class="buttons">
        <a href="https://t.me/dilla_fashion_bot?start=product_${p.id}" class="telegram" target="_blank">Telegram</a>
        <a href="https://wa.me/251900868540?text=I want to order ${p.name}" class="whatsapp" target="_blank">WhatsApp</a>
      </div>
    `;
    productsContainer.appendChild(div);
  });

  document.querySelectorAll('.likes').forEach(el=>{
    el.onclick = () => {
      const id = parseInt(el.dataset.id);
      const product = products.find(p=>p.id===id);
      product.likes += 1;
      renderProducts();
      // Update backend
      fetch(`/.netlify/functions/telegramWebhook`, {
        method: 'POST',
        body: JSON.stringify({action:'like', productId:id})
      });
    };
  });
}

sortSelect.onchange = renderProducts;

// Map
const map = L.map('map').setView([6.36, 38.31], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);
L.marker([6.36, 38.31]).addTo(map).bindPopup('Dilla Fashion Store').openPopup();
