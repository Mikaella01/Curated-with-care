
/* =========================================
   CURATED WITH CARE BY M.
   ADD AND EDIT PRODUCTS
========================================= */


/* =========================================
   1. HELPERS
========================================= */

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function getList(id) {
  return getValue(id)
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function getLines(id) {
  return getValue(id)
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}


function getIngredients() {
  const value = getValue("ingredients");

  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {}

  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}


/* =========================================
   2. ADMIN ACCESS
========================================= */

async function verifyAdmin() {
  const { data, error } =
    await supabaseClient.auth.getUser();

  if (
    error ||
    !data.user ||
    data.user.app_metadata?.role !== "admin"
  ) {
    window.location.href = "admin.html";
    return false;
  }

  return true;
}


/* =========================================
   3. PAGE ELEMENTS
========================================= */

const productForm = document.getElementById("product-form");
const saveButton = document.getElementById("save-product");
const formMessage = document.getElementById("form-message");

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

let currentProduct = null;


/* =========================================
   4. LOAD EXISTING PRODUCT
========================================= */

async function loadProductForEditing() {

  if (!editId) return;

  formMessage.textContent = "Loading product...";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", editId)
    .single();

  if (error) {
    console.error(error);
    throw new Error("Unable to load this product.");
  }

  currentProduct = data;

  document.querySelector("h1").textContent = "Edit Product";

  document.querySelector(".intro").textContent =
    "Update the information for this product.";

  saveButton.textContent = "Update Product";


  // Basic information

  document.getElementById("name").value =
    data.name || "";

  document.getElementById("brand").value =
    data.brand || "";

  document.getElementById("brandName").value =
    data.brandName || "";

  document.getElementById("category").value =
    data.category || "";

  document.getElementById("productType").value =
    data.productType || "";

  document.getElementById("price").value =
    data.price ?? "";

  document.getElementById("size").value =
    data.size || "";

  document.getElementById("collection").value =
    (data.collection || []).join(", ");


  // Product details

  document.getElementById("description").value =
    data.description || "";

  document.getElementById("benefits").value =
    (data.benefits || []).join(", ");

  document.getElementById("editorialText").value =
    data.editorialText || "";

  document.getElementById("whyWeChoseIt").value =
    data.whyWeChoseIt || "";


  // Skin information

  document.getElementById("concerns").value =
    (data.concerns || []).join(", ");

  document.getElementById("skinTypes").value =
    (data.skinTypes || []).join(", ");


  // Ingredients

  document.getElementById("ingredients").value =
    JSON.stringify(data.ingredients || [], null, 2);

  document.getElementById("fullIngredients").value =
    data.fullIngredients || "";

  document.getElementById("howToUseSteps").value =
    (data.howToUseSteps || []).join("\n");


  // Images

  document.getElementById("image").value =
    data.image || "";

  document.getElementById("gallery").value =
    (data.gallery || []).join("\n");


  // Display settings

  document.getElementById("tag").value =
    data.tag || "";

  document.getElementById("featured").checked =
    Boolean(data.featured);

  formMessage.textContent =
    "Product loaded. You can now make changes.";
}


/* =========================================
   5. UPLOAD MAIN PRODUCT IMAGE
========================================= */

async function uploadMainProductImage() {

  const fileInput = document.getElementById("image-file");
  const imageField = document.getElementById("image");

  if (!fileInput || !fileInput.files.length) {
    return null;
  }

  const file = fileInput.files[0];

  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid main image.");
  }

  const safeFileName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, "-");

  const filePath =
    "products/" + Date.now() + "-" + safeFileName;

  const { data, error } = await supabaseClient
    .storage
    .from("product-images")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) {
    throw new Error("Main image upload failed: " + error.message);
  }

  const { data: publicData } = supabaseClient
    .storage
    .from("product-images")
    .getPublicUrl(data.path);

  imageField.value = publicData.publicUrl;

  fileInput.value = "";

  return publicData.publicUrl;
}


/* =========================================
   6. UPLOAD GALLERY IMAGES
========================================= */

async function uploadGalleryImages() {

  const fileInput = document.getElementById("gallery-files");
  const galleryField = document.getElementById("gallery");

  if (!fileInput || !fileInput.files.length) {
    return [];
  }

  const files = Array.from(fileInput.files);

  const uploadedUrls = [];

  for (let i = 0; i < files.length; i++) {

    const file = files[i];

    if (!file.type.startsWith("image/")) {
      throw new Error("One of the gallery files is not an image.");
    }

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-");

    const filePath =
      "gallery/" + Date.now() + "-" + i + "-" + safeFileName;

    formMessage.textContent =
      "Uploading gallery image " + (i + 1) + " of " + files.length + "...";

    const { data, error } = await supabaseClient
      .storage
      .from("product-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new Error("Gallery image upload failed: " + error.message);
    }

    const { data: publicData } = supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(data.path);

    uploadedUrls.push(publicData.publicUrl);
  }

  // Preserve existing gallery URLs and add new ones.

  const existingUrls = getLines("gallery");

  const allUrls = [
    ...existingUrls,
    ...uploadedUrls
  ];

  galleryField.value = [...new Set(allUrls)].join("\n");

  fileInput.value = "";

  return uploadedUrls;
}


/* =========================================
   7. PREPARE PRODUCT DATA
========================================= */

function prepareProduct() {

  const price = Number(getValue("price"));

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Please enter a valid product price.");
  }

  return {

    name: getValue("name"),

    brand: getValue("brand"),

    brandName:
      getValue("brandName") || getValue("brand"),

    collection: getList("collection"),

    category: getValue("category"),

    productType: getValue("productType"),

    size: getValue("size"),

    price: price,

    concerns: getList("concerns"),

    skinTypes: getList("skinTypes"),

    description: getValue("description"),

    benefits: getList("benefits"),

    editorialText: getValue("editorialText"),

    whyWeChoseIt: getValue("whyWeChoseIt"),

    ingredients: getIngredients(),

    fullIngredients: getValue("fullIngredients"),

    howToUseSteps: getLines("howToUseSteps"),

    image: getValue("image"),

    gallery: getLines("gallery"),

    tag: getValue("tag"),

    featured:
      document.getElementById("featured").checked

  };
}


/* =========================================
   8. SAVE OR UPDATE PRODUCT
========================================= */

productForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  saveButton.disabled = true;
  formMessage.textContent = "Saving product...";

  try {

    const authorised = await verifyAdmin();

    if (!authorised) return;


    // Upload main image if selected

    await uploadMainProductImage();


    // Upload additional gallery images if selected

    await uploadGalleryImages();


    // Prepare product information after uploads

    const productData = prepareProduct();

    let result;


    if (currentProduct) {

      // UPDATE EXISTING PRODUCT

      const { data, error } = await supabaseClient
        .from("products")
        .update(productData)
        .eq("id", currentProduct.id)
        .select()
        .single();

      if (error) throw error;

      result = data;

      formMessage.textContent =
        "Product updated successfully!";

    } else {

      // CREATE NEW PRODUCT

      const { data, error } = await supabaseClient
        .from("products")
        .insert([{
          ...productData,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      result = data;

      formMessage.textContent =
        "Product created successfully! Product ID: " + result.id;

    }


    // Return to dashboard

    setTimeout(function() {

      window.location.href = "admin-dashboard.html";

    }, 1500);


  } catch (error) {

    console.error("Product saving error:", error);

    formMessage.textContent =
      error.message || "Something went wrong.";

    saveButton.disabled = false;

  }

});


/* =========================================
   9. START PAGE
========================================= */

async function startProductPage() {

  const authorised = await verifyAdmin();

  if (!authorised) return;

  try {

    if (editId) {
      await loadProductForEditing();
    }

  } catch (error) {

    formMessage.textContent = error.message;
    saveButton.disabled = true;

  }

}

startProductPage();
