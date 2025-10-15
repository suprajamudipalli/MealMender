document.addEventListener('DOMContentLoaded', () => {
  const requestsContainer = document.getElementById('requests-container');
  const loadingSpinner = document.getElementById('loading-spinner');
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('You must be logged in to view your notifications.');
    window.location.href = 'login.html';
    return;
  }

  async function loadDonorRequests() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/requests/for-me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch requests.');

      const requests = await response.json();
      loadingSpinner.classList.add('d-none');

      if (requests.length === 0) {
        requestsContainer.innerHTML = '<p class="text-center text-muted">You have no pending requests for your donations.</p>';
        return;
      }

      requestsContainer.innerHTML = '';
      requests.forEach(request => {
        const requestCard = createRequestCard(request);
        requestsContainer.insertAdjacentHTML('beforeend', requestCard);
      });

      // Add event listeners after cards are in the DOM
      addEventListeners();

    } catch (error) {
      console.error('Error loading requests:', error);
      loadingSpinner.classList.add('d-none');
      requestsContainer.innerHTML = '<p class="text-center text-danger">Could not load requests.</p>';
    }
  }

  function createRequestCard(request) {
    const recipientName = request.recipient ? request.recipient.username : 'A user';
    const isPending = request.status === 'Pending';
    const isApproved = request.status === 'Approved';

    return `
      <div class="col-md-6 mb-3">
        <div class="card" id="request-card-${request._id}">
          <div class="card-body">
            <h5 class="card-title">Request for: ${request.donation.foodName}</h5>
            <p class="card-text">From: <strong>${recipientName}</strong></p>
            <div class="action-area">
              ${isPending ? `
                <button class="btn btn-success me-2 action-btn" data-request-id="${request._id}" data-action="Approved">
                  <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger action-btn" data-request-id="${request._id}" data-action="Rejected">
                  <i class="fas fa-times"></i> Reject
                </button>
              ` : isApproved ? `
                <a href="tracking.html?requestId=${request._id}" class="btn btn-primary">
                  <i class="fas fa-comments"></i> Chat & Track
                </a>
              ` : `
                <p class="mb-0">Status: <span class="fw-bold text-danger">${request.status}</span></p>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function addEventListeners() {
    document.querySelectorAll('.action-btn').forEach(button => {
      button.addEventListener('click', handleRequestAction);
    });
  }

  async function handleRequestAction(event) {
    const button = event.currentTarget;
    const requestId = button.dataset.requestId;
    const action = button.dataset.action;

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        // Reload requests to show the updated status
        loadDonorRequests();
      } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('An error occurred. Please try again.');
    }
  }

  loadDonorRequests();
});