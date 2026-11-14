
/* =========================================
   CURATED WITH CARE BY M.
   INDIVIDUAL PRODUCT PAGE
========================================= */


/* 1. GET PRODUCT INFORMATION */

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");


function getStoredProducts() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("curatedProducts") || "[]"
    );

    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}


const products = getStoredProducts();

const product = products.find(item =>
  String(item.id) === String(productId)
);


/* 2. GALLERY ELEMENTS */

const mainPhoto = document.getElementById("mainProductPhoto");
const thumbnails = document.getElementById("productThumbnails");

let currentPhoto = 0;


/* 3. SHOPPING BAG DATA */

function getStoredCart() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("curatedCart") || "[]"
    );

    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}


let cart = getStoredCart();


/* 4. GENERAL HELPERS */

function formatPrice(price) {
  return "€" + Number(price || 0).toFixed(2);
}


function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}


function getProductGallery(selectedProduct) {
  if (selectedProduct.gallery?.length) {
    return selectedProduct.gallery;
  }

  return selectedProduct.image
    ? [selectedProduct.image]
    : [];
}


function getProductCollections(selectedProduct) {
  if (Array.isArray(selectedProduct.collections)) {
    return selectedProduct.collections;
  }

  if (Array.isArray(selectedProduct.collection)) {
    return selectedProduct.collection;
  }

  if (selectedProduct.collection) {
    return [selectedProduct.collection];
  }

  return [];
}


function showSection(sectionId, shouldShow) {
  const section = document.getElementById(sectionId);

  if (section) {
    section.hidden = !shouldShow;
  }
}


function createTextElement(tag, text, className) {
  const element = document.createElement(tag);

  element.textContent = text;

  if (className) {
    element.className = className;
  }

  return element;
}


/* 5. SAVE AND UPDATE SHOPPING BAG */

function saveCart() {
  localStorage.setItem(
    "curatedCart",
    JSON.stringify(cart)
  );
}


function refreshCartFromStorage() {
  cart = getStoredCart();
}


function updateCart() {
  saveCart();

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


/* 6. ADD PRODUCT TO BAG */

function addProductToBag() {
  if (!product) return;

  const existingItem = cart.find(item =>
    String(item.id) === String(product.id)
  );

  if (existingItem) {
    existingItem.quantity =
      Number(existingItem.quantity || 0) + 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  updateCart();

  const message = document.getElementById("addToCartMessage");
  const button = document.getElementById("productAddToCart");

  if (message) {
    message.textContent =
      "Beautiful choice! This item has been added to your bag.";
  }

  if (button) {
    button.textContent = "ADDED TO BAG ✓";
  }

  showBagToast();
}


/* 7. SHOPPING BAG NOTIFICATION */

let toastTimer;


function showBagToast(selectedProduct = product) {
  const toast = document.getElementById("bagToast");
  const toastImage = document.getElementById("bagToastImage");
  const toastName = document.getElementById("bagToastName");
  const toastPrice = document.getElementById("bagToastPrice");

  if (!toast || !selectedProduct) return;

  if (toastImage) {
    toastImage.src = selectedProduct.image || "";
    toastImage.alt = selectedProduct.name || "";
  }

  if (toastName) {
    toastName.textContent = selectedProduct.name || "";
  }

  if (toastPrice) {
    toastPrice.textContent = formatPrice(selectedProduct.price);
  }

  toast.classList.add("show");
  toast.setAttribute("aria-hidden", "false");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    closeBagToast();
  }, 4500);
}


function closeBagToast() {
  const toast = document.getElementById("bagToast");

  if (!toast) return;

  toast.classList.remove("show");
  toast.setAttribute("aria-hidden", "true");

  clearTimeout(toastTimer);
}


const toastCloseButton = document.getElementById("bagToastClose");

if (toastCloseButton) {
  toastCloseButton.addEventListener("click", closeBagToast);
}


/* 8. DISPLAY PRODUCT PHOTOS */

function showPhoto(index) {
  if (!product || !mainPhoto) return;

  const gallery = getProductGallery(product);

  if (!gallery.length) return;

  currentPhoto = (index + gallery.length) % gallery.length;

  mainPhoto.src = gallery[currentPhoto];
  mainPhoto.alt = product.name;

  document.querySelectorAll(".product-thumbnail").forEach((thumb, i) => {
    thumb.classList.toggle("selected", i === currentPhoto);
  });
}


/* 9. PRODUCT EDITORIAL SECTION */

function displayProductEditorial() {
  const editorialText = document.getElementById(
    "productEditorialText"
  );

  const text =
    product.editorialText ||
    product.editorial ||
    "";

  if (!text || !editorialText) {
    showSection("productEditorialSection", false);
    return;
  }

  editorialText.textContent = text;

  showSection("productEditorialSection", true);
}


/* 10. AT A GLANCE */

function displayProductGlance() {
  const grid = document.getElementById("productGlanceGrid");

  if (!grid) return;

  grid.innerHTML = "";

  const collections = getProductCollections(product);

  const details = [
    {
      label: "BRAND",
      value: product.brandName || product.brand
    },
    {
      label: "PRODUCT TYPE",
      value: product.productType || product.category
    },
    {
      label: "SIZE",
      value: product.size
    },
    {
      label: "COLLECTION",
      value: collections.join(", ")
    }
  ];

  const availableDetails = details.filter(detail =>
    detail.value
  );

  if (!availableDetails.length) {
    showSection("productGlanceSection", false);
    return;
  }

  availableDetails.forEach(detail => {
    const item = document.createElement("div");

    item.className = "product-glance-item";

    item.appendChild(
      createTextElement(
        "p",
        detail.label,
        "product-glance-label"
      )
    );

    item.appendChild(
      createTextElement(
        "p",
        detail.value,
        "product-glance-value"
      )
    );

    grid.appendChild(item);
  });

  showSection("productGlanceSection", true);
}


/* 11. WHY WE CHOSE IT */

function displayProductChoice() {
  const choiceText = document.getElementById(
    "productChoiceText"
  );

  const text =
    product.whyWeChoseIt ||
    product.editorialReason ||
    "";

  if (!text || !choiceText) {
    showSection("productChoiceSection", false);
    return;
  }

  choiceText.textContent = text;

  showSection("productChoiceSection", true);
}


/* 12. SKIN INFORMATION */

function displayProductSkinDetails() {
  const container = document.getElementById(
    "productSkinDetails"
  );

  if (!container) return;

  container.innerHTML = "";

  const concerns = Array.isArray(product.concerns)
    ? product.concerns
    : [];

  const skinTypes = Array.isArray(product.skinTypes)
    ? product.skinTypes
    : [];

  const hasInformation =
    concerns.length > 0 || skinTypes.length > 0;

  if (!hasInformation) {
    showSection("productSkinSection", false);
    return;
  }

  if (skinTypes.length) {
    const heading = createTextElement(
      "h3",
      "Skin Types",
      "product-detail-subheading"
    );

    container.appendChild(heading);

    const list = document.createElement("ul");

    skinTypes.forEach(type => {
      list.appendChild(
        createTextElement("li", type)
      );
    });

    container.appendChild(list);
  }

  if (concerns.length) {
    const heading = createTextElement(
      "h3",
      "Skin Concerns",
      "product-detail-subheading"
    );

    container.appendChild(heading);

    const list = document.createElement("ul");

    concerns.forEach(concern => {
      list.appendChild(
        createTextElement("li", concern)
      );
    });

    container.appendChild(list);
  }

  showSection("productSkinSection", true);
}


/* 13. INGREDIENT INFORMATION */

function displayProductIngredients() {
  const container = document.getElementById(
    "productIngredientsContent"
  );

  const fullIngredientsText = document.getElementById(
    "productFullIngredientsText"
  );

  const fullIngredients = document.getElementById(
    "productFullIngredients"
  );

  if (!container) return;

  container.innerHTML = "";

  const ingredients = Array.isArray(product.ingredients)
    ? product.ingredients
    : [];

  const hasFullIngredients = Boolean(
    product.fullIngredients
  );

  if (!ingredients.length && !hasFullIngredients) {
    showSection("productIngredientsSection", false);
    return;
  }

  ingredients.forEach(ingredient => {
    const item = document.createElement("div");

    item.className = "product-ingredient-item";

    if (typeof ingredient === "string") {
      item.appendChild(
        createTextElement("h3", ingredient)
      );
    } else if (ingredient && typeof ingredient === "object") {
      if (ingredient.name) {
        item.appendChild(
          createTextElement("h3", ingredient.name)
        );
      }

      if (ingredient.description) {
        item.appendChild(
          createTextElement("p", ingredient.description)
        );
      }
    }

    container.appendChild(item);
  });

  if (hasFullIngredients && fullIngredientsText && fullIngredients) {
    fullIngredientsText.textContent = product.fullIngredients;
    fullIngredients.hidden = false;
  } else if (fullIngredients) {
    fullIngredients.hidden = true;
  }

  showSection("productIngredientsSection", true);
}


/* 14. HOW TO USE */

function displayProductHowTo() {
  const container = document.getElementById(
    "productHowToContent"
  );

  if (!container) return;

  container.innerHTML = "";

  const instructions =
    product.howToUseSteps ||
    product.howToUse ||
    "";

  if (!instructions || (
    Array.isArray(instructions) && !instructions.length
  )) {
    showSection("productHowToSection", false);
    return;
  }

  if (Array.isArray(instructions)) {
    const list = document.createElement("ol");

    instructions.forEach(instruction => {
      list.appendChild(
        createTextElement("li", instruction)
      );
    });

    container.appendChild(list);
  } else {
    container.appendChild(
      createTextElement("p", instructions)
    );
  }

  showSection("productHowToSection", true);
}


/* 15. COMPLETE THE RITUAL */

function displayProductRoutine() {
  const grid = document.getElementById(
    "productRoutineGrid"
  );

  if (!grid) return;

  grid.innerHTML = "";

  const routineIds = Array.isArray(product.routineProductIds)
    ? product.routineProductIds
    : [];

  const routineProducts = routineIds
    .map(id =>
      products.find(item => String(item.id) === String(id))
    )
    .filter(Boolean);

  if (!routineProducts.length) {
    showSection("productRoutineSection", false);
    return;
  }

  routineProducts.forEach(item => {
    const card = document.createElement("article");

    card.className = "product-routine-card";

    card.innerHTML = `
      <a href="product.html?id=${encodeURIComponent(item.id)}">
        <img
          src="${escapeHTML(item.image || "")}"
          alt="${escapeHTML(item.name)}"
          loading="lazy"
        >
      </a>

      <p>${escapeHTML(item.brandName || item.brand || "")}</p>

      <h3>
        <a href="product.html?id=${encodeURIComponent(item.id)}">
          ${escapeHTML(item.name)}
        </a>
      </h3>

      <p>${formatPrice(item.price)}</p>
    `;

    grid.appendChild(card);
  });

  showSection("productRoutineSection", true);
}


/* 16. INITIALISE PRODUCT PAGE */

function initialiseProductPage() {
  if (!product) {
    const productPage = document.querySelector(
      ".standalone-product-page"
    );

    if (productPage) {
      productPage.innerHTML =
        '<p>Product not found. Please return to the shop.</p>';
    }

    const relatedSection = document.getElementById(
      "relatedProductsSection"
    );

    if (relatedSection) {
      relatedSection.hidden = true;
    }

    return;
  }

  document.title =
    product.name + " | Curated with Care by M.";

  document.getElementById("productBrand").textContent =
    product.brandName || product.brand || "";

  document.getElementById("productName").textContent =
    product.name;

  document.getElementById("productSize").textContent =
    product.size || "";

  document.getElementById("productPrice").textContent =
    formatPrice(product.price);

  document.getElementById("productDescription").textContent =
    product.description ||
    "Discover this beauty favourite, thoughtfully selected by Curated with Care by M.";

  /* PRODUCT BENEFITS */

  const benefits = document.getElementById("productBenefits");

  if (benefits) {
    benefits.innerHTML = "";

    (product.benefits || []).forEach(benefit => {
      benefits.appendChild(
        createTextElement("li", benefit)
      );
    });

    benefits.parentElement.hidden =
      !product.benefits || product.benefits.length === 0;
  }

  /* CREATE PHOTO THUMBNAILS */

  const gallery = getProductGallery(product);

  if (thumbnails) {
    thumbnails.innerHTML = "";

    gallery.forEach((photo, index) => {
      const button = document.createElement("button");

      button.className = "product-thumbnail";
      button.type = "button";

      button.setAttribute(
        "aria-label",
        "Show product photo " + (index + 1)
      );

      const image = document.createElement("img");

      image.src = photo;
      image.alt = product.name + " photo " + (index + 1);

      button.appendChild(image);

      button.addEventListener("click", () => {
        showPhoto(index);
      });

      thumbnails.appendChild(button);
    });
  }

  showPhoto(0);

  /* CONNECT ADD TO BAG BUTTON */

  const addButton = document.getElementById("productAddToCart");

  if (addButton) {
    addButton.addEventListener("click", addProductToBag);
  }

  /* DISPLAY NEW EDITORIAL SECTIONS */

  displayProductEditorial();
  displayProductGlance();
  displayProductChoice();
  displayProductSkinDetails();
  displayProductIngredients();
  displayProductHowTo();
  displayProductRoutine();
}


/* 17. PREVIOUS AND NEXT PHOTOS */

const previousPhoto = document.getElementById("previousPhoto");
const nextPhoto = document.getElementById("nextPhoto");

if (previousPhoto) {
  previousPhoto.addEventListener("click", () => {
    showPhoto(currentPhoto - 1);
  });
}

if (nextPhoto) {
  nextPhoto.addEventListener("click", () => {
    showPhoto(currentPhoto + 1);
  });
}


/* 18. MOBILE PHOTO SWIPING */

let touchStartX = 0;

if (mainPhoto) {
  mainPhoto.addEventListener("touchstart", event => {
    touchStartX = event.changedTouches[0].screenX;
  }, { passive: true });

  mainPhoto.addEventListener("touchend", event => {
    const touchEndX = event.changedTouches[0].screenX;
    const difference = touchStartX - touchEndX;

    if (Math.abs(difference) > 45) {
      if (difference > 0) {
        showPhoto(currentPhoto + 1);
      } else {
        showPhoto(currentPhoto - 1);
      }
    }
  }, { passive: true });
}


/* 19. RELATED PRODUCTS — YOU MAY ALSO LOVE */

function getRelatedProducts() {
  if (!product) return [];

  const currentCollections = getProductCollections(product);

  const currentConcerns = product.concerns || [];

  return products
    .filter(item => String(item.id) !== String(product.id))
    .map(item => {
      let score = 0;

      const otherCollections = getProductCollections(item);
      const otherConcerns = item.concerns || [];

      /* SAME COLLECTION */

      const sharedCollections = currentCollections.filter(value =>
        otherCollections.includes(value)
      );

      score += sharedCollections.length * 4;

      /* SIMILAR SKIN CONCERNS */

      const sharedConcerns = currentConcerns.filter(value =>
        otherConcerns.includes(value)
      );

      score += sharedConcerns.length * 3;

      /* SAME PRODUCT CATEGORY */

      if (
        product.category &&
        item.category &&
        product.category === item.category
      ) {
        score += 1;
      }

      /* SAME BRAND */

      if (product.brand === item.brand) {
        score += 0.5;
      }

      return {
        ...item,
        recommendationScore: score
      };
    })
    .filter(item => item.recommendationScore > 0)
    .sort((a, b) =>
      b.recommendationScore - a.recommendationScore
    )
    .slice(0, 4);
}


/* 20. DISPLAY RELATED PRODUCTS */

function displayRelatedProducts() {
  const section = document.getElementById(
    "relatedProductsSection"
  );

  const grid = document.getElementById(
    "relatedProductsGrid"
  );

  if (!section || !grid || !product) return;

  const relatedProducts = getRelatedProducts();

  if (relatedProducts.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  grid.innerHTML = "";

  relatedProducts.forEach(item => {
    const card = document.createElement("article");

    card.className = "related-product-card";

    card.innerHTML = `
      <div class="related-product-image">
        <a href="product.html?id=${encodeURIComponent(item.id)}">
          <img
            src="${escapeHTML(item.image || "")}"
            alt="${escapeHTML(item.name)}"
            loading="lazy"
          >
        </a>
      </div>

      <div class="related-product-info">

        <p class="related-product-brand">
          ${escapeHTML(item.brandName || item.brand || "")}
        </p>

        <h3>
          <a href="product.html?id=${encodeURIComponent(item.id)}">
            ${escapeHTML(item.name)}
          </a>
        </h3>

        <p class="related-product-price">
          ${formatPrice(item.price)}
        </p>

        <button
          type="button"
          class="related-add-button"
          data-related-add="${escapeHTML(item.id)}"
        >
          ADD +
        </button>

        <a
          class="related-view-link"
          href="product.html?id=${encodeURIComponent(item.id)}"
          style="
            display: inline-block;
            margin-top: 15px;
            padding: 0 0 4px;
            background: none;
            border: none;
            border-bottom: 1px solid var(--border);
            color: var(--deep-rose);
            font-family: inherit;
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 1px;
            text-transform: none;
            text-decoration: none;
            cursor: pointer;
          "
        >
          View details
        </a>

      </div>
    `;

    grid.appendChild(card);
  });
}


/* 21. ADD RECOMMENDED PRODUCT TO SHOPPING BAG */

function addRelatedProductToBag(selectedProductId) {
  const selectedProduct = products.find(item =>
    String(item.id) === String(selectedProductId)
  );

  if (!selectedProduct) return;

  const existingItem = cart.find(item =>
    String(item.id) === String(selectedProductId)
  );

  if (existingItem) {
    existingItem.quantity =
      Number(existingItem.quantity || 0) + 1;
  } else {
    cart.push({
      ...selectedProduct,
      quantity: 1
    });
  }

  updateCart();

  showBagToast(selectedProduct);
}


/* 22. CONNECT RELATED PRODUCT BUTTONS */

document.addEventListener("click", event => {
  const button = event.target.closest("[data-related-add]");

  if (!button) return;

  addRelatedProductToBag(button.dataset.relatedAdd);
});


/* 23. START THE PAGE */

refreshCartFromStorage();

updateCart();

initialiseProductPage();

displayRelatedProducts();
