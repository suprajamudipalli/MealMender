document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    // Hide previous error messages
    loginMessage.classList.add('d-none');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful: Store token and user ID
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userId', data._id);
        
        // Redirect to the profile page
        window.location.href = 'profile.html';
      } else {
        showError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      showError('Something went wrong. Please try again later.');
    }
  });

  function showError(message) {
    loginMessage.textContent = message;
    loginMessage.classList.remove('d-none');
  }
});