
/* =========================================
   CURATED WITH CARE BY M.
   ADD AND EDIT PRODUCTS
   IMAGE PREVIEWS AND INDIVIDUAL REMOVAL
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

const mainImageInput = document.getElementById("image-file");
const mainImageField = document.getElementById("image");

const galleryInput = document.getElementById("gallery-files");
const galleryField = document.getElementById("gallery");

const mainPreview = document.getElementById("main-image-preview");
const galleryPreview = document.getElementById("gallery-image-preview");

let currentProduct = null;

let selectedMainImage = null;
let selectedGalleryImages = [];

let mainPreviewUrl = null;
let galleryPreviewUrls = new Map();


/* =========================================
   4. IMAGE PREVIEW HELPERS
========================================= */

function createPreviewItem(src, alt, onRemove) {

  const item = document.createElement("div");
  item.className = "image-preview-item";

  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "×";
  removeButton.setAttribute("aria-label", "Remove image");

  removeButton.addEventListener("click", onRemove);

  item.appendChild(image);
  item.appendChild(removeButton);

  return item;
}


/* =========================================
   5. MAIN IMAGE PREVIEW
========================================= */

function renderMainImagePreview() {

  mainPreview.innerHTML = "";

  if (mainPreviewUrl) {
    URL.revokeObjectURL(mainPreviewUrl);
    mainPreviewUrl = null;
  }

  if (selectedMainImage) {

    mainPreviewUrl = URL.createObjectURL(selectedMainImage);

    mainPreview.appendChild(
      createPreviewItem(
        mainPreviewUrl,
        selectedMainImage.name,
        function() {

          selectedMainImage = null;
          mainImageInput.value = "";

          renderMainImagePreview();

        }
      )
    );

    return;
  }

  const existingImage = mainImageField.value.trim();

  if (existingImage) {

    mainPreview.appendChild(
      createPreviewItem(
        existingImage,
        "Main product image",
        function() {

          mainImageField.value = "";
          selectedMainImage = null;

          renderMainImagePreview();

        }
      )
    );

  } else {

    mainPreview.innerHTML =
      '<p class="image-preview-empty">No main image selected.</p>';

  }
}


/* =========================================
   6. GALLERY IMAGE PREVIEW
========================================= */

function renderGalleryPreview() {

  galleryPreview.innerHTML = "";

  // Remove previous temporary preview URLs.

  galleryPreviewUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  galleryPreviewUrls.clear();


  // Existing gallery images.

  const existingImages = getLines("gallery");

  existingImages.forEach(function(url, index) {

    galleryPreview.appendChild(
      createPreviewItem(
        url,
        "Gallery image " + (index + 1),
        function() {

          const remainingImages = getLines("gallery");

          remainingImages.splice(index, 1);

          galleryField.value = remainingImages.join("\n");

          renderGalleryPreview();

        }
      )
    );

  });


  // Newly selected gallery images.

  selectedGalleryImages.forEach(function(file, index) {

    const previewUrl = URL.createObjectURL(file);

    galleryPreviewUrls.set(index, previewUrl);

    galleryPreview.appendChild(
      createPreviewItem(
        previewUrl,
        file.name,
        function() {

          selectedGalleryImages.splice(index, 1);

          renderGalleryPreview();

        }
      )
    );

  });


  if (
    existingImages.length === 0 &&
    selectedGalleryImages.length === 0
  ) {

    galleryPreview.innerHTML =
      '<p class="image-preview-empty">No gallery images selected.</p>';

  }
}


/* =========================================
   7. IMAGE INPUT EVENTS
========================================= */

// Main image selection.

mainImageInput.addEventListener("change", function() {

  const file = mainImageInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {

    mainImageInput.value = "";

    formMessage.textContent =
      "Please select a valid image.";

    return;
  }

  selectedMainImage = file;

  renderMainImagePreview();

});


// Gallery image selection.
// New selections are added without removing earlier selections.

galleryInput.addEventListener("change", function() {

  const files = Array.from(galleryInput.files);

  files.forEach(function(file) {

    if (file.type.startsWith("image/")) {
      selectedGalleryImages.push(file);
    }

  });

  galleryInput.value = "";

  renderGalleryPreview();

});


// Update previews if image paths are manually changed.

mainImageField.addEventListener("input", function() {

  if (!selectedMainImage) {
    renderMainImagePreview();
  }

});

galleryField.addEventListener("input", function() {

  renderGalleryPreview();

});


/* =========================================
   8. LOAD EXISTING PRODUCT WHEN EDITING
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


  // Basic information.

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


  // Product details.

  document.getElementById("description").value =
    data.description || "";

  document.getElementById("benefits").value =
    (data.benefits || []).join(", ");

  document.getElementById("editorialText").value =
    data.editorialText || "";

  document.getElementById("whyWeChoseIt").value =
    data.whyWeChoseIt || "";


  // Skin information.

  document.getElementById("concerns").value =
    (data.concerns || []).join(", ");

  document.getElementById("skinTypes").value =
    (data.skinTypes || []).join(", ");


  // Ingredients.

  document.getElementById("ingredients").value =
    JSON.stringify(data.ingredients || [], null, 2);

  document.getElementById("fullIngredients").value =
    data.fullIngredients || "";

  document.getElementById("howToUseSteps").value =
    (data.howToUseSteps || []).join("\n");


  // Images.

  mainImageField.value = data.image || "";

  galleryField.value =
    (data.gallery || []).join("\n");

  selectedMainImage = null;
  selectedGalleryImages = [];

  mainImageInput.value = "";
  galleryInput.value = "";

  renderMainImagePreview();
  renderGalleryPreview();


  // Display settings.

  document.getElementById("tag").value =
    data.tag || "";

  document.getElementById("featured").checked =
    Boolean(data.featured);

  formMessage.textContent =
    "Product loaded. You can now make changes.";
}


/* =========================================
   9. UPLOAD MAIN IMAGE
========================================= */

async function uploadMainProductImage() {

  if (!selectedMainImage) {
    return null;
  }

  const file = selectedMainImage;

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
    throw new Error(
      "Main image upload failed: " + error.message
    );
  }

  const { data: publicData } = supabaseClient
    .storage
    .from("product-images")
    .getPublicUrl(data.path);

  mainImageField.value = publicData.publicUrl;

  selectedMainImage = null;
  mainImageInput.value = "";

  renderMainImagePreview();

  return publicData.publicUrl;
}


/* =========================================
   10. UPLOAD GALLERY IMAGES
========================================= */

async function uploadGalleryImages() {

  if (selectedGalleryImages.length === 0) {
    return [];
  }

  const uploadedUrls = [];

  const filesToUpload = [...selectedGalleryImages];

  for (let i = 0; i < filesToUpload.length; i++) {

    const file = filesToUpload[i];

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-");

    const filePath =
      "gallery/" + Date.now() + "-" + i + "-" + safeFileName;

    formMessage.textContent =
      "Uploading gallery image " +
      (i + 1) + " of " + filesToUpload.length + "...";

    const { data, error } = await supabaseClient
      .storage
      .from("product-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new Error(
        "Gallery image upload failed: " + error.message
      );
    }

    const { data: publicData } = supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(data.path);

    uploadedUrls.push(publicData.publicUrl);

  }


  // Preserve remaining existing gallery images.

  const existingUrls = getLines("gallery");

  const allUrls = [
    ...existingUrls,
    ...uploadedUrls
  ];

  galleryField.value = [...new Set(allUrls)].join("\n");

  selectedGalleryImages = [];
  galleryInput.value = "";

  renderGalleryPreview();

  return uploadedUrls;
}


/* =========================================
   11. PREPARE PRODUCT DATA
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
   12. SAVE OR UPDATE PRODUCT
========================================= */

productForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  saveButton.disabled = true;
  formMessage.textContent = "Saving product...";

  try {

    const authorised = await verifyAdmin();

    if (!authorised) return;


    // Upload main image if selected.

    if (selectedMainImage) {

      formMessage.textContent = "Uploading main image...";

      await uploadMainProductImage();

    }


    // Upload selected gallery images.

    if (selectedGalleryImages.length > 0) {

      await uploadGalleryImages();

    }


    // Prepare product data after uploads.

    const productData = prepareProduct();

    let result;


    if (currentProduct) {

      // UPDATE EXISTING PRODUCT.

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

      // CREATE NEW PRODUCT.

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
   13. START PAGE
========================================= */

async function startProductPage() {

  const authorised = await verifyAdmin();

  if (!authorised) return;

  try {

    if (editId) {
      await loadProductForEditing();
    } else {
      renderMainImagePreview();
      renderGalleryPreview();
    }

  } catch (error) {

    formMessage.textContent = error.message;
    saveButton.disabled = true;

  }

}

startProductPage();
