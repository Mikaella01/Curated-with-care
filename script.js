
/* =========================================
   CURATED WITH CARE BY M.
   PRODUCT CATALOGUE & WEBSITE FUNCTIONALITY
========================================= */


/* 1. PRODUCT DATABASE

   Add every product here.
   Each product is entered only ONCE.

   Image paths must match your GitHub folders.
*/

const products = [
{

    id: 1,

    name: "PDRN Pink Collagen Bubble Serum",

    brand: "medicube",

    brandName: "Medicube",

    collection: ["pdrn", "pink-pdrn-line"],

    concerns: [],

    category: "skincare",

    description: "",

    benefits: [],

    size: "95ml",

    price: 25.00,

    image: "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9212.webp",

    gallery: [

      "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9212.webp",

      "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9242.webp",

      "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9243.webp",

      "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9244.webp",

      "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9245.webp",

      "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9246.webp",

      "images/Brands/Medicube/Pink-PDRN-line/PDRN-pink-collagen-bubble-serum/IMG_9247.webp"

    ],

    tag: "THE BEAUTY EDIT",

    featured: true

  }

];


/* 2. WEBSITE STATE */

let activeBrand = "all";
let activeCollection = "all";
let activeConcern = "all";
let activeView = "all";
let searchTerm = "";
let sortOrder = "featured";

let cart = [];

let currentProduct = null;


/* 3. HELPER FUNCTIONS */

function formatPrice(price) {
  return "€" + Number(price).toFixed(2);
}


function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}


function getBrandName(brand) {

  const brands = {
    "medicube": "Medicube",
    "anua": "Anua",
    "beauty-of-joseon": "Beauty of Joseon",
    "cosrx": "COSRX",
    "vt-cosmetics": "VT Cosmetics",
    "skin1004": "SKIN1004",
    "torriden": "Torriden"
  };

  return brands[brand] || brand;
}


/* 4. PRODUCT FILTERING */

function getFilteredProducts() {

  let filtered = [...products];

  // BRAND FILTER

  if (activeBrand !== "all") {

    filtered = filtered.filter(product =>
      product.brand === activeBrand
    );

  }


  // COLLECTION FILTER

  if (activeCollection !== "all") {

    filtered = filtered.filter(product =>
      (product.collection || []).includes(activeCollection)
    );

  }


  // SKIN CONCERN FILTER

  if (activeConcern !== "all") {

    filtered = filtered.filter(product =>
      (product.concerns || []).includes(activeConcern)
    );

  }


  // SEARCH FILTER

  if (searchTerm.trim() !== "") {

    const search = searchTerm.toLowerCase();

    filtered = filtered.filter(product => {

      const searchableText = [
        product.name,
        product.brandName,
        product.brand,
        product.description,
        ...(product.collection || []),
        ...(product.concerns || [])
      ].join(" ").toLowerCase();

      return searchableText.includes(search);

    });

  }


  // SORT PRODUCTS

  if (sortOrder === "price-low") {

    filtered.sort((a, b) => a.price - b.price);

  }

  else if (sortOrder === "price-high") {

    filtered.sort((a, b) => b.price - a.price);

  }

  else if (sortOrder === "name") {

    filtered.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  }

  else {

    filtered.sort((a, b) =>
      Number(b.featured) - Number(a.featured)
    );

  }

  return filtered;

}


/* 5. DISPLAY PRODUCTS */

function displayProducts() {

  const productGrid = document.getElementById("productGrid");

  const resultsTitle = document.getElementById("resultsTitle");

  const resultsCount = document.getElementById("resultsCount");

  if (!productGrid) return;

  const filteredProducts = getFilteredProducts();

  productGrid.innerHTML = "";


  // RESULTS TITLE

  let title = "All beauty favourites";

  if (activeBrand !== "all") {
    title = getBrandName(activeBrand);
  }

  if (activeCollection !== "all") {
    title = activeCollection.replace(/-/g, " ").toUpperCase();
  }

  if (activeConcern !== "all") {
    title = activeConcern.replace(/-/g, " ") + " favourites";
  }

  if (searchTerm) {
    title = "Search results";
  }

  if (resultsTitle) {
    resultsTitle.textContent = title;
  }

  if (resultsCount) {
    resultsCount.textContent =
      filteredProducts.length + " products";
  }


  // EMPTY CATALOGUE

  if (filteredProducts.length === 0) {

    const message = products.length === 0
      ? "Your product collection is waiting to be added. Start by adding your first beauty favourite."
      : "No products found. Try another brand, collection or search.";

    productGrid.innerHTML = `
      <div class="catalogue-empty">
        <p>${message}</p>
      </div>
    `;

    return;

  }


  // CREATE PRODUCT CARDS

  filteredProducts.forEach(product => {

    const card = document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `

      <div class="product-image">

        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.style.opacity='0'">

        <span class="product-tag">
          ${escapeHTML(product.tag || "THE BEAUTY EDIT")}
        </span>

      </div>

      <div class="product-info">

        <span class="product-type">
          ${escapeHTML(product.brandName || getBrandName(product.brand))}
        </span>

        <h3>${escapeHTML(product.name)}</h3>

        <p class="product-description">
          ${escapeHTML(product.description)}
        </p>

        <div class="product-bottom">

          <span>${formatPrice(product.price)}</span>

          <button
            class="add-button"
            data-add="${escapeHTML(product.id)}">
            ADD +
          </button>

        </div>

        <button
          class="text-link"
          data-view-product="${escapeHTML(product.id)}"
          style="margin-top:15px;background:none;border:none;cursor:pointer">
          VIEW DETAILS ↗
        </button>

      </div>

    `;

    productGrid.appendChild(card);

  });

}


/* 6. SHOP NAVIGATION */

function updateShopView(view) {

  activeView = view;

  document.querySelectorAll(".shop-tab").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.view === view
    );

  });


  const brandFilters = document.getElementById("brandFilters");

  const collectionFilters = document.getElementById("collectionFilters");

  const concernFilters = document.getElementById("concernFilters");


  if (brandFilters) {
    brandFilters.hidden = view !== "brands";
  }

  if (collectionFilters) {
    collectionFilters.hidden = view !== "collections";
  }

  if (concernFilters) {
    concernFilters.hidden = view !== "concerns";
  }

}


document.querySelectorAll(".shop-tab").forEach(button => {

  button.addEventListener("click", () => {

    updateShopView(button.dataset.view);

  });

});


/* 7. BRAND FILTERS */

document.querySelectorAll("[data-brand]").forEach(button => {

  button.addEventListener("click", () => {

    activeBrand = button.dataset.brand;

    document.querySelectorAll("[data-brand]").forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.brand === activeBrand
      );

    });

    displayProducts();

  });

});


/* 8. COLLECTION FILTERS */

document.querySelectorAll("[data-collection]").forEach(button => {

  button.addEventListener("click", () => {

    activeCollection = button.dataset.collection;

    document.querySelectorAll("[data-collection]").forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.collection === activeCollection
      );

    });

    displayProducts();

  });

});


/* 9. SKIN CONCERN FILTERS */

document.querySelectorAll("[data-concern]").forEach(button => {

  button.addEventListener("click", () => {

    activeConcern = button.dataset.concern;

    document.querySelectorAll("[data-concern]").forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.concern === activeConcern
      );

    });

    displayProducts();

  });

});


/* 10. BRAND CARDS ON HOMEPAGE */

document.querySelectorAll("[data-brand-link]").forEach(button => {

  button.addEventListener("click", () => {

    activeBrand = button.dataset.brandLink;

    activeCollection = "all";
    activeConcern = "all";

    document.querySelectorAll("[data-brand]").forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.brand === activeBrand
      );

    });

    document.querySelectorAll("[data-collection]").forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.collection === "all"
      );

    });

    document.querySelectorAll("[data-concern]").forEach(item => {

      item.classList.toggle(
        "active",
        item.dataset.concern === "all"
      );

    });

    updateShopView("brands");

    displayProducts();

    document.getElementById("shop").scrollIntoView({
      behavior: "smooth"
    });

  });

});


/* 11. SEARCH PRODUCTS */

const productSearch = document.getElementById("productSearch");

if (productSearch) {

  productSearch.addEventListener("input", event => {

    searchTerm = event.target.value;

    displayProducts();

  });

}


/* 12. SORT PRODUCTS */

const productSort = document.getElementById("productSort");

if (productSort) {

  productSort.addEventListener("change", event => {

    sortOrder = event.target.value;

    displayProducts();

  });

}


/* 13. PRODUCT DETAILS */

function showProductDetails(productId) {

  const product = products.find(item =>
    String(item.id) === String(productId)
  );

  if (!product) return;

  currentProduct = product;

  const detailsSection =
    document.getElementById("productDetails");

  const detailContent =
    document.getElementById("productDetailContent");

  const gallery = product.gallery?.length
    ? product.gallery
    : [product.image];

  const safeGallery = gallery.map(image => `
    <img
      src="${escapeHTML(image)}"
      alt="${escapeHTML(product.name)}"
      loading="lazy">
  `).join("");


  detailContent.innerHTML = `

    <div class="product-detail-layout">

      <div class="product-detail-gallery">
        ${safeGallery}
      </div>

      <div class="product-detail-info">

        <span class="eyebrow">
          ${escapeHTML(product.brandName || getBrandName(product.brand))}
        </span>

        <h2>${escapeHTML(product.name)}</h2>

        <p>${escapeHTML(product.description)}</p>

        <div class="product-detail-price">
          ${formatPrice(product.price)}
        </div>

        <p><strong>Size:</strong> ${escapeHTML(product.size || "Please enquire")}</p>

        <h3>Product benefits</h3>

        <ul>
          ${(product.benefits || []).map(benefit =>
            `<li>${escapeHTML(benefit)}</li>`
          ).join("")}
        </ul>

        <button
          class="primary-button"
          data-add="${escapeHTML(product.id)}">
          ADD TO BAG
        </button>

      </div>

    </div>

  `;

  detailsSection.hidden = false;

  detailsSection.scrollIntoView({
    behavior: "smooth"
  });

}


document.addEventListener("click", event => {

  const detailButton = event.target.closest("[data-view-product]");

  if (detailButton) {

    showProductDetails(detailButton.dataset.viewProduct);

  }

});


/* BACK TO SHOP */

const backToShop = document.getElementById("backToShop");

if (backToShop) {

  backToShop.addEventListener("click", () => {

    document.getElementById("productDetails").hidden = true;

    document.getElementById("shop").scrollIntoView({
      behavior: "smooth"
    });

  });

}


/* 14. SHOPPING BAG */

function addToCart(productId) {

  const product = products.find(item =>
    String(item.id) === String(productId)
  );

  if (!product) return;

  const existingItem = cart.find(item =>
    String(item.id) === String(productId)
  );

  if (existingItem) {

    existingItem.quantity++;

  } else {

    cart.push({
      ...product,
      quantity: 1
    });

  }

  updateCart();

}


function removeFromCart(productId) {

  cart = cart.filter(item =>
    String(item.id) !== String(productId)
  );

  updateCart();

}


function updateCart() {

  const cartItems = document.getElementById("cartItems");

  const cartCount = document.getElementById("bagCount");

  const cartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );


  cartCount.textContent = totalItems;

  cartTotal.textContent = formatPrice(totalPrice);


  if (cart.length === 0) {

    cartItems.innerHTML = `
      <p>Your bag is currently empty.</p>
    `;

    return;

  }


  cartItems.innerHTML = cart.map(item => `

    <div class="cart-item">

      <p><strong>${escapeHTML(item.name)}</strong></p>

      <p>
        ${formatPrice(item.price)} × ${item.quantity}
      </p>

      <button
        class="remove-cart-item"
        data-remove="${escapeHTML(item.id)}">
        REMOVE
      </button>

    </div>

  `).join("");

}


document.addEventListener("click", event => {

  const addButton = event.target.closest("[data-add]");

  if (addButton) {

    addToCart(addButton.dataset.add);

  }

  const removeButton = event.target.closest("[data-remove]");

  if (removeButton) {

    removeFromCart(removeButton.dataset.remove);

  }

});


/* OPEN AND CLOSE SHOPPING BAG */

const bagButton = document.getElementById("bagButton");

const cartOverlay = document.getElementById("cartOverlay");

const closeCart = document.getElementById("closeCart");


function openCart() {

  cartOverlay.classList.add("open");

  cartOverlay.setAttribute("aria-hidden", "false");

}


function closeCartPanel() {

  cartOverlay.classList.remove("open");

  cartOverlay.setAttribute("aria-hidden", "true");

}


bagButton.addEventListener("click", openCart);

closeCart.addEventListener("click", closeCartPanel);


cartOverlay.addEventListener("click", event => {

  if (event.target === cartOverlay) {

    closeCartPanel();

  }

});


/* CHECKOUT PLACEHOLDER */

document.getElementById("checkoutButton")
  .addEventListener("click", () => {

    if (cart.length === 0) {

      alert("Your shopping bag is empty.");

      return;

    }

    alert(
      "Thank you for your selection! " +
      "Our ordering and payment process will be connected here."
    );

  });


/* 15. MOBILE NAVIGATION */

const menuToggle = document.getElementById("menuToggle");

const navigation = document.getElementById("navigation");


menuToggle.addEventListener("click", () => {

  const isOpen = navigation.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", isOpen);

});


navigation.querySelectorAll("a").forEach(link => {

  link.addEventListener("click", () => {

    navigation.classList.remove("open");

    menuToggle.setAttribute("aria-expanded", "false");

  });

});


/* 16. GIFT FINDER */

const findGift = document.getElementById("findGift");


findGift.addEventListener("click", () => {

  const occasion =
    document.getElementById("giftOccasion").value;

  const budget =
    document.getElementById("giftBudget").value;

  const result =
    document.getElementById("giftResult");


  if (!occasion || !budget) {

    result.textContent =
      "Please select an occasion and your preferred budget.";

    return;

  }


  result.textContent =
    "Thank you! We're preparing thoughtful gift suggestions for you.";

});


/* 17. NEWSLETTER */

const newsletterForm =
  document.getElementById("newsletterForm");


newsletterForm.addEventListener("submit", event => {

  event.preventDefault();

  const email =
    document.getElementById("newsletterEmail").value;

  const message =
    document.getElementById("newsletterMessage");


  message.textContent =
    "Thank you for your interest! Newsletter registration will be connected soon.";

  newsletterForm.reset();

});


/* 18. INITIALISE WEBSITE */

updateShopView("all");

displayProducts();

updateCart();

console.log(
  "Curated with Care by M. — Website loaded successfully."
);
