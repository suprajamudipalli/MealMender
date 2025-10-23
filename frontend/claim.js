document.addEventListener('DOMContentLoaded', () => {
  const claimForm = document.getElementById('claim-form');
  const messageContainer = document.getElementById('message-container');
  const donationDetailsDiv = document.getElementById('donation-details');

  // --- 1. Get Donation ID and Token ---
  const params = new URLSearchParams(window.location.search);
  const donationId = params.get('donationId');
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('You must be logged in to claim a donation.');
    window.location.href = 'login.html';
    return;
  }

  if (!donationId) {
    donationDetailsDiv.innerHTML = '<div class="alert alert-danger">Error: No donation specified.</div>';
    claimForm.style.display = 'none';
    return;
  }

  // --- Load and display donation details ---
  async function loadDonationDetails() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/donations/${donationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Donation not found or you do not have permission to view it.');
      }

      const donation = await response.json();
      renderDonationDetails(donation);

    } catch (error) {
      donationDetailsDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
      claimForm.style.display = 'none';
    }
  }

  function renderDonationDetails(donation) {
    const expiryDate = new Date(donation.expiry).toLocaleDateString();
    donationDetailsDiv.innerHTML = `
      <h5 class="text-success">${donation.foodName}</h5>
      <ul class="list-unstyled text-start">
        <li><strong>Quantity:</strong> ${donation.quantity}</li>
        <li><strong>Quality:</strong> ${donation.quality}</li>
        <li><strong>Type:</strong> ${donation.type}</li>
        <li><strong>Best Before:</strong> ${expiryDate}</li>
        <li><strong>Pickup Address:</strong> ${donation.pickupLocation.address}</li>
        ${donation.notes ? `<li><strong>Notes:</strong> ${donation.notes}</li>` : ''}
      </ul>
    `;
  }

  // --- 2. Handle Form Submission ---
  claimForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/requests/claim/${donationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Request sent successfully! You will be notified when the donor responds.', 'success');
        claimForm.style.display = 'none'; // Hide form after success
        setTimeout(() => window.location.href = 'receiver_improved.html', 3000);
      } else {
        showMessage(data.message || 'Failed to send request.', 'danger');
      }
    } catch (error) {
      console.error('Claim error:', error);
      showMessage('An error occurred. Please try again later.', 'danger');
    }
  });

  function showMessage(message, type) {
    messageContainer.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  }

  // Initial load
  loadDonationDetails();
});