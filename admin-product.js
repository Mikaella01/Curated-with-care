
/* =========================================
   CURATED WITH CARE BY M.
   PRODUCT EDITOR
   PHOTO VIEWER + AUTO DRAFTS
   UNSAVED CHANGES PROTECTION
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

    if (Array.isArray(parsed)) return parsed;
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
   3. PAGE ELEMENTS AND STATE
========================================= */

const productForm = document.getElementById("product-form");
const saveButton = document.getElementById("save-product");
const formMessage = document.getElementById("form-message");

const mainImageInput = document.getElementById("image-file");
const mainImageField = document.getElementById("image");

const galleryInput = document.getElementById("gallery-files");
const galleryField = document.getElementById("gallery");

const mainPreview = document.getElementById("main-image-preview");
const galleryPreview = document.getElementById("gallery-image-preview");

const draftNotice = document.getElementById("draft-notice");
const draftStatus = document.getElementById("draft-status");

const photoViewer = document.getElementById("photo-viewer");
const viewerImage = document.getElementById("photo-viewer-image");
const viewerCounter = document.getElementById("photo-viewer-counter");

const confirmOverlay = document.getElementById("confirm-overlay");

const params = new URLSearchParams(window.location.search);
const editId = params.get("id");

const draftKey = "curatedProductDraft_" + (editId || "new");

const fieldIds = [
  "name",
  "brand",
  "brandName",
  "category",
  "productType",
  "price",
  "size",
  "collection",
  "description",
  "benefits",
  "editorialText",
  "whyWeChoseIt",
  "concerns",
  "skinTypes",
  "ingredients",
  "fullIngredients",
  "howToUseSteps",
  "image",
  "gallery",
  "tag"
];

let currentProduct = null;

let selectedMainImage = null;
let selectedGalleryImages = [];

let previewUrls = [];
let viewerUrls = [];

let viewerPhotos = [];
let currentViewerIndex = 0;

let dirty = false;
let saving = false;
let restoringDraft = false;
let pendingDestination = null;
let saveTimer = null;

let initialFormSnapshot = "";


/* =========================================
   4. INDEXEDDB FOR IMAGE DRAFTS
========================================= */

const DRAFT_DB_NAME = "CuratedWithCareDrafts";
const DRAFT_STORE_NAME = "images";

function openDraftDatabase() {

  return new Promise(function(resolve, reject) {

    if (!window.indexedDB) {
      reject(new Error("Browser draft storage is unavailable."));
      return;
    }

    const request = indexedDB.open(DRAFT_DB_NAME, 1);

    request.onupgradeneeded = function() {

      const db = request.result;

      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME);
      }

    };

    request.onsuccess = function() {
      resolve(request.result);
    };

    request.onerror = function() {
      reject(request.error);
    };

  });
}


async function storeDraftImages() {

  const db = await openDraftDatabase();

  return new Promise(function(resolve, reject) {

    const transaction = db.transaction(
      DRAFT_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(DRAFT_STORE_NAME);

    store.put({
      main: selectedMainImage,
      gallery: selectedGalleryImages
    }, draftKey);

    transaction.oncomplete = function() {
      db.close();
      resolve();
    };

    transaction.onerror = function() {
      db.close();
      reject(transaction.error);
    };

  });
}


async function loadDraftImages() {

  const db = await openDraftDatabase();

  return new Promise(function(resolve, reject) {

    const transaction = db.transaction(
      DRAFT_STORE_NAME,
      "readonly"
    );

    const request = transaction
      .objectStore(DRAFT_STORE_NAME)
      .get(draftKey);

    request.onsuccess = function() {

      const result = request.result || {};

      db.close();

      resolve(result);

    };

    request.onerror = function() {

      db.close();
      reject(request.error);

    };

  });
}


async function deleteDraftImages() {

  try {

    const db = await openDraftDatabase();

    await new Promise(function(resolve, reject) {

      const transaction = db.transaction(
        DRAFT_STORE_NAME,
        "readwrite"
      );

      transaction.objectStore(DRAFT_STORE_NAME).delete(draftKey);

      transaction.oncomplete = resolve;
      transaction.onerror = function() {
        reject(transaction.error);
      };

    });

    db.close();

  } catch (error) {

    console.warn("Could not remove stored draft images.", error);

  }
}


/* =========================================
   5. FORM DATA AND DRAFT STORAGE
========================================= */

function collectFormFields() {

  const fields = {};

  fieldIds.forEach(function(id) {

    fields[id] = document.getElementById(id).value;

  });

  fields.featured =
    document.getElementById("featured").checked;

  return fields;
}


function applyFormFields(fields) {

  fieldIds.forEach(function(id) {

    if (fields[id] !== undefined) {
      document.getElementById(id).value = fields[id];
    }

  });

  if (fields.featured !== undefined) {

    document.getElementById("featured").checked =
      Boolean(fields.featured);

  }

}


function getFormSnapshot() {

  return JSON.stringify(collectFormFields());

}


function markAsChanged() {

  if (restoringDraft || saving) return;

  dirty = getFormSnapshot() !== initialFormSnapshot;

  scheduleDraftSave();

}


function scheduleDraftSave() {

  clearTimeout(saveTimer);

  saveTimer = setTimeout(function() {

    saveDraftAutomatically();

  }, 700);

}


async function saveDraftAutomatically() {

  if (!dirty || saving) return;

  try {

    const draft = {
      fields: collectFormFields(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(
      draftKey,
      JSON.stringify(draft)
    );

    await storeDraftImages();

    draftStatus.textContent =
      "Draft saved automatically on this device.";

  } catch (error) {

    console.error("Draft saving error:", error);

    draftStatus.textContent =
      "Automatic draft saving is unavailable. Please save your product regularly.";

  }

}


async function clearDraft() {

  clearTimeout(saveTimer);

  localStorage.removeItem(draftKey);

  await deleteDraftImages();

  draftNotice.classList.remove("active");

  draftStatus.textContent =
    "Your changes will be saved automatically as you work.";

}


/* =========================================
   6. DRAFT RECOVERY
========================================= */

async function checkForExistingDraft() {

  const savedDraft = localStorage.getItem(draftKey);

  if (!savedDraft) return;

  try {

    const draft = JSON.parse(savedDraft);

    if (!draft.fields) return;

    draftNotice.classList.add("active");

    draftStatus.textContent =
      "A saved draft is available for recovery.";

    document.getElementById("draft-message").textContent =
      "A draft saved on " +
      new Date(draft.updatedAt).toLocaleString() +
      " is available. Would you like to restore it?";

  } catch (error) {

    console.error("Could not read saved draft.", error);

  }

}


async function restoreDraft() {

  const savedDraft = localStorage.getItem(draftKey);

  if (!savedDraft) return;

  try {

    restoringDraft = true;

    const draft = JSON.parse(savedDraft);

    applyFormFields(draft.fields);

    const images = await loadDraftImages();

    selectedMainImage = images.main || null;

    selectedGalleryImages =
      Array.isArray(images.gallery) ? images.gallery : [];

    mainImageInput.value = "";
    galleryInput.value = "";

    renderMainImagePreview();
    renderGalleryPreview();

    restoringDraft = false;

    dirty = true;

    draftNotice.classList.remove("active");

    draftStatus.textContent =
      "Recovered draft. Your changes will continue saving automatically.";

    scheduleDraftSave();

  } catch (error) {

    restoringDraft = false;

    console.error("Draft recovery error:", error);

    formMessage.textContent =
      "We could not restore the draft. Please try again.";

  }

}


document.getElementById("restore-draft")
  .addEventListener("click", restoreDraft);


document.getElementById("discard-draft")
  .addEventListener("click", async function() {

    await clearDraft();

    formMessage.textContent =
      "Saved draft discarded.";

  });


/* =========================================
   7. PHOTO PREVIEW HELPERS
========================================= */

function clearPreviewUrls() {

  previewUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  previewUrls = [];

}


function makePreviewItem(src, alt, onRemove, onOpen) {

  const item = document.createElement("div");
  item.className = "image-preview-item";

  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.addEventListener("click", onOpen);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "×";
  removeButton.setAttribute("aria-label", "Remove image");

  removeButton.addEventListener("click", function(event) {

    event.stopPropagation();
    onRemove();

  });

  item.appendChild(image);
  item.appendChild(removeButton);

  return item;
}


/* =========================================
   8. BUILD PHOTO VIEWER LIST
========================================= */

function buildViewerPhotos() {

  viewerUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  viewerUrls = [];
  viewerPhotos = [];

  // Main image.

  if (selectedMainImage) {

    const url = URL.createObjectURL(selectedMainImage);

    viewerUrls.push(url);

    viewerPhotos.push({
      type: "main-file",
      src: url,
      name: selectedMainImage.name
    });

  } else if (mainImageField.value.trim()) {

    viewerPhotos.push({
      type: "main-url",
      src: mainImageField.value.trim(),
      name: "Main product image"
    });

  }


  // Existing gallery images.

  getLines("gallery").forEach(function(url, index) {

    viewerPhotos.push({
      type: "gallery-url",
      src: url,
      name: "Gallery image " + (index + 1)
    });

  });


  // Newly selected gallery files.

  selectedGalleryImages.forEach(function(file, index) {

    const url = URL.createObjectURL(file);

    viewerUrls.push(url);

    viewerPhotos.push({
      type: "gallery-file",
      src: url,
      name: file.name
    });

  });

}


/* =========================================
   9. OPEN AND CLOSE PHOTO VIEWER
========================================= */

function openPhotoViewer(index) {

  buildViewerPhotos();

  if (!viewerPhotos.length) return;

  currentViewerIndex = index;

  updatePhotoViewer();

  photoViewer.classList.add("active");

  document.body.style.overflow = "hidden";

}


function closePhotoViewer() {

  photoViewer.classList.remove("active");

  document.body.style.overflow = "";

  viewerUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  viewerUrls = [];

}


function updatePhotoViewer() {

  if (!viewerPhotos.length) {

    closePhotoViewer();
    return;

  }

  if (currentViewerIndex < 0) {
    currentViewerIndex = viewerPhotos.length - 1;
  }

  if (currentViewerIndex >= viewerPhotos.length) {
    currentViewerIndex = 0;
  }

  const photo = viewerPhotos[currentViewerIndex];

  viewerImage.src = photo.src;
  viewerImage.alt = photo.name;

  viewerCounter.textContent =
    "Photo " + (currentViewerIndex + 1) +
    " of " + viewerPhotos.length;

  document.getElementById("previous-photo").disabled =
    viewerPhotos.length < 2;

  document.getElementById("next-photo").disabled =
    viewerPhotos.length < 2;

}


document.getElementById("close-photo-viewer")
  .addEventListener("click", closePhotoViewer);


document.getElementById("previous-photo")
  .addEventListener("click", function() {

    currentViewerIndex--;
    updatePhotoViewer();

  });


document.getElementById("next-photo")
  .addEventListener("click", function() {

    currentViewerIndex++;
    updatePhotoViewer();

  });


photoViewer.addEventListener("click", function(event) {

  if (event.target === photoViewer) {
    closePhotoViewer();
  }

});


document.addEventListener("keydown", function(event) {

  if (!photoViewer.classList.contains("active")) return;

  if (event.key === "Escape") {
    closePhotoViewer();
  }

  if (event.key === "ArrowLeft") {
    currentViewerIndex--;
    updatePhotoViewer();
  }

  if (event.key === "ArrowRight") {
    currentViewerIndex++;
    updatePhotoViewer();
  }

});


/* =========================================
   10. DELETE PHOTO FROM VIEWER
========================================= */

function deleteCurrentPhoto() {

  if (!viewerPhotos.length) return;

  const photo = viewerPhotos[currentViewerIndex];

  if (photo.type === "main-file") {

    selectedMainImage = null;
    mainImageInput.value = "";

  }

  else if (photo.type === "main-url") {

    mainImageField.value = "";

  }

  else if (photo.type === "gallery-url") {

    const urls = getLines("gallery");

    const galleryIndex = urls.indexOf(photo.src);

    if (galleryIndex !== -1) {
      urls.splice(galleryIndex, 1);
    }

    galleryField.value = urls.join("\n");

  }

  else if (photo.type === "gallery-file") {

    const file = selectedGalleryImages.find(function(item) {
      return item.name === photo.name;
    });

    const index = selectedGalleryImages.indexOf(file);

    if (index !== -1) {
      selectedGalleryImages.splice(index, 1);
    }

  }


  // Rebuild the viewer after removal.

  buildViewerPhotos();

  if (currentViewerIndex >= viewerPhotos.length) {
    currentViewerIndex = viewerPhotos.length - 1;
  }

  if (viewerPhotos.length === 0) {
    closePhotoViewer();
  } else {
    updatePhotoViewer();
  }

  renderMainImagePreview();
  renderGalleryPreview();

  markAsChanged();

}


document.getElementById("delete-current-photo")
  .addEventListener("click", deleteCurrentPhoto);


/* =========================================
   11. RENDER MAIN IMAGE PREVIEW
========================================= */

function renderMainImagePreview() {

  clearPreviewUrls();

  mainPreview.innerHTML = "";

  if (selectedMainImage) {

    const url = URL.createObjectURL(selectedMainImage);

    previewUrls.push(url);

    mainPreview.appendChild(
      makePreviewItem(
        url,
        selectedMainImage.name,

        function() {

          selectedMainImage = null;
          mainImageInput.value = "";

          renderMainImagePreview();
          markAsChanged();

        },

        function() {
          openPhotoViewer(0);
        }
      )
    );

    return;

  }

  const existingImage = mainImageField.value.trim();

  if (existingImage) {

    mainPreview.appendChild(
      makePreviewItem(
        existingImage,
        "Main product image",

        function() {

          mainImageField.value = "";

          renderMainImagePreview();
          markAsChanged();

        },

        function() {
          openPhotoViewer(0);
        }
      )
    );

  } else {

    mainPreview.innerHTML =
      '<p class="image-preview-empty">No main image selected.</p>';

  }

}


/* =========================================
   12. RENDER GALLERY PREVIEWS
========================================= */

function renderGalleryPreview() {

  clearPreviewUrls();

  galleryPreview.innerHTML = "";

  const existingImages = getLines("gallery");

  existingImages.forEach(function(url, index) {

    galleryPreview.appendChild(
      makePreviewItem(
        url,
        "Gallery image " + (index + 1),

        function() {

          const images = getLines("gallery");

          images.splice(index, 1);

          galleryField.value = images.join("\n");

          renderGalleryPreview();
          markAsChanged();

        },

        function() {

          const mainExists =
            Boolean(selectedMainImage || mainImageField.value.trim());

          openPhotoViewer(index + (mainExists ? 1 : 0));

        }
      )
    );

  });


  selectedGalleryImages.forEach(function(file, index) {

    const url = URL.createObjectURL(file);

    previewUrls.push(url);

    galleryPreview.appendChild(
      makePreviewItem(
        url,
        file.name,

        function() {

          selectedGalleryImages.splice(index, 1);

          renderGalleryPreview();
          markAsChanged();

        },

        function() {

          const mainExists =
            Boolean(selectedMainImage || mainImageField.value.trim());

          openPhotoViewer(
            existingImages.length +
            (mainExists ? 1 : 0) +
            index
          );

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
   13. IMAGE INPUT EVENTS
========================================= */

mainImageInput.addEventListener("change", function() {

  const file = mainImageInput.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {

    mainImageInput.value = "";

    formMessage.textContent =
      "Please select a valid main image.";

    return;

  }

  selectedMainImage = file;

  renderMainImagePreview();
  markAsChanged();

});


galleryInput.addEventListener("change", function() {

  const files = Array.from(galleryInput.files);

  files.forEach(function(file) {

    if (file.type.startsWith("image/")) {
      selectedGalleryImages.push(file);
    }

  });

  galleryInput.value = "";

  renderGalleryPreview();
  markAsChanged();

});


mainImageField.addEventListener("input", function() {

  if (!selectedMainImage) {
    renderMainImagePreview();
  }

  markAsChanged();

});


galleryField.addEventListener("input", function() {

  renderGalleryPreview();
  markAsChanged();

});


/* =========================================
   14. LOAD EXISTING PRODUCT
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


  const fields = {

    name: data.name || "",
    brand: data.brand || "",
    brandName: data.brandName || "",
    category: data.category || "",
    productType: data.productType || "",
    price: data.price ?? "",
    size: data.size || "",
    collection: (data.collection || []).join(", "),

    description: data.description || "",
    benefits: (data.benefits || []).join(", "),
    editorialText: data.editorialText || "",
    whyWeChoseIt: data.whyWeChoseIt || "",

    concerns: (data.concerns || []).join(", "),
    skinTypes: (data.skinTypes || []).join(", "),

    ingredients: JSON.stringify(data.ingredients || [], null, 2),
    fullIngredients: data.fullIngredients || "",
    howToUseSteps: (data.howToUseSteps || []).join("\n"),

    image: data.image || "",
    gallery: (data.gallery || []).join("\n"),

    tag: data.tag || ""

  };

  fields.featured = Boolean(data.featured);

  applyFormFields(fields);

  selectedMainImage = null;
  selectedGalleryImages = [];

  mainImageInput.value = "";
  galleryInput.value = "";

  renderMainImagePreview();
  renderGalleryPreview();

}


/* =========================================
   15. UPLOAD MAIN PRODUCT IMAGE
========================================= */

async function uploadMainProductImage() {

  if (!selectedMainImage) return null;

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
   16. UPLOAD GALLERY IMAGES
========================================= */

async function uploadGalleryImages() {

  if (selectedGalleryImages.length === 0) return [];

  const files = [...selectedGalleryImages];
  const uploadedUrls = [];

  for (let i = 0; i < files.length; i++) {

    const file = files[i];

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-");

    const filePath =
      "gallery/" + Date.now() + "-" + i + "-" + safeFileName;

    formMessage.textContent =
      "Uploading gallery image " +
      (i + 1) + " of " + files.length + "...";

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

  const existingUrls = getLines("gallery");

  galleryField.value = [
    ...new Set([...existingUrls, ...uploadedUrls])
  ].join("\n");

  selectedGalleryImages = [];
  galleryInput.value = "";

  renderGalleryPreview();

  return uploadedUrls;

}


/* =========================================
   17. PREPARE PRODUCT DATA
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
   18. SAVE PRODUCT
========================================= */

async function saveProduct() {

  if (saving) return;

  saving = true;
  saveButton.disabled = true;

  formMessage.textContent = "Saving product...";

  try {

    const authorised = await verifyAdmin();

    if (!authorised) {
      saving = false;
      return;
    }

    if (selectedMainImage) {

      formMessage.textContent = "Uploading main image...";

      await uploadMainProductImage();

    }

    if (selectedGalleryImages.length > 0) {

      await uploadGalleryImages();

    }

    const productData = prepareProduct();

    let result;

    if (currentProduct) {

      const { data, error } = await supabaseClient
        .from("products")
        .update(productData)
        .eq("id", currentProduct.id)
        .select()
        .single();

      if (error) throw error;

      result = data;

    } else {

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

    }


    dirty = false;
    initialFormSnapshot = getFormSnapshot();

    await clearDraft();

    formMessage.textContent =
      currentProduct
        ? "Product updated successfully!"
        : "Product created successfully! Product ID: " + result.id;

    if (pendingDestination) {

      window.location.href = pendingDestination;

    } else {

      setTimeout(function() {
        window.location.href = "admin-dashboard.html";
      }, 1200);

    }

  } catch (error) {

    console.error("Product saving error:", error);

    formMessage.textContent =
      error.message || "Something went wrong.";

    saving = false;
    saveButton.disabled = false;

    scheduleDraftSave();

  }

}


productForm.addEventListener("submit", function(event) {

  event.preventDefault();

  saveProduct();

});


/* =========================================
   19. UNSAVED CHANGES PROTECTION
========================================= */

function openConfirmation() {

  confirmOverlay.classList.add("active");

}


function closeConfirmation() {

  confirmOverlay.classList.remove("active");

}


document.getElementById("continue-editing")
  .addEventListener("click", closeConfirmation);


document.getElementById("discard-before-leaving")
  .addEventListener("click", async function() {

    const destination = pendingDestination;

    closeConfirmation();

    dirty = false;

    await clearDraft();

    if (destination) {
      window.location.href = destination;
    }

  });


document.getElementById("save-before-leaving")
  .addEventListener("click", function() {

    closeConfirmation();

    productForm.requestSubmit();

  });


// Protect links inside the editor.

document.querySelectorAll('a[href]').forEach(function(link) {

  link.addEventListener("click", function(event) {

    if (!dirty || saving) return;

    const destination = link.href;

    if (destination === window.location.href) return;

    event.preventDefault();

    pendingDestination = destination;

    openConfirmation();

  });

});


// Browser-controlled warning for refresh, closing or browser navigation.

window.addEventListener("beforeunload", function(event) {

  if (!dirty || saving) return;

  event.preventDefault();

  event.returnValue = "";

});


/* =========================================
   20. FORM CHANGE TRACKING
========================================= */

productForm.addEventListener("input", markAsChanged);

productForm.addEventListener("change", markAsChanged);


/* =========================================
   21. START PAGE
========================================= */

async function startProductPage() {

  const authorised = await verifyAdmin();

  if (!authorised) return;

  try {

    if (editId) {
      await loadProductForEditing();
    }

    renderMainImagePreview();
    renderGalleryPreview();

    initialFormSnapshot = getFormSnapshot();

    await checkForExistingDraft();

    formMessage.textContent = "";

  } catch (error) {

    console.error(error);

    formMessage.textContent = error.message;

    saveButton.disabled = true;

  }

}


startProductPage();
