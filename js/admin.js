
/* =========================================
   CURATED WITH CARE BY M.
   ADMIN LOGIN
========================================= */

const loginForm = document.getElementById("admin-login-form");
const loginMessage = document.getElementById("login-message");
const loginButton = document.getElementById("login-button");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document
    .getElementById("admin-email")
    .value
    .trim();

  const password = document
    .getElementById("admin-password")
    .value;

  loginMessage.textContent = "Signing in...";
  loginButton.disabled = true;

  try {
    // Sign in using Supabase Authentication.
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      throw error;
    }

    // Check the authenticated user's protected metadata.
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError) {
      throw userError;
    }

    const user = userData.user;

    // Only accounts with the admin role can continue.
    if (user.app_metadata?.role !== "admin") {
      await supabaseClient.auth.signOut();

      throw new Error(
        "This account does not have administrator access."
      );
    }

    loginMessage.textContent = "Login successful. Opening dashboard...";

    // Open the administration dashboard.
    window.location.href = "admin-dashboard.html";

  } catch (error) {
    console.error("Admin login error:", error);

    loginMessage.textContent =
      error.message || "Unable to sign in. Please try again.";

    loginButton.disabled = false;
  }
});
