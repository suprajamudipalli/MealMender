document.addEventListener('DOMContentLoaded', () => {
  const requestsContainer = document.getElementById('requests-container');
  const loadingSpinner = document.getElementById('loading-spinner');
  const token = localStorage.getItem('authToken');

  if (!token) {
    alert('You must be logged in to view your requests.');
    window.location.href = 'login.html';
    return;
  }

  async function loadMyRequests() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/requests/my-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const requests = await response.json();
      loadingSpinner.classList.add('d-none');

      if (requests.length === 0) {
        requestsContainer.innerHTML = '<p class="text-center text-muted">You have not made any requests yet.</p>';
        return;
      }

      requestsContainer.innerHTML = ''; // Clear container
      requests.forEach(request => {
        const requestItem = createRequestItem(request);
        requestsContainer.insertAdjacentHTML('beforeend', requestItem);
      });

    } catch (error) {
      console.error('Failed to load requests:', error);
      loadingSpinner.classList.add('d-none');
      requestsContainer.innerHTML = '<p class="text-center text-danger">Could not load your requests. Please try again later.</p>';
    }
  }

  function getStatusBadge(status) {
    const statusMap = {
      'Pending': { class: 'warning', icon: 'fa-clock' },
      'Approved': { class: 'success', icon: 'fa-check-circle' },
      'Rejected': { class: 'danger', icon: 'fa-times-circle' },
    };
    const { class: badgeClass, icon } = statusMap[status] || { class: 'secondary', icon: 'fa-question-circle' };
    return `<span class="badge bg-${badgeClass}"><i class="fas ${icon} me-1"></i>${status}</span>`;
  }

  function createRequestItem(request) {
    const requestedDate = new Date(request.createdAt).toLocaleDateString();
    return `
      <div class="list-group-item list-group-item-action flex-column align-items-start mb-2 shadow-sm">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">Request for: ${request.donation.foodName}</h5>
          <small>Requested on: ${requestedDate}</small>
        </div>
        <p class="mb-1">From donor: <strong>${request.donor.username}</strong></p>
        <div class="mt-2">Status: ${getStatusBadge(request.status)}</div>
      </div>
    `;
  }

  loadMyRequests();
});