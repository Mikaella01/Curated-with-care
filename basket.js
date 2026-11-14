
/* =========================================
   CURATED WITH CARE BY M.
   DEDICATED BASKET PAGE
========================================= */


/* 1. BASKET STORAGE */

let basket = [];

function loadBasket() {
  try {
    const savedBasket = JSON.parse(
      localStorage.getItem("curatedCart") || "[]"
    );

    basket = Array.isArray(savedBasket) ? savedBasket : [];

  } catch (error) {
    basket = [];
  }
}


/* 2. PRICE FORMATTING */

function formatBasketPrice(price) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR"
  }).format(Number(price) || 0);
}


/* 3. HTML SAFETY */

function escapeBasketHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character];
  });
}


/* 4. DISPLAY BASKET PRODUCTS */

function displayBasket() {

  const basketItems = document.getElementById("basketItems");
  const basketSubtotal = document.getElementById("basketSubtotal");
  const basketTotal = document.getElementById("basketTotal");
  const bagCount = document.getElementById("bagCount");
  const checkoutButton = document.getElementById("basketCheckoutButton");

  if (!basketItems) return;

  // Calculate total quantity and price

  const totalQuantity = basket.reduce(function (total, item) {
    return total + (Number(item.quantity) || 0);
  }, 0);

  const subtotal = basket.reduce(function (total, item) {
    return total + (
      (Number(item.price) || 0) *
      (Number(item.quantity) || 0)
    );
  }, 0);


  // Update basket count

  if (bagCount) {
    bagCount.textContent = totalQuantity;
  }


  // Update prices

  if (basketSubtotal) {
    basketSubtotal.textContent = formatBasketPrice(subtotal);
  }

  if (basketTotal) {
    basketTotal.textContent = formatBasketPrice(subtotal);
  }


  // Empty basket message

  if (basket.length === 0) {

    basketItems.innerHTML = `
      <div class="basket-empty">
        <p>Your bag is currently empty.</p>
        <a href="shop.html" class="primary-button">
          DISCOVER OUR COLLECTION
        </a>
      </div>
    `;

    if (checkoutButton) {
      checkoutButton.classList.add("basket-checkout-disabled");
      checkoutButton.setAttribute("aria-disabled", "true");
    }

    return;
  }


  // Enable checkout

  if (checkoutButton) {
    checkoutButton.classList.remove("basket-checkout-disabled");
    checkoutButton.removeAttribute("aria-disabled");
  }


  // Display each product

  basketItems.innerHTML = basket.map(function (item) {

    const productId = escapeBasketHTML(item.id);
    const productName = escapeBasketHTML(item.name);
    const productBrand = escapeBasketHTML(item.brandName || item.brand || "");
    const productImage = escapeBasketHTML(item.image);
    const productSize = escapeBasketHTML(item.size || "");
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const price = Number(item.price) || 0;
    const productLink = `product.html?id=${encodeURIComponent(item.id)}`;

    return `

      <article class="basket-item">

        <a
          href="${productLink}"
          class="basket-item-image-link"
          aria-label="View ${productName}"
        >
          <img
            src="${productImage}"
            alt="${productName}"
            class="basket-item-image"
          >
        </a>


        <div class="basket-item-details">

          <p class="basket-item-brand">${productBrand}</p>

          <a
            href="${productLink}"
            class="basket-item-name"
          >
            ${productName}
          </a>

          <p class="basket-item-size">${productSize}</p>

          <p class="basket-item-price">
            ${formatBasketPrice(price)}
          </p>


          <div class="basket-item-actions">

            <div class="basket-quantity">

              <button
                type="button"
                data-basket-quantity="minus"
                data-product-id="${productId}"
                aria-label="Decrease quantity"
              >
                −
              </button>

              <span>${quantity}</span>

              <button
                type="button"
                data-basket-quantity="plus"
                data-product-id="${productId}"
                aria-label="Increase quantity"
              >
                +
              </button>

            </div>


            <button
              type="button"
              class="basket-remove"
              data-basket-remove="${productId}"
            >
              Remove
            </button>

          </div>

        </div>


        <div class="basket-item-subtotal">
          ${formatBasketPrice(price * quantity)}
        </div>

      </article>

    `;

  }).join("");

}


/* 5. CHANGE PRODUCT QUANTITY */

function changeBasketQuantity(productId, change) {

  const item = basket.find(function (product) {
    return String(product.id) === String(productId);
  });

  if (!item) return;

  item.quantity = (Number(item.quantity) || 0) + change;

  // Remove product if quantity reaches zero

  if (item.quantity <= 0) {
    basket = basket.filter(function (product) {
      return String(product.id) !== String(productId);
    });
  }

  saveBasket();
}


/* 6. REMOVE PRODUCT */

function removeBasketProduct(productId) {

  basket = basket.filter(function (item) {
    return String(item.id) !== String(productId);
  });

  saveBasket();
}


/* 7. SAVE BASKET */

function saveBasket() {

  localStorage.setItem(
    "curatedCart",
    JSON.stringify(basket)
  );

  displayBasket();
}


/* 8. BASKET BUTTON EVENTS */

document.addEventListener("click", function (event) {

  // Increase or decrease quantity

  const quantityButton = event.target.closest(
    "[data-basket-quantity]"
  );

  if (quantityButton) {

    const productId = quantityButton.dataset.productId;
    const action = quantityButton.dataset.basketQuantity;

    if (action === "plus") {
      changeBasketQuantity(productId, 1);
    }

    if (action === "minus") {
      changeBasketQuantity(productId, -1);
    }

    return;
  }


  // Remove product

  const removeButton = event.target.closest(
    "[data-basket-remove]"
  );

  if (removeButton) {

    const productId = removeButton.dataset.basketRemove;

    removeBasketProduct(productId);

    return;
  }


  // Prevent checkout when basket is empty

  const checkoutButton = event.target.closest(
    "#basketCheckoutButton"
  );

  if (
    checkoutButton &&
    checkoutButton.getAttribute("aria-disabled") === "true"
  ) {
    event.preventDefault();
  }

});


/* 9. REFRESH WHEN BASKET CHANGES IN ANOTHER TAB */

window.addEventListener("storage", function (event) {

  if (event.key === "curatedCart") {
    loadBasket();
    displayBasket();
  }

});


/* 10. INITIALISE BASKET */

loadBasket();
displayBasket();
