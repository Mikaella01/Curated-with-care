

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


/* 3. DISPLAY PRODUCT PHOTOS */

function showPhoto(index) {

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


/* 4. SHOPPING BAG */

function addProductToBag() {

  if (!product) return;

  let cart = JSON.parse(
    localStorage.getItem("curatedCart") || "[]"
  );

  const existingItem = cart.find(item =>
    String(item.id) === String(product.id)
  );

  if (existingItem) {

    existingItem.quantity++;

  } else {

    cart.push({
      ...product,
      quantity: 1
    });

  }

  localStorage.setItem(
    "curatedCart",
    JSON.stringify(cart)
  );

  const message = document.getElementById("addToCartMessage");
  const button = document.getElementById("productAddToCart");

  if (message) {
    message.textContent = "Beautiful choice! This item has been added to your bag.";
  }

  if (button) {
    button.textContent = "ADDED TO BAG ✓";
  }

}


/* 5. INITIALISE PRODUCT PAGE */

function initialiseProductPage() {

  if (!product) {

    document.querySelector(".standalone-product-page").innerHTML =
      "<p>Product not found. Please return to the shop.</p>";

    return;

  }

  document.title = product.name + " | Curated with Care by M.";

  document.getElementById("productBrand").textContent =
    product.brandName || product.brand;

  document.getElementById("productName").textContent =
    product.name;

  document.getElementById("productSize").textContent =
    product.size || "";

  document.getElementById("productPrice").textContent =
    "€" + Number(product.price).toFixed(2);

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


/* 6. PREVIOUS AND NEXT PHOTOS */

document.getElementById("previousPhoto").addEventListener("click", () => {
  showPhoto(currentPhoto - 1);
});

document.getElementById("nextPhoto").addEventListener("click", () => {
  showPhoto(currentPhoto + 1);
});


/* 7. MOBILE PHOTO SWIPING */

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


/* 8. START THE PAGE */

initialiseProductPage();
