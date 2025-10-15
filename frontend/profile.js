document.addEventListener('DOMContentLoaded', () => {
  const profileCard = document.getElementById('profile-card');
  const loadingSpinner = document.getElementById('loading-spinner');
  const logoutButton = document.getElementById('logout-button');

  // --- 1. Get the token from localStorage ---
  // We saved it as 'authToken' in the login script.
  const token = localStorage.getItem('authToken');

  if (!token) {
    // If no token, redirect to login page immediately
    alert('You are not logged in. Please log in to view your profile.');
    window.location.href = 'login.html';
    return;
  }

  // --- 2. Fetch profile data from the protected backend route ---
  fetch(`${window.API_BASE_URL}/api/profile/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // --- 3. Include the token in the Authorization header ---
      'Authorization': `Bearer ${token}`,
    },
  })
  .then(response => {
    if (response.status === 401) {
      // Unauthorized (e.g., token is invalid or expired)
      localStorage.removeItem('authToken'); // Clear the bad token
      alert('Your session has expired. Please log in again.');
      window.location.href = 'login.html';
      return Promise.reject('Unauthorized');
    }
    if (!response.ok) {
      throw new Error('Failed to fetch profile data.');
    }
    return response.json();
  })
  .then(user => {
    // --- 4. Populate the profile page with user data ---
    const fullName = `${user.firstName} ${user.lastName}`;
    document.getElementById('name').textContent = fullName;
    document.getElementById('username').textContent = `@${user.username}`;
    document.getElementById('email').textContent = user.email || 'Not provided';
    document.getElementById('phone').textContent = user.phone || 'Not provided';
    document.getElementById('address').textContent = user.address || 'Not provided';
    document.getElementById('joined').textContent = new Date(user.createdAt).toLocaleDateString();
    
    // Update avatar with user's initials
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=140&background=2E7D32&color=fff&bold=true&rounded=true`;
    document.getElementById('profile-pic').src = avatarUrl;

    // Hide spinner and show profile card
    loadingSpinner.classList.add('d-none');
    profileCard.classList.remove('d-none');

    // --- Load user's donations ---
    loadMyDonations(token);
  })
  .catch(error => {
    if (error !== 'Unauthorized') {
      console.error('Error loading profile:', error);
    }
  });

  async function loadMyDonations(token) {
    const donationsContainer = document.getElementById('my-donations-container');
    const donationsSpinner = document.getElementById('donations-loading-spinner');
    const statsRow = document.getElementById('stats-row');

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/donations/my-donations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch donations.');

      const donations = await response.json();
      donationsSpinner.classList.add('d-none');

      // Calculate and display stats
      const totalDonations = donations.length;
      const completedDonations = donations.filter(d => d.status === 'delivered').length;
      const activeDonations = donations.filter(d => d.status === 'available').length;
      
      document.getElementById('total-donations').textContent = totalDonations;
      document.getElementById('completed-donations').textContent = completedDonations;
      document.getElementById('active-donations').textContent = activeDonations;
      statsRow.classList.remove('d-none');

      if (donations.length === 0) {
        donationsContainer.innerHTML = `
          <div class="text-center py-5">
            <i class="fas fa-box-open fa-4x text-muted mb-3" style="opacity: 0.3;"></i>
            <h4 class="text-muted">No Donations Yet</h4>
            <p class="text-muted">Start making a difference by donating food to those in need.</p>
            <a href="donation.html" class="btn btn-success mt-3">
              <i class="fas fa-plus me-2"></i>Create Your First Donation
            </a>
          </div>
        `;
        return;
      }

      donationsContainer.innerHTML = ''; // Clear spinner
      donations.forEach(donation => {
        donationsContainer.insertAdjacentHTML('beforeend', createDonationItem(donation));
      });

      // Add event listener for delete buttons
      donationsContainer.addEventListener('click', handleDonationAction);
      
      // Start countdown timers for expiring donations
      startExpiryCountdowns();

    } catch (error) {
      console.error('Error loading donations:', error);
      donationsContainer.innerHTML = '<p class="text-center text-danger">Could not load your donations.</p>';
    }
  }

  function getStatusBadge(status) {
    const statusMap = { 'available': 'success', 'claimed': 'info', 'delivered': 'primary' };
    const badgeClass = statusMap[status] || 'secondary';
    return `<span class="badge bg-${badgeClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
  }

  function createDonationItem(donation) {
    const donatedDate = new Date(donation.createdAt).toLocaleDateString();
    const canBeModified = donation.status === 'available';
    const expiryDate = new Date(donation.expiry);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
    
    // Determine expiry urgency
    let expiryBadge = '';
    if (donation.status === 'available') {
      if (hoursUntilExpiry < 0) {
        expiryBadge = `<span class="expiry-badge urgent"><i class="fas fa-exclamation-triangle"></i> Expired</span>`;
      } else if (hoursUntilExpiry <= 2) {
        expiryBadge = `<span class="expiry-badge urgent" data-expiry="${donation.expiry}" data-donation-id="${donation._id}"><i class="fas fa-clock"></i> <span class="countdown-timer">Expires soon!</span></span>`;
      } else if (hoursUntilExpiry <= 5) {
        expiryBadge = `<span class="expiry-badge warning" data-expiry="${donation.expiry}"><i class="fas fa-hourglass-half"></i> <span class="countdown-timer">${Math.floor(hoursUntilExpiry)}h left</span></span>`;
      } else {
        expiryBadge = `<span class="expiry-badge safe" data-expiry="${donation.expiry}"><i class="fas fa-check-circle"></i> <span class="countdown-timer">${Math.floor(hoursUntilExpiry)}h left</span></span>`;
      }
    }

    return `
      <div class="donation-card">
        <div class="donation-card-header">
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h5 class="mb-1" style="font-family: 'Playfair Display', serif; font-weight: 700; color: #1B5E20;">
                <i class="fas fa-utensils me-2" style="color: #2E7D32;"></i>${donation.foodName}
              </h5>
              <div class="d-flex gap-3 mt-2 flex-wrap">
                <span style="font-size: 0.9rem; color: #689F38;">
                  <i class="fas fa-weight me-1"></i><strong>Quantity:</strong> ${donation.quantity}
                </span>
                <span style="font-size: 0.9rem; color: #689F38;">
                  <i class="fas fa-star me-1"></i><strong>Quality:</strong> ${donation.quality}
                </span>
                <span style="font-size: 0.9rem; color: #689F38;">
                  <i class="fas fa-tag me-1"></i><strong>Type:</strong> ${donation.type}
                </span>
              </div>
            </div>
            <div class="text-end">
              ${getStatusBadge(donation.status)}
            </div>
          </div>
        </div>
        <div class="donation-card-body">
          ${expiryBadge ? `<div class="mb-3">${expiryBadge}</div>` : ''}
          ${donation.notes ? `<p class="mb-3" style="color: #5A6C7D;"><i class="fas fa-comment-alt me-2"></i>${donation.notes}</p>` : ''}
          <p class="mb-3" style="font-size: 0.875rem; color: #9E9E9E;">
            <i class="fas fa-calendar me-2"></i>Posted on ${donatedDate}
          </p>
          <div class="d-flex gap-2 flex-wrap">
            ${canBeModified ? `
              <a href="edit_donation.html?id=${donation._id}" class="btn btn-sm btn-primary">
                <i class="fas fa-edit me-1"></i>Edit
              </a>
              <button class="btn btn-sm btn-danger delete-btn" data-donation-id="${donation._id}">
                <i class="fas fa-trash me-1"></i>Delete
              </button>
            ` : `
              <a href="notifications.html" class="btn btn-sm btn-info">
                <i class="fas fa-bell me-1"></i>View Requests
              </a>
            `}
            ${donation.pickupLocation && donation.pickupLocation.address ? `
              <button class="btn btn-sm btn-outline-secondary" onclick="alert('Pickup: ${donation.pickupLocation.address}')">
                <i class="fas fa-map-marker-alt me-1"></i>Location
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  async function handleDonationAction(event) {
    if (!event.target.classList.contains('delete-btn')) return;

    const donationId = event.target.dataset.donationId;
    if (!confirm('Are you sure you want to delete this donation? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/donations/${donationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        loadMyDonations(token); // Refresh the list
      } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('An error occurred while deleting the donation.');
    }
  }

  // --- 5. Countdown timer for expiring donations ---
  function startExpiryCountdowns() {
    setInterval(() => {
      document.querySelectorAll('.countdown-timer').forEach(timer => {
        const badge = timer.closest('.expiry-badge');
        if (!badge) return;
        
        const expiryDate = new Date(badge.dataset.expiry);
        const now = new Date();
        const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
        const minutesUntilExpiry = (expiryDate - now) / (1000 * 60);
        
        if (hoursUntilExpiry < 0) {
          timer.textContent = 'Expired';
          badge.className = 'expiry-badge urgent';
        } else if (hoursUntilExpiry < 1) {
          timer.textContent = `${Math.floor(minutesUntilExpiry)}m left`;
          badge.className = 'expiry-badge urgent';
        } else if (hoursUntilExpiry <= 2) {
          timer.textContent = `${Math.floor(hoursUntilExpiry)}h ${Math.floor(minutesUntilExpiry % 60)}m left`;
          badge.className = 'expiry-badge urgent';
        } else if (hoursUntilExpiry <= 5) {
          timer.textContent = `${Math.floor(hoursUntilExpiry)}h left`;
          badge.className = 'expiry-badge warning';
        } else {
          timer.textContent = `${Math.floor(hoursUntilExpiry)}h left`;
          badge.className = 'expiry-badge safe';
        }
      });
    }, 60000); // Update every minute
  }

  // --- 6. Logout functionality ---
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  });
});