
/* =========================================
   CURATED WITH CARE BY M.
   PRODUCT ADMINISTRATION DASHBOARD
   BRAND SECTIONS + DRAG AND DROP ORGANISER
========================================= */


const productList = document.getElementById("product-list");
const totalProducts = document.getElementById("total-products");
const activeProducts = document.getElementById("active-products");
const dashboardMessage = document.getElementById("dashboard-message");

let allProducts = [];
let draggedProductId = null;
let draggedSectionName = null;

/* REMEMBER WHICH BRAND SECTIONS ARE OPEN */
let openSections = new Set();


/* =========================================
   1. CHECK ADMIN ACCESS
========================================= */

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


/* =========================================
   2. GET DASHBOARD SECTION
========================================= */

/*
  IMPORTANT:

  admin_section is only for dashboard organisation.

  It does NOT change product.brand.

  If a product has never been organised,
  its original brand is used as its first section.
*/

function getProductSection(product) {

  return (
    product.admin_section ||
    product.brand ||
    product.brandName ||
    "Unassigned"
  );

}


/* =========================================
   3. GET SECTION NAMES
========================================= */

function getSectionNames() {

  const names = [];

  allProducts.forEach(product => {

    const section = getProductSection(product);

    if (!names.includes(section)) {
      names.push(section);
    }

  });

  return names;

}


/* =========================================
   4. ORGANISE PRODUCTS
========================================= */

function getOrganisedSections() {

  const groups = {};

  allProducts.forEach(product => {

    const sectionName = getProductSection(product);

    if (!groups[sectionName]) {

      groups[sectionName] = {
        name: sectionName,
        order: Number.isFinite(Number(product.admin_section_order))
          ? Number(product.admin_section_order)
          : 999999,
        products: []
      };

    }

    groups[sectionName].products.push(product);

    const productSectionOrder = Number(product.admin_section_order);

    if (
      Number.isFinite(productSectionOrder) &&
      productSectionOrder < groups[sectionName].order
    ) {
      groups[sectionName].order = productSectionOrder;
    }

  });


  const sections = Object.values(groups);


  sections.forEach(section => {

    section.products.sort((a, b) => {

      const orderA = Number.isFinite(Number(a.admin_product_order))
        ? Number(a.admin_product_order)
        : 999999;

      const orderB = Number.isFinite(Number(b.admin_product_order))
        ? Number(b.admin_product_order)
        : 999999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return String(a.name || "").localeCompare(
        String(b.name || "")
      );

    });

  });


  sections.sort((a, b) => {

    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.name.localeCompare(b.name);

  });


  return sections;

}


/* =========================================
   5. SAVE DASHBOARD ARRANGEMENT
========================================= */

/*
  Only these three fields are updated:

  admin_section
  admin_section_order
  admin_product_order

  The actual product information is untouched.
*/

async function saveDashboardArrangement() {

  dashboardMessage.textContent = "Saving your arrangement...";

  const sections = getOrganisedSections();

  const updates = [];

  sections.forEach((section, sectionIndex) => {

    section.products.forEach((product, productIndex) => {

      updates.push({

        id: product.id,

        admin_section: section.name,

        admin_section_order: sectionIndex,

        admin_product_order: productIndex

      });

    });

  });


  const results = await Promise.all(

    updates.map(update =>

      supabaseClient
        .from("products")
        .update({

          admin_section: update.admin_section,

          admin_section_order: update.admin_section_order,

          admin_product_order: update.admin_product_order

        })
        .eq("id", update.id)

    )

  );


  const failedUpdate = results.find(result => result.error);


  if (failedUpdate) {

    console.error(
      "Dashboard arrangement could not be saved:",
      failedUpdate.error
    );

    dashboardMessage.textContent =
      "Some changes could not be saved. Reloading your products...";

    await loadProducts();

    return false;

  }


  dashboardMessage.textContent =
    "Your dashboard arrangement has been saved.";

  return true;

}


/* =========================================
   6. MOVE PRODUCT TO ANOTHER SECTION
========================================= */

async function moveProductToSection(productId, newSection) {

  const selectedProduct = allProducts.find(product =>
    String(product.id) === String(productId)
  );

  if (!selectedProduct || !newSection) return;

  const oldSection = getProductSection(selectedProduct);

  if (oldSection === newSection) return;


  selectedProduct.admin_section = newSection;

  /*
    The product's real brand is not changed.
  */

  renderDashboard();

  const saved = await saveDashboardArrangement();

  if (saved) {
    dashboardMessage.textContent =
      `${selectedProduct.name} moved to ${newSection}.`;
  }

}


/* =========================================
   7. CREATE NEW DASHBOARD SECTION
========================================= */

function askForNewSection(productId) {

  const sectionName = window.prompt(
    "Enter a name for the new dashboard section:"
  );

  if (!sectionName || !sectionName.trim()) {
    renderDashboard();
    return;
  }

  moveProductToSection(
    productId,
    sectionName.trim()
  );

}


/* =========================================
   8. MOVE PRODUCT UP OR DOWN
========================================= */

async function moveProductWithinSection(productId, direction) {

  const product = allProducts.find(item =>
    String(item.id) === String(productId)
  );

  if (!product) return;

  const sectionName = getProductSection(product);

  const sectionProducts = allProducts
    .filter(item => getProductSection(item) === sectionName)
    .sort((a, b) => {

      const orderA = Number(a.admin_product_order);
      const orderB = Number(b.admin_product_order);

      return (
        (Number.isFinite(orderA) ? orderA : 999999) -
        (Number.isFinite(orderB) ? orderB : 999999)
      );

    });

  const currentIndex = sectionProducts.findIndex(item =>
    String(item.id) === String(productId)
  );

  const newIndex = currentIndex + direction;

  if (
    currentIndex < 0 ||
    newIndex < 0 ||
    newIndex >= sectionProducts.length
  ) {
    return;
  }

  const currentProduct = sectionProducts[currentIndex];

  sectionProducts[currentIndex] = sectionProducts[newIndex];

  sectionProducts[newIndex] = currentProduct;


  sectionProducts.forEach((item, index) => {
    item.admin_product_order = index;
  });


  renderDashboard();

  await saveDashboardArrangement();

}


/* =========================================
   9. MOVE SECTION UP OR DOWN
========================================= */

async function moveSection(sectionName, direction) {

  const sections = getOrganisedSections();

  const currentIndex = sections.findIndex(section =>
    section.name === sectionName
  );

  const newIndex = currentIndex + direction;

  if (
    currentIndex < 0 ||
    newIndex < 0 ||
    newIndex >= sections.length
  ) {
    return;
  }


  const currentSection = sections[currentIndex];

  sections[currentIndex] = sections[newIndex];

  sections[newIndex] = currentSection;


  sections.forEach((section, index) => {

    section.products.forEach(product => {
      product.admin_section_order = index;
    });

  });


  renderDashboard();

  await saveDashboardArrangement();

}


/* =========================================
   10. CREATE PRODUCT ROW
========================================= */

function createProductRow(product) {

  const row = document.createElement("div");

  row.className = "product-row";
  row.draggable = true;
  row.dataset.productId = product.id;


  /* DRAG HANDLE */

  const dragHandle = document.createElement("span");

  dragHandle.className = "product-drag-handle";
  dragHandle.textContent = "⠿";
  dragHandle.title = "Drag to rearrange product";


  /* PRODUCT IMAGE */

  const image = document.createElement("img");

  image.className = "product-image";
  image.alt = product.name || "Product image";
  image.loading = "lazy";

  if (product.image) {

    image.src = product.image;

    image.addEventListener("error", function() {
      image.style.display = "none";
    });

  } else {

    image.style.display = "none";

  }


  /* PRODUCT DETAILS */

  const details = document.createElement("div");

  details.className = "product-details";

  const name = document.createElement("strong");

  name.textContent = product.name || "Unnamed product";

  const info = document.createElement("small");

  info.textContent =
    `${product.brand || product.brandName || "No brand"} · €${Number(product.price || 0).toFixed(2)}`;

  const status = document.createElement("small");

  status.textContent =
    product.is_active ? "Active" : "Inactive";

  status.style.color =
    product.is_active ? "#65816b" : "#a47770";

  details.append(name, info, status);


  /* MOVE TO ANOTHER SECTION */

  const moveWrapper = document.createElement("div");

  moveWrapper.className = "product-move-wrapper";

  const moveLabel = document.createElement("small");

  moveLabel.textContent = "Dashboard section";

  const moveSelect = document.createElement("select");

  moveSelect.className = "product-move-select";

  const currentSection = getProductSection(product);

  getSectionNames().forEach(sectionName => {

    const option = document.createElement("option");

    option.value = sectionName;
    option.textContent = sectionName;

    option.selected = sectionName === currentSection;

    moveSelect.appendChild(option);

  });


  const createOption = document.createElement("option");

  createOption.value = "__create_new_section__";
  createOption.textContent = "+ Create new section";

  moveSelect.appendChild(createOption);


  moveSelect.addEventListener("change", async function() {

    const selectedSection = moveSelect.value;

    if (selectedSection === "__create_new_section__") {

      askForNewSection(product.id);

      return;

    }

    await moveProductToSection(
      product.id,
      selectedSection
    );

  });


  moveWrapper.append(moveLabel, moveSelect);


  /* ACTION BUTTONS */

  const actions = document.createElement("div");

  actions.className = "product-actions";


  /* MOVE UP */

  const upButton = document.createElement("button");

  upButton.textContent = "↑";
  upButton.type = "button";
  upButton.title = "Move product up";
  upButton.className = "secondary-button";

  upButton.addEventListener("click", function() {

    moveProductWithinSection(product.id, -1);

  });


  /* MOVE DOWN */

  const downButton = document.createElement("button");

  downButton.textContent = "↓";
  downButton.type = "button";
  downButton.title = "Move product down";
  downButton.className = "secondary-button";

  downButton.addEventListener("click", function() {

    moveProductWithinSection(product.id, 1);

  });


  /* EDIT */

  const editButton = document.createElement("button");

  editButton.textContent = "Edit";
  editButton.type = "button";

  editButton.addEventListener("click", function() {

    window.location.href =
      "admin-product.html?id=" + encodeURIComponent(product.id);

  });


  /* ACTIVATE / DEACTIVATE */

  const toggleButton = document.createElement("button");

  toggleButton.textContent =
    product.is_active ? "Deactivate" : "Activate";

  toggleButton.type = "button";
  toggleButton.className = "secondary-button";

  toggleButton.addEventListener("click", async function() {

    toggleButton.disabled = true;

    dashboardMessage.textContent =
      "Updating product status...";

    const { error } = await supabaseClient
      .from("products")
      .update({ is_active: !product.is_active })
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


  /* DELETE */

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
    upButton,
    downButton,
    editButton,
    toggleButton,
    deleteButton
  );


  row.append(
    dragHandle,
    image,
    details,
    moveWrapper,
    actions
  );


  /* DRAG PRODUCT */

  row.addEventListener("dragstart", function(event) {

    draggedProductId = String(product.id);

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "text/plain",
      "product:" + product.id
    );

    row.classList.add("dragging");

  });


  row.addEventListener("dragend", function() {

    draggedProductId = null;

    row.classList.remove("dragging");

    document.querySelectorAll(".product-row").forEach(item => {
      item.classList.remove("drag-over");
    });

  });


  /* DROP ON ANOTHER PRODUCT */

  row.addEventListener("dragover", function(event) {

    if (!draggedProductId) return;

    event.preventDefault();

    row.classList.add("drag-over");

  });


  row.addEventListener("dragleave", function() {

    row.classList.remove("drag-over");

  });


  row.addEventListener("drop", async function(event) {

    event.preventDefault();

    row.classList.remove("drag-over");

    const sourceId = draggedProductId;

    if (!sourceId || sourceId === String(product.id)) return;

    const sourceProduct = allProducts.find(item =>
      String(item.id) === sourceId
    );

    const targetProduct = allProducts.find(item =>
      String(item.id) === String(product.id)
    );

    if (!sourceProduct || !targetProduct) return;


    const targetSection = getProductSection(targetProduct);

    const sourceSection = getProductSection(sourceProduct);


    /* MOVE BETWEEN SECTIONS */

    if (sourceSection !== targetSection) {

      sourceProduct.admin_section = targetSection;

    }


    /* REORDER PRODUCTS */

    const sectionProducts = allProducts
      .filter(item => getProductSection(item) === targetSection)
      .sort((a, b) => {

        const orderA = Number(a.admin_product_order);
        const orderB = Number(b.admin_product_order);

        return (
          (Number.isFinite(orderA) ? orderA : 999999) -
          (Number.isFinite(orderB) ? orderB : 999999)
        );

      });


    const sourceIndex = sectionProducts.findIndex(item =>
      String(item.id) === sourceId
    );

    const targetIndex = sectionProducts.findIndex(item =>
      String(item.id) === String(product.id)
    );

    if (sourceIndex < 0 || targetIndex < 0) return;

    const movedProduct = sectionProducts.splice(sourceIndex, 1)[0];

    sectionProducts.splice(targetIndex, 0, movedProduct);


    sectionProducts.forEach((item, index) => {
      item.admin_product_order = index;
    });


    renderDashboard();

    await saveDashboardArrangement();

  });


  return row;

}


/* =========================================
   11. CREATE BRAND SECTION
   COLLAPSIBLE BRAND HEADERS
========================================= */

function createBrandSection(section, sectionIndex, totalSections) {

  const sectionElement = document.createElement("section");

  sectionElement.className = "admin-brand-section";

  sectionElement.dataset.sectionName = section.name;


  /* SECTION HEADER */

  const header = document.createElement("div");

  header.className = "admin-brand-section-header";


  const titleArea = document.createElement("div");

  titleArea.className = "admin-brand-title-area";


  /* SECTION DRAG HANDLE */

  const dragHandle = document.createElement("span");

  dragHandle.className = "section-drag-handle";
  dragHandle.textContent = "⠿";
  dragHandle.title = "Drag to rearrange sections";


  /* COLLAPSE ARROW */

  const collapseArrow = document.createElement("span");

  collapseArrow.className = "section-collapse-arrow";


  const isOpen = openSections.has(section.name);

  collapseArrow.textContent = isOpen ? "▼" : "▶";


  /* BRAND NAME */

  const title = document.createElement("h2");

  title.textContent = section.name;


  /* PRODUCT COUNT */

  const count = document.createElement("small");

  count.className = "admin-section-count";

  count.textContent =
    section.products.length +
    (section.products.length === 1
      ? " product"
      : " products");


  titleArea.append(
    dragHandle,
    collapseArrow,
    title,
    count
  );


  /* SECTION MOVE BUTTONS */

  const sectionActions = document.createElement("div");

  sectionActions.className = "admin-section-actions";


  const upButton = document.createElement("button");

  upButton.type = "button";
  upButton.textContent = "↑";
  upButton.title = "Move section up";
  upButton.disabled = sectionIndex === 0;


  upButton.addEventListener("click", function(event) {

    event.stopPropagation();

    moveSection(section.name, -1);

  });


  const downButton = document.createElement("button");

  downButton.type = "button";
  downButton.textContent = "↓";
  downButton.title = "Move section down";
  downButton.disabled = sectionIndex === totalSections - 1;


  downButton.addEventListener("click", function(event) {

    event.stopPropagation();

    moveSection(section.name, 1);

  });


  /* COLLAPSE BUTTON */

  const collapseButton = document.createElement("button");

  collapseButton.type = "button";

  collapseButton.className = "section-collapse-button";

  collapseButton.textContent = isOpen ? "−" : "+";

  collapseButton.title = isOpen
    ? "Collapse section"
    : "Expand section";


  sectionActions.append(
    upButton,
    downButton,
    collapseButton
  );


  header.append(
    titleArea,
    sectionActions
  );


  /* PRODUCT CONTAINER */

  const body = document.createElement("div");

  body.className = "admin-brand-section-products";

  body.hidden = !isOpen;


  section.products.forEach(product => {

    body.appendChild(createProductRow(product));

  });


  /* TOGGLE SECTION */

  function toggleSection() {

    const currentlyOpen = openSections.has(section.name);

    if (currentlyOpen) {

      openSections.delete(section.name);

    } else {

      openSections.add(section.name);

    }


    const nowOpen = openSections.has(section.name);

    body.hidden = !nowOpen;

    collapseArrow.textContent = nowOpen ? "▼" : "▶";

    collapseButton.textContent = nowOpen ? "−" : "+";

    collapseButton.title = nowOpen
      ? "Collapse section"
      : "Expand section";

  }


  /* CLICK BRAND HEADER TO OPEN/CLOSE */

  titleArea.addEventListener("click", toggleSection);


  collapseButton.addEventListener("click", function(event) {

    event.stopPropagation();

    toggleSection();

  });


  /* DROP PRODUCTS INTO SECTION */

  body.addEventListener("dragover", function(event) {

    if (!draggedProductId) return;

    event.preventDefault();

    body.classList.add("section-drop-target");

  });


  body.addEventListener("dragleave", function(event) {

    if (!body.contains(event.relatedTarget)) {

      body.classList.remove("section-drop-target");

    }

  });


  body.addEventListener("drop", async function(event) {

    event.preventDefault();

    event.stopPropagation();

    body.classList.remove("section-drop-target");

    const sourceId = draggedProductId;

    if (!sourceId) return;


    const movedProduct = allProducts.find(item =>
      String(item.id) === sourceId
    );

    if (!movedProduct) return;


    const oldSection = getProductSection(movedProduct);

    if (oldSection === section.name) return;


    movedProduct.admin_section = section.name;


    /* OPEN DESTINATION SECTION */

    openSections.add(section.name);


    const destinationProducts = allProducts.filter(item =>
      getProductSection(item) === section.name
    );

    movedProduct.admin_product_order =
      destinationProducts.length - 1;


    renderDashboard();

    await saveDashboardArrangement();

  });


  sectionElement.append(header, body);


  /* DRAG SECTION */

  header.draggable = true;

  header.addEventListener("dragstart", function(event) {

    if (draggedProductId) {

      event.preventDefault();

      return;

    }

    draggedSectionName = section.name;

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "text/plain",
      "section:" + section.name
    );

    sectionElement.classList.add("section-dragging");

  });


  header.addEventListener("dragend", function() {

    draggedSectionName = null;

    sectionElement.classList.remove("section-dragging");

    document.querySelectorAll(".admin-brand-section").forEach(item => {

      item.classList.remove("section-drag-over");

    });

  });


  sectionElement.addEventListener("dragover", function(event) {

    if (!draggedSectionName) return;

    event.preventDefault();

    sectionElement.classList.add("section-drag-over");

  });


  sectionElement.addEventListener("dragleave", function(event) {

    if (!sectionElement.contains(event.relatedTarget)) {

      sectionElement.classList.remove("section-drag-over");

    }

  });


  sectionElement.addEventListener("drop", async function(event) {

    if (!draggedSectionName) return;

    event.preventDefault();

    event.stopPropagation();

    sectionElement.classList.remove("section-drag-over");

    if (draggedSectionName === section.name) return;


    const sections = getOrganisedSections();

    const sourceIndex = sections.findIndex(item =>
      item.name === draggedSectionName
    );

    const targetIndex = sections.findIndex(item =>
      item.name === section.name
    );

    if (sourceIndex < 0 || targetIndex < 0) return;


    const movedSection = sections.splice(sourceIndex, 1)[0];

    sections.splice(targetIndex, 0, movedSection);


    sections.forEach((item, index) => {

      item.products.forEach(product => {

        product.admin_section_order = index;

      });

    });


    draggedSectionName = null;

    renderDashboard();

    await saveDashboardArrangement();

  });


  return sectionElement;

}

/* =========================================
   12. RENDER DASHBOARD
========================================= */

function renderDashboard() {

  productList.replaceChildren();

  const sections = getOrganisedSections();


  if (!sections.length) {

    productList.textContent =
      "No products have been added yet.";

    return;

  }


  sections.forEach((section, index) => {

    productList.appendChild(
      createBrandSection(
        section,
        index,
        sections.length
      )
    );

  });

}


/* =========================================
   13. LOAD PRODUCTS
========================================= */

async function loadProducts() {

  productList.textContent = "Loading products...";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*");

  if (error) {

    console.error(error);

    productList.textContent =
      "Unable to load products. Please try again.";

    return;

  }


  allProducts = data || [];


  /* PRODUCT COUNTS */

  totalProducts.textContent = allProducts.length;

  activeProducts.textContent =
    allProducts.filter(product => product.is_active).length;


  /* DISPLAY BRAND SECTIONS */

  renderDashboard();

}


/* =========================================
   14. ADD PRODUCT BUTTON
========================================= */

document
  .getElementById("add-product-button")
  .addEventListener("click", function() {

    window.location.href = "admin-product.html";

  });


/* =========================================
   15. BULK UPLOAD BUTTON
========================================= */

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


/* =========================================
   16. SIGN OUT
========================================= */

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


/* =========================================
   17. START DASHBOARD
========================================= */

async function startDashboard() {

  const authorised = await checkAdminAccess();

  if (!authorised) return;

  await loadProducts();

}

startDashboard();
