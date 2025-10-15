document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.getElementById('edit-profile-form');
  const messageContainer = document.getElementById('message-container');
  
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const addressInput = document.getElementById('address');

  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('You must be logged in to edit your profile.');
    window.location.href = 'login.html';
    return;
  }

  // --- 1. Load existing profile data into the form ---
  async function loadProfileData() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile data.');
      }

      const user = await response.json();
      
      // Pre-fill the form
      firstNameInput.value = user.firstName || '';
      lastNameInput.value = user.lastName || '';
      emailInput.value = user.email || '';
      phoneInput.value = user.phone || '';
      addressInput.value = user.address || '';

    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('Could not load your profile data. Please try again.', 'danger');
    }
  }

  // --- 2. Handle form submission to update the profile ---
  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const updatedData = {
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      address: addressInput.value.trim(),
    };

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Profile updated successfully! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'profile.html', 1500);
      } else {
        showMessage(data.message || 'Failed to update profile.', 'danger');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('An error occurred while updating. Please try again.', 'danger');
    }
  });

  function showMessage(message, type) {
    messageContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  }

  // Initial load of data
  loadProfileData();
});