
/* =========================================
   CURATED WITH CARE BY M.
   INDIVIDUAL PRODUCT PAGE
========================================= */


/* 1. GET PRODUCT INFORMATION */

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const products = JSON.parse(
  localStorage.getItem("curatedProducts") || "[]"
);

const product = products.find(item =>
  String(item.id) === String(productId)
);


/* 2. GALLERY ELEMENTS */

const mainPhoto = document.getElementById("mainProductPhoto");
const thumbnails = document.getElementById("productThumbnails");

let currentPhoto = 0;


/* 3. SHOPPING BAG DATA */

let cart = JSON.parse(
  localStorage.getItem("curatedCart") || "[]"
);


/* 4. SHOPPING BAG HELPERS */

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


function saveCart() {
  localStorage.setItem(
    "curatedCart",
    JSON.stringify(cart)
  );
}


function refreshCartFromStorage() {
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
}


/* 5. UPDATE SHOPPING BAG */

function updateCart() {

  saveCart();

  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("bagCount");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce(
    (total, item) =>
      total + Math.max(0, Number(item.quantity) || 0),
    0
  );

  const totalPrice = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      Math.max(0, Number(item.quantity) || 0),
    0
  );


  if (cartCount) {
    cartCount.textContent = totalItems;
  }

  if (cartTotal) {
    cartTotal.textContent = formatPrice(totalPrice);
  }

  if (!cartItems) return;


  if (cart.length === 0) {

    cartItems.innerHTML = `
      <p>Your bag is currently empty.</p>
    `;

    return;
  }


  cartItems.innerHTML = cart.map(item => `

    <div class="cart-item">

      <div class="cart-item-layout">

        <img
          class="cart-item-image"
          src="${escapeHTML(item.image || "")}"
          alt="${escapeHTML(item.name)}"
          loading="lazy"
        >

        <div class="cart-item-details">

          <p>
            <strong>${escapeHTML(item.name)}</strong>
          </p>

          <p>
            ${formatPrice(item.price)} each
          </p>

          <div class="cart-item-quantity">

            <button
              class="quantity-button"
              type="button"
              data-quantity-change="-1"
              data-quantity-id="${escapeHTML(item.id)}"
              aria-label="Remove one ${escapeHTML(item.name)}"
            >
              −
            </button>

            <span class="quantity-number">
              ${Number(item.quantity) || 0}
            </span>

            <button
              class="quantity-button"
              type="button"
              data-quantity-change="1"
              data-quantity-id="${escapeHTML(item.id)}"
              aria-label="Add one ${escapeHTML(item.name)}"
            >
              +
            </button>

          </div>

          <p>
            Subtotal: ${formatPrice(
              Number(item.price || 0) *
              Number(item.quantity || 0)
            )}
          </p>

        </div>

      </div>

      <button
        class="remove-cart-item"
        type="button"
        data-remove="${escapeHTML(item.id)}"
      >
        REMOVE ENTIRE PRODUCT
      </button>

    </div>

  `).join("");

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


/* 7. CHANGE PRODUCT QUANTITY */

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


/* 8. REMOVE ENTIRE PRODUCT */

function removeFromCart(productId) {

  cart = cart.filter(item =>
    String(item.id) !== String(productId)
  );

  updateCart();

}


/* 9. CONNECT BAG QUANTITY AND REMOVE BUTTONS */

document.addEventListener("click", event => {

  const quantityButton = event.target.closest(
    "[data-quantity-change]"
  );

  if (quantityButton) {

    const id = quantityButton.dataset.quantityId;

    const change = Number(
      quantityButton.dataset.quantityChange
    );

    changeQuantity(id, change);

    return;
  }


  const removeButton = event.target.closest("[data-remove]");

  if (removeButton) {

    removeFromCart(removeButton.dataset.remove);

  }

});


/* 10. OPEN AND CLOSE SHOPPING BAG */

const bagButton = document.getElementById("bagButton");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");


function openCart() {

  if (!cartOverlay) return;

  refreshCartFromStorage();

  updateCart();

  cartOverlay.classList.add("open");

  cartOverlay.setAttribute("aria-hidden", "false");

}


function closeCartPanel() {

  if (!cartOverlay) return;

  cartOverlay.classList.remove("open");

  cartOverlay.setAttribute("aria-hidden", "true");

}


if (bagButton) {

  bagButton.addEventListener("click", event => {

    event.preventDefault();

    openCart();

  });

}


if (closeCart) {

  closeCart.addEventListener("click", closeCartPanel);

}


if (cartOverlay) {

  cartOverlay.addEventListener("click", event => {

    if (event.target === cartOverlay) {

      closeCartPanel();

    }

  });

}


/* 11. CONNECT VIEW MY BAG LINK */

const bagToastView = document.getElementById("bagToastView");

if (bagToastView) {

  bagToastView.addEventListener("click", event => {

    event.preventDefault();

    closeBagToast();

    openCart();

  });

}


/* 12. CHECKOUT BUTTON */

const checkoutButton = document.getElementById("checkoutButton");

if (checkoutButton) {

  checkoutButton.addEventListener("click", () => {

    if (cart.length === 0) {

      alert("Your shopping bag is empty.");

      return;

    }

    alert(
      "Thank you for your selection! " +
      "Our ordering and payment process will be connected here."
    );

  });

}


/* 13. SHOPPING BAG NOTIFICATION */

let toastTimer;


function showBagToast() {

  const toast = document.getElementById("bagToast");

  const toastImage = document.getElementById("bagToastImage");

  const toastName = document.getElementById("bagToastName");

  const toastPrice = document.getElementById("bagToastPrice");


  if (!toast || !product) return;


  if (toastImage) {

    toastImage.src = product.image;

    toastImage.alt = product.name;

  }

  if (toastName) {
    toastName.textContent = product.name;
  }

  if (toastPrice) {
    toastPrice.textContent = formatPrice(product.price);
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


/* 14. DISPLAY PRODUCT PHOTOS */

function showPhoto(index) {

  if (!product || !mainPhoto) return;

  const gallery = product.gallery?.length
    ? product.gallery
    : [product.image];

  if (!gallery.length) return;

  currentPhoto = (index + gallery.length) % gallery.length;

  mainPhoto.src = gallery[currentPhoto];

  mainPhoto.alt = product.name;


  document.querySelectorAll(".product-thumbnail").forEach((thumb, i) => {

    thumb.classList.toggle("selected", i === currentPhoto);

  });

}


/* 15. INITIALISE PRODUCT PAGE */

function initialiseProductPage() {

  if (!product) {

    const productPage = document.querySelector(
      ".standalone-product-page"
    );

    if (productPage) {

      productPage.innerHTML =
        "<p>Product not found. Please return to the shop.</p>";

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


  const benefits = document.getElementById("productBenefits");

  if (benefits) {

    benefits.innerHTML = "";

    (product.benefits || []).forEach(benefit => {

      const li = document.createElement("li");

      li.textContent = benefit;

      benefits.appendChild(li);

    });

  }


  /* CREATE PHOTO THUMBNAILS */

  const gallery = product.gallery?.length
    ? product.gallery
    : [product.image];

  if (thumbnails) {

    thumbnails.innerHTML = "";

    gallery.forEach((photo, index) => {

      const button = document.createElement("button");

      button.className = "product-thumbnail";

      button.type = "button";


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

}


/* 16. PREVIOUS AND NEXT PHOTOS */

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


/* 17. MOBILE PHOTO SWIPING */

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


/* 18. START THE PAGE */

updateCart();

initialiseProductPage();
