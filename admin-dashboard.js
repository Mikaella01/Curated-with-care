
/* =========================================
   CURATED WITH CARE BY M.
   PRODUCT ADMINISTRATION DASHBOARD
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


// 2. CREATE PRODUCT ROW

function createProductRow(product) {

  const row = document.createElement("div");
  row.className = "product-row";

  const details = document.createElement("div");
  details.className = "product-details";

  const name = document.createElement("strong");
  name.textContent = product.name || "Unnamed product";

  const info = document.createElement("small");
  info.textContent =
    `${product.brand || "No brand"} · €${Number(product.price || 0).toFixed(2)}`;

  const status = document.createElement("small");
  status.textContent =
    product.is_active ? "Active" : "Inactive";

  status.style.color =
    product.is_active ? "#65816b" : "#a47770";

  details.append(name, info, status);


  // ACTION BUTTONS

  const actions = document.createElement("div");
  actions.className = "product-actions";


  // EDIT BUTTON

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.type = "button";
  editButton.addEventListener("click", function() {

    window.location.href =
      "admin-product.html?id=" + encodeURIComponent(product.id);

  });


  // ACTIVATE / DEACTIVATE BUTTON

  const toggleButton = document.createElement("button");

  toggleButton.textContent =
    product.is_active ? "Deactivate" : "Activate";

  toggleButton.type = "button";
  toggleButton.className = "secondary-button";

  toggleButton.addEventListener("click", async function() {

    toggleButton.disabled = true;
    dashboardMessage.textContent = "Updating product status...";

    const newStatus = !product.is_active;

    const { error } = await supabaseClient
      .from("products")
      .update({ is_active: newStatus })
      .eq("id", product.id);

    if (error) {

      console.error(error);

      dashboardMessage.textContent =
        "Could not update product status.";

      toggleButton.disabled = false;
      return;
    }

    dashboardMessage.textContent =
      "Product status updated successfully.";

    await loadProducts();

  });


  // DELETE BUTTON

  const deleteButton = document.createElement("button");

  deleteButton.textContent = "Delete";
  deleteButton.type = "button";
  deleteButton.style.background = "#eee3df";
  deleteButton.style.color = "#8d5f58";

  deleteButton.addEventListener("click", async function() {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    deleteButton.disabled = true;
    dashboardMessage.textContent = "Deleting product...";

    const { error } = await supabaseClient
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {

      console.error(error);

      dashboardMessage.textContent =
        "Could not delete product.";

      deleteButton.disabled = false;
      return;
    }

    dashboardMessage.textContent =
      "Product deleted successfully.";

    await loadProducts();

  });


  actions.append(
    editButton,
    toggleButton,
    deleteButton
  );

  row.append(details, actions);

  return row;
}


// 3. LOAD PRODUCTS

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

    const row = createProductRow(product);

    productList.appendChild(row);

  });
}


// 4. ADD PRODUCT BUTTON

document
  .getElementById("add-product-button")
  .addEventListener("click", function() {

    window.location.href = "admin-product.html";

  });


// 5. BULK UPLOAD BUTTON

const bulkFile = document.getElementById("bulk-file");

document
  .getElementById("bulk-upload-button")
  .addEventListener("click", function() {

    bulkFile.click();

  });

bulkFile.addEventListener("change", function() {

  if (!bulkFile.files.length) return;

  dashboardMessage.textContent =
    "Bulk importing will be activated in a later step.";

  bulkFile.value = "";

});


// 6. SIGN OUT

document
  .getElementById("logout-button")
  .addEventListener("click", async function() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {

      dashboardMessage.textContent =
        "Unable to sign out. Please try again.";

      return;
    }

    window.location.href = "admin.html";

  });


// 7. START DASHBOARD

async function startDashboard() {

  const authorised = await checkAdminAccess();

  if (!authorised) return;

  await loadProducts();

}

startDashboard();
