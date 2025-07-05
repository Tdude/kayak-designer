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
        designData = data;
        
        // Generate and update the share link
        generateShareLink();
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
     * Load a design from URL parameters
     * @returns {boolean} True if design was loaded from URL, false otherwise
     */
    function loadFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const designId = urlParams.get('design_id');
        
        if (designId) {
            // If there's a design_id in the URL, attempt to load it
            console.log('Attempting to load shared design:', designId);
            
            // Return true to indicate we found a design ID in the URL
            return { found: true, designId: designId };
        }
        
        // Return false if no design ID in URL
        return { found: false };
    }
    
    // Public API
    return {
        init: init,
        updateDesignData: updateDesignData,
        loadFromUrl: loadFromUrl
    };
})();

export default KayakSharing;
