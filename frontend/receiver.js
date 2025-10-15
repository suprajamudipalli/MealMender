document.addEventListener('DOMContentLoaded', () => {
  const donationsContainer = document.getElementById('donations-container');
  const loadingSpinner = document.getElementById('loading-spinner');
  const paginationContainer = document.getElementById('pagination-container');

  async function loadAvailableDonations(pageNumber = 1) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/donations?pageNumber=${pageNumber}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const { donations, page, pages } = await response.json();

      // Hide the spinner once data is fetched
      loadingSpinner.classList.add('d-none');

      if (donations.length === 0) {
        paginationContainer.innerHTML = ''; // Clear pagination if no results
        donationsContainer.innerHTML = '<p class="text-center text-muted">No available donations at the moment. Please check back later.</p>';
        return;
      }
      
      donationsContainer.innerHTML = ''; // Clear the container
      donations.forEach(donation => {
        const donationCard = createDonationCard(donation);
        donationsContainer.insertAdjacentHTML('beforeend', donationCard);
      });

      renderPagination(page, pages);

    } catch (error) {
      console.error('Failed to load donations:', error);
      loadingSpinner.classList.add('d-none');
      donationsContainer.innerHTML = '<p class="text-center text-danger">Could not load donations. Please try again later.</p>';
    }
  }

  function createDonationCard(donation) {
    // Use donor's username or first name, default to 'Anonymous'
    const donorName = donation.donor ? (donation.donor.username || donation.donor.firstName) : 'Anonymous';
    const expiryDate = new Date(donation.expiry);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
    
    // Determine urgency level and styling
    let urgencyBadge = '';
    let cardBorderClass = '';
    let urgencyClass = '';
    
    if (hoursUntilExpiry < 0) {
      urgencyBadge = '<span class="badge bg-danger mb-2"><i class="fas fa-exclamation-triangle"></i> Expired</span>';
      cardBorderClass = 'border-danger';
    } else if (hoursUntilExpiry <= 2) {
      urgencyBadge = `<span class="badge bg-danger mb-2 pulse-animation"><i class="fas fa-clock"></i> URGENT: ${Math.floor(hoursUntilExpiry)}h ${Math.floor((hoursUntilExpiry % 1) * 60)}m left!</span>`;
      cardBorderClass = 'border-danger border-3';
      urgencyClass = 'urgent-glow';
    } else if (hoursUntilExpiry <= 5) {
      urgencyBadge = `<span class="badge bg-warning text-dark mb-2"><i class="fas fa-hourglass-half"></i> ${Math.floor(hoursUntilExpiry)}h left</span>`;
      cardBorderClass = 'border-warning border-2';
    } else {
      urgencyBadge = `<span class="badge bg-success mb-2"><i class="fas fa-check-circle"></i> Fresh</span>`;
    }

    return `
      <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm ${cardBorderClass} ${urgencyClass}" style="position: relative;">
          ${hoursUntilExpiry <= 2 && hoursUntilExpiry > 0 ? '<div class="urgent-ribbon">URGENT</div>' : ''}
          <div class="card-body d-flex flex-column">
            ${urgencyBadge}
            <h5 class="card-title text-success mb-3">
              <i class="fas fa-utensils me-2"></i>${donation.foodName}
            </h5>
            <div class="mb-2">
              <small class="text-muted d-block mb-1">
                <i class="fas fa-weight me-2"></i><strong>Quantity:</strong> ${donation.quantity}
              </small>
              <small class="text-muted d-block mb-1">
                <i class="fas fa-star me-2"></i><strong>Quality:</strong> ${donation.quality}
              </small>
              <small class="text-muted d-block mb-1">
                <i class="fas fa-tag me-2"></i><strong>Type:</strong> ${donation.type}
              </small>
              <small class="text-muted d-block mb-1">
                <i class="fas fa-calendar me-2"></i><strong>Expires:</strong> ${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </small>
              <small class="text-muted d-block mb-1">
                <i class="fa fa-map-marker-alt me-2"></i>${donation.pickupLocation.address || 'Address not provided'}
              </small>
              <small class="text-muted d-block">
                <i class="fas fa-user me-2"></i>By: ${donorName}
              </small>
            </div>
            <div class="mt-auto pt-3">
              <a href="request_food.html?id=${donation._id}" class="btn ${hoursUntilExpiry <= 2 ? 'btn-danger' : 'btn-primary'} w-100">
                <i class="fas fa-hand-holding-heart me-2"></i>${hoursUntilExpiry <= 2 ? 'Request NOW!' : 'Request Food'}
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPagination(currentPage, totalPages) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = '<ul class="pagination justify-content-center">';

    // Previous button
    paginationHTML += `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
      </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    // Next button
    paginationHTML += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
      </li>
    `;

    paginationHTML += '</ul>';
    paginationContainer.innerHTML = paginationHTML;
  }

  // Initial load
  loadAvailableDonations(1);

  // Event listener for pagination clicks
  paginationContainer.addEventListener('click', (event) => {
    event.preventDefault();
    const target = event.target;
    if (target.tagName === 'A' && target.dataset.page) {
      const page = parseInt(target.dataset.page, 10);
      if (!isNaN(page)) {
        donationsContainer.innerHTML = ''; // Clear current items
        loadingSpinner.classList.remove('d-none'); // Show spinner
        loadAvailableDonations(page);
      }
    }
  });
});