document.addEventListener('DOMContentLoaded', () => {
  // Create a placeholder for the navbar and prepend it to the body
  const navbarPlaceholder = document.createElement('div');
  navbarPlaceholder.id = 'navbar-placeholder';
  document.body.prepend(navbarPlaceholder);

  const token = localStorage.getItem('authToken');
  const currentPath = window.location.pathname.split('/').pop();

  async function renderNavbar() {
    let navLinks = '';
    let isAdmin = false;

    if (token) {
      try {
        const response = await fetch(`${window.API_BASE_URL}/api/profile/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const user = await response.json();
          isAdmin = user.role === 'admin';
          // Personalize brand when logged in
          const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
          if (name) {
            document.title = `MealMender · ${name}`;
          }
        }
      } catch (error) {
        console.error('Could not fetch user profile for navbar', error);
      }

      // Links for logged-in users
      navLinks = `
        <li class="nav-item">
          <a class="nav-link ${currentPath === 'dashboard.html' ? 'active' : ''}" href="dashboard.html">
            <i class="fas fa-home"></i> Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${currentPath === 'receiver_improved.html' || currentPath === 'receiver.html' ? 'active' : ''}" href="receiver_improved.html">Find Food</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${currentPath === 'donation.html' ? 'active' : ''}" href="donation.html">Donate</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${currentPath === 'profile.html' ? 'active' : ''}" href="profile.html">Profile</a>
        </li>
        ${isAdmin ? `
          <li class="nav-item">
            <a class="nav-link ${currentPath === 'admin.html' ? 'active' : ''}" href="admin.html">Admin</a>
          </li>
        ` : ''}
        <li class="nav-item">
          <a id="logout-link" class="nav-link" href="#" style="cursor: pointer;">Logout</a>
        </li>
      `;
    } else {
      // Links for logged-out users
      navLinks = `
        <li class="nav-item">
          <a class="nav-link ${currentPath === 'login.html' ? 'active' : ''}" href="login.html">Login</a>
        </li>
        <li class="nav-item">
          <a class="nav-link btn btn-success text-white px-3" href="signup.html">Sign Up</a>
        </li>
      `;
    }

    const navbarHTML = `
      <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
        <div class="container">
          <a class="navbar-brand fw-bold text-success" href="index.html">🍱 MealMender</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#main-nav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="main-nav">
            <ul class="navbar-nav ms-auto">
              ${navLinks}
            </ul>
          </div>
        </div>
      </nav>
    `;

    navbarPlaceholder.innerHTML = navbarHTML;

    // Add logout functionality if the link exists
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        window.location.href = 'login.html';
      });
    }
  }

  renderNavbar();
});