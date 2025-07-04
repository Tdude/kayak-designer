/**
 * Storage module - Design save/load functionality
 */
import { setLocalStorageItem, getLocalStorageItem } from './utils.js';
import { createCombinedCanvas } from './render.js';

// Constant for local storage key
const LOCAL_STORAGE_KEY = 'kayak_designer_designs';

// These will be initialized from the main module
let ajaxUrl;
let nonce;
let isUserLoggedIn;

/**
 * Initialize storage module with WordPress data
 * @param {Object} config - Configuration object with WordPress data
 */
export const initStorage = (config) => {
    ajaxUrl = config.ajaxUrl;
    nonce = config.nonce;
    // Fix for checking user login status - handle different formats
    isUserLoggedIn = config.isUserLoggedIn === true || config.isUserLoggedIn === 'true' || config.isUserLoggedIn === '1' || config.isUserLoggedIn === 1;
    console.log('Storage module initialized with:', {
        ajaxUrl,
        nonceLength: nonce ? nonce.length : 'missing',
        isUserLoggedIn,
        rawUserLoggedIn: config.isUserLoggedIn
    });
};

/**
 * Collect design data from form inputs
 * @returns {Object} - Design data object
 */
export const collectDesignData = () => {
    const data = {};
    document.querySelectorAll('.color-input').forEach(input => {
        data[input.name] = input.value;
    });
    
    const hullFinish = document.getElementById('hull-finish');
    if (hullFinish) {
        data['hull-finish'] = hullFinish.value;
    }
    
    return data;
};

/**
 * Apply design data to the kayak
 * @param {Object} designData - Design data to apply
 * @param {Function} updateKayakPartColor - Function to update kayak part colors
 * @param {Function} handleHullAppearanceChange - Function to update hull appearance
 */
export const applyDesign = (designData, updateKayakPartColor, handleHullAppearanceChange) => {
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

/**
 * Save design to server (logged-in users) or local storage (guests)
 * @returns {Promise<void>}
 */
export const saveDesign = async (updateKayakPartColor, handleHullAppearanceChange) => {
    const designNameInput = document.getElementById('design-name');
    const designName = designNameInput.value.trim();
    if (!designName) {
        alert('Please enter a name for your design.');
        return;
    }
    const designData = collectDesignData();

    if (isUserLoggedIn) {
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
                loadDesigns(updateKayakPartColor, handleHullAppearanceChange);
            }
        } catch (error) {
            console.error('Error saving design:', error);
            alert('An error occurred while saving the design.');
        }
    } else {
        // Guest user: Save to local storage
        try {
            const designs = getLocalStorageItem(LOCAL_STORAGE_KEY);
            designs[designName] = designData;
            const success = setLocalStorageItem(LOCAL_STORAGE_KEY, designs);
            
            if (success) {
                alert('Design saved to your browser!');
                loadDesigns(updateKayakPartColor, handleHullAppearanceChange);
            } else {
                alert('Could not save design. Your browser storage might be full or disabled.');
            }
        } catch (e) {
            console.error('Error saving to local storage:', e);
            alert('Could not save design. Your browser storage might be full or disabled.');
        }
    }
};

/**
 * Load saved designs into the select dropdown
 * @returns {Promise<void>}
 */
export const loadDesigns = async (updateKayakPartColor, handleHullAppearanceChange) => {
    const select = document.getElementById('saved-designs-select');
    if (!select) return;
    
    const placeholder = isUserLoggedIn ? 'Select a design from your account...' : 'Select a design from your browser...';
    select.innerHTML = `<option value="">${placeholder}</option>`;

    if (isUserLoggedIn) {
        // Logged-in user: Load from database
        try {
            console.log('Loading designs with AJAX - request details:', {
                ajaxUrl,
                nonce,
                isUserLoggedIn
            });
            
            // Use POST instead of GET for better compatibility
            const formData = new FormData();
            formData.append('action', 'get_kayak_designs');
            formData.append('nonce', nonce);
            
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            });
            
            console.log('AJAX response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
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
        const designs = getLocalStorageItem(LOCAL_STORAGE_KEY);
        Object.keys(designs).forEach(name => {
            select.add(new Option(name, name));
        });
    }
};

/**
 * Handle design select change event
 * @param {Event} e - Change event
 * @returns {Promise<void>}
 */
export const handleDesignLoad = async (e, updateKayakPartColor, handleHullAppearanceChange) => {
    const designId = e.target.value;
    if (!designId) return;

    if (isUserLoggedIn) {
        // Logged-in user: Fetch design from server
        try {
            console.log('Loading individual design with AJAX - request details:', {
                ajaxUrl,
                nonce,
                designId,
                isUserLoggedIn
            });
            
            // Use POST instead of GET for better compatibility
            const formData = new FormData();
            formData.append('action', 'load_kayak_design'); // Changed to match PHP handler name
            formData.append('nonce', nonce);
            formData.append('design_id', designId);
            
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            });
            
            console.log('AJAX response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('AJAX response for get_kayak_design:', result);
            
            console.log('Full result object structure:', JSON.stringify(result, null, 2));
            
            if (!result.success) {
                console.error('Server reported error:', result.data || 'No error message provided');
                alert(`Could not load design: ${result.data || 'The server reported an error'}`);
                return;
            }
            
            if (!result.data) {
                console.error('Missing design data in successful response');
                alert('Could not load design: The server response was missing design data');
                return;
            }
            
            console.log('Design data from server:', result.data);
            
            try {
                // Try to parse the design data
                let designData;
                try {
                    // The PHP backend returns the design_data directly as the data field
                    // This could be a string or already parsed, so handle both cases
                    designData = typeof result.data === 'string' 
                        ? JSON.parse(result.data) 
                        : result.data;
                } catch (parseError) {
                    console.error('Error parsing design data:', parseError);
                    console.log('Raw design_data:', result.data.design_data);
                    alert('Could not load the design. Invalid data format.');
                    return;
                }
                
                console.log('Successfully parsed design data:', designData);
                
                if (!designData || typeof designData !== 'object') {
                    console.error('Design data is not a valid object after parsing:', designData);
                    alert('Could not load design: The parsed design data was invalid');
                    return;
                }
                
                // Apply the design data to the kayak
                applyDesign(designData, updateKayakPartColor, handleHullAppearanceChange);
                
                // Always update the kayak model to ensure mask paths are correctly updated
                const modelSelect = document.getElementById('kayak-model-select');
                const selectedModel = result.data.model || modelSelect?.value;
                
                if (modelSelect && selectedModel) {
                    console.log('Updating kayak model for saved design:', selectedModel);
                    modelSelect.value = selectedModel;
                    
                    // Import the updateKayakAssets function from designer module
                    import('./designer.js').then(designerModule => {
                        // Directly call updateKayakAssets with the model name to refresh all mask paths
                        designerModule.updateKayakAssets(selectedModel);
                        console.log('Mask assets paths refreshed for model:', selectedModel);
                    });
                    
                    // Only dispatch the change event after updating assets
                    // to avoid race conditions with the model change handler
                    setTimeout(() => {
                        modelSelect.dispatchEvent(new Event('change'));
                    }, 100);
                }
            } catch (error) {
                console.error('Unexpected error while processing design data:', error);
                alert(`Could not load design: ${error.message}`);
            }
        } catch (error) {
            console.error('Error loading design:', error);
            alert('An error occurred while loading the design.');
        }
    } else {
        // Guest user: Get design from local storage
        try {
            const designs = getLocalStorageItem(LOCAL_STORAGE_KEY);
            const designData = designs[designId];
            if (designData) {
                applyDesign(designData, updateKayakPartColor, handleHullAppearanceChange);
            } else {
                alert('Could not find the selected design.');
            }
        } catch (error) {
            console.error('Error loading design from local storage:', error);
            alert('An error occurred while loading the design from your browser.');
        }
    }
};
