
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const products = JSON.parse(
  localStorage.getItem("curatedProducts") || "[]"
);

const product = products.find(item =>
  String(item.id) === String(productId)
);

const mainPhoto = document.getElementById("mainProductPhoto");
const thumbnails = document.getElementById("productThumbnails");

let currentPhoto = 0;

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
    product.description || "Discover this beauty favourite, thoughtfully selected by Curated with Care by M.";

  const benefits = document.getElementById("productBenefits");

  benefits.innerHTML = "";

  (product.benefits || []).forEach(benefit => {
    const li = document.createElement("li");
    li.textContent = benefit;
    benefits.appendChild(li);
  });

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

}

document.getElementById("previousPhoto").addEventListener("click", () => {
  showPhoto(currentPhoto - 1);
});

document.getElementById("nextPhoto").addEventListener("click", () => {
  showPhoto(currentPhoto + 1);
});

// Allow visitors to swipe the main photo on touchscreens

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

initialiseProductPage();
