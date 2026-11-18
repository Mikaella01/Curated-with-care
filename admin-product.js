
alert("ADMIN PRODUCT JAVASCRIPT IS LOADING");

/* =========================================
   CURATED WITH CARE BY M.
   PRODUCT EDITOR
   DRAGGABLE GALLERY
   PHOTO VIEWER + AUTO DRAFTS
   PRODUCT VARIATIONS
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
  const { data, error } = await supabaseClient.auth.getUser();

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

let galleryItems = [];
let galleryItemCounter = 0;

let mainPreviewUrls = [];
let galleryPreviewUrls = [];

let viewerUrls = [];
let viewerPhotos = [];
let currentViewerIndex = 0;

let dirty = false;
let hasUnsavedImageChanges = false;
let saving = false;
let restoringDraft = false;

let pendingDestination = null;
let saveTimer = null;

let initialFormSnapshot = "";

let galleryDrag = null;
let suppressGalleryClick = false;


/* =========================================
   3A. PRODUCT VARIATIONS STATE
========================================= */

let productVariants = [];
let variantCounter = 0;
let variantPreviewUrls = [];


function createVariant(data = {}) {
  variantCounter++;

  return {
    id: data.id || "variant-" + variantCounter,
    name: data.name || "",
    size: data.size || "",
    price: data.price ?? "",
    image: data.image || "",
    file: data.file || null
  };
}


function getVariantDraftData() {
  return productVariants.map(function(variant) {
    return {
      id: variant.id,
      name: variant.name,
      size: variant.size,
      price: variant.price,
      image: variant.image,
      file: variant.file || null
    };
  });
}


function getVariantDatabaseData() {
  return productVariants.map(function(variant) {
    return {
      name: variant.name.trim(),
      size: variant.size.trim(),
      price: Number(variant.price),
      image: variant.image
    };
  });
}


/* =========================================
   3B. CREATE VARIATION EDITOR
========================================= */

function createVariantEditor() {

  if (document.getElementById("variant-editor")) return;

  const firstSection = productForm.querySelector(".form-section");

  if (!firstSection) {
    throw new Error(
      "Could not find the product form section for the variant editor."
    );
  }

  const section = document.createElement("section");

  section.className = "form-section";
  section.id = "variant-editor";

  section.style.marginTop = "25px";

  section.innerHTML = `
    <h2>Product Variations</h2>

    <p style="color:#777; line-height:1.6;">
      Add different sizes or versions of this product.
      Each variation can have its own price and photograph.
    </p>

    <div id="variant-list"></div>

    <button
      type="button"
      id="add-variant-button"
      style="
        margin-top:18px;
        padding:12px 20px;
        border:1px solid #c9b9ae;
        background:#f7f2ed;
        color:#51443d;
        cursor:pointer;
        border-radius:5px;
      "
    >
      + Add Product Variation
    </button>
  `;

  firstSection.after(section);

  document
    .getElementById("add-variant-button")
    .addEventListener("click", function() {

      productVariants.push(createVariant());

      renderVariantEditor();

      markAsChanged();

    });

  renderVariantEditor();
}


/* =========================================
   3C. RENDER VARIATION EDITOR
========================================= */

function clearVariantPreviewUrls() {

  variantPreviewUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  variantPreviewUrls = [];
}


function renderVariantEditor() {

  const list = document.getElementById("variant-list");

  if (!list) return;

  clearVariantPreviewUrls();

  list.innerHTML = "";

  if (productVariants.length === 0) {

    const empty = document.createElement("p");

    empty.textContent =
      "No variations added. You can add variations such as 30ml, 50ml or 100ml.";

    empty.style.color = "#888";
    empty.style.padding = "15px 0";

    list.appendChild(empty);

    return;
  }


  productVariants.forEach(function(variant, index) {

    const card = document.createElement("div");

    card.style.cssText = `
      border:1px solid #e5ddd6;
      padding:18px;
      margin-top:16px;
      border-radius:8px;
      background:#fffdfa;
    `;


    const heading = document.createElement("h3");

    heading.textContent = "Variation " + (index + 1);

    heading.style.cssText = `
      margin:0 0 15px;
      font-size:16px;
      color:#51443d;
    `;

    card.appendChild(heading);


    function createField(labelText, value, placeholder, type) {

      const wrapper = document.createElement("div");

      wrapper.style.marginBottom = "14px";

      const label = document.createElement("label");

      label.textContent = labelText;

      label.style.cssText = `
        display:block;
        margin-bottom:6px;
        font-weight:500;
      `;

      const input = document.createElement("input");

      input.type = type || "text";
      input.value = value ?? "";
      input.placeholder = placeholder || "";

      input.style.cssText = `
        width:100%;
        padding:11px;
        border:1px solid #ded5ce;
        border-radius:5px;
        box-sizing:border-box;
      `;

      if (input.type === "number") {
        input.min = "0";
        input.step = "0.01";
      }

      input.addEventListener("input", function() {

        if (type === "number") {
          variant.price = input.value;
        } else if (labelText === "Variation name") {
          variant.name = input.value;
        } else {
          variant.size = input.value;
        }

        markAsChanged();

      });

      wrapper.appendChild(label);
      wrapper.appendChild(input);

      card.appendChild(wrapper);

      return input;
    }


    createField(
      "Variation name",
      variant.name,
      "Example: Standard, Refill, Gift Set",
      "text"
    );


    createField(
      "Size",
      variant.size,
      "Example: 30ml, 50ml, 100ml",
      "text"
    );


    createField(
      "Price",
      variant.price,
      "Enter variation price",
      "number"
    );


    /* VARIATION IMAGE URL */

    const imageUrlWrapper = document.createElement("div");

    imageUrlWrapper.style.marginBottom = "14px";

    const imageUrlLabel = document.createElement("label");

    imageUrlLabel.textContent = "Variation photograph URL";

    imageUrlLabel.style.cssText = `
      display:block;
      margin-bottom:6px;
      font-weight:500;
    `;

    const imageUrlInput = document.createElement("input");

    imageUrlInput.type = "url";
    imageUrlInput.value = variant.image || "";
    imageUrlInput.placeholder = "Paste an image URL (optional)";

    imageUrlInput.style.cssText = `
      width:100%;
      padding:11px;
      border:1px solid #ded5ce;
      border-radius:5px;
      box-sizing:border-box;
    `;

    imageUrlInput.addEventListener("input", function() {

      variant.image = imageUrlInput.value.trim();

      if (variant.file) {
        variant.file = null;
      }

      renderVariantEditor();

      markAsChanged();

    });

    imageUrlWrapper.appendChild(imageUrlLabel);
    imageUrlWrapper.appendChild(imageUrlInput);

    card.appendChild(imageUrlWrapper);


    /* VARIATION IMAGE FILE */

    const uploadLabel = document.createElement("label");

    uploadLabel.textContent = "Upload a separate photograph";

    uploadLabel.style.cssText = `
      display:block;
      margin-bottom:6px;
      font-weight:500;
    `;

    card.appendChild(uploadLabel);


    const fileInput = document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.style.cssText = `
      display:block;
      margin-bottom:12px;
      max-width:100%;
    `;

    fileInput.addEventListener("change", function() {

      const file = fileInput.files[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {

        formMessage.textContent =
          "Please select a valid variation photograph.";

        fileInput.value = "";

        return;
      }

      variant.file = file;
      variant.image = "";

      hasUnsavedImageChanges = true;

      renderVariantEditor();

      markAsChanged();

    });

    card.appendChild(fileInput);


    /* VARIATION IMAGE PREVIEW */

    let previewSource = "";

    if (variant.file) {

      previewSource = URL.createObjectURL(variant.file);

      variantPreviewUrls.push(previewSource);

    } else if (variant.image) {

      previewSource = variant.image;

    }


    if (previewSource) {

      const preview = document.createElement("img");

      preview.src = previewSource;
      preview.alt = "Variation photograph";

      preview.style.cssText = `
        display:block;
        width:120px;
        height:120px;
        object-fit:cover;
        border-radius:6px;
        margin:10px 0;
        border:1px solid #e5ddd6;
      `;

      preview.onerror = function() {
        preview.style.display = "none";
      };

      card.appendChild(preview);

    }


    /* REMOVE VARIATION */

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.textContent = "Remove Variation";

    removeButton.style.cssText = `
      margin-top:12px;
      padding:9px 14px;
      border:1px solid #d7b9b2;
      background:#fff8f6;
      color:#8a5149;
      cursor:pointer;
      border-radius:5px;
    `;

    removeButton.addEventListener("click", function() {

      productVariants.splice(index, 1);

      renderVariantEditor();

      markAsChanged();

    });

    card.appendChild(removeButton);

    list.appendChild(card);

  });

}


/* =========================================
   4. GALLERY ITEM HELPERS
========================================= */

function createGalleryItem(type, value) {
  galleryItemCounter++;

  if (type === "file") {
    return {
      key: "gallery-" + galleryItemCounter,
      type: "file",
      file: value
    };
  }

  return {
    key: "gallery-" + galleryItemCounter,
    type: "url",
    url: value
  };
}


function initialiseGalleryFromField() {
  galleryItems = getLines("gallery").map(function(url) {
    return createGalleryItem("url", url);
  });
}


function syncGalleryField() {
  galleryField.value = galleryItems
    .filter(item => item.type === "url")
    .map(item => item.url)
    .join("\n");
}


function getGalleryImageSource(item) {
  if (item.type === "file") {
    return URL.createObjectURL(item.file);
  }

  return item.url;
}


function addGalleryFiles(files) {
  files.forEach(function(file) {
    if (!file.type.startsWith("image/")) return;

    galleryItems.push(
      createGalleryItem("file", file)
    );

    hasUnsavedImageChanges = true;
  });

  syncGalleryField();
}


/* =========================================
   5. INDEXEDDB FOR IMAGE DRAFTS
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
      gallery: galleryItems,
      variants: getVariantDraftData()
    }, draftKey);

    transaction.oncomplete = function() {
      db.close();
      resolve();
    };

    transaction.onerror = function() {
      db.close();
      reject(transaction.error);
    };

    transaction.onabort = function() {
      db.close();
      reject(transaction.error || new Error("Draft image storage failed."));
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

      transaction.onabort = function() {
        reject(transaction.error);
      };

    });

    db.close();

  } catch (error) {
    console.warn("Could not remove stored draft images.", error);
  }
}


/* =========================================
   6. FORM DATA AND DRAFT STORAGE
========================================= */

function collectFormFields() {
  const fields = {};

  fieldIds.forEach(function(id) {
    fields[id] = document.getElementById(id).value;
  });

  fields.featured =
    document.getElementById("featured").checked;

  fields.variants = getVariantDraftData();

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

  if (Array.isArray(fields.variants)) {

    productVariants = fields.variants.map(function(variant) {
      return createVariant(variant);
    });

    renderVariantEditor();

  }
}


function getFormSnapshot() {
  return JSON.stringify(collectFormFields());
}


function markAsChanged() {
  if (restoringDraft || saving) return;

  dirty =
    getFormSnapshot() !== initialFormSnapshot ||
    hasUnsavedImageChanges;

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

  const draft = {
    fields: collectFormFields(),
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));

    draftStatus.textContent =
      "Draft saved automatically on this device.";

  } catch (error) {
    console.error("Draft field saving error:", error);

    draftStatus.textContent =
      "Draft storage is unavailable. Please save your product regularly.";

    return;
  }

  try {
    await storeDraftImages();

  } catch (error) {
    console.error("Draft image saving error:", error);

    draftStatus.textContent =
      "Your text changes are saved, but selected photos could not be saved. Please save your product regularly.";
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
   7. DRAFT RECOVERY
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

    selectedMainImage = null;
    galleryItems = [];

    try {
      const images = await loadDraftImages();

      selectedMainImage = images.main || null;

      if (Array.isArray(images.gallery)) {

        if (
          images.gallery.every(function(item) {
            return item && (
              item.type === "url" ||
              item.type === "file"
            );
          })
        ) {
          galleryItems = images.gallery.map(function(item) {
            return {
              key: item.key || (
                "gallery-" + (++galleryItemCounter)
              ),
              type: item.type,
              url: item.url,
              file: item.file
            };
          });

        } else {
          galleryItems = images.gallery.map(function(file) {
            return createGalleryItem("file", file);
          });
        }
      }


      /* RESTORE VARIANT PHOTOS */

      if (Array.isArray(images.variants)) {

        productVariants = images.variants.map(function(variant) {
          return createVariant(variant);
        });

      }

    } catch (imageError) {
      console.warn("Draft images could not be restored.", imageError);
    }

    if (galleryItems.length === 0) {
      initialiseGalleryFromField();
    }

    syncGalleryField();

    mainImageInput.value = "";
    galleryInput.value = "";

    hasUnsavedImageChanges =
      Boolean(selectedMainImage) ||
      galleryItems.some(item => item.type === "file") ||
      productVariants.some(item => item.file);

    renderMainImagePreview();
    renderGalleryPreview();
    renderVariantEditor();

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

    dirty = false;
    hasUnsavedImageChanges = false;

    formMessage.textContent = "Saved draft discarded.";

  });


/* =========================================
   8. PREVIEW URL HELPERS
========================================= */

function clearMainPreviewUrls() {
  mainPreviewUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  mainPreviewUrls = [];
}


function clearGalleryPreviewUrls() {
  galleryPreviewUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  galleryPreviewUrls = [];
}


function makePreviewItem(src, alt, onRemove, onOpen) {
  const item = document.createElement("div");
  item.className = "image-preview-item";

  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;

  image.addEventListener("click", function() {
    if (suppressGalleryClick) return;
    onOpen();
  });

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
   9. BUILD PHOTO VIEWER LIST
========================================= */

function buildViewerPhotos() {
  viewerUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  viewerUrls = [];
  viewerPhotos = [];

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

  galleryItems.forEach(function(item, index) {
    let src;
    let name;

    if (item.type === "file") {
      src = URL.createObjectURL(item.file);
      viewerUrls.push(src);
      name = item.file.name;
    } else {
      src = item.url;
      name = "Gallery image " + (index + 1);
    }

    viewerPhotos.push({
      type: item.type === "file" ? "gallery-file" : "gallery-url",
      src: src,
      name: name,
      galleryIndex: index
    });
  });
}


/* =========================================
   10. OPEN AND CLOSE PHOTO VIEWER
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
   11. DELETE PHOTO FROM VIEWER
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

  else if (
    photo.type === "gallery-url" ||
    photo.type === "gallery-file"
  ) {
    galleryItems.splice(photo.galleryIndex, 1);
    syncGalleryField();
  }

  hasUnsavedImageChanges = true;

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
   12. RENDER MAIN IMAGE PREVIEW
========================================= */

function renderMainImagePreview() {
  clearMainPreviewUrls();

  mainPreview.innerHTML = "";

  if (selectedMainImage) {
    const url = URL.createObjectURL(selectedMainImage);

    mainPreviewUrls.push(url);

    mainPreview.appendChild(
      makePreviewItem(
        url,
        selectedMainImage.name,

        function() {
          selectedMainImage = null;
          mainImageInput.value = "";

          hasUnsavedImageChanges = true;

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

          hasUnsavedImageChanges = true;

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
   13. DRAG AND DROP GALLERY
========================================= */

function startGalleryDrag(event, item) {
  if (event.target.closest("button")) return;

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  galleryDrag = {
    element: item,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    moved: false
  };
}


function moveGalleryDrag(event) {
  if (!galleryDrag) return;

  if (event.pointerId !== galleryDrag.pointerId) return;

  const distanceX = event.clientX - galleryDrag.startX;
  const distanceY = event.clientY - galleryDrag.startY;

  if (
    !galleryDrag.moved &&
    Math.hypot(distanceX, distanceY) < 8
  ) {
    return;
  }

  galleryDrag.moved = true;

  event.preventDefault();

  const draggedElement = galleryDrag.element;

  draggedElement.classList.add("gallery-dragging");

  const elementUnderPointer = document.elementFromPoint(
    event.clientX,
    event.clientY
  );

  if (!elementUnderPointer) return;

  const target = elementUnderPointer.closest(
    ".image-preview-item"
  );

  if (!target || target === draggedElement) return;

  if (target.parentElement !== galleryPreview) return;

  const rect = target.getBoundingClientRect();

  const horizontal =
    Math.abs(distanceX) > Math.abs(distanceY);

  const shouldInsertAfter = horizontal
    ? event.clientX > rect.left + rect.width / 2
    : event.clientY > rect.top + rect.height / 2;

  if (shouldInsertAfter) {
    galleryPreview.insertBefore(
      draggedElement,
      target.nextSibling
    );
  } else {
    galleryPreview.insertBefore(
      draggedElement,
      target
    );
  }
}


function finishGalleryDrag(event) {
  if (!galleryDrag) return;

  if (event.pointerId !== galleryDrag.pointerId) return;

  const dragged = galleryDrag;

  galleryDrag = null;

  dragged.element.classList.remove("gallery-dragging");

  if (!dragged.moved) return;

  suppressGalleryClick = true;

  setTimeout(function() {
    suppressGalleryClick = false;
  }, 250);

  const orderedKeys = Array.from(
    galleryPreview.querySelectorAll(".image-preview-item")
  ).map(function(element) {
    return element.dataset.galleryKey;
  });

  const itemMap = new Map(
    galleryItems.map(function(item) {
      return [item.key, item];
    })
  );

  galleryItems = orderedKeys
    .map(key => itemMap.get(key))
    .filter(Boolean);

  syncGalleryField();

  renderGalleryPreview();

  hasUnsavedImageChanges = true;

  markAsChanged();

  formMessage.textContent =
    "Gallery photo order updated.";
}


document.addEventListener("pointermove", moveGalleryDrag, {
  passive: false
});

document.addEventListener("pointerup", finishGalleryDrag);
document.addEventListener("pointercancel", finishGalleryDrag);


/* =========================================
   14. RENDER GALLERY PREVIEWS
========================================= */

function renderGalleryPreview() {
  clearGalleryPreviewUrls();

  galleryPreview.innerHTML = "";

  galleryItems.forEach(function(galleryItem, index) {

    const url = getGalleryImageSource(galleryItem);

    if (galleryItem.type === "file") {
      galleryPreviewUrls.push(url);
    }

    const item = makePreviewItem(
      url,

      "Gallery image " + (index + 1),

      function() {
        galleryItems.splice(index, 1);

        syncGalleryField();

        hasUnsavedImageChanges = true;

        renderGalleryPreview();
        markAsChanged();
      },

      function() {
        const mainExists =
          Boolean(selectedMainImage || mainImageField.value.trim());

        openPhotoViewer(index + (mainExists ? 1 : 0));
      }
    );

    item.dataset.galleryKey = galleryItem.key;

    item.style.touchAction = "none";
    item.style.cursor = "grab";

    item.addEventListener("pointerdown", function(event) {
      startGalleryDrag(event, item);
    });

    galleryPreview.appendChild(item);
  });


  if (galleryItems.length === 0) {
    galleryPreview.innerHTML =
      '<p class="image-preview-empty">No gallery images selected.</p>';
  }
}


/* =========================================
   15. IMAGE INPUT EVENTS
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
  hasUnsavedImageChanges = true;

  renderMainImagePreview();
  markAsChanged();
});


galleryInput.addEventListener("change", function() {
  const files = Array.from(galleryInput.files);

  addGalleryFiles(files);

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
  const pendingFiles = galleryItems.filter(function(item) {
    return item.type === "file";
  });

  galleryItems = getLines("gallery").map(function(url) {
    return createGalleryItem("url", url);
  });

  galleryItems.push(...pendingFiles);

  renderGalleryPreview();
  markAsChanged();
});


/* =========================================
   16. LOAD EXISTING PRODUCT
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

  /* LOAD EXISTING VARIATIONS */

  productVariants = Array.isArray(data.variants)
    ? data.variants.map(function(variant) {
        return createVariant(variant);
      })
    : [];

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

    ingredients: JSON.stringify(
      data.ingredients || [],
      null,
      2
    ),

    fullIngredients: data.fullIngredients || "",

    howToUseSteps: (data.howToUseSteps || []).join("\n"),

    image: data.image || "",

    gallery: (data.gallery || []).join("\n"),

    tag: data.tag || ""
  };

  fields.featured = Boolean(data.featured);

  applyFormFields(fields);

  selectedMainImage = null;

  initialiseGalleryFromField();

  hasUnsavedImageChanges = false;

  mainImageInput.value = "";
  galleryInput.value = "";

  renderMainImagePreview();
  renderGalleryPreview();
  renderVariantEditor();
}


/* =========================================
   17. UPLOAD MAIN PRODUCT IMAGE
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
   18. UPLOAD GALLERY IMAGES
========================================= */

async function uploadGalleryImages() {
  const totalFiles = galleryItems.filter(function(item) {
    return item.type === "file";
  }).length;

  if (totalFiles === 0) return [];

  const uploadedUrls = [];
  let uploadedCount = 0;

  for (let i = 0; i < galleryItems.length; i++) {

    const item = galleryItems[i];

    if (item.type !== "file") continue;

    const file = item.file;

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-");

    const filePath =
      "gallery/" + Date.now() + "-" + i + "-" + safeFileName;

    uploadedCount++;

    formMessage.textContent =
      "Uploading gallery image " +
      uploadedCount + " of " + totalFiles + "...";

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

    const publicUrl = publicData.publicUrl;

    uploadedUrls.push(publicUrl);

    galleryItems[i] = {
      key: item.key,
      type: "url",
      url: publicUrl
    };

    syncGalleryField();

    await storeDraftImages();
  }

  galleryInput.value = "";

  syncGalleryField();

  renderGalleryPreview();

  return uploadedUrls;
}


/* =========================================
   18A. UPLOAD VARIATION PHOTOGRAPHS
========================================= */

async function uploadVariantImages() {

  for (let i = 0; i < productVariants.length; i++) {

    const variant = productVariants[i];

    if (!variant.file) continue;

    const file = variant.file;

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "-");

    const filePath =
      "variants/" +
      Date.now() +
      "-" +
      i +
      "-" +
      safeFileName;

    formMessage.textContent =
      "Uploading photograph for " +
      (variant.name || "variation " + (i + 1)) +
      "...";

    const { data, error } = await supabaseClient
      .storage
      .from("product-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new Error(
        "Variation image upload failed: " + error.message
      );
    }

    const { data: publicData } = supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(data.path);

    variant.image = publicData.publicUrl;

    variant.file = null;
  }

  renderVariantEditor();
}


/* =========================================
   18B. VALIDATE VARIATIONS
========================================= */

function validateVariants() {

  for (let i = 0; i < productVariants.length; i++) {

    const variant = productVariants[i];

    if (!variant.name.trim()) {

      throw new Error(
        "Please enter a name for variation " + (i + 1) + "."
      );

    }

    if (
      variant.price === "" ||
      !Number.isFinite(Number(variant.price)) ||
      Number(variant.price) < 0
    ) {

      throw new Error(
        "Please enter a valid price for variation: " +
        variant.name
      );

    }

  }

}


/* =========================================
   19. PREPARE PRODUCT DATA
========================================= */

function prepareProduct() {
  const price = Number(getValue("price"));

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Please enter a valid product price.");
  }

  syncGalleryField();

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

    gallery: galleryItems.map(function(item) {
      return item.url;
    }),

    /* SAVE PRODUCT VARIATIONS */

    variants: getVariantDatabaseData(),

    tag: getValue("tag"),

    featured:
      document.getElementById("featured").checked
  };
}


/* =========================================
   20. SAVE PRODUCT
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


    /* VALIDATE VARIATIONS */

    validateVariants();


    /* UPLOAD MAIN IMAGE */

    if (selectedMainImage) {
      formMessage.textContent = "Uploading main image...";
      await uploadMainProductImage();
    }


    /* UPLOAD GALLERY IMAGES */

    if (galleryItems.some(item => item.type === "file")) {
      await uploadGalleryImages();
    }


    /* UPLOAD VARIATION IMAGES */

    await uploadVariantImages();


    /* PREPARE PRODUCT DATA */

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
    hasUnsavedImageChanges = false;

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

    dirty =
      getFormSnapshot() !== initialFormSnapshot ||
      hasUnsavedImageChanges;

    scheduleDraftSave();
  }
}


/* =========================================
   SAVE BUTTON EVENT LISTENER
========================================= */

alert("SAVE BUTTON LISTENER IS BEING ATTACHED");

productForm.addEventListener("submit", function(event) {
  event.preventDefault();
  saveProduct();
});


/* =========================================
   21. UNSAVED CHANGES PROTECTION
========================================= */

function openConfirmation() {
  confirmOverlay.classList.add("active");
}


function closeConfirmation() {
  confirmOverlay.classList.remove("active");
}


document.getElementById("continue-editing")
  .addEventListener("click", function() {
    pendingDestination = null;
    closeConfirmation();
  });


document.getElementById("discard-before-leaving")
  .addEventListener("click", async function() {
    const destination = pendingDestination;

    closeConfirmation();

    dirty = false;
    hasUnsavedImageChanges = false;

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


document.querySelectorAll("a[href]").forEach(function(link) {
  link.addEventListener("click", function(event) {
    if (!dirty || saving) return;

    const destination = link.href;

    if (destination === window.location.href) return;

    event.preventDefault();

    pendingDestination = destination;

    openConfirmation();
  });
});


window.addEventListener("beforeunload", function(event) {
  if (!dirty || saving) return;

  event.preventDefault();
  event.returnValue = "";
});


/* =========================================
   22. FORM CHANGE TRACKING
========================================= */

productForm.addEventListener("input", markAsChanged);
productForm.addEventListener("change", markAsChanged);


/* =========================================
   23. CLEAN UP IMAGE PREVIEWS
========================================= */

window.addEventListener("pagehide", function() {
  clearMainPreviewUrls();
  clearGalleryPreviewUrls();
  clearVariantPreviewUrls();

  viewerUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  viewerUrls = [];
});


function clearVariantPreviewUrls() {
  variantPreviewUrls.forEach(function(url) {
    URL.revokeObjectURL(url);
  });

  variantPreviewUrls = [];
}


/* =========================================
   24. START PAGE
========================================= */

async function startProductPage() {
  const authorised = await verifyAdmin();

  if (!authorised) return;

  try {

    /* CREATE VARIATION EDITOR */

    createVariantEditor();


    if (editId) {

      await loadProductForEditing();

    } else {

      initialiseGalleryFromField();

      productVariants = [];

      renderVariantEditor();

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


/* =========================================
   25. PRODUCT INFORMATION ASSISTANT
   FREE PRODUCT RESEARCH HELPER
========================================= */

const findProductButton = document.getElementById(
  "find-product-information"
);

const organiseProductButton = document.getElementById(
  "organise-product-information"
);

const assistantMessage = document.getElementById(
  "assistant-message"
);


/* =========================================
   26. FIND PRODUCT INFORMATION
========================================= */

if (findProductButton) {

  findProductButton.addEventListener("click", function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();

    const brand = document.getElementById("brand").value.trim();

    const sourceLink = document.getElementById(
      "product-source-link"
    ).value.trim();


    if (!name) {

      assistantMessage.textContent =
        "Please enter the product name first.";

      return;
    }


    let searchUrl;


    if (sourceLink) {

      try {

        const url = new URL(sourceLink);

        if (!["https:", "http:"].includes(url.protocol)) {
          throw new Error("Invalid website");
        }

        searchUrl = url.href;

      } catch (error) {

        assistantMessage.textContent =
          "Please enter a valid website link.";

        return;
      }

    } else {

      const searchText = encodeURIComponent(
        brand + " " + name +
        " official product ingredients how to use"
      );

      searchUrl =
        "https://www.google.com/search?q=" + searchText;

    }


    const searchWindow = window.open(
      searchUrl,
      "_blank"
    );


    if (searchWindow) {

      searchWindow.opener = null;

      assistantMessage.textContent =
        "Product search opened. Find the manufacturer's information and paste it into the box below.";

    } else {

      assistantMessage.textContent =
        "Your browser blocked the new tab. Please allow pop-ups for this website and try again.";

    }

  });

}


/* =========================================
   27. ORGANISE PRODUCT INFORMATION
========================================= */

if (organiseProductButton) {

  organiseProductButton.addEventListener("click", function(event) {

    event.preventDefault();

    const sourceText = document.getElementById(
      "product-source-text"
    ).value.trim();


    if (!sourceText) {

      assistantMessage.textContent =
        "Please paste product information first.";

      return;
    }


    function extractSection(labels, text) {

      const labelPattern = labels.join("|");

      const nextHeading =
        "Description|Product Description|Benefits|Key Benefits|Key Ingredients|Ingredients|Full Ingredients|INCI|How to Use|Directions|Usage Instructions";

      const regex = new RegExp(
        "(?:^|\\n)\\s*(?:" +
        labelPattern +
        ")\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:" +
        nextHeading +
        ")\\s*:|$)",
        "i"
      );

      const match = text.match(regex);

      return match ? match[1].trim() : "";
    }


    function fillField(id, value) {

      if (!value) return false;

      const field = document.getElementById(id);

      if (!field) return false;

      field.value = value;

      field.dispatchEvent(
        new Event("input", { bubbles: true })
      );

      field.dispatchEvent(
        new Event("change", { bubbles: true })
      );

      return true;
    }


    const description = extractSection(
      ["Description", "Product Description"],
      sourceText
    );

    const benefits = extractSection(
      ["Benefits", "Key Benefits"],
      sourceText
    );

    const keyIngredients = extractSection(
      ["Key Ingredients"],
      sourceText
    );

    const fullIngredients = extractSection(
      ["Full Ingredients", "Ingredients", "INCI"],
      sourceText
    );

    const howToUse = extractSection(
      ["How to Use", "Directions", "Usage Instructions"],
      sourceText
    );


    let filledCount = 0;

    if (fillField("description", description)) {
      filledCount++;
    }

    if (fillField("benefits", benefits)) {
      filledCount++;
    }

    if (fillField("ingredients", keyIngredients)) {
      filledCount++;
    }

    if (fillField("fullIngredients", fullIngredients)) {
      filledCount++;
    }

    if (fillField("howToUseSteps", howToUse)) {
      filledCount++;
    }


    if (filledCount > 0) {

      assistantMessage.textContent =
        filledCount +
        " section(s) organised successfully. Please review the information before saving.";

    } else {

      assistantMessage.textContent =
        "No recognised sections found. Please use headings such as Description:, Benefits:, Key Ingredients:, Full Ingredients: and How to Use:.";

    }

  });

}
