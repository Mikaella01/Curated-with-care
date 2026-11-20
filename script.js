
/* =========================================
   CURATED WITH CARE BY M.
   PRODUCT CATALOGUE & WEBSITE FUNCTIONALITY
   SUPABASE CONNECTED VERSION
========================================= */


/* =========================================
   1. PRODUCTS — LOADED FROM SUPABASE
========================================= */

let products = [];
let productsLoaded = false;


/* =========================================
   2. WEBSITE STATE
========================================= */

let activeBrand = "all";
let activeCollection = "all";
let activeConcern = "all";
let activeView = "all";

let searchTerm = "";
let sortOrder = "featured";

let cart = [];

try {

  cart = JSON.parse(
    localStorage.getItem("curatedCart") || "[]"
  );

  if (!Array.isArray(cart)) {
    cart = [];
  }

} catch (error) {

  cart = [];

}

let currentProduct = null;


/* =========================================
   3. HELPER FUNCTIONS
========================================= */

function formatPrice(price) {

  return "€" + Number(price || 0).toFixed(2);

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


function normaliseArray(value) {

  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  return [value];

}


/* =========================================
   4. PRODUCT FILTERING
========================================= */

function getFilteredProducts() {

  let filtered = [...products];


  if (activeBrand !== "all") {

    filtered = filtered.filter(product =>
      product.brand === activeBrand
    );

  }


  if (activeCollection !== "all") {

    filtered = filtered.filter(product =>
      (product.collection || []).includes(activeCollection)
    );

  }


  if (activeConcern !== "all") {

    filtered = filtered.filter(product =>
      (product.concerns || []).includes(activeConcern)
    );

  }


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


  if (sortOrder === "price-low") {

    filtered.sort((a, b) =>
      Number(a.price || 0) - Number(b.price || 0)
    );

  }

  else if (sortOrder === "price-high") {

    filtered.sort((a, b) =>
      Number(b.price || 0) - Number(a.price || 0)
    );

  }

  else if (sortOrder === "name") {

    filtered.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );

  }

  else {

    filtered.sort((a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    );

  }

  return filtered;

}


/* =========================================
   5. DISPLAY PRODUCTS
========================================= */

function displayProducts() {

  const productGrid = document.getElementById("productGrid");

  const resultsTitle = document.getElementById("resultsTitle");

  const resultsCount = document.getElementById("resultsCount");


  if (!productGrid) return;


  const filteredProducts = getFilteredProducts();

  productGrid.innerHTML = "";


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


  if (filteredProducts.length === 0) {

    const message = products.length === 0

      ? "Your product collection is waiting to be added."

      : "No products found. Try another brand, collection or search.";


    productGrid.innerHTML = `

      <div class="catalogue-empty">

        <p>${message}</p>

      </div>

    `;

    return;

  }


  filteredProducts.forEach(product => {

    const card = document.createElement("article");

    card.className = "product-card";


    card.innerHTML = `

      <div
        class="product-image"
        data-view-product="${escapeHTML(product.id)}"
        role="link"
        tabindex="0"
        aria-label="View ${escapeHTML(product.name)}"
      >

        <img
          src="${escapeHTML(product.image || "")}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.style.opacity='0'"
        >

      </div>


      <div class="product-info">

  <h3
    data-view-product="${escapeHTML(product.id)}"
    role="link"
    tabindex="0"
    aria-label="View ${escapeHTML(product.name)}"
  >

    ${escapeHTML(product.name)}

  </h3>

  <p class="product-price">
    ${formatPrice(product.price)}
  </p>

</div>

    `;


    productGrid.appendChild(card);

  });

}


/* =========================================
   6. SHOP NAVIGATION
========================================= */

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


/* =========================================
   7. BRAND FILTERS
========================================= */

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


/* =========================================
   8. COLLECTION FILTERS
========================================= */

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


/* =========================================
   9. SKIN CONCERN FILTERS
========================================= */

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


/* =========================================
   10. BRAND LINKS AND URL FILTERING
========================================= */

const availableBrands = [

  "medicube",
  "anua",
  "beauty-of-joseon",
  "cosrx",
  "vt-cosmetics",
  "skin1004",
  "torriden"

];


function initialiseBrandFromURL() {

  const urlParams = new URLSearchParams(
    window.location.search
  );

  const requestedBrand = urlParams.get("brand");


  if (
    requestedBrand &&
    availableBrands.includes(requestedBrand)
  ) {

    activeBrand = requestedBrand;

    activeCollection = "all";

    activeConcern = "all";

    searchTerm = "";

    activeView = "brands";

  }


  document.querySelectorAll("[data-brand]").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.brand === activeBrand
    );

  });


  document.querySelectorAll("[data-collection]").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.collection === activeCollection
    );

  });


  document.querySelectorAll("[data-concern]").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.concern === activeConcern
    );

  });


  const searchInput = document.getElementById("productSearch");

  if (searchInput) {

    searchInput.value = "";

  }

}


/* =========================================
   11. SEARCH PRODUCTS
========================================= */

const productSearch = document.getElementById("productSearch");


if (productSearch) {

  productSearch.addEventListener("input", event => {

    searchTerm = event.target.value;

    displayProducts();

  });

}


/* =========================================
   12. SORT PRODUCTS
========================================= */

const productSort = document.getElementById("productSort");


if (productSort) {

  productSort.addEventListener("change", event => {

    sortOrder = event.target.value;

    displayProducts();

  });

}


/* =========================================
   13. OPEN INDIVIDUAL PRODUCT PAGE
========================================= */

document.addEventListener("click", event => {

  const detailButton = event.target.closest("[data-view-product]");


  if (detailButton) {

    const productId = detailButton.dataset.viewProduct;

    window.location.href =
      `product.html?id=${encodeURIComponent(productId)}`;

  }

});


/* =========================================
   14. OLD PRODUCT DETAILS BACK BUTTON
========================================= */

const backToShop = document.getElementById("backToShop");


if (backToShop) {

  backToShop.addEventListener("click", () => {

    const detailsSection =
      document.getElementById("productDetails");

    const shop = document.getElementById("shop");


    if (detailsSection) {

      detailsSection.hidden = true;

    }


    if (shop) {

      shop.scrollIntoView({
        behavior: "smooth"
      });

    }

  });

}


/* =========================================
   15. SHOPPING BAG
========================================= */

function addToCart(productId) {

  const product = products.find(item =>
    String(item.id) === String(productId)
  );

  if (!product) return;


  const existingItem = cart.find(item =>
    String(item.id) === String(productId)
  );


  if (existingItem) {

    existingItem.quantity =
      Number(existingItem.quantity || 0) + 1;

  }

  else {

    cart.push({
      ...product,
      quantity: 1
    });

  }


  updateCart();

}


/* CHANGE QUANTITY */

function changeQuantity(productId, change) {

  const item = cart.find(item =>
    String(item.id) === String(productId)
  );

  if (!item) return;


  item.quantity =
    Number(item.quantity || 0) + Number(change);


  if (item.quantity <= 0) {

    cart = cart.filter(item =>
      String(item.id) !== String(productId)
    );

  }


  updateCart();

}


/* REMOVE ENTIRE PRODUCT */

function removeFromCart(productId) {

  cart = cart.filter(item =>
    String(item.id) !== String(productId)
  );

  updateCart();

}


/* SAVE BASKET AND UPDATE HEADER COUNT */

function updateCart() {

  try {

    localStorage.setItem(
      "curatedCart",
      JSON.stringify(cart)
    );

  } catch (error) {

    console.warn("Shopping bag could not be saved.", error);

  }


  const cartCount = document.getElementById("bagCount");


  const totalItems = cart.reduce(
    (total, item) =>
      total + Math.max(0, Number(item.quantity) || 0),
    0
  );


  if (cartCount) {

    cartCount.textContent = totalItems;

  }

}


/* CONNECT ADD TO BAG BUTTONS */

document.addEventListener("click", event => {

  const addButton = event.target.closest("[data-add]");


  if (addButton) {

    addToCart(addButton.dataset.add);

  }

});


/* =========================================
   16. OPEN DEDICATED BASKET PAGE
========================================= */

const bagButton = document.getElementById("bagButton");

if (bagButton) {

  bagButton.addEventListener("click", event => {

    event.preventDefault();

    window.location.href = "basket.html";

  });

}


/* =========================================
   17. MOBILE NAVIGATION
========================================= */

const menuToggle = document.getElementById("menuToggle");

const navigation = document.getElementById("navigation");


if (menuToggle && navigation) {

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

}


/* =========================================
   18. GIFT FINDER
========================================= */

const findGift = document.getElementById("findGift");


if (findGift) {

  findGift.addEventListener("click", () => {

    const occasion =
      document.getElementById("giftOccasion")?.value;

    const budget =
      document.getElementById("giftBudget")?.value;

    const result =
      document.getElementById("giftResult");


    if (!occasion || !budget) {

      if (result) {

        result.textContent =
          "Please select an occasion and your preferred budget.";

      }

      return;

    }


    if (result) {

      result.textContent =
        "Thank you! We're preparing thoughtful gift suggestions for you.";

    }

  });

}


/* =========================================
   19. NEWSLETTER
========================================= */

const newsletterForm =
  document.getElementById("newsletterForm");


if (newsletterForm) {

  newsletterForm.addEventListener("submit", event => {

    event.preventDefault();


    const message =
      document.getElementById("newsletterMessage");


    if (message) {

      message.textContent =
        "Thank you for your interest! Newsletter registration will be connected soon.";

    }


    newsletterForm.reset();

  });

}


/* =========================================
   20. LOAD PUBLIC PRODUCTS FROM SUPABASE
========================================= */

async function loadSupabaseProducts() {

  const productGrid = document.getElementById("productGrid");


  if (productGrid) {

    productGrid.innerHTML = `

      <div class="catalogue-empty">

        <p>Preparing your beauty edit...</p>

      </div>

    `;

  }


  try {

    if (typeof supabaseClient === "undefined") {

      throw new Error(
        "Supabase client is not available. Check the Supabase script tags in your HTML."
      );

    }


    const { data, error } = await supabaseClient

      .from("products")

      .select("*")

      .eq("is_active", true);


    if (error) {

      throw error;

    }


    products = (data || []).map(product => {

      const collections = normaliseArray(
        product.collection ?? product.collections
      );

      return {

        ...product,

        collection: collections,

        collections: collections,

        concerns: normaliseArray(product.concerns),

        skinTypes: normaliseArray(product.skinTypes),

        benefits: normaliseArray(product.benefits),

        ingredients: normaliseArray(product.ingredients),

        howToUseSteps: normaliseArray(product.howToUseSteps),

        gallery: normaliseArray(product.gallery)

      };

    });


    productsLoaded = true;


    console.log(
      "Supabase products loaded successfully:",
      products.length,
      products
    );


    displayProducts();


  } catch (error) {

    console.error(
      "Could not load products from Supabase:",
      error
    );


    if (productGrid) {

      productGrid.innerHTML = `

        <div class="catalogue-empty">

          <p>We're having trouble loading our beauty edit.</p>

          <p>Please try again shortly.</p>

        </div>

      `;

    }

  }

}


/* =========================================
   21. INITIALISE WEBSITE
========================================= */

initialiseBrandFromURL();

updateShopView(activeView);

updateCart();


/* =========================================
   22. REFRESH BAG WHEN RETURNING TO WEBSITE
========================================= */

window.addEventListener("pageshow", () => {

  try {

    cart = JSON.parse(
      localStorage.getItem("curatedCart") || "[]"
    );

    if (!Array.isArray(cart)) {

      cart = [];

    }

  } catch (error) {

    cart = [];

  }

  updateCart();

});


/* =========================================
   23. START PUBLIC PRODUCT CATALOGUE
========================================= */

loadSupabaseProducts();


console.log(
  "Curated with Care by M. — Website loaded successfully."
);


/* =========================================
   EDITORIAL INTRO — REPLAYABLE SCROLL ANIMATION
========================================= */

document.addEventListener("DOMContentLoaded", function () {

  const introSection = document.querySelector(".intro");

  if (!introSection) return;

  introSection.classList.add("intro-reveal");

  const introObserver = new IntersectionObserver(
    function (entries) {

      entries.forEach(function (entry) {

        if (entry.isIntersecting) {

          introSection.classList.add("intro-visible");

        } else {

          introSection.classList.remove("intro-visible");

        }

      });

    },
    {
      threshold: 0.15
    }
  );

  introObserver.observe(introSection);

});

/* =========================================
   CINEMATIC HERO — SCROLL STORY
========================================= */

document.addEventListener("DOMContentLoaded", function () {

  const hero = document.querySelector(".hero");
  const heroImage = document.querySelector(".hero-image");
  const heroContent = document.querySelector(".hero-content");

  if (!hero || !heroImage || !heroContent) return;

  /* Create floating petals */

  if (!hero.querySelector(".cinematic-petal")) {

    const petalOne = document.createElement("span");
    const petalTwo = document.createElement("span");
    const petalThree = document.createElement("span");

    petalOne.className = "cinematic-petal petal-one";
    petalTwo.className = "cinematic-petal petal-two";
    petalThree.className = "cinematic-petal petal-three";

    petalOne.setAttribute("aria-hidden", "true");
    petalTwo.setAttribute("aria-hidden", "true");
    petalThree.setAttribute("aria-hidden", "true");

    hero.appendChild(petalOne);
    hero.appendChild(petalTwo);
    hero.appendChild(petalThree);

  }

  /* Scroll animation */

  let ticking = false;

  function updateHeroAnimation() {

    const rect = hero.getBoundingClientRect();

    const progress = Math.max(
      0,
      Math.min(
        1,
        (0 - rect.top) / (rect.height * 0.75)
      )
    );

    /* Image moves and enlarges */

    const scale = 1.04 + (progress * 0.08);
    const imageMove = progress * -45;

    heroImage.style.transform =
      `scale(${scale}) translateY(${imageMove}px)`;

    /* Text gently moves as the visitor scrolls */

    const contentMove = progress * -35;
    const contentOpacity = 1 - (progress * 0.45);

    heroContent.style.transform =
      `translateY(${contentMove}px)`;

    heroContent.style.opacity = contentOpacity;

    ticking = false;

  }

  function requestHeroUpdate() {

    if (!ticking) {

      window.requestAnimationFrame(updateHeroAnimation);

      ticking = true;

    }

  }

  window.addEventListener("scroll", requestHeroUpdate, {
    passive: true
  });

  window.addEventListener("resize", requestHeroUpdate);

  updateHeroAnimation();

});

/* =========================================
   CINEMATIC TRANSITION — INTRO SCROLL
========================================= */

document.addEventListener("DOMContentLoaded", function () {

  const intro = document.querySelector(".intro");

  if (!intro) return;

  let ticking = false;

  function updateIntroScene() {

    const rect = intro.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const progress = Math.max(
      0,
      Math.min(
        1,
        (windowHeight - rect.top) /
        (windowHeight + rect.height)
      )
    );

    intro.style.setProperty(
      "--story-progress",
      progress
    );

    ticking = false;

  }

  function requestIntroUpdate() {

    if (!ticking) {

      window.requestAnimationFrame(updateIntroScene);

      ticking = true;

    }

  }

  window.addEventListener("scroll", requestIntroUpdate, {
    passive: true
  });

  window.addEventListener("resize", requestIntroUpdate);

  updateIntroScene();

});
