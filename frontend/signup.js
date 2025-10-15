document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const messageContainer = document.getElementById('message-container');

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Clear previous messages
    messageContainer.innerHTML = '';

    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const role = document.getElementById('role').value;

    if (!role) {
      showMessage('Please select whether you want to donate or receive food.', 'danger');
      return;
    }

    const userData = { firstName, lastName, username, email, password, role };
    if (dob) userData.dob = dob;
    if (gender) userData.gender = gender;

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Signup successful! Redirecting to login...', 'success');
        
        // Redirect to the login page after a short delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);

      } else {
        // Signup failed, show error message from the server
        showMessage(data.message || 'Signup failed. Please try again.', 'danger');
      }
    } catch (error) {
      // Network or other unexpected errors
      console.error('Signup error:', error);
      showMessage('Something went wrong. Please try again later.', 'danger');
    }
  });

  function showMessage(message, type) {
    messageContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  }
});