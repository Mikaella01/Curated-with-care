
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
  return "€" + Number(price).toFixed(2);
}


function saveCart() {

  localStorage.setItem(
    "curatedCart",
    JSON.stringify(cart)
  );

}


/* 5. UPDATE SHOPPING BAG */

function updateCart() {

  saveCart();

  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("bagCount");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  const totalPrice = cart.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity || 0),
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

      <p>
        <strong>${item.name}</strong>
      </p>

      <p>
        ${formatPrice(item.price)} × ${item.quantity}
      </p>

      <button
        class="remove-cart-item"
        data-remove="${item.id}"
        type="button"
      >
        REMOVE
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


/* 7. REMOVE PRODUCT FROM BAG */

function removeFromCart(productId) {

  cart = cart.filter(item =>
    String(item.id) !== String(productId)
  );

  updateCart();

}


/* CONNECT REMOVE BUTTONS */

document.addEventListener("click", event => {

  const removeButton = event.target.closest("[data-remove]");

  if (removeButton) {

    removeFromCart(removeButton.dataset.remove);

  }

});


/* 8. OPEN AND CLOSE SHOPPING BAG */

const bagButton = document.getElementById("bagButton");
const cartOverlay = document.getElementById("cartOverlay");
const closeCart = document.getElementById("closeCart");


function openCart() {

  if (!cartOverlay) return;

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

  bagButton.addEventListener("click", openCart);

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


/* 9. CONNECT VIEW MY BAG LINK */

const bagToastView = document.getElementById("bagToastView");

if (bagToastView) {

  bagToastView.addEventListener("click", event => {

    event.preventDefault();

    closeBagToast();

    openCart();

  });

}


/* 10. CHECKOUT BUTTON */

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


/* 11. SHOPPING BAG NOTIFICATION */

let toastTimer;


function showBagToast() {

  const toast = document.getElementById("bagToast");

  const toastImage = document.getElementById("bagToastImage");

  const toastName = document.getElementById("bagToastName");

  const toastPrice = document.getElementById("bagToastPrice");


  if (!toast || !product) return;


  toastImage.src = product.image;

  toastImage.alt = product.name;

  toastName.textContent = product.name;

  toastPrice.textContent = formatPrice(product.price);


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


/* 12. DISPLAY PRODUCT PHOTOS */

function showPhoto(index) {

  if (!product) return;

  const gallery = product.gallery?.length
    ? product.gallery
    : [product.image];

  currentPhoto = (index + gallery.length) % gallery.length;

  mainPhoto.src = gallery[currentPhoto];

  mainPhoto.alt = product.name;


  document.querySelectorAll(".product-thumbnail").forEach((thumb, i) => {

    thumb.classList.toggle("selected", i === currentPhoto);

  });

}


/* 13. INITIALISE PRODUCT PAGE */

function initialiseProductPage() {

  if (!product) {

    document.querySelector(".standalone-product-page").innerHTML =
      "<p>Product not found. Please return to the shop.</p>";

    return;

  }


  document.title =
    product.name + " | Curated with Care by M.";


  document.getElementById("productBrand").textContent =
    product.brandName || product.brand;

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

  benefits.innerHTML = "";


  (product.benefits || []).forEach(benefit => {

    const li = document.createElement("li");

    li.textContent = benefit;

    benefits.appendChild(li);

  });


  /* CREATE PHOTO THUMBNAILS */

  const gallery = product.gallery?.length
    ? product.gallery
    : [product.image];

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


  showPhoto(0);


  /* CONNECT ADD TO BAG BUTTON */

  const addButton = document.getElementById("productAddToCart");

  if (addButton) {

    addButton.addEventListener("click", addProductToBag);

  }

}


/* 14. PREVIOUS AND NEXT PHOTOS */

document.getElementById("previousPhoto").addEventListener("click", () => {

  showPhoto(currentPhoto - 1);

});


document.getElementById("nextPhoto").addEventListener("click", () => {

  showPhoto(currentPhoto + 1);

});


/* 15. MOBILE PHOTO SWIPING */

let touchStartX = 0;


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


/* 16. START THE PAGE */

updateCart();

initialiseProductPage();
