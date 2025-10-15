document.addEventListener('DOMContentLoaded', () => {
  const donationForm = document.getElementById('donation-form');
  const messageContainer = document.getElementById('message-container');

  // --- Check for login token ---
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert('You must be logged in to make a donation.');
    window.location.href = 'login.html';
    return;
  }

  // --- Form Submission Logic ---
  donationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    messageContainer.innerHTML = ''; // Clear previous messages

    const formData = {
      foodName: document.getElementById('foodName').value,
      quantity: document.getElementById('quantity').value,
      quality: document.getElementById('quality').value,
      type: document.getElementById('type').value,
      expiry: document.getElementById('expiry').value,
      notes: document.getElementById('notes').value,
      pickupLocation: {
        address: document.getElementById('pickup-address').value,
        lat: parseFloat(document.getElementById('pickup-lat').value) || null,
        lon: parseFloat(document.getElementById('pickup-lon').value) || null,
      },
    };

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Donation submitted successfully! Thank you for your contribution.', 'success');
        donationForm.reset();
        setTimeout(() => {
          // Redirect to a 'my donations' page or profile
          window.location.href = 'profile.html';
        }, 2500);
      } else {
        showMessage(data.message || 'Failed to submit donation. Please check the form.', 'danger');
      }
    } catch (error) {
      console.error('Donation submission error:', error);
      showMessage('An error occurred. Please try again later.', 'danger');
    }
  });

  function showMessage(message, type) {
    messageContainer.innerHTML = `<div class="alert alert-${type === 'success' ? 'success' : 'danger'}" role="alert">${message}</div>`;
  }

  // --- Geolocation and Map Logic ---
  let map;
  let marker;
  const getLocationBtn = document.getElementById('get-location-btn');
  const toggleMapBtn = document.getElementById('toggle-map-btn');
  const locationStatus = document.getElementById('location-status');
  const pickupAddressInput = document.getElementById('pickup-address');
  const latInput = document.getElementById('pickup-lat');
  const lonInput = document.getElementById('pickup-lon');

  getLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      locationStatus.textContent = 'Fetching your location...';
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      locationStatus.textContent = 'Geolocation is not supported by this browser.';
    }
  });

  function showPosition(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    pickupAddressInput.value = `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    latInput.value = lat;
    lonInput.value = lon;
    locationStatus.textContent = 'Location captured ✔️';

    if (map) {
      map.setView([lat, lon], 15);
      if (marker) marker.setLatLng([lat, lon]);
      else marker = L.marker([lat, lon]).addTo(map);
    }
  }

  function showError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        locationStatus.textContent = '❌ User denied location request.';
        break;
      default:
        locationStatus.textContent = '⚠️ Could not get location.';
        break;
    }
  }

  toggleMapBtn.addEventListener('click', () => {
    const mapDiv = document.getElementById('map');
    if (mapDiv.style.display === 'none') {
      mapDiv.style.display = 'block';
      if (!map) {
        // Initialize map (default to a central location)
        map = L.map('map').setView([13.6288, 79.4192], 10); // Default to Tirupati
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        map.on('click', function (e) {
          const { lat, lng } = e.latlng;
          pickupAddressInput.value = `Selected on map (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          latInput.value = lat;
          lonInput.value = lng;

          if (marker) {
            marker.setLatLng([lat, lng]);
          } else {
            marker = L.marker([lat, lng]).addTo(map);
          }
        });
      }
    } else {
      mapDiv.style.display = 'none';
    }
  });
});