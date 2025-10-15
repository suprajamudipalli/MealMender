document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('msgs');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('inputMsg');
  const statusBadge = document.getElementById('statusBadge');
  const typingIndicator = document.getElementById('typing-indicator');
  const completeButton = document.getElementById('complete-btn');

  const params = new URLSearchParams(window.location.search);
  const requestId = params.get('requestId');
  const token = localStorage.getItem('authToken');
  const currentUserId = localStorage.getItem('userId');

  if (!token || !requestId) {
    alert('Invalid request. You must be logged in and have a request ID.');
    window.location.href = 'profile.html';
    return;
  }

  // --- Initial data load ---
  loadRequestDetails();

  // --- 1. Connect to Socket.IO server with authentication ---
  const socket = io(window.API_BASE_URL || 'http://localhost:5000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Connected to socket server!');
    statusBadge.textContent = 'Connected to chat';
    statusBadge.style.background = '#d9f7e0';
    // Join the room for this specific request
    socket.emit('joinRoom', requestId);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection Error:', err.message);
    alert('Could not connect to chat server: ' + err.message);
    statusBadge.textContent = 'Connection failed';
    statusBadge.style.background = '#ffcdd2';
  });

  // Listen for errors from the server
  socket.on('error', (error) => {
    alert(`Chat Error: ${error.message}`);
  });

  // --- 2. Listen for incoming messages ---
  socket.on('receiveMessage', (message) => {
    appendMessage(message);
  });

  // --- 3. Listen for chat history ---
  socket.on('chatHistory', (messages) => {
    messagesContainer.innerHTML = ''; // Clear placeholder messages
    messages.forEach(message => {
      appendMessage(message);
    });
  });

  // --- Typing Indicator Logic ---
  let typingTimeout;
  messageInput.addEventListener('input', () => {
    socket.emit('typing', { requestId, isTyping: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing', { requestId, isTyping: false });
    }, 2000); // Stop showing "typing" after 2 seconds of inactivity
  });

  socket.on('userTyping', (data) => {
    if (data.isTyping) {
      typingIndicator.textContent = `${data.username} is typing...`;
    } else {
      typingIndicator.textContent = '';
    }
  });

  // --- 4. Handle sending a message ---
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (content) {
      socket.emit('sendMessage', { requestId, content });
      messageInput.value = '';
    }
  });

  // --- Helper function to display a message ---
  function appendMessage(message) {
    typingIndicator.textContent = ''; // Clear typing indicator when a message arrives
    const messageElement = document.createElement('div');
    const isMe = message.sender._id === currentUserId;
    
    messageElement.classList.add('msg');
    messageElement.classList.add(isMe ? 'me' : 'them');
    
    const senderName = isMe ? 'You' : message.sender.username;
    messageElement.innerHTML = `<small class="msg-sender">${senderName}</small>${message.content}`;
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // --- 5. Load Request Details to manage state (like 'Complete' button) ---
  async function loadRequestDetails() {
    try {
      // Use the dedicated endpoint to get full request details
      const res = await fetch(`${window.API_BASE_URL}/api/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Could not fetch request details');
      }
      
      const request = await res.json();
      
      // Update UI with request details
      if (request.donation) {
        // Set food name
        document.getElementById('itemName').textContent = request.donation.foodName || 'Food Item';
        
        // Set pickup location
        const pickupLocation = request.donation.pickupLocation;
        if (pickupLocation && pickupLocation.address) {
          document.getElementById('addrText').textContent = pickupLocation.address;
          
          // Set up map
          if (pickupLocation.lat && pickupLocation.lon) {
            const mapFrame = document.getElementById('mapFrame');
            const lat = pickupLocation.lat;
            const lon = pickupLocation.lon;
            
            // Embed Google Maps
            mapFrame.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lon}&zoom=15`;
            
            // Set up "Open in Google Maps" link
            const gmLink = document.getElementById('gm-open');
            gmLink.href = `https://www.google.com/maps?q=${lat},${lon}`;
          }
        }
      }
      
      // Update status badge
      statusBadge.textContent = `Status: ${request.status}`;
      
      // Show complete button if donor and status is Approved
      const isDonor = request.donor && request.donor._id === currentUserId;
      if (isDonor && request.status === 'Approved') {
        completeButton.style.display = 'block';
      }
      
    } catch (error) {
      console.error("Failed to load request details:", error);
      statusBadge.textContent = 'Error loading details';
      statusBadge.style.background = '#ffcdd2';
    }
  }

  // --- 6. Handle 'Mark as Completed' button click ---
  completeButton.addEventListener('click', async () => {
    if (!confirm('Are you sure the food has been picked up? This will complete the request.')) {
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE_URL}/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Completed' })
      });

      if (response.ok) {
        alert('Request marked as completed!');
        completeButton.style.display = 'none';
        statusBadge.textContent = 'Status: Completed';
      } else {
        const data = await response.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  });
});