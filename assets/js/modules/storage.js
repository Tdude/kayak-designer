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
    /*
    console.log('Storage module initialized with:', {
        ajaxUrl,
        nonceLength: nonce ? nonce.length : 'missing',
        isUserLoggedIn,
        rawUserLoggedIn: config.isUserLoggedIn
    });*/
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
    // Get references to the container and select element
    const designsContainer = document.getElementById('saved-designs-container');
    const select = document.getElementById('saved-designs-select');
    if (!select || !designsContainer) return;
    
    // Clear the container
    designsContainer.innerHTML = '';
    
    // Create UI elements
    const selectLabel = document.createElement('label');
    selectLabel.setAttribute('for', 'saved-designs-select');
    selectLabel.textContent = 'Select a design:';
    
    // Create a new select element with proper styling
    const newSelect = document.createElement('select');
    newSelect.id = 'saved-designs-select';
    newSelect.className = 'design-select';
    
    // Create a dropdown container div
    const selectContainer = document.createElement('div');
    selectContainer.className = 'select-container';
    selectContainer.appendChild(selectLabel);
    selectContainer.appendChild(newSelect);
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'design-action-buttons';
    
    // Create load button
    const loadButton = document.createElement('button');
    loadButton.id = 'load-design-button';
    loadButton.className = 'button load-design-button';
    loadButton.textContent = 'Load Design';
    loadButton.type = 'button';
    loadButton.setAttribute('disabled', 'disabled');
    loadButton.addEventListener('click', () => {
        const designId = newSelect.value;
        if (designId) {
            handleLoadDesign(designId, updateKayakPartColor, handleHullAppearanceChange);
        }
    });
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.id = 'delete-design-button';
    deleteButton.className = 'button delete-design-button';
    deleteButton.textContent = 'Delete Design';
    deleteButton.type = 'button';
    deleteButton.setAttribute('disabled', 'disabled');
    // Event listener will be added later to prevent duplicates
    
    // Add elements to buttons container
    buttonsContainer.appendChild(loadButton);
    buttonsContainer.appendChild(deleteButton);
    
    // Enable/disable buttons based on selection
    newSelect.addEventListener('change', () => {
        const hasSelection = newSelect.value !== '';
        loadButton.disabled = !hasSelection;
        deleteButton.disabled = !hasSelection;
    });
    
    // Add elements to the container
    designsContainer.appendChild(selectContainer);
    designsContainer.appendChild(buttonsContainer);
    
    // Add default option to select
    const placeholder = isUserLoggedIn ? 'Select a design from your account...' : 'Select a design from your browser...';
    newSelect.innerHTML = `<option value="">${placeholder}</option>`;
    
    // Remove any existing event listeners by recreating the buttons
    const newLoadButton = document.createElement('button');
    newLoadButton.id = 'load-design-button';
    newLoadButton.className = 'button load-design-button';
    newLoadButton.textContent = 'Load Design';
    newLoadButton.type = 'button';
    newLoadButton.disabled = true;
    
    const newDeleteButton = document.createElement('button');
    newDeleteButton.id = 'delete-design-button';
    newDeleteButton.className = 'button delete-design-button';
    newDeleteButton.textContent = 'Delete Design';
    newDeleteButton.type = 'button';
    newDeleteButton.disabled = true;
    
    // Replace the old buttons with new ones
    buttonsContainer.innerHTML = '';
    buttonsContainer.appendChild(newLoadButton);
    buttonsContainer.appendChild(newDeleteButton);
    
    // Add event listeners to buttons (only once)
    newLoadButton.addEventListener('click', () => {
        const designId = newSelect.value;
        if (designId) {
            // Load design on button click
            handleLoadDesign(designId, updateKayakPartColor, handleHullAppearanceChange);
        }
    });
    
    newDeleteButton.addEventListener('click', () => {
        const designId = newSelect.value;
        if (designId) {
            // Delete design on button click
            handleDeleteDesign(designId, updateKayakPartColor, handleHullAppearanceChange);
        }
    });
    
    // Add event listener to the dropdown to enable/disable buttons
    newSelect.addEventListener('change', (event) => {
        // Update button states when selection changes
        const hasSelection = event.target.value !== '';
        newLoadButton.disabled = !hasSelection;
        newDeleteButton.disabled = !hasSelection;
    });
    
    // Handle loading designs based on user login status
    if (isUserLoggedIn) {
        // Logged-in user: Load from database
        try {
            // Loading designs with AJAX
            
            // Use POST instead of GET for better compatibility
            const formData = new FormData();
            formData.append('action', 'get_kayak_designs');
            formData.append('nonce', nonce);
            
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            });
            

            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();


            if (result.success) {
                if (result.data.length === 0) {
                    // No designs found in the database for the current user
                } else {
                    // Add each design as an option to the dropdown
                    result.data.forEach(design => {
                        const option = document.createElement('option');
                        option.value = design.id;
                        option.textContent = design.name;
                        newSelect.appendChild(option);
                    });
                }
            } else {
                console.error('Failed to load designs:', result.data);
                designsList.appendChild(placeholderMessage);
            }
        } catch (error) {
            console.error('Error fetching designs:', error);
        }
    } else {
        // Guest user: Load from local storage
        const savedDesigns = JSON.parse(localStorage.getItem('kayakDesigns')) || [];
        
        if (savedDesigns.length === 0) {
            // No designs found in localStorage
        } else {
            // Add each design as an option to the dropdown
            savedDesigns.forEach(design => {
                const option = document.createElement('option');
                option.value = design.id;
                option.textContent = design.name;
                newSelect.appendChild(option);
            });
        }
    }
    
    // We've already added the event listeners above, no need to add them again
};

/**
 * Create a design list item with edit and delete buttons
 * @param {string} id - Design ID or name
 * @param {string} name - Design name
 * @param {Function} updateKayakPartColor - Function to update kayak colors
 * @param {Function} handleHullAppearanceChange - Function to update hull appearance
 * @returns {HTMLElement} - The design list item element
 */
const createDesignListItem = (id, name, updateKayakPartColor, handleHullAppearanceChange) => {
    // Create the container
    const item = document.createElement('div');
    item.className = 'design-list-item';
    item.dataset.id = id;
    
    // Create the design name
    const designName = document.createElement('span');
    designName.className = 'design-name';
    designName.textContent = name;
    
    // Create the buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'design-actions';
    
    // Create the edit button
    const loadButton = document.createElement('button');
    loadButton.className = 'button load-design-button';
    loadButton.textContent = 'Load';
    loadButton.type = 'button';
    loadButton.addEventListener('click', () => handleLoadDesign(id, updateKayakPartColor, handleHullAppearanceChange));
    
    // Create the delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'button delete-design-button';
    deleteButton.textContent = 'Delete';
    deleteButton.type = 'button';
    deleteButton.addEventListener('click', () => handleDeleteDesign(id, updateKayakPartColor, handleHullAppearanceChange));
    
    // Assemble the item
    buttonsContainer.appendChild(loadButton);
    buttonsContainer.appendChild(deleteButton);
    item.appendChild(designName);
    item.appendChild(buttonsContainer);
    
    return item;
};

/**
 * Handle design select change event
 * @param {Event} e - Change event
 * @returns {Promise<void>}
 */
export const handleDesignLoad = async (e, updateKayakPartColor, handleHullAppearanceChange) => {
    const designId = e.target.value;
    if (!designId) return;
    
    // Call the implementation function
    return handleLoadDesign(designId, updateKayakPartColor, handleHullAppearanceChange);
};

/**
 * Handle loading a design (from button click)
 * @param {string} designId - ID of the design to load
 * @param {Function} updateKayakPartColor - Function to update kayak part colors
 * @param {Function} handleHullAppearanceChange - Function to update hull appearance
 * @returns {Promise<void>}
 */
export const handleLoadDesign = async (designId, updateKayakPartColor, handleHullAppearanceChange) => {
    if (!designId) return;

    if (isUserLoggedIn) {
        // Logged-in user: Fetch design from server
        try {
            /*
            console.log('Loading individual design with AJAX - request details:', {
                ajaxUrl,
                nonce,
                designId,
                isUserLoggedIn
            });
            */
            // Use POST instead of GET for better compatibility
            const formData = new FormData();
            formData.append('action', 'load_kayak_design'); // Changed to match PHP handler name
            formData.append('nonce', nonce);
            formData.append('design_id', designId);
            
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            });
            

            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                alert(`Could not load design: ${result.data || 'The server reported an error'}`);
                return;
            }
            
            if (!result.data) {
                console.error('Missing design data in successful response');
                alert('Could not load design: The server response was missing design data');
                return;
            }
            
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
                    alert('Could not load the design. Invalid data format.');
                    return;
                }
                
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
                    modelSelect.value = selectedModel;
                    
                    // Import the updateKayakAssets function from designer module
                    import('./designer.js').then(designerModule => {
                        // Directly call updateKayakAssets with the model name to refresh all mask paths
                        designerModule.updateKayakAssets(selectedModel);
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

/**
 * Handle deleting a design
 * @param {string} designId - ID of the design to delete
 * @param {Function} updateKayakPartColor - Function to update kayak colors
 * @param {Function} handleHullAppearanceChange - Function to update hull appearance
 * @returns {Promise<void>}
 */
export const handleDeleteDesign = async (designId, updateKayakPartColor, handleHullAppearanceChange) => {
    if (!designId) return;
    
    // Starting delete process for design
    
    // Confirm deletion with the user
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
        // User cancelled deletion
        return;
    }
    
    // User confirmed deletion, proceeding
    
    if (isUserLoggedIn) {
        // Logged-in user: Delete from server
        try {
            // Deleting design with AJAX
            
            const formData = new FormData();
            formData.append('action', 'delete_kayak_design');
            formData.append('nonce', nonce);
            formData.append('design_id', designId);
            
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();

            
            if (result.success) {
                // Design deleted successfully, refreshing list
                // Just update the dropdown options instead of removing the entire dropdown
                // This preserves the dropdown's existence in the DOM
                setTimeout(() => {
                    loadDesigns(updateKayakPartColor, handleHullAppearanceChange);
                }, 50);
            } else {
                console.error('Failed to delete design:', result.data);
                // Keep only this alert as it's an error case
                alert(`Could not delete design: ${result.data}`);
            }
        } catch (error) {
            console.error('Error deleting design:', error);
            // Keep only this alert as it's an error case
            alert(`An error occurred while deleting the design: ${error.message}`);
        }
    } else {
        // Guest user: Delete from local storage
        try {
            // Deleting design from local storage
            const savedDesigns = JSON.parse(localStorage.getItem('kayakDesigns')) || [];
            const updatedDesigns = savedDesigns.filter(design => design.id !== designId);
            localStorage.setItem('kayakDesigns', JSON.stringify(updatedDesigns));
            
            // Design deleted from local storage, refreshing list
            // Just update the dropdown options instead of removing the entire dropdown
            // This preserves the dropdown's existence in the DOM
            setTimeout(() => {
                loadDesigns(updateKayakPartColor, handleHullAppearanceChange);
            }, 50);
        } catch (error) {
            console.error('Error deleting design from local storage:', error);
            // Keep only this alert as it's an error case
            alert('Could not delete the design. Your browser storage might be locked or disabled.');
        }
    }
};
