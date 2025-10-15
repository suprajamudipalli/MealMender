// Enhanced Dashboard with Inline Notifications and Requests
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
      await loadDefaultDashboard(user, token);
    }

    loadingOverlay.style.display = 'none';

  } catch (error) {
    console.error('Dashboard error:', error);
    loadingOverlay.style.display = 'none';
    
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
    const donationsResponse = await fetch(`${window.API_BASE_URL}/api/donations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (donationsResponse.ok) {
      const donationsData = await donationsResponse.json();
      availableDonations = Array.isArray(donationsData) ? donationsData : (donationsData.donations || []);
      availableDonations = availableDonations.filter(d => d.status === 'available');
    }
  } catch (error) {
    console.error('Error fetching donations:', error);
  }

  try {
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

  // Show recent requests with actions
  if (myRequests.length > 0) {
    showRecipientRequests(myRequests.slice(0, 5));
  }
}

// ============= DONOR DASHBOARD =============
async function loadDonorDashboard(user, token) {
  document.getElementById('hero-subtitle').textContent = 
    'Share your surplus and make an impact';

  let myDonations = [];
  let requests = [];

  try {
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
  const activeDonations = myDonations.filter(d => d.status === 'available').length;
  const completedDonations = myDonations.filter(d => d.status === 'delivered').length;
  const approvedRequests = requests.filter(r => r.status === 'Approved' || r.status === 'In Transit' || r.status === 'Delivered').length;

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
        <h3 class="mb-0">${activeDonations}</h3>
        <p class="text-muted mb-0">Active Listings</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-orange">
          <i class="fas fa-users"></i>
        </div>
        <h3 class="mb-0">${approvedRequests}</h3>
        <p class="text-muted mb-0">People Helped</p>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stats-card">
        <div class="stats-icon icon-purple">
          <i class="fas fa-check-double"></i>
        </div>
        <h3 class="mb-0">${completedDonations}</h3>
        <p class="text-muted mb-0">Completed</p>
      </div>
    </div>
  `;

  // Impact display
  document.getElementById('impact-display').innerHTML = `
    <div class="impact-badge">
      ❤️ You've helped ${approvedRequests} ${approvedRequests === 1 ? 'person' : 'people'} get food!
    </div>
  `;

  // Quick actions
  const actionsSection = document.getElementById('actions-section');
  actionsSection.innerHTML = `
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='donation.html'">
        <i class="fas fa-plus-circle"></i>
        <h3>Donate Food</h3>
        <p class="text-muted">Share your surplus meals and groceries</p>
        <button class="btn btn-primary-custom mt-2">Donate Now</button>
      </div>
    </div>
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='notifications.html'">
        <i class="fas fa-bell"></i>
        <h3>Requests & Notifications</h3>
        <p class="text-muted">View and manage incoming requests</p>
        ${requests.filter(r => r.status === 'Pending').length > 0 ? 
          `<span class="badge bg-danger">${requests.filter(r => r.status === 'Pending').length} New</span>` : ''}
        <button class="btn btn-primary-custom mt-2">View Requests</button>
      </div>
    </div>
    <div class="col-md-4">
      <div class="action-card" onclick="window.location.href='profile.html'">
        <i class="fas fa-chart-line"></i>
        <h3>My Impact</h3>
        <p class="text-muted">See your contribution to reducing waste</p>
        <button class="btn btn-primary-custom mt-2">View Impact</button>
      </div>
    </div>
  `;

  // Show pending requests inline
  if (requests.length > 0) {
    showDonorRequests(requests.slice(0, 5), token);
  }
}

// ============= SHOW RECIPIENT REQUESTS =============
function showRecipientRequests(requests) {
  const activitySection = document.getElementById('recent-activity-section');
  const activityList = document.getElementById('activity-list');
  
  activitySection.classList.remove('d-none');
  activitySection.innerHTML = `
    <h3 class="mb-4"><i class="fas fa-list-check me-2"></i>Your Recent Requests</h3>
    <div id="activity-list"></div>
  `;
  
  const newActivityList = document.getElementById('activity-list');
  newActivityList.innerHTML = requests.map(req => `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h5 class="card-title mb-2">
              <i class="fas fa-utensils text-success me-2"></i>
              ${req.donation?.foodName || 'Food Item'}
            </h5>
            <p class="mb-2">
              <strong>Quantity:</strong> ${req.requestedQuantity || '-'}<br>
              <strong>Status:</strong> <span class="badge bg-${getStatusColor(req.status)}">${req.status}</span><br>
              <strong>Requested:</strong> ${new Date(req.createdAt).toLocaleDateString()}
            </p>
            ${req.specialRequirements ? `
              <p class="text-muted small mb-2">
                <i class="fas fa-info-circle me-1"></i>${req.specialRequirements}
              </p>
            ` : ''}
          </div>
          <div class="text-end">
            ${req.status === 'Approved' || req.status === 'In Transit' ? `
              <button class="btn btn-sm btn-success mb-2" onclick="window.location.href='track_delivery.html?id=${req._id}'">
                <i class="fas fa-map-marked-alt me-1"></i>Track
              </button>
              <button class="btn btn-sm btn-primary" onclick="window.location.href='chat.html?requestId=${req._id}'">
                <i class="fas fa-comment me-1"></i>Chat
              </button>
            ` : req.status === 'Pending' ? `
              <span class="text-muted small">Waiting for approval...</span>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ============= SHOW DONOR REQUESTS =============
function showDonorRequests(requests, token) {
  const activitySection = document.getElementById('recent-activity-section');
  
  activitySection.classList.remove('d-none');
  activitySection.innerHTML = `
    <h3 class="mb-4"><i class="fas fa-bell me-2"></i>Incoming Requests</h3>
    <div id="activity-list"></div>
  `;
  
  const activityList = document.getElementById('activity-list');
  activityList.innerHTML = requests.map(req => `
    <div class="card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h5 class="card-title mb-2">
              <i class="fas fa-user text-primary me-2"></i>
              ${req.recipient?.firstName || 'User'} requested ${req.donation?.foodName || 'food'}
            </h5>
            <p class="mb-2">
              <strong>Quantity Needed:</strong> ${req.requestedQuantity || '-'}<br>
              <strong>Pickup Time:</strong> ${req.pickupTime ? new Date(req.pickupTime).toLocaleString() : 'Not specified'}<br>
              <strong>Delivery Method:</strong> ${req.deliveryMethod || 'Not decided'}<br>
              <strong>Status:</strong> <span class="badge bg-${getStatusColor(req.status)}">${req.status}</span>
            </p>
            ${req.specialRequirements ? `
              <div class="alert alert-info py-2 mb-2">
                <strong><i class="fas fa-clipboard-list me-1"></i>Special Requirements:</strong><br>
                ${req.specialRequirements}
              </div>
            ` : ''}
            ${req.deliveryAddress ? `
              <p class="text-muted small mb-0">
                <i class="fas fa-map-marker-alt me-1"></i>${req.deliveryAddress}
              </p>
            ` : ''}
          </div>
          <div class="text-end">
            ${req.status === 'Pending' ? `
              <button class="btn btn-sm btn-success mb-2" onclick="approveRequest('${req._id}')">
                <i class="fas fa-check me-1"></i>Approve
              </button>
              <button class="btn btn-sm btn-danger" onclick="rejectRequest('${req._id}')">
                <i class="fas fa-times me-1"></i>Reject
              </button>
            ` : req.status === 'Approved' || req.status === 'In Transit' ? `
              <button class="btn btn-sm btn-success mb-2" onclick="window.location.href='track_delivery.html?id=${req._id}'">
                <i class="fas fa-map-marked-alt me-1"></i>Track
              </button>
              <button class="btn btn-sm btn-primary" onclick="window.location.href='chat.html?requestId=${req._id}'">
                <i class="fas fa-comment me-1"></i>Chat
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ============= ADMIN DASHBOARD =============
async function loadAdminDashboard(user, token) {
  document.getElementById('hero-subtitle').textContent = 'Manage the platform';
  document.getElementById('stats-section').innerHTML = `
    <div class="col-12 text-center">
      <h3>Admin Dashboard</h3>
      <p>Admin features coming soon...</p>
    </div>
  `;
}

// ============= DEFAULT DASHBOARD =============
async function loadDefaultDashboard(user, token) {
  document.getElementById('hero-subtitle').textContent = 'Choose your role to get started';
  document.getElementById('stats-section').innerHTML = `
    <div class="col-12 text-center">
      <h3>Welcome to MealMender!</h3>
      <p>Please select your role:</p>
      <button class="btn btn-success btn-lg me-3" onclick="setUserRole('recipient')">
        <i class="fas fa-hand-holding-heart me-2"></i>I want to receive food
      </button>
      <button class="btn btn-primary btn-lg" onclick="setUserRole('donor')">
        <i class="fas fa-gift me-2"></i>I want to donate food
      </button>
    </div>
  `;
}

// ============= HELPER FUNCTIONS =============
function getStatusColor(status) {
  const statusLower = status?.toLowerCase() || '';
  const colors = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger',
    'available': 'success',
    'claimed': 'info',
    'delivered': 'primary',
    'completed': 'success',
    'in transit': 'info'
  };
  return colors[statusLower] || 'secondary';
}

async function approveRequest(requestId) {
  const token = localStorage.getItem('authToken');
  if (confirm('Approve this request? Contact details will be shared.')) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Approved' })
      });

      if (response.ok) {
        alert('Request approved! Contact details have been shared.');
        window.location.reload();
      } else {
        alert('Failed to approve request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  }
}

async function rejectRequest(requestId) {
  const token = localStorage.getItem('authToken');
  if (confirm('Reject this request? This cannot be undone.')) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Rejected' })
      });

      if (response.ok) {
        alert('Request rejected');
        window.location.reload();
      } else {
        alert('Failed to reject request');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    }
  }
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
      window.location.reload();
    } else {
      alert('Failed to update role');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred');
  }
}
