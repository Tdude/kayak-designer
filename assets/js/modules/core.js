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
import KayakSharing from './sharing.js';
// Configuration object with paths and settings
let config = {};

/**
 * Initialize the core module with WordPress data
 * @param {Object} wpConfig - Configuration object with WordPress data
 */
export const initialize = (wpConfig) => {
    config = {
        ...wpConfig,
        patternsPath: wpConfig.pluginUrl + '/assets/img/patterns/',
        modelsBaseUrl: wpConfig.pluginUrl + '/assets/img/models/'
    };
    
    // Initialize all modules with relevant config
    initStorage(config);
    initDesigner(config);
    initGallery(config);
    initModal(config);
    initRender(config);
    KayakSharing.init();

    // Check which page we're on and initialize accordingly
    if (elementExists('#kayak-designer-container')) {
        initializeDesignerPage();
    } else if (elementExists('.kayak-design-gallery')) {
        initializeGalleryPage();
    }
};

/**
 * Initialize the designer page
 */
const initializeDesignerPage = () => {
    try {
        initializeDesigner();
        initializeModal();
        
        // Check if we need to load a design from URL (shared design)
        const urlDesignData = KayakSharing.loadFromUrl();
        if (urlDesignData.found) {
            // Attempt to load the shared design
            handleDesignLoad(urlDesignData.designId);
        }

        const pngButton = document.getElementById('export-png-button');
        if (pngButton) {
            pngButton.addEventListener('click', (e) => {
                exportToPng();
            });
        }

        const pdfButton = document.getElementById('export-pdf-button');
        if (pdfButton) {
            pdfButton.addEventListener('click', (e) => {
                exportToPdf();
            });
        }

        // Set up save/load functionality
        const saveButton = document.getElementById('save-design-button');
        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                saveDesign(updateKayakPartColor, handleHullAppearanceChange);
            });
        }

        const designsSelect = document.getElementById('saved-designs-select');
        if (designsSelect) {
            loadDesigns(updateKayakPartColor, handleHullAppearanceChange);
            
            designsSelect.addEventListener('change', (e) => {
                handleDesignLoad(e, updateKayakPartColor, handleHullAppearanceChange);
            });
        }
    } catch (error) {
        console.error('Error initializing designer page:', error);
    }
};

/**
 * Initialize the gallery page
 */
const initializeGalleryPage = () => {
    initializeGalleryModal();

    const galleryContainer = document.querySelector('.kayak-design-gallery');
    
    if (galleryContainer) {
        galleryContainer.addEventListener('click', handleVoteClick);
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
