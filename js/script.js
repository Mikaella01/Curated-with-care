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


const availableConcerns = [

  "dryness",
  "dullness",
  "pores",
  "uneven-tone",
  "sensitive-skin"

];


function initialiseBrandFromURL() {

  const urlParams = new URLSearchParams(
    window.location.search
  );

  const requestedBrand = urlParams.get("brand");
  const requestedConcern = urlParams.get("concern");


  // BRAND FILTER

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


  // SKIN CONCERN FILTER

  else if (
    requestedConcern &&
    availableConcerns.includes(requestedConcern)
  ) {

    activeBrand = "all";

    activeCollection = "all";

    activeConcern = requestedConcern;

    searchTerm = "";

    activeView = "concerns";

  }


  // UPDATE BRAND BUTTONS

  document.querySelectorAll("[data-brand]").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.brand === activeBrand
    );

  });


  // UPDATE COLLECTION BUTTONS

  document.querySelectorAll("[data-collection]").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.collection === activeCollection
    );

  });


  // UPDATE CONCERN BUTTONS

  document.querySelectorAll("[data-concern]").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.concern === activeConcern
    );

  });


  // CLEAR SEARCH

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
   REAL PRODUCT RECOMMENDATIONS
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

      result.textContent =
        "Please select an occasion and your preferred budget.";

      return;

    }


    if (!products.length) {

      result.textContent =
        "Our gift collection is being prepared. Please check back soon.";

      return;

    }


    const budgetRanges = {

      "under-30": [0, 30],

      "30-60": [30, 60],

      "60-100": [60, 100],

      "100-plus": [100, Infinity]

    };


    const occasions = {

      "birthday": "Birthday gifts",

      "christmas": "Christmas gifting",

      "thank-you": "Thoughtful thank-you gifts",

      "self-care": "Self-care treats",

      "just-because": "Little gifts, just because"

    };


    const [minimum, maximum] =
      budgetRanges[budget];


    const suggestions = products

      .filter(product => {

        const price = Number(product.price || 0);

        return price >= minimum && price <= maximum;

      })

      .sort((a, b) => {

        return Number(Boolean(b.featured)) -
          Number(Boolean(a.featured));

      })

      .slice(0, 3);


    if (!suggestions.length) {

      result.innerHTML = `
        <p>
          We don't have products in this budget yet.
          Please explore our complete collection.
        </p>

        <a href="shop.html">
          EXPLORE THE COLLECTION ↗
        </a>
      `;

      return;

    }


    result.innerHTML = `

      <div class="gift-result-heading">

        <span>YOUR CURATED GIFT EDIT</span>

        <h3>
          ${escapeHTML(occasions[occasion])}
        </h3>

        <p>
          A few thoughtful discoveries within your budget.
        </p>

      </div>


      <div class="gift-result-grid">

        ${suggestions.map(product => `

          <a
            href="shop.html#shop"
            class="gift-result-card">

            <div class="gift-result-image">

              <img
                src="${escapeHTML(product.image || "")}"
                alt="${escapeHTML(product.name)}"
                loading="lazy">

            </div>

            <h4>
              ${escapeHTML(product.name)}
            </h4>

            <span>
              ${formatPrice(product.price)}
            </span>

          </a>

        `).join("")}

      </div>


      <a
        href="shop.html"
        class="gift-result-link">

        DISCOVER MORE GIFT IDEAS ↗

      </a>

    `;

  });

}


/* =========================================
   19. NEWSLETTER
   CONNECTED TO SUPABASE
========================================= */

const newsletterForm =
  document.getElementById("newsletterForm");


if (newsletterForm) {

  newsletterForm.addEventListener("submit", async event => {

    event.preventDefault();

    const emailInput =
      document.getElementById("newsletterEmail");

    const consentInput =
      document.getElementById("newsletterConsent");

    const message =
      document.getElementById("newsletterMessage");

    const submitButton =
      newsletterForm.querySelector('button[type="submit"]');

    const email = emailInput.value.trim().toLowerCase();


    if (!consentInput.checked) {

      message.textContent =
        "Please confirm your consent before subscribing.";

      return;

    }


    if (typeof supabaseClient === "undefined") {

      message.textContent =
        "Our newsletter is temporarily unavailable. Please try again later.";

      return;

    }


    submitButton.disabled = true;

    submitButton.textContent = "SUBSCRIBING...";

    message.textContent = "Please wait...";


    try {

      const { error } = await supabaseClient

        .from("newsletter_subscribers")

        .insert([
          {
            email: email,
            marketing_consent: true
          }
        ]);


      if (error) {

        if (error.code === "23505") {

          message.textContent =
            "This email address is already subscribed.";

          return;

        }

        throw error;

      }


      message.textContent =
        "Thank you! You're now on our beauty list.";

      newsletterForm.reset();


    } catch (error) {

      console.error("Newsletter signup failed:", error);

      message.textContent =
        "We couldn't complete your subscription. Please try again.";

    } finally {

      submitButton.disabled = false;

      submitButton.textContent = "SUBSCRIBE ↗";

    }

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

// Read URL parameters first
initialiseBrandFromURL();

// Display the correct shop navigation
updateShopView(activeView);

// Update shopping bag count
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
   CURATED WITH CARE
   UNIFIED CINEMATIC STORY CONTROLLER
========================================= */

(function initCinematicStory() {

  const hero = document.querySelector(".hero");
  const heroImage = document.querySelector(".hero-image");
  const heroContent = document.querySelector(".hero-content");
  const intro = document.querySelector(".intro");

  if (!hero || !heroImage || !heroContent || !intro) return;


  /* ---------------------------------------
     1. CREATE TRAVELLING PETALS
  --------------------------------------- */

  document.querySelectorAll(".story-petal").forEach(el => el.remove());

  const petals = [];

  for (let i = 0; i < 4; i++) {

    const petal = document.createElement("div");

    petal.className = `story-petal story-petal-${i + 1}`;

    petal.setAttribute("aria-hidden", "true");

    document.body.appendChild(petal);

    petals.push(petal);

  }


  /* ---------------------------------------
     2. SCROLL PROGRESS
  --------------------------------------- */

  let ticking = false;

  function clamp(value) {

    return Math.max(0, Math.min(1, value));

  }


  function smooth(value) {

    return value * value * (3 - 2 * value);

  }


  /* ---------------------------------------
     3. HERO CAMERA MOVEMENT
  --------------------------------------- */

  function updateStory() {

    const heroRect = hero.getBoundingClientRect();

    const introRect = intro.getBoundingClientRect();

    const viewportHeight = window.innerHeight;

    const heroProgress = clamp(
      -heroRect.top / (heroRect.height * 0.8)
    );

    const introProgress = clamp(
      (viewportHeight - introRect.top) /
      (viewportHeight + introRect.height)
    );


    /* Camera zoom */

    const zoom = 1.04 + heroProgress * 0.12;

    const verticalMove = heroProgress * -55;

    heroImage.style.transform =
      `scale(${zoom}) translate3d(0, ${verticalMove}px, 0)`;


    /* Image transition */

    const inset = heroProgress * 9;

    const radius = heroProgress * 45;

    const opacity = 1 - heroProgress * 0.28;

    heroImage.style.clipPath =
      `inset(0 ${inset}% 0 ${inset}% round ${radius}px)`;


    heroImage.style.opacity = opacity;


    /* Hero text travels upward */

    heroContent.style.transform =
      `translate3d(0, ${heroProgress * -45}px, 0)`;


    heroContent.style.opacity =
      1 - heroProgress * 0.45;


    /* ---------------------------------------
       4. PETALS TRAVEL BETWEEN SCENES
    --------------------------------------- */

    const heroStart =
      heroRect.top + window.scrollY;

    const introEnd =
      introRect.bottom + window.scrollY;

    const travelDistance =
      Math.max(1, introEnd - heroStart);

    const storyProgress = clamp(
      (window.scrollY - heroStart) /
      travelDistance
    );


    petals.forEach((petal, index) => {

      const offset = index * 0.17;

      const progress = clamp(storyProgress + offset);

      const wave = Math.sin(progress * Math.PI * 2 + index);

      const x =
        window.innerWidth *
        (0.82 - progress * 0.68) +
        wave * 65;

      const y =
        window.innerHeight *
        (0.20 + progress * 0.65) +
        Math.cos(progress * Math.PI * 3 + index) * 45;

      const rotation =
        progress * 540 + index * 100;

      const size =
        0.7 + progress * 0.7;

      const visibility =
        Math.sin(progress * Math.PI);


      petal.style.transform =
        `translate3d(${x}px, ${y}px, 0)`;

      petal.style.opacity =
        visibility;

      petal.style.setProperty(
        "--petal-rotation",
        `${rotation}deg`
      );

      petal.style.setProperty(
        "--petal-scale",
        size
      );

    });


    /* ---------------------------------------
       5. INTRO REPLAY
    --------------------------------------- */

    intro.style.setProperty(
      "--story-progress",
      introProgress
    );

    if (introProgress > 0.08) {

      intro.classList.add("intro-visible");

    } else {

      intro.classList.remove("intro-visible");

    }


    ticking = false;

  }


  /* ---------------------------------------
     6. PERFORMANCE
  --------------------------------------- */

  function requestUpdate() {

    if (!ticking) {

      window.requestAnimationFrame(updateStory);

      ticking = true;

    }

  }


  window.addEventListener(
    "scroll",
    requestUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    requestUpdate
  );


  /* Initial state */

  updateStory();


})();
