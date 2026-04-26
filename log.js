function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;
  const btn = document.getElementById("login-btn");
  const btnText = document.getElementById("btn-text");
  const loader = document.getElementById("btn-loader");

  if (!email || !password) {
    alert("Please enter both email and password");
    return;
  }

  // Show Loading State
  btn.disabled = true;
  btnText.style.display = "none";
  loader.style.display = "block";

  // Connect directly to the backend running node server.js
  const baseUrl = window.location.origin;

  fetch(baseUrl + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role })
  })
    .then(async r => {
      const isJson = r.headers.get("content-type")?.includes("application/json");
      const d = isJson ? await r.json() : null;

      if (r.ok && d && d.success) {
        localStorage.setItem("token", d.token);
        localStorage.setItem("email", email.toLowerCase());
        localStorage.setItem("role", role);
        localStorage.setItem("name", d.name);
        
        alert("Login successful! ✅");
        window.location = role === "doctor" ? "docdash.html" : "patientdash.html";
      } else {
        const msg = d ? d.message : "Server error (Status: " + r.status + ")";
        alert("Login failed: " + msg);
        // Reset button
        btn.disabled = false;
        btnText.style.display = "block";
        loader.style.display = "none";
      }
    })
    .catch(err => {
      console.error("Login Error:", err);
      alert("Could not connect to the server. Please check the backend server and network connectivity. ❌");
      // Reset button
      btn.disabled = false;
      btnText.style.display = "block";
      loader.style.display = "none";
    });
}
