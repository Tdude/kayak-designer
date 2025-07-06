/**
 * Sharing module for Kayak Designer
 * Handles social media sharing and link generation
 */

const KayakSharing = (function() {
    // Private variables
    let designData = null;
    let shareButtons = null;
    let shareLinkInput = null;
    
    /**
     * Initialize the sharing functionality
     */
    function init() {
        // Create sharing UI elements
        createSharingUI();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    /**
     * Create the sharing UI elements
     */
    function createSharingUI() {
        const sharingContainer = document.createElement('div');
        sharingContainer.id = 'kayak-sharing-container';
        sharingContainer.className = 'kayak-sharing-container';
        
        sharingContainer.innerHTML = `
            <h4>Share Your Design</h4>
            <div class="sharing-buttons">
                <button id="facebook-share" class="share-button" title="Share on Facebook">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                </button>
                <button id="instagram-share" class="share-button" title="Share on Instagram">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                </button>
                <button id="twitter-share" class="share-button" title="Share on Twitter">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.19 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z"/>
                    </svg>
                </button>
                <button id="email-share" class="share-button" title="Share via Email">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                </button>
                <button id="copy-share-link" class="share-button" title="Copy Link">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                </button>
            </div>
            <div class="share-link-container">
                <input type="text" id="share-link-input" readonly placeholder="Generate a shareable link" />
                <div id="share-link-copied" class="share-link-copied">Copied!</div>
            </div>
        `;
        
        // Append the sharing container to the main designer container
        const designerContainer = document.getElementById('kayak-designer-container');
        if (designerContainer) {
            designerContainer.appendChild(sharingContainer);
        }
        
        // Store references to UI elements
        shareButtons = {
            facebook: document.getElementById('facebook-share'),
            instagram: document.getElementById('instagram-share'),
            twitter: document.getElementById('twitter-share'),
            email: document.getElementById('email-share'),
            copyLink: document.getElementById('copy-share-link')
        };
        
        shareLinkInput = document.getElementById('share-link-input');
    }
    
    /**
     * Set up event listeners for sharing buttons
     */
    function setupEventListeners() {
        if (!shareButtons) return;
        
        // Facebook share
        shareButtons.facebook.addEventListener('click', function() {
            shareOnFacebook();
        });
        
        // Instagram share
        shareButtons.instagram.addEventListener('click', function() {
            shareOnInstagram();
        });
        
        // Twitter share
        shareButtons.twitter.addEventListener('click', function() {
            shareOnTwitter();
        });
        
        // Email share
        shareButtons.email.addEventListener('click', function() {
            shareViaEmail();
        });
        
        // Copy link
        shareButtons.copyLink.addEventListener('click', function() {
            copyShareLink();
        });
    }
    
    /**
     * Update the design data used for sharing
     * @param {Object} data - The design data to share
     */
    function updateDesignData(data) {
        console.log('Sharing module received design data:', data);
        
        // Make sure we have valid design data with an ID
        if (data && data.id) {
            designData = data;
            
            // Generate and update the share link
            generateShareLink();
            
            // Enable sharing buttons
            enableSharingButtons();
        } else {
            console.error('Invalid design data received in sharing module:', data);
        }
    }
    
    /**
     * Generate a shareable link for the current design
     */
    function generateShareLink() {
        if (!designData || !designData.id) {
            // If no design is saved, prompt to save first
            shareLinkInput.value = '';
            shareLinkInput.placeholder = 'Save your design first to generate a link';
            return;
        }
        
        // Get the current page URL and add the design ID as a parameter
        const baseUrl = window.location.href.split('?')[0];
        const shareUrl = `${baseUrl}?design_id=${designData.id}`;
        
        // Update the share link input
        shareLinkInput.value = shareUrl;
        shareLinkInput.placeholder = '';
    }
    
    /**
     * Enable sharing buttons and update UI to indicate sharing is available
     */
    function enableSharingButtons() {
        if (!shareButtons) return;
        
        // Make sure all share buttons are active
        Object.values(shareButtons).forEach(button => {
            button.removeAttribute('disabled');
            button.classList.remove('disabled');
        });
        
        // Update share link input styling to indicate it's available
        if (shareLinkInput) {
            shareLinkInput.classList.add('active');
        }
        
        // Add a sharing container active class
        const container = document.getElementById('kayak-sharing-container');
        if (container) {
            container.classList.add('active');
        }
    }
    
    /**
     * Share the design on Facebook
     */
    function shareOnFacebook() {
        if (!designData || !designData.id) {
            alert('Please save your design before sharing.');
            return;
        }
        
        const shareUrl = shareLinkInput.value;
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        
        // Open the Facebook sharing dialog
        window.open(facebookShareUrl, 'Share on Facebook', 'width=600,height=400');
    }
    
    /**
     * Share the design on Instagram
     */
    function shareOnInstagram() {
        if (!designData || !designData.id) {
            alert('Please save your design before sharing.');
            return;
        }
        
        // Instagram doesn't have a direct web sharing API like Facebook or Twitter
        // We'll open Instagram app or website and prompt user to share manually
        const shareUrl = shareLinkInput.value;
        const designName = designData.design_name || 'my kayak design';
        
        // Copy the share URL to clipboard automatically
        shareLinkInput.select();
        document.execCommand('copy');
        
        // Show a message that the link was copied
        const copiedMessage = document.getElementById('share-link-copied');
        copiedMessage.textContent = 'Link copied! Now you can paste it on Instagram';
        copiedMessage.style.display = 'block';
        
        // Open Instagram in a new tab
        window.open('https://www.instagram.com/', 'Share on Instagram', 'width=600,height=400');
        
        // Reset the copied message after 4 seconds
        setTimeout(function() {
            copiedMessage.style.display = 'none';
            copiedMessage.textContent = 'Copied!';
        }, 4000);
    }
    
    /**
     * Share the design on Twitter
     */
    function shareOnTwitter() {
        if (!designData || !designData.id) {
            alert('Please save your design before sharing.');
            return;
        }
        
        const shareUrl = shareLinkInput.value;
        const designName = designData.design_name || 'my kayak design';
        const tweetText = `Check out ${designName} that I created with the Kayak Designer!`;
        const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
        
        // Open the Twitter sharing dialog
        window.open(twitterShareUrl, 'Share on Twitter', 'width=600,height=400');
    }
    
    /**
     * Share the design via email
     */
    function shareViaEmail() {
        if (!designData || !designData.id) {
            alert('Please save your design before sharing.');
            return;
        }
        
        const shareUrl = shareLinkInput.value;
        const designName = designData.design_name || 'my kayak design';
        const subject = `Check out my kayak design: ${designName}`;
        const body = `I created this kayak design using the Kayak Designer. Check it out here: ${shareUrl}`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open the default email client
        window.location.href = mailtoUrl;
    }
    
    /**
     * Copy the share link to clipboard
     */
    function copyShareLink() {
        if (!designData || !designData.id) {
            alert('Please save your design before sharing.');
            return;
        }
        
        shareLinkInput.select();
        document.execCommand('copy');
        
        // Show the "Copied!" message
        const copiedMessage = document.getElementById('share-link-copied');
        copiedMessage.style.display = 'block';
        
        // Hide the message after a short delay
        setTimeout(function() {
            copiedMessage.style.display = 'none';
        }, 2000);
    }
    
    /**
     * Check if the URL contains a shared design ID parameter
     * This is used when someone opens a shared link to detect the design to load
     * @returns {Object} Object with found status and designId if present
     */
    function checkForSharedDesignId() {
        const urlParams = new URLSearchParams(window.location.search);
        const designId = urlParams.get('design_id');
        
        if (designId) {
            // If there's a design_id in the URL, it means someone opened a shared link
            console.log('Shared design ID found in URL:', designId);
            
            // Return the design ID to be loaded
            return { found: true, designId: designId };
        }
        
        // Return empty result if no design ID in URL
        return { found: false };
    }
    
    // Public API
    return {
        init: init,
        updateDesignData: updateDesignData,
        loadFromUrl: checkForSharedDesignId // Keep the old name in the API for backward compatibility
    };
})();

export default KayakSharing;
