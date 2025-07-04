/**
 * Core module - Main coordination and initialization
 */

// Import modules
import { loadImage, elementExists } from './utils.js';
import { initStorage, saveDesign, loadDesigns, handleDesignLoad, collectDesignData } from './storage.js';
import { initDesigner, updateKayakPartColor, handleHullAppearanceChange, updateKayakAssets, initializeDesigner } from './designer.js';
import { initGallery, handleVoteClick, showVoteConfirmationAlert } from './gallery.js';
import { initModal, initializeModal, initializeGalleryModal } from './modal.js';
import { initRender, renderViewToCanvas, createCombinedCanvas, exportToPng, exportToPdf } from './render.js';
// Configuration object with paths and settings
let config = {};

/**
 * Initialize the core module with WordPress data
 * @param {Object} wpConfig - Configuration object with WordPress data
 */
export const initialize = (wpConfig) => {
    console.log('Core initialize called with config:', wpConfig);
    
    // Set up global config
    config = {
        ...wpConfig,
        patternsPath: wpConfig.pluginUrl + '/assets/img/patterns/',
        modelsBaseUrl: wpConfig.pluginUrl + '/assets/img/models/'
    };
    
    console.log('Config prepared:', config);
    console.log('Checking DOM: designer container exists?', elementExists('#kayak-designer-container'));
    console.log('Checking DOM: gallery container exists?', elementExists('.kayak-design-gallery'));
    
    // Initialize all modules with relevant config
    console.log('Initializing modules...');
    initStorage(config);
    initDesigner(config);
    initGallery(config);
    initModal(config);
    initRender(config);

    // Check which page we're on and initialize accordingly
    if (elementExists('#kayak-designer-container')) {
        console.log('Designer page detected, initializing designer...');
        initializeDesignerPage();
    } else if (elementExists('.kayak-design-gallery')) {
        console.log('Gallery page detected, initializing gallery...');
        initializeGalleryPage();
    } else {
        console.log('Neither designer nor gallery container found!');
    }
};

/**
 * Initialize the designer page
 */
const initializeDesignerPage = () => {
    console.log('initializeDesignerPage called - this is where all functionality is set up');
    
    try {
        // Initialize the designer interface
        console.log('Calling initializeDesigner...');
        initializeDesigner();

        // Initialize the modal
        console.log('Calling initializeModal...');
        initializeModal();

        // Set up export buttons
        console.log('Setting up export buttons...');
        const pngButton = document.getElementById('export-png-button');
        console.log('PNG button found:', pngButton);
        if (pngButton) {
            pngButton.addEventListener('click', (e) => {
                console.log('PNG export clicked');
                exportToPng();
            });
        }

        const pdfButton = document.getElementById('export-pdf-button');
        console.log('PDF button found:', pdfButton);
        if (pdfButton) {
            pdfButton.addEventListener('click', (e) => {
                console.log('PDF export clicked');
                exportToPdf();
            });
        }

        // Set up save/load functionality
        console.log('Setting up save/load functionality...');
        const saveButton = document.getElementById('save-design-button');
        console.log('Save button found:', saveButton);
        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                console.log('Save design clicked');
                saveDesign(updateKayakPartColor, handleHullAppearanceChange);
            });
        }

        const designsSelect = document.getElementById('saved-designs-select');
        console.log('Designs select found:', designsSelect);
        if (designsSelect) {
            // Initial load of designs
            console.log('Loading saved designs...');
            loadDesigns(updateKayakPartColor, handleHullAppearanceChange);
            
            // Set up change handler
            designsSelect.addEventListener('change', (e) => {
                console.log('Design selected:', e.target.value);
                handleDesignLoad(e, updateKayakPartColor, handleHullAppearanceChange);
            });
        }
        
        console.log('Designer page initialization completed successfully');
    } catch (error) {
        console.error('Error initializing designer page:', error);
    }
};

/**
 * Initialize the gallery page
 */
const initializeGalleryPage = () => {
    console.log('Initializing gallery modal...');
    initializeGalleryModal();

    // Initialize vote handling
    const galleryContainer = document.querySelector('.kayak-design-gallery');
    console.log('Gallery container for vote handling:', galleryContainer);
    
    if (galleryContainer) {
        galleryContainer.addEventListener('click', handleVoteClick);
        console.log('Vote click handler attached to gallery container');
    } else {
        console.error('Gallery container not found for vote handling');
    }

    // Check for vote confirmations (e.g. from a previous page load/redirect)
    showVoteConfirmationAlert();
};

/**
 * Export public API for the core module
 */
export default {
    initialize,
    renderViewToCanvas,
    createCombinedCanvas,
    exportToPng,
    exportToPdf,
    saveDesign,
    loadDesigns,
    handleDesignLoad,
    collectDesignData,
    updateKayakPartColor,
    handleHullAppearanceChange,
    updateKayakAssets
};
