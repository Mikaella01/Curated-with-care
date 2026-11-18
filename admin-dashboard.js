
/* =========================================
   CURATED WITH CARE BY M.
   ADMIN DASHBOARD CONNECTION
========================================= */

const productList = document.getElementById("product-list");
const totalProducts = document.getElementById("total-products");
const activeProducts = document.getElementById("active-products");
const dashboardMessage = document.getElementById("dashboard-message");


// 1. CHECK ADMIN ACCESS

async function checkAdminAccess() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session) {
    window.location.href = "admin.html";
    return false;
  }

  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (
    userError ||
    !user ||
    user.app_metadata?.role !== "admin"
  ) {
    await supabaseClient.auth.signOut();
    window.location.href = "admin.html";
    return false;
  }

  return true;
}


// 2. LOAD PRODUCTS

async function loadProducts() {
  productList.textContent = "Loading products...";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    productList.textContent =
      "Unable to load products. Please try again.";
    return;
  }

  const products = data || [];

  totalProducts.textContent = products.length;

  activeProducts.textContent =
    products.filter(product => product.is_active).length;

  productList.replaceChildren();

  if (products.length === 0) {
    productList.textContent =
      "No products have been added yet.";
    return;
  }

  products.forEach(product => {
    const row = document.createElement("div");
    row.className = "product-row";

    const details = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = product.name;

    const info = document.createElement("small");
    info.textContent =
      `${product.brand} · €${Number(product.price).toFixed(2)}`;

    details.append(name, info);

    const status = document.createElement("small");
    status.textContent =
      product.is_active ? "Active" : "Inactive";

    row.append(details, status);
    productList.appendChild(row);
  });
}


// 3. ADD PRODUCT BUTTON

document
  .getElementById("add-product-button")
  .addEventListener("click", function () {
    window.location.href = "admin-product.html";
  });


// 4. BULK UPLOAD BUTTON

const bulkFile = document.getElementById("bulk-file");

document
  .getElementById("bulk-upload-button")
  .addEventListener("click", function () {
    bulkFile.click();
  });

bulkFile.addEventListener("change", function () {
  if (!bulkFile.files.length) return;

  dashboardMessage.textContent =
    "Your file is selected. We'll activate the bulk importer in the next step.";

  bulkFile.value = "";
});


// 5. SIGN OUT

document
  .getElementById("logout-button")
  .addEventListener("click", async function () {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      dashboardMessage.textContent =
        "Unable to sign out. Please try again.";
      return;
    }

    window.location.href = "admin.html";
  });


// 6. START DASHBOARD

async function startDashboard() {
  const authorised = await checkAdminAccess();

  if (!authorised) return;

  await loadProducts();
}

startDashboard();
