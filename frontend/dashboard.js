document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('authToken');
  const loadingOverlay = document.getElementById('loading-overlay');
  
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Fetch user profile
    const response = await fetch(`${window.API_BASE_URL}/api/profile/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      localStorage.removeItem('authToken');
      window.location.href = 'login.html';
      return;
    }

    const user = await response.json();
    
    // Store user role for later use
    localStorage.setItem('userRole', user.role);
    
    // Update welcome message
    document.getElementById('welcome-message').textContent = 
      `Welcome back, ${user.firstName}! 👋`;
    
    // Load role-specific dashboard
    if (user.role === 'recipient' || user.role === 'user') {
      await loadRecipientDashboard(user, token);
    } else if (user.role === 'donor') {
      await loadDonorDashboard(user, token);
    } else if (user.role === 'admin') {
      await loadAdminDashboard(user, token);
    } else {
      // Default dashboard for new users
      await loadDefaultDashboard(user, token);
    }

    // Hide loading overlay
    loadingOverlay.style.display = 'none';

  } catch (error) {
    console.error('Dashboard error:', error);
    loadingOverlay.style.display = 'none';
    
    // Show error message in the dashboard instead of alert
    document.getElementById('welcome-message').textContent = 'Error Loading Dashboard';
    document.getElementById('hero-subtitle').textContent = 'Please check your connection and try again';
    document.getElementById('stats-section').innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Failed to load dashboard</h4>
          <p>Error: ${error.message}</p>
          <hr>
          <p class="mb-0">Please check the browser console (F12) for more details, or <a href="login.html" class="alert-link">try logging in again</a>.</p>
        </div>
      </div>
    `;
  }
});

// ============= RECIPIENT DASHBOARD =============
async function loadRecipientDashboard(user, token) {
  document.getElementById('hero-subtitle').textContent = 
    'Find fresh meals and help reduce food waste';

  let availableDonations = [];
  let myRequests = [];

  try {
    // Fetch available donations count
    const donationsResponse = await fetch(`${window.API_BASE_URL}/api/donations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (donationsResponse.ok) {
      const donationsData = await donationsResponse.json();
      // Handle both array and object with donations property
      availableDonations = Array.isArray(donationsData) ? donationsData : (donationsData.donations || []);
      availableDonations = availableDonations.filter(d => d.status === 'available');
    }
  } catch (error) {
    console.error('Error fetching donations:', error);
  }

  try {
    // Fetch user's requests
    const requestsResponse = await fetch(`${window.API_BASE_URL}/api/requests/my-requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (requestsResponse.ok) {
      myRequests = await requestsResponse.json();
      if (!Array.isArray(myRequests)) myRequests = [];
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
  }

  // Display stats
  const statsSection = document.getElementById('stats-section');
  statsSection.innerHTML = `
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-green">
          <i class="fas fa-utensils"></i>
        </div>
        <h3 class="mb-0">${availableDonations.length}</h3>
        <p class="text-muted mb-0">Available Meals</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-blue">
          <i class="fas fa-hand-holding-heart"></i>
        </div>
        <h3 class="mb-0">${myRequests.length}</h3>
        <p class="text-muted mb-0">Your Requests</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-orange">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3 class="mb-0">${myRequests.filter(r => r.status?.toLowerCase() === 'approved').length}</h3>
        <p class="text-muted mb-0">Approved</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-purple">
          <i class="fas fa-leaf"></i>
        </div>
        <h3 class="mb-0">${myRequests.filter(r => r.status?.toLowerCase() === 'approved').length * 2}</h3>
        <p class="text-muted mb-0">Meals Saved</p>
      </div>
    </div>
  `;

  // Impact display
  const approvedCount = myRequests.filter(r => r.status?.toLowerCase() === 'approved').length;
  document.getElementById('impact-display').innerHTML = `
    <div class="impact-badge">
      🌍 You've helped save ${approvedCount * 2} meals from waste!
    </div>
  `;

  // Quick actions
  const actionsSection = document.getElementById('actions-section');
  actionsSection.innerHTML = `
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='receiver_improved.html'">
        <i class="fas fa-search"></i>
        <h3>Browse Available Food</h3>
        <p class="text-muted">Discover fresh meals and groceries available near you</p>
        <button class="btn btn-primary-custom mt-2">Explore Now</button>
      </div>
    </div>
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='my_requests.html'">
        <i class="fas fa-list-check"></i>
        <h3>My Requests</h3>
        <p class="text-muted">Track your food requests and pickup status</p>
        <button class="btn btn-primary-custom mt-2">View Requests</button>
      </div>
    </div>
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='profile.html'">
        <i class="fas fa-user-circle"></i>
        <h3>My Profile</h3>
        <p class="text-muted">Update your information and preferences</p>
        <button class="btn btn-primary-custom mt-2">Edit Profile</button>
      </div>
    </div>
  `;

  // Show notifications & requests section
  showRecipientNotifications(myRequests);
}

// ============= DONOR DASHBOARD =============
async function loadDonorDashboard(user, token) {
  document.getElementById('hero-subtitle').textContent = 
    'Share your surplus and make an impact';

  let myDonations = [];
  let requests = [];

  try {
    // Fetch donor's donations
    const donationsResponse = await fetch(`${window.API_BASE_URL}/api/donations/my-donations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (donationsResponse.ok) {
      myDonations = await donationsResponse.json();
      if (!Array.isArray(myDonations)) myDonations = [];
    }
  } catch (error) {
    console.error('Error fetching donations:', error);
  }

  try {
    // Fetch requests for donor's donations
    const requestsResponse = await fetch(`${window.API_BASE_URL}/api/requests/for-me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (requestsResponse.ok) {
      requests = await requestsResponse.json();
      if (!Array.isArray(requests)) requests = [];
    }
  } catch (error) {
    console.error('Error fetching requests:', error);
  }

  // Display stats
  const statsSection = document.getElementById('stats-section');
  statsSection.innerHTML = `
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-green">
          <i class="fas fa-gift"></i>
        </div>
        <h3 class="mb-0">${myDonations.length}</h3>
        <p class="text-muted mb-0">Total Donations</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-blue">
          <i class="fas fa-clock"></i>
        </div>
        <h3 class="mb-0">${myDonations.filter(d => d.status === 'available').length}</h3>
        <p class="text-muted mb-0">Active Listings</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-orange">
          <i class="fas fa-users"></i>
        </div>
        <h3 class="mb-0">${requests.length}</h3>
        <p class="text-muted mb-0">People Helped</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-purple">
          <i class="fas fa-heart"></i>
        </div>
        <h3 class="mb-0">${myDonations.filter(d => d.status === 'delivered').length}</h3>
        <p class="text-muted mb-0">Completed</p>
      </div>
    </div>
  `;

  // Impact display
  document.getElementById('impact-display').innerHTML = `
    <div class="impact-badge">
      ❤️ You've helped ${requests.length} people and saved ${myDonations.length * 3} meals from waste!
    </div>
  `;

  // Quick actions
  const actionsSection = document.getElementById('actions-section');
  actionsSection.innerHTML = `
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='donation.html'">
        <i class="fas fa-plus-circle"></i>
        <h3>Donate Food</h3>
        <p class="text-muted">Share your surplus meals and make a difference</p>
        <button class="btn btn-primary-custom mt-2">Start Donating</button>
      </div>
    </div>
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='notifications.html'">
        <i class="fas fa-bell"></i>
        <h3>Requests & Notifications</h3>
        <p class="text-muted">Manage requests for your donations</p>
        <button class="btn btn-primary-custom mt-2">View Requests</button>
      </div>
    </div>
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='profile.html'">
        <i class="fas fa-chart-line"></i>
        <h3>My Impact</h3>
        <p class="text-muted">See your donation history and statistics</p>
        <button class="btn btn-primary-custom mt-2">View Details</button>
      </div>
    </div>
  `;

  // Show recent donations
  if (myDonations.length > 0) {
    showRecentDonations(myDonations.slice(0, 5));
  }

  // Show donor notifications
  showDonorNotifications(requests);
}

// ============= ADMIN DASHBOARD =============
async function loadAdminDashboard(user, token) {
  document.getElementById('hero-subtitle').textContent = 
    'Manage and monitor the platform';

  window.location.href = 'admin.html';
}

// ============= DEFAULT DASHBOARD (New Users) =============
async function loadDefaultDashboard(user, token) {
  document.getElementById('hero-subtitle').textContent = 
    'Choose how you want to make a difference';

  // Display role selection
  const statsSection = document.getElementById('stats-section');
  statsSection.innerHTML = `
    <div class="col-12 text-center">
      <h3 class="mb-4">How would you like to participate?</h3>
    </div>
  `;

  const actionsSection = document.getElementById('actions-section');
  actionsSection.innerHTML = `
    <div class="col-md-6">
      <div class="action-card" onclick="setUserRole('recipient')">
        <i class="fas fa-hand-holding-heart"></i>
        <h3>I Need Food</h3>
        <p class="text-muted">Browse and request available meals from generous donors</p>
        <button class="btn btn-primary-custom mt-2">Continue as Recipient</button>
      </div>
    </div>
    <div class="col-md-6">
      <div class="action-card" onclick="setUserRole('donor')">
        <i class="fas fa-gift"></i>
        <h3>I Want to Donate</h3>
        <p class="text-muted">Share your surplus food and help reduce waste</p>
        <button class="btn btn-primary-custom mt-2">Continue as Donor</button>
      </div>
    </div>
  `;
}

// ============= HELPER FUNCTIONS =============
function showRecentActivity(requests) {
  const activitySection = document.getElementById('recent-activity-section');
  const activityList = document.getElementById('activity-list');
  
  activitySection.classList.remove('d-none');
  
  activityList.innerHTML = requests.map(req => `
    <div class="activity-item">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${req.donation?.foodName || 'Food Item'}</strong>
          <p class="mb-0 text-muted small">
            Status: <span class="badge bg-${getStatusColor(req.status)}">${req.status}</span>
          </p>
        </div>
        <small class="text-muted">${new Date(req.createdAt).toLocaleDateString()}</small>
      </div>
    </div>
  `).join('');
}

function showRecentDonations(donations) {
  const activitySection = document.getElementById('recent-activity-section');
  const activityList = document.getElementById('activity-list');
  
  activitySection.classList.remove('d-none');
  
  activityList.innerHTML = donations.map(donation => `
    <div class="activity-item">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <strong>${donation.foodName}</strong>
          <p class="mb-0 text-muted small">
            Quantity: ${donation.quantity} | Status: <span class="badge bg-${getStatusColor(donation.status)}">${donation.status}</span>
          </p>
        </div>
        <small class="text-muted">${new Date(donation.createdAt).toLocaleDateString()}</small>
      </div>
    </div>
  `).join('');
}

function getStatusColor(status) {
  const statusLower = status?.toLowerCase() || '';
  const colors = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'available': 'success',
    'claimed': 'info',
    'delivered': 'primary',
    'completed': 'success'
  };
  return colors[statusLower] || 'secondary';
}

async function setUserRole(role) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/profile/update-role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role })
    });

    if (response.ok) {
      localStorage.setItem('userRole', role);
      window.location.reload();
    } else {
      alert('Failed to update role. Please try again.');
    }
  } catch (error) {
    console.error('Role update error:', error);
    alert('An error occurred. Please try again.');
  }
}

// ============= NOTIFICATION SECTIONS =============
function showRecipientNotifications(requests) {
  const notificationsSection = document.getElementById('notifications-section');
  if (!notificationsSection) return;

  notificationsSection.classList.remove('d-none');
  
  const recentRequests = requests.slice(0, 5);
  
  if (recentRequests.length === 0) {
    notificationsSection.innerHTML = `
      <div class="col-12">
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">No requests yet</h5>
            <p class="text-muted">Browse available food and make your first request!</p>
            <a href="receiver_improved.html" class="btn btn-success">Browse Food</a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  notificationsSection.innerHTML = `
    <div class="col-12">
      <div class="card shadow-sm">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0"><i class="fas fa-bell me-2"></i>Your Requests & Notifications</h5>
        </div>
        <div class="card-body">
          ${recentRequests.map(req => {
            const isApproved = req.status?.toLowerCase() === 'approved' || req.status?.toLowerCase() === 'in transit';
            return `
            <div class="notification-item border rounded p-3 mb-3 ${isApproved ? 'bg-light border-success' : ''}">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <h6 class="mb-2">
                    <i class="fas fa-utensils text-success me-2"></i>${req.donation?.foodName || 'Food Item'}
                  </h6>
                  <div class="mb-2">
                    <small class="text-muted d-block">
                      <i class="fas fa-user me-1"></i><strong>Donor:</strong> ${req.donor?.firstName || 'Anonymous'} ${req.donor?.lastName || ''}
                    </small>
                    ${req.requestedQuantity ? `
                      <small class="text-muted d-block">
                        <i class="fas fa-calculator me-1"></i><strong>Requested:</strong> ${req.requestedQuantity}
                      </small>
                    ` : ''}
                    ${isApproved && req.donor?.phone ? `
                      <small class="text-success d-block">
                        <i class="fas fa-phone me-1"></i><strong>Contact:</strong> ${req.donor.phone}
                      </small>
                    ` : ''}
                    ${req.pickupTime ? `
                      <small class="text-muted d-block">
                        <i class="fas fa-clock me-1"></i><strong>Pickup:</strong> ${new Date(req.pickupTime).toLocaleString()}
                      </small>
                    ` : ''}
                  </div>
                  <div>
                    <span class="badge bg-${getStatusBadgeColor(req.status)} me-2">${req.status}</span>
                    ${req.deliveryMethod ? `<span class="badge bg-info">${req.deliveryMethod}</span>` : ''}
                  </div>
                </div>
                <div class="text-end ms-3">
                  <small class="text-muted d-block mb-2">${new Date(req.createdAt).toLocaleDateString()}</small>
                  ${getRecipientActionButtons(req)}
                </div>
              </div>
            </div>
          `;
          }).join('')}
          <div class="text-center mt-3">
            <a href="my_requests.html" class="btn btn-outline-success">
              <i class="fas fa-list me-2"></i>View All Requests
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function showDonorNotifications(requests) {
  const notificationsSection = document.getElementById('notifications-section');
  if (!notificationsSection) return;

  notificationsSection.classList.remove('d-none');
  
  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const recentRequests = requests.slice(0, 5);
  
  if (recentRequests.length === 0) {
    notificationsSection.innerHTML = `
      <div class="col-12">
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">No requests yet</h5>
            <p class="text-muted">Your donations will appear here when someone requests them!</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  notificationsSection.innerHTML = `
    <div class="col-12">
      <div class="card shadow-sm">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">
            <i class="fas fa-bell me-2"></i>Incoming Requests
            ${pendingRequests.length > 0 ? `<span class="badge bg-warning ms-2">${pendingRequests.length} Pending</span>` : ''}
          </h5>
        </div>
        <div class="card-body">
          ${recentRequests.map(req => {
            const isApproved = req.status?.toLowerCase() === 'approved' || req.status?.toLowerCase() === 'in transit';
            return `
            <div class="notification-item border rounded p-3 mb-3 ${isApproved ? 'bg-light border-success' : req.status === 'Pending' ? 'border-warning' : ''}">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <h6 class="mb-2">
                    <i class="fas fa-utensils text-success me-2"></i>${req.donation?.foodName || 'Food Item'}
                  </h6>
                  <div class="mb-2">
                    <small class="text-muted d-block">
                      <i class="fas fa-user me-1"></i><strong>Recipient:</strong> ${req.recipient?.firstName || 'Anonymous'} ${req.recipient?.lastName || ''}
                    </small>
                    ${req.requestedQuantity ? `
                      <small class="text-muted d-block">
                        <i class="fas fa-calculator me-1"></i><strong>Requested:</strong> ${req.requestedQuantity}
                      </small>
                    ` : ''}
                    ${isApproved && req.recipient?.phone ? `
                      <small class="text-success d-block">
                        <i class="fas fa-phone me-1"></i><strong>Contact:</strong> ${req.recipient.phone}
                      </small>
                    ` : ''}
                    ${req.specialRequirements ? `
                      <small class="text-muted d-block">
                        <i class="fas fa-clipboard-list me-1"></i><strong>Special:</strong> ${req.specialRequirements}
                      </small>
                    ` : ''}
                    ${req.pickupTime ? `
                      <small class="text-muted d-block">
                        <i class="fas fa-clock me-1"></i><strong>Pickup:</strong> ${new Date(req.pickupTime).toLocaleString()}
                      </small>
                    ` : ''}
                  </div>
                  <div>
                    <span class="badge bg-${getStatusBadgeColor(req.status)} me-2">${req.status}</span>
                    ${req.deliveryMethod ? `<span class="badge bg-info">${req.deliveryMethod}</span>` : ''}
                  </div>
                </div>
                <div class="text-end ms-3">
                  <small class="text-muted d-block mb-2">${new Date(req.createdAt).toLocaleDateString()}</small>
                  ${getDonorActionButtons(req)}
                </div>
              </div>
            </div>
          `;
          }).join('')}
          <div class="text-center mt-3">
            <a href="notifications.html" class="btn btn-outline-success">
              <i class="fas fa-list me-2"></i>View All Requests
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getStatusBadgeColor(status) {
  const statusLower = status?.toLowerCase() || '';
  const colors = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'in transit': 'info',
    'delivered': 'primary',
    'completed': 'success'
  };
  return colors[statusLower] || 'secondary';
}

function getRecipientActionButtons(request) {
  const status = request.status?.toLowerCase() || '';
  
  if (status === 'approved' || status === 'in transit') {
    return `
      <div class="btn-group-vertical btn-group-sm">
        <a href="track_delivery.html?id=${request._id}" class="btn btn-sm btn-success mb-1">
          <i class="fas fa-map-marker-alt me-1"></i>Track
        </a>
        <a href="chat.html?requestId=${request._id}" class="btn btn-sm btn-primary">
          <i class="fas fa-comment me-1"></i>Chat
        </a>
      </div>
    `;
  } else if (status === 'pending') {
    return `<span class="badge bg-warning">Awaiting Approval</span>`;
  } else if (status === 'delivered') {
    return `<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Completed</span>`;
  }
  
  return '';
}

function getDonorActionButtons(request) {
  const status = request.status?.toLowerCase() || '';
  const token = localStorage.getItem('authToken');
  
  if (status === 'pending') {
    return `
      <div class="btn-group-vertical btn-group-sm">
        <button onclick="updateRequestStatus('${request._id}', 'Approved')" class="btn btn-sm btn-success mb-1">
          <i class="fas fa-check me-1"></i>Approve
        </button>
        <button onclick="updateRequestStatus('${request._id}', 'Rejected')" class="btn btn-sm btn-danger">
          <i class="fas fa-times me-1"></i>Reject
        </button>
      </div>
    `;
  } else if (status === 'approved' || status === 'in transit') {
    return `
      <div class="btn-group-vertical btn-group-sm">
        <a href="track_delivery.html?id=${request._id}" class="btn btn-sm btn-success mb-1">
          <i class="fas fa-map-marker-alt me-1"></i>Track
        </a>
        <a href="chat.html?requestId=${request._id}" class="btn btn-sm btn-primary">
          <i class="fas fa-comment me-1"></i>Chat
        </a>
      </div>
    `;
  } else if (status === 'delivered') {
    return `<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Completed</span>`;
  }
  
  return '';
}

async function updateRequestStatus(requestId, status) {
  const token = localStorage.getItem('authToken');
  
  if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) {
    return;
  }
  
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/requests/${requestId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      alert(`Request ${status.toLowerCase()} successfully!`);
      window.location.reload();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to update request status');
    }
  } catch (error) {
    console.error('Error updating request:', error);
    alert('An error occurred. Please try again.');
  }
}
