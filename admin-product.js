
/* =========================================
   CURATED WITH CARE BY M.
   INDIVIDUAL PRODUCT CREATION
========================================= */


// 1. HELPER: READ FORM VALUES

function getValue(id) {
  return document.getElementById(id).value.trim();
}


// 2. HELPER: CONVERT COMMA-SEPARATED TEXT INTO ARRAYS

function getList(id) {
  return getValue(id)
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}


// 3. HELPER: CONVERT LINE-BY-LINE TEXT INTO ARRAYS

function getLines(id) {
  return getValue(id)
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}


// 4. CHECK ADMINISTRATOR ACCESS

async function verifyAdmin() {
  const { data, error } =
    await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "admin.html";
    return false;
  }

  if (data.user.app_metadata?.role !== "admin") {
    await supabaseClient.auth.signOut();
    window.location.href = "admin.html";
    return false;
  }

  return true;
}


// 5. SAVE PRODUCT

const productForm = document.getElementById("product-form");
const saveButton = document.getElementById("save-product");
const formMessage = document.getElementById("form-message");

productForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  saveButton.disabled = true;
  formMessage.textContent = "Saving product...";

  try {

    const authorised = await verifyAdmin();

    if (!authorised) return;

    const price = Number(getValue("price"));

    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Please enter a valid product price.");
    }

    // Prepare product information.

    const newProduct = {

      name: getValue("name"),

      brand: getValue("brand"),

      brandName: getValue("brandName") || getValue("brand"),

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

      ingredients: getList("ingredients"),

      fullIngredients: getValue("fullIngredients"),

      howToUseSteps: getLines("howToUseSteps"),

      image: getValue("image"),

      gallery: getLines("gallery"),

      tag: getValue("tag"),

      featured: document.getElementById("featured").checked,

      is_active: true
    };


    // Insert product into Supabase.

    const { data, error } = await supabaseClient
      .from("products")
      .insert([newProduct])
      .select()
      .single();

    if (error) {
      throw error;
    }

    formMessage.textContent =
      "Product saved successfully! Product ID: " + data.id;

    productForm.reset();

    // Return to dashboard after a short pause.

    setTimeout(function() {
      window.location.href = "admin-dashboard.html";
    }, 1800);

  } catch (error) {

    console.error("Product saving error:", error);

    formMessage.textContent =
      error.message || "Something went wrong while saving.";

    saveButton.disabled = false;
  }

});


// 6. START PAGE

verifyAdmin();
