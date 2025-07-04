/**
 * Gallery module - Gallery display and voting functionality
 */

// These will be initialized from the main module
let ajaxUrl;
let nonce;
let isUserLoggedIn;

/**
 * Initialize gallery module with WordPress data
 * @param {Object} config - Configuration object with WordPress data
 */
export const initGallery = (config) => {
    ajaxUrl = config.ajaxUrl;
    nonce = config.nonce;
    isUserLoggedIn = config.isUserLoggedIn === 'true';
    
    // Initialize gallery filtering
    initGalleryFiltering();
};

/**
 * Handle vote button clicks for gallery designs
 * @param {Event} e - Click event
 */
export const handleVoteClick = (e) => {
    // Only process if the click was on a vote button
    const voteButton = e.target.closest('.vote-button');
    // Process vote button click

    if (!voteButton) return;
    
    // Prevent default behavior (like form submission)
    e.preventDefault();

    const galleryItem = voteButton.closest('.gallery-item');

    
    if (!galleryItem) {
        // Could not find parent gallery item for vote button
        return;
    }

    // Extract the design ID from the data attribute on the button itself
    const designId = voteButton.getAttribute('data-design-id');
    const buttonNonce = voteButton.getAttribute('data-nonce');
    
    if (!designId) {
        // Missing design ID on gallery item
        return;
    }
    
    if (!buttonNonce) {
        // Missing nonce on vote button
        return;
    }

    // Don't allow unregistered users to vote
    if (!isUserLoggedIn) {
        alert('Please log in to vote for designs.');
        return;
    }

    // Determine the vote action based on button state
    let voteAction;
    if (voteButton.classList.contains('active')) {
        voteAction = 'remove_vote'; // User is clicking an active button, so they want to remove their vote
    } else {
        voteAction = 'add_vote'; // User is adding a vote
    }

    // Sending vote request
    
    // Send the vote to the server - note the action name must match PHP handler
    const formData = new FormData();
    formData.append('action', 'kayak_designer_handle_vote'); // Match the action in gallery-functions.php
    formData.append('nonce', buttonNonce); // Use the button-specific nonce
    formData.append('design_id', designId);
    formData.append('vote_action', voteAction);
    


    fetch(ajaxUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Update the UI to reflect the vote change
            const voteCount = galleryItem.querySelector('.vote-count');
            if (voteCount) {
                // PHP returns new_vote_count, not vote_count
                voteCount.textContent = result.data?.new_vote_count || voteCount.textContent;

            }

            // Toggle the active state of the button
            if (voteAction === 'add_vote') {
                voteButton.classList.add('active');
            } else {
                voteButton.classList.remove('active');
            }
            
            // Show a confirmation
            if (result.message) {
                // Store in localStorage so we can show it across page loads
                localStorage.setItem('kayak_vote_confirmation', result.message);
                // Show the alert now
                showVoteConfirmationAlert();
            }
        } else {
            // Display specific error message from server or a more helpful default
            let errorMessage = '';
            
            if (result.data && typeof result.data === 'string') {
                // If server sent a specific error message, use it
                errorMessage = result.data;
                
                // Check for common cases and make them more user-friendly
                if (errorMessage.includes('already voted')) {
                    errorMessage = 'You have already voted for this design.';
                    // Mark the button as active since they've already voted
                    voteButton.classList.add('active');
                }
            } else {
                // Default message if no specific error was provided
                errorMessage = 'Could not process your vote. Please try again later.';
            }
            
            alert(errorMessage);
        }
    })
    .catch(error => {
        alert('An error occurred while processing your vote.');
    });
};

/**
 * Show a confirmation alert for vote actions
 */
export const showVoteConfirmationAlert = (message) => {
    // Create a stylized alert message
    const alertElement = document.createElement('div');
    alertElement.className = 'kayak-alert kayak-alert-success';
    alertElement.textContent = message;
    
    // Add to page
    document.body.appendChild(alertElement);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        alertElement.remove();
    }, 3000);
};

/**
 * Initialize gallery filtering with AJAX
 */
const initGalleryFiltering = () => {
    const sortSelect = document.getElementById('gallery-sort-select');
    if (!sortSelect) return; // Not on a gallery page
    
    const galleryContainer = document.querySelector('.kayak-design-gallery');
    if (!galleryContainer) return; // Gallery container not found
    
    const loadingIndicator = document.getElementById('gallery-loading-indicator');
    
    // Add change event listener to the dropdown
    sortSelect.addEventListener('change', (e) => {
        const orderby = e.target.value;
        const selectNonce = sortSelect.getAttribute('data-nonce');
        
        if (!selectNonce) {
            // Missing nonce for gallery filtering
            return;
        }
        
        // Show loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'inline-block';
        
        // Make AJAX request to filter gallery
        const formData = new FormData();
        formData.append('action', 'kayak_designer_gallery_filter');
        formData.append('nonce', selectNonce);
        formData.append('orderby', orderby);
        
        fetch(ajaxUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data.html) {
                // Update gallery content
                galleryContainer.innerHTML = result.data.html;
                
                // Re-initialize click events for gallery items
                attachGalleryItemEvents();
            } else {
                // Error filtering gallery
            }
            
            // Hide loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        })
        .catch(error => {
            // Error during gallery filtering
            // Hide loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
    });
};

/**
 * Attach click events to gallery items after AJAX refresh
 */
const attachGalleryItemEvents = () => {
    // Re-initialize modal triggers
    const zoomIcons = document.querySelectorAll('.zoom-icon');
    zoomIcons.forEach(icon => {
        icon.addEventListener('click', (e) => {
            const image = e.target.getAttribute('data-modal-image');
            const title = e.target.getAttribute('data-modal-title');
            const modalImage = document.getElementById('kayak-gallery-modal-image');
            const modalTitle = document.getElementById('kayak-gallery-modal-title');
            
            if (modalImage) {
                modalImage.src = image;
                if (modalTitle) modalTitle.textContent = title;
                galleryModal.style.display = 'flex';
            }
        });
    });
    
    // Re-initialize vote buttons
    const voteButtons = document.querySelectorAll('.vote-button');
    voteButtons.forEach(button => {
        button.addEventListener('click', handleVoteClick);
    });
};
