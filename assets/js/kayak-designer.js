document.addEventListener('DOMContentLoaded', () => {
    // Ensure localized data from PHP is available
    if (typeof window.kayakDesignerData === 'undefined' || !window.kayakDesignerData.patternsPath || !window.kayakDesignerData.ajaxUrl || !window.kayakDesignerData.nonce || typeof window.kayakDesignerData.isUserLoggedIn === 'undefined' || !window.kayakDesignerData.modelsBaseUrl) {
        console.error('Kayak Designer script failed to load: Missing required PHP-localized variables for models.');
        return;
    }

    const { ajaxUrl, nonce, patternsPath, isUserLoggedIn, modelsBaseUrl } = window.kayakDesignerData;

    // --- 1. CORE COLOR AND APPEARANCE LOGIC ---

    const updateKayakPartColor = (partName, color) => {
        const topViewPart = document.getElementById(`kayak-top-view-${partName}`);
        const sideViewPart = document.getElementById(`kayak-side-view-${partName}`);
        
        if (topViewPart) topViewPart.style.backgroundColor = color;
        // The seat is only on the top view, so sideViewPart will be null, which is fine.
        if (sideViewPart) sideViewPart.style.backgroundColor = color;

        // Logos share a single color picker but have multiple layers.
        if (partName === 'logo-color') {
            document.querySelectorAll('.logo-layer').forEach(layer => layer.style.backgroundColor = color);
        }
    };

    const handleHullAppearanceChange = () => {
        const finishSelect = document.getElementById('hull-finish');

        // Get elements for HULL ONLY
        const hullColorInput = document.getElementById('hull-color');
        const hullSideView = document.getElementById('kayak-side-view-hull-color');
        const hullTopView = document.getElementById('kayak-top-view-hull-color');

        // Get the UI containers for the HULL to hide/show them
        const hullColorLabel = document.querySelector('label[for="hull-color"]');
        const hullColorPicker = hullColorInput?.closest('.ral-palette-container');

        // We only require the side view and the picker to proceed. The top view is optional.
        if (!finishSelect || !hullSideView || !hullColorPicker || !hullColorLabel) {
            console.error("Hull appearance change handler couldn't find essential hull elements (side view or picker).");
            return;
        }

        const selectedFinish = finishSelect.value;

        if (selectedFinish.includes('carbon')) {
            const patternUrl = `${patternsPath}${selectedFinish}.png`;
            
            // Apply pattern to both hull views (top and side), if they exist
            [hullSideView, hullTopView].forEach(el => {
                if (el) {
                    el.style.backgroundColor = '';
                    el.style.backgroundImage = `url(${patternUrl})`;
                    el.classList.add('pattern-active');
                }
            });

            // Hide ONLY the hull color picker and its label
            hullColorLabel.style.display = 'none';
            hullColorPicker.style.display = 'none';

        } else { // Handle standard/solid color for hull
            // Remove pattern from both hull views
            [hullSideView, hullTopView].forEach(el => {
                if (el) {
                    el.style.backgroundImage = 'none';
                    el.classList.remove('pattern-active');
                }
            });

            // Restore solid color for hull (this function updates both views if they exist)
            if (hullColorInput) updateKayakPartColor('hull-color', hullColorInput.value);

            // Show ONLY the hull color picker and its label
            hullColorLabel.style.display = '';
            hullColorPicker.style.display = '';
        }
    };

    // --- 2: DYNAMIC ASSET LOADING FOR MULTI-MODEL SUPPORT ---

    const updateKayakAssets = (modelName) => {
        if (!modelName) return;

        // Define all parts and their corresponding asset files
        const assetMap = {
            // Top View Images
            'kayak-top-view-img': { type: 'image', src: 'top_view_outline.png' },
            'kayak-top-view-hardware': { type: 'image', src: 'top_view_hardware.png' },
            // Side View Images
            'kayak-side-view-img': { type: 'image', src: 'side_view_outline.png' },
            'kayak-side-view-hardware': { type: 'image', src: 'side_view_hardware.png' },
            
            // Top View Masks
            'kayak-top-view-deck-color': { type: 'mask', src: 'deck_top_mask.png' },
            'kayak-top-view-lines-color': { type: 'mask', src: 'lines_top_mask.png' },
            'kayak-top-view-accent-front-color': { type: 'mask', src: 'accent_front_top_mask.png' },
            'kayak-top-view-accent-rear-color': { type: 'mask', src: 'accent_rear_top_mask.png' },
            'kayak-top-view-cockpit-rim-color': { type: 'mask', src: 'cockpit_rim_top_mask.png' },
            'kayak-top-view-seat-color': { type: 'mask', src: 'seat_top_mask.png' },
            'kayak-top-view-logo-color': { type: 'mask', src: 'logos_top_mask.png' },

            // Side View Masks
            'kayak-side-view-hull-color': { type: 'mask', src: 'hull_side_mask.png' },
            'kayak-side-view-deck-color': { type: 'mask', src: 'deck_side_mask.png' },
            'kayak-side-view-deck-seam-tape-color': { type: 'mask', src: 'seam_tape_side_mask.png' },
            'kayak-side-view-lines-color': { type: 'mask', src: 'lines_side_mask.png' },
            'kayak-side-view-cockpit-rim-color': { type: 'mask', src: 'cockpit_rim_side_mask.png' },
            'kayak-side-view-accent-front-color': { type: 'mask', src: 'accent_front_side_mask.png' },
            'kayak-side-view-accent-rear-color': { type: 'mask', src: 'accent_rear_side_mask.png' },
            'kayak-side-view-logo-color': { type: 'mask', src: 'logos_side_mask.png' },
        };

        for (const [elementId, asset] of Object.entries(assetMap)) {
            const element = document.getElementById(elementId);
            if (!element) continue; // Skip if element doesn't exist

            if (asset.type === 'image') {
                element.src = `${modelsBaseUrl}${modelName}/${asset.src}`;
            } else if (asset.type === 'mask') {
                const maskUrl = `url("${modelsBaseUrl}${modelName}/masks/${asset.src}")`;
                element.style.webkitMaskImage = maskUrl;
                element.style.maskImage = maskUrl;
            }
        }
    };

    // --- 3. EXPORT FUNCTIONALITY ---

    // Helper to load an image and handle CORS
    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    };

    // Helper to extract URL from CSS properties like `url("...")`
    const getUrlFromCss = (cssProperty) => {
        if (!cssProperty || cssProperty === 'none') return null;
        const match = cssProperty.match(/url\("(.*?)"\)/);
        return match ? match[1] : null;
    };

    const renderViewToCanvas = async (viewContainerId) => {
        const viewContainer = document.getElementById(viewContainerId);
        if (!viewContainer) throw new Error(`Container not found: ${viewContainerId}`);

        const outlineImageEl = viewContainer.querySelector('.kayak-outline-image');
        const hardwareLayerEl = viewContainer.querySelector('.hardware-layer');
        const colorLayers = Array.from(viewContainer.querySelectorAll('.color-layer'));

        const outlineImage = await loadImage(outlineImageEl.src);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = outlineImage.naturalWidth;
        canvas.height = outlineImage.naturalHeight;

        // 1. Draw the base outline
        ctx.drawImage(outlineImage, 0, 0);

        // 2. Draw each color layer
        for (const layer of colorLayers) {
            const style = window.getComputedStyle(layer);
            const maskUrl = getUrlFromCss(style.webkitMaskImage || style.maskImage);
            const bgColor = style.backgroundColor;
            const bgImage = getUrlFromCss(style.backgroundImage);

            if (maskUrl && (bgColor !== 'rgba(0, 0, 0, 0)' || bgImage)) {
                const mask = await loadImage(maskUrl);
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;

                // Fill with color or pattern
                if (bgImage) {
                    const patternImg = await loadImage(bgImage);
                    tempCtx.drawImage(patternImg, 0, 0, canvas.width, canvas.height);
                } else {
                    tempCtx.fillStyle = bgColor;
                    tempCtx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Apply the mask
                tempCtx.globalCompositeOperation = 'destination-in';
                tempCtx.drawImage(mask, 0, 0);

                // Draw the masked layer onto the main canvas
                ctx.drawImage(tempCanvas, 0, 0);
            }
        }

        // 3. Draw the hardware layer on top
        if (hardwareLayerEl && hardwareLayerEl.src) {
            const hardwareImage = await loadImage(hardwareLayerEl.src);
            ctx.drawImage(hardwareImage, 0, 0);
        }

        return canvas;
    };

    const createCombinedCanvas = async () => {
        const [topCanvas, sideCanvas] = await Promise.all([
            renderViewToCanvas('kayak-top-view-container'),
            renderViewToCanvas('kayak-side-view-container')
        ]);

        const combinedCanvas = document.createElement('canvas');
        const ctx = combinedCanvas.getContext('2d');
        const spacing = 20; // Space between the two views

        // Scale to a max width of 1200px for reasonable export size
        const scale = Math.min(1, 1200 / Math.max(topCanvas.width, sideCanvas.width));
        const scaledTopWidth = topCanvas.width * scale;
        const scaledTopHeight = topCanvas.height * scale;
        const scaledSideWidth = sideCanvas.width * scale;
        const scaledSideHeight = sideCanvas.height * scale;

        combinedCanvas.width = Math.max(scaledTopWidth, scaledSideWidth);
        combinedCanvas.height = scaledTopHeight + scaledSideHeight + spacing;
        
        // Draw scaled images to the combined canvas
        ctx.drawImage(topCanvas, (combinedCanvas.width - scaledTopWidth) / 2, 0, scaledTopWidth, scaledTopHeight);
        ctx.drawImage(sideCanvas, (combinedCanvas.width - scaledSideWidth) / 2, scaledTopHeight + spacing, scaledSideWidth, scaledSideHeight);

        return combinedCanvas;
    };

    const exportToPng = async () => {
        const canvas = await createCombinedCanvas();
        const link = document.createElement('a');
        link.download = 'kayak-design.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const exportToPdf = async () => {
        const canvas = await createCombinedCanvas();
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('kayak-design.pdf');
    };

    // --- 4. DESIGN MANAGEMENT (SAVE/LOAD) ---

    const LOCAL_STORAGE_KEY = 'kayak_designer_designs';

    const collectDesignData = () => {
        const data = {};
        document.querySelectorAll('.color-input').forEach(input => {
            data[input.name] = input.value;
        });
        data['hull-finish'] = document.getElementById('hull-finish').value;
        return data;
    };

    const applyDesign = (designData) => {
        Object.entries(designData).forEach(([key, value]) => {
            const input = document.querySelector(`[name="${key}"]`);
            if (!input) return;

            if (key === 'hull-finish') {
                input.value = value;
            } else if (input.classList.contains('color-input')) {
                input.value = value;

                // Directly update the visual color of the kayak part
                updateKayakPartColor(key, value);

                // Update the UI of the color picker control
                const container = input.closest('.ral-palette-container');
                if (container) {
                    const preview = container.querySelector('.selected-color-preview');
                    const colorNameSpan = container.querySelector('.selected-color-name');
                    
                    if (preview) preview.style.backgroundColor = value;

                    // Find the corresponding swatch to get the color name, case-insensitively
                    let swatchName = 'Custom'; // Fallback
                    const allSwatches = container.querySelectorAll('.ral-swatch');
                    for (const swatch of allSwatches) {
                        if (swatch.dataset.color.toLowerCase() === value.toLowerCase()) {
                            swatchName = swatch.dataset.colorName;
                            break;
                        }
                    }
                    if (colorNameSpan) colorNameSpan.textContent = swatchName;
                }
            }
        });

        // After applying all data, refresh the hull's appearance (pattern vs. color)
        handleHullAppearanceChange();
    };

    const saveDesign = async () => {
        const designNameInput = document.getElementById('design-name');
        const designName = designNameInput.value.trim();
        if (!designName) {
            alert('Please enter a name for your design.');
            return;
        }
        const designData = collectDesignData();

        if (isUserLoggedIn === 'true') {
            // Logged-in user: Save to database via AJAX
            const modelName = document.getElementById('kayak-model-select').value;
            const formData = new FormData();
            formData.append('action', 'save_kayak_design');
            formData.append('nonce', nonce);
            formData.append('design_name', designName);
            formData.append('design_data', JSON.stringify(designData));
            formData.append('model_name', modelName);

            try {
                // Generate preview image
                const previewCanvas = await createCombinedCanvas();
                const previewImage = previewCanvas.toDataURL('image/png'); // Get as Base64
                formData.append('preview_image', previewImage);

                const response = await fetch(ajaxUrl, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                alert(result.success ? 'Design saved successfully.' : `Error: ${result.data}`);
                if (result.success) {
                    loadDesigns();
                }
            } catch (error) {
                console.error('Error saving design:', error);
                alert('An error occurred while saving the design.');
            }
        } else {
            // Guest user: Save to local storage
            try {
                const designs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
                designs[designName] = designData;
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(designs));
                alert('Design saved to your browser!');
                loadDesigns();
            } catch (e) {
                console.error('Error saving to local storage:', e);
                alert('Could not save design. Your browser storage might be full or disabled.');
            }
        }
    };

    const loadDesigns = async () => {
        const select = document.getElementById('saved-designs-select');
        if (!select) return;
        
        const placeholder = isUserLoggedIn === 'true' ? 'Select a design from your account...' : 'Select a design from your browser...';
        select.innerHTML = `<option value="">${placeholder}</option>`;

        if (isUserLoggedIn === 'true') {
            // Logged-in user: Load from database
            try {
                const response = await fetch(`${ajaxUrl}?action=get_kayak_designs&nonce=${nonce}`);
                const result = await response.json();
                
                console.log('AJAX response for get_kayak_designs:', result); // DEBUGGING

                if (result.success) {
                    if (result.data.length === 0) {
                        console.log('No designs found in the database for the current user.');
                    }
                    result.data.forEach(design => {
                        select.add(new Option(design.name, design.id));
                    });
                } else {
                    console.error('Failed to load designs:', result.data);
                }
            } catch (error) {
                console.error('Error fetching designs:', error);
            }
        } else {
            // Guest user: Load from local storage
            let designs = {};
            try {
                const storedDesigns = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (storedDesigns) {
                    designs = JSON.parse(storedDesigns);
                }
                // Validate that the parsed data is a non-null object
                if (typeof designs !== 'object' || designs === null || Array.isArray(designs)) {
                    throw new Error('Stored data is not a valid object.');
                }
            } catch (e) {
                console.error('Could not parse designs from local storage. Clearing invalid data.', e);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                designs = {}; // Reset to empty object
            }
            
            Object.keys(designs).forEach(name => {
                select.add(new Option(name, name));
            });
        }
    };

    const handleDesignLoad = async (e) => {
        const selectedValue = e.target.value;
        const designNameInput = document.getElementById('design-name');
        if (!selectedValue) return;

        if (isUserLoggedIn === 'true') {
            // Logged-in user: Load from database
            const response = await fetch(`${ajaxUrl}?action=load_kayak_design&nonce=${nonce}&design_id=${selectedValue}`);
            const result = await response.json();

            console.log('--- Loading Design from Server ---');
            console.log('Raw response:', result);

            if (result.success) {
                console.log('Design data received:', result.data);
                console.log('Type of design data:', typeof result.data);

                // The data might be a JSON string inside the data property, so we parse it if needed.
                const designObject = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
                
                console.log('Applying design object:', designObject);
                applyDesign(designObject);

                // Set design name in input field from the selected option's text
                designNameInput.value = e.target.options[e.target.selectedIndex].text;
            } else {
                console.error('Failed to load design:', result.data);
            }
        } else {
            // Guest user: Load from local storage
            const designs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
            const designData = designs[selectedValue];
            if (designData) {
                applyDesign(designData);
                designNameInput.value = selectedValue; // The name is the value
            }
        }
    };

    // --- 5. MODAL (FULL-SCREEN VIEW) ---

    const initializeModal = () => {
        const modal = document.getElementById('kayak-designer-modal');

        // If the designer modal isn't on the page, do nothing.
        // This is expected on pages that only have the gallery shortcode.
        if (!modal) {
            return;
        }

        const closeButton = modal.querySelector('.kayak-modal-close');
        const modalContentWrapper = modal.querySelector('.kayak-modal-content-wrapper');

        // Also check for the parts of the modal
        if (!closeButton || !modalContentWrapper) {
            console.error('Modal components not found. Modal functionality disabled.');
            return;
        }

        // Function to open the modal with a specific view
        const openModal = (viewContainer) => {
            if (!viewContainer) return;
            const clonedView = viewContainer.cloneNode(true);
            modalContentWrapper.innerHTML = ''; // Clear previous content
            modalContentWrapper.appendChild(clonedView);
            modal.style.display = 'block';
        };

        // Function to close the modal
        const closeModal = () => {
            modal.style.display = 'none';
            modalContentWrapper.innerHTML = ''; // Clean up
        };

        // Add listeners to zoom icons
        document.querySelectorAll('.zoom-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                const viewContainer = document.getElementById(`kayak-${view}-view-container`);
                if (viewContainer) {
                    openModal(viewContainer);
                }
            });
        });

        // Add listeners for closing the modal
        closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    };

    const initializeDesigner = () => {
        const designerContainer = document.getElementById('kayak-designer-container');
        // If the main designer container isn't on the page, don't initialize any of the designer-specific logic.
        if (!designerContainer) {
            return;
        }
        // --- Model Switching Logic ---
        const modelSelect = document.getElementById('kayak-model-select');
        if (modelSelect) {
            // Initial asset load based on the default selected model
            updateKayakAssets(modelSelect.value);

            // Listener for changes
            modelSelect.addEventListener('change', (e) => {
                updateKayakAssets(e.target.value);
            });
        }
        // Initialize color pickers
        document.querySelectorAll('.ral-palette-container').forEach(container => {
            const colorInput = container.querySelector('.color-input');
            if (!colorInput) return;
            const partName = colorInput.name;
            const preview = container.querySelector('.selected-color-preview');
            const gridWrapper = container.querySelector('.ral-palette-grid-wrapper');

            preview?.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = gridWrapper.classList.contains('is-hidden');
                document.querySelectorAll('.ral-palette-grid-wrapper').forEach(gw => gw.classList.add('is-hidden'));
                if (isHidden) gridWrapper.classList.remove('is-hidden');
            });

            gridWrapper?.addEventListener('click', (e) => {
                const swatch = e.target.closest('.ral-swatch');
                if (!swatch) return;
                const newColor = swatch.dataset.color;
                const newColorName = swatch.dataset.colorName;
                const colorNameSpan = container.querySelector('.selected-color-name');

                if (colorInput) colorInput.value = newColor;
                if (preview) preview.style.backgroundColor = newColor;
                if (colorNameSpan) colorNameSpan.textContent = newColorName;

                container.dispatchEvent(new CustomEvent('colorSelected', { detail: { color: newColor } }));
                gridWrapper.classList.add('is-hidden');
            });

            if (colorInput.value) updateKayakPartColor(partName, colorInput.value);
            container.addEventListener('colorSelected', (e) => updateKayakPartColor(partName, e.detail.color));
        });

        // Attach all other event listeners
        document.getElementById('hull-finish')?.addEventListener('change', handleHullAppearanceChange);
        document.getElementById('export-png-button')?.addEventListener('click', exportToPng);
        document.getElementById('export-pdf-button')?.addEventListener('click', exportToPdf);
        document.getElementById('save-design-button')?.addEventListener('click', saveDesign);
        document.getElementById('saved-designs-select')?.addEventListener('change', handleDesignLoad);

        // Global listener to close open color palettes
        document.addEventListener('click', () => {
            document.querySelectorAll('.ral-palette-grid-wrapper:not(.is-hidden)').forEach(grid => grid.classList.add('is-hidden'));
        });

        // Set initial states
        handleHullAppearanceChange();
        initializeModal();
        console.log('Kayak Designer Initialized');
    };

    // --- 6. GALLERY VOTING ---

    const handleVoteClick = async (e) => {
        if (!e.target.classList.contains('vote-button')) return;

        const button = e.target;
        const designId = button.dataset.designId;
        const nonce = button.dataset.nonce;

        // Check if user is logged in (using a simple check for a WordPress admin bar)
        const isLoggedIn = document.body.classList.contains('logged-in');

        if (isLoggedIn) {
            // --- Logged-in user voting ---
            button.disabled = true;
            const formData = new FormData();
            formData.append('action', 'kayak_designer_handle_vote');
            formData.append('design_id', designId);
            formData.append('nonce', nonce);

            try {
                const response = await fetch(ajaxUrl, { method: 'POST', body: formData });
                const result = await response.json();
                if (result.success) {
                    const voteCountSpan = button.parentElement.querySelector('.vote-count');
                    if (voteCountSpan) voteCountSpan.textContent = result.data.new_vote_count;
                    button.textContent = 'Voted!';
                } else {
                    alert(`Error: ${result.data}`);
                    button.disabled = false;
                }
            } catch (error) {
                console.error('Vote request failed:', error);
                button.disabled = false;
            }
        } else {
            // --- Guest voting: show email form ---
            let form = button.nextElementSibling;
            if (form && form.classList.contains('guest-vote-form')) {
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
            } else {
                form = document.createElement('form');
                form.className = 'guest-vote-form';
                form.innerHTML = `
                    <input type="email" placeholder="Enter your email to vote" required />
                    <button type="submit">Confirm Vote</button>
                `;
                button.after(form);

                form.addEventListener('submit', async (ev) => {
                    ev.preventDefault();
                    const emailInput = form.querySelector('input[type="email"]');
                    const email = emailInput.value;
                    const submitButton = form.querySelector('button');

                    submitButton.disabled = true;
                    submitButton.textContent = 'Sending...';

                    const formData = new FormData();
                    formData.append('action', 'kayak_designer_request_guest_vote');
                    formData.append('design_id', designId);
                    formData.append('email', email);
                    formData.append('nonce', nonce);

                    try {
                        const response = await fetch(ajaxUrl, { method: 'POST', body: formData });
                        const result = await response.json();
                        if (result.success) {
                            form.innerHTML = `<p>${result.data}</p>`;
                        } else {
                            alert(`Error: ${result.data}`);
                            submitButton.disabled = false;
                            submitButton.textContent = 'Confirm Vote';
                        }
                    } catch (error) {
                        console.error('Guest vote request failed:', error);
                        submitButton.disabled = false;
                        submitButton.textContent = 'Confirm Vote';
                    }
                });
            }
        }
    };

    // Attach listener to the body to catch clicks on buttons in the shortcode content
    document.body.addEventListener('click', handleVoteClick);

    // --- 7. VOTE CONFIRMATION ALERT ---
    const showVoteConfirmationAlert = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('vote_confirmed')) {
            alert('Thank you! Your vote has been confirmed.');
            // Clean the URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    };

    const initializeGalleryModal = () => {
    const gallery = document.querySelector('.kayak-design-gallery');
    if (!gallery) return; // Exit if no gallery on the page.

    // 1. Create and inject the modal HTML if it doesn't already exist.
    if (!document.getElementById('kayak-gallery-modal')) {
        const modalHTML = `
            <div id="kayak-gallery-modal" class="kayak-modal">
                <div class="kayak-modal-content-wrapper">
                    <span class="kayak-modal-close">&times;</span>
                    <figure>
                        <img id="kayak-gallery-modal-image" class="kayak-modal-content" src="" alt="Full-size design">
                        <figcaption id="kayak-gallery-modal-title"></figcaption>
                    </figure>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. Get modal elements
    const galleryModal = document.getElementById('kayak-gallery-modal');
    const modalImage = document.getElementById('kayak-gallery-modal-image');
    const modalTitle = document.getElementById('kayak-gallery-modal-title');
    const closeButton = galleryModal.querySelector('.kayak-modal-close');

    // 3. Prepare each gallery item with data attributes
    gallery.querySelectorAll('.gallery-item').forEach(item => {
        const preview = item.querySelector('.gallery-item-preview img');
        const titleEl = item.querySelector('h3');
        const imagePreviewLink = item.querySelector('.gallery-item-preview');

        if (preview && titleEl && imagePreviewLink) {
            const highResSrc = imagePreviewLink.dataset.highResImage || preview.src;
            const title = titleEl.textContent.trim();
            // Set the data attributes on the clickable preview element
            imagePreviewLink.dataset.modalImage = highResSrc;
            imagePreviewLink.dataset.modalTitle = title;
        }
    });

    // 4. Define modal open/close functions
    const openModal = (imageSrc, title) => {
        modalImage.src = imageSrc;
        modalTitle.textContent = title;
        galleryModal.style.display = 'flex'; // Use flex to center content
        setTimeout(() => galleryModal.classList.add('modal-visible'), 10); // Add class for fade-in
    };

    const closeModal = () => {
        galleryModal.classList.remove('modal-visible');
        // Wait for the transition to finish before hiding the modal and clearing the src
        setTimeout(() => {
            galleryModal.style.display = 'none';
            modalImage.src = '';
            modalTitle.textContent = '';
        }, 300); // Must match CSS transition duration
    };

    // 5. Add event listeners
    gallery.addEventListener('click', (e) => {
        const previewLink = e.target.closest('.gallery-item-preview');
        if (previewLink && previewLink.dataset.modalImage) {
            e.preventDefault();
            const imageSrc = previewLink.dataset.modalImage;
            const title = previewLink.dataset.modalTitle;
            openModal(imageSrc, title);
        }
    });

    closeButton.addEventListener('click', closeModal);

    galleryModal.addEventListener('click', (e) => {
        // Close if the user clicks on the dark backdrop (the content wrapper)
        if (e.target.classList.contains('kayak-modal-content-wrapper')) {
            closeModal();
        }
    });
};

// --- 9. INITIALIZATION ---
initializeDesigner();
loadDesigns();
showVoteConfirmationAlert();
initializeGalleryModal();

});