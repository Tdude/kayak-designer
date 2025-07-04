/**
 * Modal module - Handles modal functionality for kayak views
 */

// Configuration object with paths and settings
let config = {};

/**
 * Initialize modal module with WordPress data
 * @param {Object} wpConfig - Configuration object with WordPress data
 */
export const initModal = (wpConfig) => {
    config = wpConfig;
};

/**
 * Initialize the kayak designer modal - simplified approach
 */
export const initializeModal = () => {
    const modal = document.getElementById('kayak-designer-modal');
    if (!modal) {
        console.error('Kayak designer modal not found!');
        return;
    }

    // Move modal to body to ensure it's not clipped by parent containers
    document.body.appendChild(modal);
    
    const modalContent = modal.querySelector('.kayak-modal-content-wrapper');
    const closeButton = modal.querySelector('.kayak-modal-close');

    // Ensure modal is hidden initially
    if (!modal.style.display || modal.style.display !== 'none') {
        modal.style.display = 'none';
    }

    // Functions to open and close modal
    const openModal = () => {
        console.log('Opening modal');
        
        // Simply show the modal - no need to clone anything
        modal.style.display = 'flex';
        // Add visible class for opacity transition
        modal.classList.add('modal-visible');
        
        // Hide all zoom buttons when modal is open
        document.querySelectorAll('.zoom-icon').forEach(icon => {
            icon.style.display = 'none';
        });
        
        // Ensure theme toggle button exists
        addThemeToggleButton();
        
        // Clone the entire kayak view containers with all color layers
        const topViewContainer = document.querySelector('#kayak-top-view-container');
        const sideViewContainer = document.querySelector('#kayak-side-view-container');
        
        if (topViewContainer && sideViewContainer && modalContent) {
            // Clear previous content
            modalContent.innerHTML = '';
            
            // Create image container
            const imageContainer = document.createElement('div');
            imageContainer.className = 'modal-image-container';
            
            // Clone the complete top view container with all layers
            const topViewClone = topViewContainer.cloneNode(true);
            topViewClone.id = 'modal-top-view-container';
            topViewClone.style.width = '90%'; // Make it larger in the modal
            topViewClone.style.margin = '0 auto 20px auto';
            imageContainer.appendChild(topViewClone);
            
            // Clone the complete side view container with all layers
            const sideViewClone = sideViewContainer.cloneNode(true);
            sideViewClone.id = 'modal-side-view-container';
            sideViewClone.style.width = '90%'; // Make it larger in the modal
            sideViewClone.style.margin = '0 auto';
            imageContainer.appendChild(sideViewClone);
            
            // Add to modal content
            modalContent.appendChild(imageContainer);
        }
    };

    const closeModal = () => {
        console.log('Closing modal');
        // First remove the visible class to trigger opacity transition
        modal.classList.remove('modal-visible');
        // Then hide after transition completes
        setTimeout(() => {
            modal.style.display = 'none';
            
            // Show zoom buttons again when modal is closed
            document.querySelectorAll('.zoom-icon').forEach(icon => {
                icon.style.display = '';
            });
        }, 300); // Match the CSS transition time
    };

    // Add event listeners to zoom icons
    const zoomIcons = document.querySelectorAll('.zoom-icon');
    console.log('Found zoom icons:', zoomIcons.length);
    zoomIcons.forEach(icon => {
        console.log('Adding click event to zoom icon:', icon);
        icon.addEventListener('click', openModal);
    });

    // Add click handlers to kayak images to open modal
    const kayakImages = document.querySelectorAll('#kayak-top-view-img, #kayak-side-view-img');
    console.log('Found kayak images for modal click:', kayakImages.length);
    kayakImages.forEach(img => {
        img.addEventListener('click', (e) => {
            console.log('Kayak image clicked, opening modal');
            openModal();
        });
    });

    // Also add click handlers to the container divs
    const kayakContainers = document.querySelectorAll('.kayak-top-view, .kayak-side-view');
    console.log('Found kayak containers for modal click:', kayakContainers.length);
    kayakContainers.forEach(container => {
        container.addEventListener('click', (e) => {
            // Only open modal if clicking on the container itself, not controls or zoom icon
            if (!e.target.closest('.view-controls') && 
                !e.target.closest('.zoom-icon') &&
                e.target === container) {
                console.log('Kayak container clicked, opening modal');
                openModal();
            }
        });
    });
    
    // Add event listener to close modal when clicking outside content
    modal.addEventListener('click', (e) => {
        // Log what was clicked to help debug
        console.log('Modal clicked, target:', e.target, 'current target:', e.currentTarget);
        
        // Close if clicking on the modal background (not on any of its content children)
        // Check if the click is directly on the modal itself or if the click is not inside the content wrapper
        if (e.target === modal || (!e.target.closest('.modal-image-container') && 
                                  !e.target.closest('.kayak-modal-close'))) {
            console.log('Modal background clicked, closing modal');
            closeModal();
        }
    });

    // Close button event listener
    if (closeButton) {
        console.log('Adding click event to close button');
        closeButton.addEventListener('click', closeModal);
    } else {
        console.error('Close button not found in modal');
    }

    /**
     * Adds a theme toggle button to the modal for switching between light and dark backgrounds
     */
    const addThemeToggleButton = () => {
        // Remove any existing toggle button first
        const existingToggle = modal.querySelector('.modal-theme-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'modal-theme-toggle';
        
        // Set initial state based on stored preference or default to dark
        const isDarkMode = localStorage.getItem('kayak-modal-theme') !== 'light';
        updateToggleButton(toggleBtn, isDarkMode);
        
        // Apply saved theme preference
        if (!isDarkMode) {
            modal.classList.add('light-mode');
        } else {
            modal.classList.remove('light-mode');
        }
        
        // Add event listener
        toggleBtn.addEventListener('click', (event) => {
            // Prevent default behavior and stop event propagation to prevent modal closing
            event.preventDefault();
            event.stopPropagation();
            
            // Toggle mode
            const newIsDarkMode = !modal.classList.contains('light-mode');
            
            if (newIsDarkMode) {
                // Switch to light mode
                modal.classList.add('light-mode');
                localStorage.setItem('kayak-modal-theme', 'light');
            } else {
                // Switch to dark mode
                modal.classList.remove('light-mode');
                localStorage.setItem('kayak-modal-theme', 'dark');
            }
            
            // Update button text/icon
            updateToggleButton(toggleBtn, !newIsDarkMode);
            
            console.log('Theme toggled to:', newIsDarkMode ? 'light mode' : 'dark mode');
            
            // Return false to prevent any other handlers
            return false;
        });
        
        // Add to modal
        modal.appendChild(toggleBtn);
    };
    
    /**
     * Updates toggle button text and icon based on current mode
     */
    const updateToggleButton = (button, isDarkMode) => {
        if (isDarkMode) {
            button.innerHTML = '<span class="modal-theme-toggle-icon">☀️</span> Light Mode';
        } else {
            button.innerHTML = '<span class="modal-theme-toggle-icon">🌙</span> Dark Mode';
        }
    }

    return { openModal, closeModal };
};

/**
 * Initialize the kayak gallery modal
 */
export const initializeGalleryModal = () => {
    const galleryModal = document.getElementById('kayak-gallery-modal');
    if (!galleryModal) {
        console.warn('Gallery modal not found.');
        return;
    }

    // Move gallery modal to body to prevent clipping issues
    document.body.appendChild(galleryModal);

    const modalImage = galleryModal.querySelector('#kayak-gallery-modal-image');
    const modalTitle = galleryModal.querySelector('.kayak-gallery-modal-title');
    const closeButton = galleryModal.querySelector('.kayak-modal-close');

    // Functions to open and close modal
    const openModal = (imageSrc, imageTitle) => {
        console.log('Opening gallery modal');
        if (modalImage) modalImage.src = imageSrc;
        if (modalTitle) modalTitle.textContent = imageTitle || '';
        
        // Show modal with fade effect
        galleryModal.style.display = 'flex';
        // Add visible class for consistency with designer modal
        galleryModal.classList.add('modal-visible');
        
        // Hide all zoom buttons when modal is open
        document.querySelectorAll('.zoom-icon').forEach(icon => {
            icon.style.display = 'none';
        });
        
        // Add theme toggle button
        addGalleryThemeToggleButton();
    };

    const closeModal = () => {
        console.log('Closing gallery modal');
        // First remove the visible class to trigger opacity transition
        galleryModal.classList.remove('modal-visible');
        // Then hide after transition completes
        setTimeout(() => {
            galleryModal.style.display = 'none';
            
            // Show zoom buttons again when modal is closed
            document.querySelectorAll('.zoom-icon').forEach(icon => {
                icon.style.display = '';
            });
        }, 300); // Match the CSS transition time
    };
    
    /**
     * Adds a theme toggle button to the gallery modal for switching between light and dark backgrounds
     */
    const addGalleryThemeToggleButton = () => {
        // Remove any existing toggle button first
        const existingToggle = galleryModal.querySelector('.modal-theme-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'modal-theme-toggle';
        
        // Set initial state based on stored preference or default to dark
        const isDarkMode = localStorage.getItem('kayak-modal-theme') !== 'light';
        updateGalleryToggleButton(toggleBtn, isDarkMode);
        
        // Apply saved theme preference
        if (!isDarkMode) {
            galleryModal.classList.add('light-mode');
        } else {
            galleryModal.classList.remove('light-mode');
        }
        
        // Add event listener
        toggleBtn.addEventListener('click', (event) => {
            // Prevent default behavior and stop event propagation to prevent modal closing
            event.preventDefault();
            event.stopPropagation();
            
            // Toggle mode
            const newIsDarkMode = !galleryModal.classList.contains('light-mode');
            
            if (newIsDarkMode) {
                // Switch to light mode
                galleryModal.classList.add('light-mode');
                localStorage.setItem('kayak-modal-theme', 'light');
            } else {
                // Switch to dark mode
                galleryModal.classList.remove('light-mode');
                localStorage.setItem('kayak-modal-theme', 'dark');
            }
            
            // Update button text/icon
            updateGalleryToggleButton(toggleBtn, !newIsDarkMode);
            
            console.log('Gallery theme toggled to:', newIsDarkMode ? 'light mode' : 'dark mode');
            
            // Return false to prevent any other handlers
            return false;
        });
        
        // Add to modal
        galleryModal.appendChild(toggleBtn);
    };
    
    /**
     * Updates gallery toggle button text and icon based on current mode
     */
    const updateGalleryToggleButton = (button, isDarkMode) => {
        if (isDarkMode) {
            button.innerHTML = '<span class="modal-theme-toggle-icon">☀️</span> Light Mode';
        } else {
            button.innerHTML = '<span class="modal-theme-toggle-icon">🌙</span> Dark Mode';
        }
    };

    // Add click handlers to gallery item images and zoom icons
    const galleryItems = document.querySelectorAll('.gallery-item');
    console.log('Found gallery items for modal:', galleryItems.length);
    
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        const zoomIcon = item.querySelector('.zoom-icon');
        const title = item.querySelector('h3')?.textContent || 'Kayak Design';
        
        console.log('Gallery item:', item);
        console.log('Gallery item img:', img);
        console.log('Gallery item zoom icon:', zoomIcon);
        console.log('Gallery item title:', title);
        
        // Handle clicks on both the image and zoom icon
        if (img) {
            console.log('Adding click handler to gallery image');
            img.addEventListener('click', () => {
                console.log('Gallery image clicked');
                openModal(img.src, title);
            });
        }
        
        if (zoomIcon) {
            console.log('Adding click handler to gallery zoom icon');
            // Use data attributes if available, otherwise use the image source
            const modalImage = zoomIcon.getAttribute('data-modal-image') || (img ? img.src : '');
            const modalTitle = zoomIcon.getAttribute('data-modal-title') || title;
            
            zoomIcon.addEventListener('click', (e) => {
                console.log('Gallery zoom icon clicked');
                e.stopPropagation();
                openModal(modalImage, modalTitle);
            });
        }
    });

    // Close button event listener
    if (closeButton) {
        console.log('Adding click event to gallery close button');
        closeButton.addEventListener('click', closeModal);
    } else {
        console.error('Close button not found in gallery modal');
    }

    // Add event listener to close modal when clicking outside content
    galleryModal.addEventListener('click', (e) => {
        // Log what was clicked to help debug
        console.log('Gallery modal clicked, target:', e.target, 'current target:', e.currentTarget);
        
        // Close if clicking on the modal background (not on any of its content children)
        // This matches the designer modal behavior exactly
        if (e.target === galleryModal || (!e.target.closest('.kayak-modal-content') && 
                                       !e.target.closest('.kayak-modal-close'))) {
            console.log('Gallery modal background clicked, closing modal');
            closeModal();
        }
    });

    return { openModal, closeModal };
};
