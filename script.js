
// Mobile navigation
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    navigation.classList.toggle("active");
  });
}

// Product filtering
const filterButtons = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".product-card");

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    const category = button.dataset.filter;

    productCards.forEach(card => {
      const matches =
        category === "all" || card.dataset.category === category;

      card.style.display = matches ? "block" : "none";
    });
  });
});

// Shopping cart
let cart = [];

const cartCount = document.querySelector(".cart-count");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");

function updateCart() {
  if (cartCount) cartCount.textContent = cart.length;

  if (cartItems) {
    cartItems.innerHTML = "";

    cart.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "cart-item";

      const name = document.createElement("span");
      name.textContent = item.name;

      const price = document.createElement("span");
      price.textContent = `€${item.price.toFixed(2)}`;

      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.addEventListener("click", () => {
        cart.splice(index, 1);
        updateCart();
      });

      row.append(name, price, removeButton);
      cartItems.appendChild(row);
    });
  }

  if (cartTotal) {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `€${total.toFixed(2)}`;
  }
}

document.querySelectorAll(".add-to-cart").forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");

    if (!card) return;

    cart.push({
      name: card.dataset.name,
      price: Number(card.dataset.price)
    });

    updateCart();
    button.textContent = "Added!";
    setTimeout(() => button.textContent = "Add to bag", 1000);
  });
});

// Open and close cart
document.querySelectorAll(".cart-button").forEach(button => {
  button.addEventListener("click", () => {
    if (cartOverlay) cartOverlay.classList.add("active");
  });
});

document.querySelectorAll(".close-cart").forEach(button => {
  button.addEventListener("click", () => {
    if (cartOverlay) cartOverlay.classList.remove("active");
  });
});

// Gift finder
const giftForm = document.querySelector(".gift-finder-form");
const giftResult = document.querySelector(".gift-result");

if (giftForm && giftResult) {
  giftForm.addEventListener("submit", event => {
    event.preventDefault();

    const occasion = giftForm.querySelector("[name='occasion']")?.value;
    const budget = giftForm.querySelector("[name='budget']")?.value;

    giftResult.textContent =
      `Lovely! We'll help you discover a gift for ${occasion || "your occasion"} within ${budget || "your budget"}.`;
  });
}

// Newsletter demo
const newsletterForm = document.querySelector(".newsletter-form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", event => {
    event.preventDefault();
    alert("Thank you for your interest! Newsletter sign-up will be available soon.");
    newsletterForm.reset();
  });
}

// Demo checkout
const checkoutButton = document.querySelector(".checkout-button");

if (checkoutButton) {
  checkoutButton.addEventListener("click", () => {
    alert("Thank you! Online checkout is coming soon. Your bag is currently a website demo.");
  });
}
