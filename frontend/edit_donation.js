document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.getElementById('edit-donation-form');
  const messageContainer = document.getElementById('message-container');

  const params = new URLSearchParams(window.location.search);
  const donationId = params.get('id');
  const token = localStorage.getItem('authToken');

  if (!token || !donationId) {
    alert('Invalid request. You must be logged in and specify a donation to edit.');
    window.location.href = 'profile.html';
    return;
  }

  // --- 1. Load existing donation data into the form ---
  async function loadDonationData() {
    try {
      const response = await fetch(`http://localhost:5000/api/donations/${donationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load donation data.');

      const donation = await response.json();
      
      // Pre-fill the form
      document.getElementById('foodName').value = donation.foodName;
      document.getElementById('quantity').value = donation.quantity;
      document.getElementById('quality').value = donation.quality;
      document.getElementById('type').value = donation.type;
      document.getElementById('expiry').valueAsDate = new Date(donation.expiry);
      document.getElementById('notes').value = donation.notes || '';

    } catch (error) {
      console.error('Error loading donation:', error);
      showMessage('Could not load donation data. Please try again.', 'danger');
      editForm.style.display = 'none';
    }
  }

  // --- 2. Handle form submission to update the donation ---
  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const updatedData = {
      foodName: document.getElementById('foodName').value,
      quantity: document.getElementById('quantity').value,
      quality: document.getElementById('quality').value,
      type: document.getElementById('type').value,
      expiry: document.getElementById('expiry').value,
      notes: document.getElementById('notes').value,
    };

    try {
      const response = await fetch(`http://localhost:5000/api/donations/${donationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Donation updated successfully! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'profile.html', 1500);
      } else {
        showMessage(data.message || 'Failed to update donation.', 'danger');
      }
    } catch (error) {
      console.error('Error updating donation:', error);
      showMessage('An error occurred while updating.', 'danger');
    }
  });

  function showMessage(message, type) {
    messageContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  }

  // Initial load of data
  loadDonationData();
});