document.addEventListener('DOMContentLoaded', () => {
  const loadingSpinner = document.getElementById('loading-spinner');
  const dashboardContent = document.getElementById('dashboard-content');
  const statsContainer = document.getElementById('stats-container');
  const usersTableBody = document.getElementById('users-table-body');
  const donationsTableBody = document.getElementById('donations-table-body');
  const logoutButton = document.getElementById('logout-button');

  const token = localStorage.getItem('authToken');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  let currentUserId = null;

  async function initializeDashboard() {
    try {
      // First, verify the user is an admin
      const profileResponse = await fetch('http://localhost:5000/api/profile/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!profileResponse.ok) throw new Error('Authentication failed.');
      
      const user = await profileResponse.json();
      currentUserId = user._id; // Store current user's ID
      if (user.role !== 'admin') {
        alert('Access Denied: You are not an admin.');
        window.location.href = 'profile.html';
        return;
      }

      // If admin, show content and fetch data
      loadingSpinner.classList.add('d-none');
      dashboardContent.classList.remove('d-none');

      // Fetch all users and donations in parallel
      await Promise.all([
        loadStats(),
        loadUsers(),
        loadDonations(),
      ]);

    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      localStorage.removeItem('authToken');
      window.location.href = 'login.html';
    }
  }

  async function loadUsers() {
    const response = await fetch('http://localhost:5000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { users } = await response.json(); // Assuming pagination might be added later
    usersTableBody.innerHTML = '';
    users.forEach(user => {
      const isCurrentUser = user._id === currentUserId;
      let roleButton = '';
      if (user.role === 'admin') {
        roleButton = `<button class="btn btn-sm btn-warning me-2 role-change-btn" data-id="${user._id}" data-role="user" ${isCurrentUser ? 'disabled title="Cannot demote yourself"' : ''}>Demote</button>`;
      } else {
        roleButton = `<button class="btn btn-sm btn-info me-2 role-change-btn" data-id="${user._id}" data-role="admin">Promote</button>`;
      }

      const row = `
        <tr>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td><span class="badge bg-secondary">${user.role}</span></td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
          <td>
            ${roleButton}
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user._id}" ${isCurrentUser ? 'disabled' : ''}>Delete</button>
          </td>
        </tr>
      `;
      usersTableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  async function loadDonations() {
    const response = await fetch('http://localhost:5000/api/admin/donations?pageNumber=1&pageSize=100', { // Fetch a large number for now
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { donations } = await response.json();
    donationsTableBody.innerHTML = '';
    donations.forEach(donation => {
      const row = `
        <tr>
          <td>${donation.foodName}</td>
          <td>${donation.donor ? donation.donor.username : 'N/A'}</td>
          <td><span class="badge bg-info">${donation.status}</span></td>
          <td>${new Date(donation.expiry).toLocaleDateString()}</td>
          <td><button class="btn btn-sm btn-danger delete-donation-btn" data-id="${donation._id}">Delete</button></td>
        </tr>
      `;
      donationsTableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  async function handleTableActions(event) {
    const target = event.target;
    const id = target.dataset.id;

    if (target.classList.contains('delete-user-btn')) {
      if (confirm('Are you sure you want to delete this user? This cannot be undone.')) {
        await performAction('DELETE', `http://localhost:5000/api/admin/users/${id}`, null, loadUsers);
      }
    }

    if (target.classList.contains('delete-donation-btn')) {
      if (confirm('Are you sure you want to delete this donation? This cannot be undone.')) {
        await performAction('DELETE', `http://localhost:5000/api/admin/donations/${id}`, null, loadDonations);
      }
    }

    if (target.classList.contains('role-change-btn')) {
      const role = target.dataset.role;
      if (confirm(`Are you sure you want to change this user's role to "${role}"?`)) {
        await performAction('PUT', `http://localhost:5000/api/admin/users/${id}/role`, { role }, loadUsers);
      }
    }
  }

  async function performAction(method, url, body, onSuccess) {
    try {
      const options = {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      };
      if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      if (response.ok) {
        onSuccess(); // Refresh the relevant table
      } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert(`An error occurred: ${error.message}`);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;

      const stats = await response.json();

      document.getElementById('total-users-stat').textContent = stats.users.total;
      document.getElementById('total-donations-stat').textContent = stats.donations.total;
      document.getElementById('new-users-stat').textContent = stats.users.newThisMonth;

      renderDonationStatusChart(stats.donations.byStatus);

    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  function renderDonationStatusChart(data) {
    const ctx = document.getElementById('donations-status-chart').getContext('2d');
    const labels = data.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1));
    const counts = data.map(item => item.count);

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          label: 'Donations',
          data: counts,
          backgroundColor: ['rgba(40, 167, 69, 0.7)', 'rgba(23, 162, 184, 0.7)', 'rgba(255, 193, 7, 0.7)'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
    });
  }

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
  });

  initializeDashboard();
  dashboardContent.addEventListener('click', handleTableActions);
});