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
};

/**
 * Handle vote button clicks for gallery designs
 * @param {Event} e - Click event
 */
export const handleVoteClick = (e) => {
    // Only process if the click was on a vote button
    const voteButton = e.target.closest('.vote-button');
    console.log('Vote click detected, target:', e.target);
    console.log('Vote button found:', voteButton);
    if (!voteButton) return;
    
    // Prevent default behavior (like form submission)
    e.preventDefault();

    const galleryItem = voteButton.closest('.gallery-item');
    console.log('Gallery item found:', galleryItem);
    
    if (!galleryItem) {
        console.error('Could not find parent gallery item for vote button');
        return;
    }

    // Extract the design ID from the data attribute on the button itself
    const designId = voteButton.getAttribute('data-design-id');
    const buttonNonce = voteButton.getAttribute('data-nonce');
    
    if (!designId) {
        console.error('Missing design ID on gallery item');
        return;
    }
    
    if (!buttonNonce) {
        console.error('Missing nonce on vote button');
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

    console.log('Sending vote: Design ID:', designId, 'Vote Action:', voteAction);
    
    // Send the vote to the server - note the action name must match PHP handler
    const formData = new FormData();
    formData.append('action', 'kayak_designer_handle_vote'); // Match the action in gallery-functions.php
    formData.append('nonce', buttonNonce); // Use the button-specific nonce
    formData.append('design_id', designId);
    formData.append('vote_action', voteAction);
    
    console.log('Vote data being sent:', {
        action: 'kayak_designer_handle_vote',
        nonce,
        design_id: designId,
        vote_action: voteAction
    });

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
                console.log('Updated vote count to:', result.data?.new_vote_count);
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
            
            console.log('Vote error details:', result);
            alert(errorMessage);
        }
    })
    .catch(error => {
        console.error('Error processing vote:', error);
        alert('An error occurred while processing your vote.');
    });
};

/**
 * Show a confirmation alert for vote actions
 */
export const showVoteConfirmationAlert = () => {
    const message = localStorage.getItem('kayak_vote_confirmation');
    if (message) {
        // Display the alert, then remove from storage
        alert(message);
        localStorage.removeItem('kayak_vote_confirmation');
    }
};
