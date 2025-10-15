document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const messageBox = document.getElementById('loginMessage');

  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.classList.remove('d-none', 'alert-danger', 'alert-success');
    messageBox.classList.add(type === 'success' ? 'alert-success' : 'alert-danger');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageBox.classList.add('d-none');

    const usernameOrEmail = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password })
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || 'Login failed. Please try again.', 'danger');
        return;
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      showMessage('Login successful! Redirecting…', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } catch (err) {
      showMessage('Network error. Please try again.', 'danger');
      // eslint-disable-next-line no-console
      console.error('Login error', err);
    }
  });
});


