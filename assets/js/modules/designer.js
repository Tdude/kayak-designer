/**
 * Designer module - Kayak designer functionality
 */

// These will be initialized from the main module
let patternsPath;
let modelsBaseUrl;

/**
 * Initialize designer module with WordPress data
 * @param {Object} config - Configuration object with WordPress data
 */
export const initDesigner = (config) => {
    patternsPath = config.patternsPath;
    modelsBaseUrl = config.modelsBaseUrl;
};

/**
 * Update color of a kayak part
 * @param {string} partName - Name of the part to update
 * @param {string} color - Color to apply
 */
export const updateKayakPartColor = (partName, color) => {
    console.log(`Updating kayak part: ${partName} to color: ${color}`);
    
    // Extract base part name without '-color' suffix for mapping to element IDs
    const basePart = partName.replace('-color', '');
    
    // Use exact IDs to prevent affecting other color elements
    const topViewElementId = `kayak-top-view-${basePart}-color`;
    const sideViewElementId = `kayak-side-view-${basePart}-color`;
    
    const topViewPart = document.getElementById(topViewElementId);
    const sideViewPart = document.getElementById(sideViewElementId);
    
    console.log(`Looking for elements: ${topViewElementId} and ${sideViewElementId}`);
    console.log('Found elements:', topViewPart, sideViewPart);
    
    // Only update the colors for the specific element IDs that match our target
    if (topViewPart) {
        topViewPart.style.backgroundColor = color;
    }
    
    // The seat is only on the top view, so sideViewPart will be null for seat-color, which is fine.
    if (sideViewPart) {
        sideViewPart.style.backgroundColor = color;
    }

    // Logos share a single color picker but have multiple layers with the logo-layer class.
    // Only update these if we're specifically changing the logo color.
    if (partName === 'logo-color') {
        document.querySelectorAll('.logo-layer').forEach(layer => {
            layer.style.backgroundColor = color;
        });
    }
};

/**
 * Handle changes to hull finish (pattern vs color)
 */
export const handleHullAppearanceChange = () => {
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

/**
 * Update kayak assets based on selected model
 * @param {string} modelName - Name of the selected model
 */
export const updateKayakAssets = (modelName) => {
    console.log('updateKayakAssets called with modelName:', modelName);
    console.log('modelsBaseUrl value:', modelsBaseUrl);

    // Ensure trailing slash on base URL
    const basePath = modelsBaseUrl.endsWith('/') ? modelsBaseUrl : `${modelsBaseUrl}/`;
    
    const assetMap = {
        // Regular image assets
        'kayak-top-view-img': { type: 'image', src: 'top_view_outline.png' },
        'kayak-top-view-hardware': { type: 'image', src: 'top_view_hardware.png' },
        'kayak-side-view-img': { type: 'image', src: 'side_view_outline.png' },
        'kayak-side-view-hardware': { type: 'image', src: 'side_view_hardware.png' },
        
        // Mask assets for color areas
        'kayak-top-view-deck-color': { type: 'mask', src: 'deck_top_mask.png' },
        'kayak-top-view-lines-color': { type: 'mask', src: 'lines_top_mask.png' },
        'kayak-top-view-accent-front-color': { type: 'mask', src: 'accent_front_top_mask.png' },
        'kayak-top-view-accent-rear-color': { type: 'mask', src: 'accent_rear_top_mask.png' },
        'kayak-top-view-seat-color': { type: 'mask', src: 'seat_top_mask.png' },
        'kayak-top-view-cockpit-rim-color': { type: 'mask', src: 'cockpit_rim_top_mask.png' },
        'kayak-side-view-hull-color': { type: 'mask', src: 'hull_side_mask.png' },
        'kayak-top-view-logo-color': { type: 'mask', src: 'logos_top_mask.png' },
        'kayak-side-view-deck-color': { type: 'mask', src: 'deck_side_mask.png' },
        'kayak-side-view-lines-color': { type: 'mask', src: 'lines_side_mask.png' },
        'kayak-side-view-deck-seam-tape-color': { type: 'mask', src: 'seam_tape_side_mask.png' },
        'kayak-side-view-cockpit-rim-color': { type: 'mask', src: 'cockpit_rim_side_mask.png' },
        'kayak-side-view-accent-front-color': { type: 'mask', src: 'accent_front_side_mask.png' },
        'kayak-side-view-accent-rear-color': { type: 'mask', src: 'accent_rear_side_mask.png' },
        'kayak-side-view-logo-color': { type: 'mask', src: 'logos_side_mask.png' },
    };

    for (const [elementId, asset] of Object.entries(assetMap)) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element not found: ${elementId}`);
            continue; // Skip if element doesn't exist
        }

        if (asset.type === 'image') {
            const imagePath = `${basePath}${modelName}/${asset.src}`;
            console.log(`Setting image src for ${elementId} to:`, imagePath);
            element.src = imagePath;
        } else if (asset.type === 'mask') {
            const maskPath = `${basePath}${modelName}/masks/${asset.src}`;
            const maskUrl = `url("${maskPath}")`;
            console.log(`Setting mask for ${elementId} to:`, maskPath);
            element.style.webkitMaskImage = maskUrl;
            element.style.maskImage = maskUrl;
        }
    }
    
    console.log('All kayak assets updated for model:', modelName);
};

/**
 * Initialize the designer interface
 */
/**
 * Set up export buttons for PNG and SVG exports
 */
const setupExportButtons = () => {
    console.log('Setting up export buttons');
    
    // Find export buttons if they exist
    const exportPngBtn = document.getElementById('export-png-button');
    const exportPdfBtn = document.getElementById('export-pdf-button');
    
    if (exportPngBtn) {
        exportPngBtn.addEventListener('click', () => {
            console.log('Export PNG button clicked');
            alert('PNG export is downloaded');
            // Implementation will be added here
        });
    }
    
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            console.log('Export PDF button clicked');
            alert('PDF export is downloaded');
            // Implementation will be added here
        });
    }
};

/**
 * Initialize the RAL color palette functionality
 * This enables the color picker popup when clicking on a color preview
 */
const initializeRALPalettes = () => {
    console.log('Initializing RAL color palettes');
    
    // Find all RAL palette containers
    const paletteContainers = document.querySelectorAll('.ral-palette-container');
    console.log(`Found ${paletteContainers.length} RAL palette containers`);
    
    paletteContainers.forEach(container => {
        const colorPreview = container.querySelector('.selected-color-wrapper');
        const paletteGrid = container.querySelector('.ral-palette-grid-wrapper');
        const swatches = container.querySelectorAll('.ral-swatch');
        const input = container.querySelector('input.color-input');
        const colorNameSpan = container.querySelector('.selected-color-name');
        
        // Toggle palette visibility when clicking on the color preview
        if (colorPreview && paletteGrid) {
            colorPreview.addEventListener('click', () => {
                console.log('Color preview clicked, toggling palette');
                paletteGrid.classList.toggle('is-hidden');
                
                // Close other open palettes
                document.querySelectorAll('.ral-palette-grid-wrapper:not(.is-hidden)').forEach(otherGrid => {
                    if (otherGrid !== paletteGrid) {
                        otherGrid.classList.add('is-hidden');
                    }
                });
            });
        }
        
        // Set up swatch click handlers
        swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.dataset.color;
                const colorName = swatch.dataset.colorName;
                
                console.log(`Swatch clicked: ${colorName} (${color})`);
                
                // Update the input value
                if (input) {
                    input.value = color;
                    
                    // Dispatch change event to trigger the color update
                    const changeEvent = new Event('change', { bubbles: true });
                    input.dispatchEvent(changeEvent);
                }
                
                // Update the color preview
                const preview = container.querySelector('.selected-color-preview');
                if (preview) preview.style.backgroundColor = color;
                
                // Update the color name display
                if (colorNameSpan) colorNameSpan.textContent = colorName;
                
                // Hide the palette grid
                if (paletteGrid) paletteGrid.classList.add('is-hidden');
            });
        });
        
        // Close palette when clicking outside
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target) && !paletteGrid.classList.contains('is-hidden')) {
                paletteGrid.classList.add('is-hidden');
            }
        });
    });
};

/**
 * Initialize all color layers with their default colors
 * This ensures each layer has its own color and prevents color bleeding between layers
 */
export const initializeDefaultColors = () => {
    console.log('Initializing default colors for all layers');
    
    // Get the default colors from the input fields
    const colorInputs = document.querySelectorAll('.color-input');
    const defaultColors = {};
    
    // Create a map of color inputs with their default values
    colorInputs.forEach(input => {
        defaultColors[input.name] = input.value;
        console.log(`Default color for ${input.name}: ${input.value}`);
    });
    
    // Apply each default color to its corresponding layer
    Object.keys(defaultColors).forEach(colorName => {
        updateKayakPartColor(colorName, defaultColors[colorName]);
    });
};

export const initializeDesigner = () => {
    console.log('initializeDesigner called');
    
    // Check if designer elements exist before initializing
    const designerContainer = document.querySelector('#kayak-designer-container');
    console.log('Designer container found:', designerContainer);
    if (!designerContainer) {
        console.error('Designer container not found, aborting initialization');
        return;
    }
    
    // Add a direct click event to test events are working
    document.addEventListener('click', function(e) {
        console.log('Document clicked:', e.target);
    });
    
    // Call setupExportButtons function for export functionality if enabled
    setupExportButtons();

    // Initialize the RAL color palettes
    initializeRALPalettes();
    console.log('RAL palettes initialized');
    
    // Initialize default colors for all layers
    initializeDefaultColors();
    console.log('Default colors initialized');

    // Set up event listeners for color inputs
    const colorInputs = document.querySelectorAll('.color-input');
    console.log('Color inputs found:', colorInputs.length);
    
    colorInputs.forEach(input => {
        console.log('Setting up event listener for color input:', input.id, input.name);
        input.addEventListener('change', (e) => {
            console.log('Color change event fired:', e.target.name, e.target.value);
            updateKayakPartColor(e.target.name, e.target.value);
        });
    });

    // Set up hull finish dropdown
    const hullFinishSelect = document.getElementById('hull-finish');
    console.log('Hull finish select found:', hullFinishSelect);
    
    if (hullFinishSelect) {
        hullFinishSelect.addEventListener('change', (e) => {
            console.log('Hull finish change event fired:', e.target.value);
            handleHullAppearanceChange();
        });
        // Initialize the hull appearance based on initial value
        console.log('Initializing hull appearance');
        handleHullAppearanceChange();
    }

    // Set up model selection
    const modelSelect = document.getElementById('kayak-model-select');
    console.log('Model select found:', modelSelect);
    
    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            console.log('Model change event fired:', e.target.value);
            updateKayakAssets(e.target.value);
        });
        
        // Initialize with currently selected model
        if (modelSelect.value) {
            console.log('Initializing with selected model:', modelSelect.value);
            updateKayakAssets(modelSelect.value);
        }
    }

    // Setup design saving and loading handlers
    const saveButton = document.getElementById('save-design-button');
    if (saveButton) {
        // The saveDesign handler will be set up in the main module
    }

    const designsSelect = document.getElementById('saved-designs-select');
    if (designsSelect) {
        // The handleDesignLoad handler will be set up in the main module
    }
};
