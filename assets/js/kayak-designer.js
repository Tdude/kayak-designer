/**
 * Main entry point for Kayak Designer plugin
 * This file serves as the WordPress entry point and initializes the modular architecture
 */

import { initialize } from './modules/core.js';

console.log('Kayak Designer module loaded');

// Add a helper function to debug DOM elements
window.debugKayakElements = function() {
    console.log('--- KAYAK DESIGNER DEBUG ---');
    console.log('Designer container:', document.querySelector('#kayak-designer-container'));
    console.log('Color inputs:', document.querySelectorAll('.color-input'));
    console.log('Hull finish select:', document.getElementById('hull-finish'));
    console.log('Model select:', document.getElementById('kayak-model-select'));
    console.log('-------------------------');
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired for Kayak Designer');
    
    // Ensure localized data from PHP is available
    if (typeof window.kayakDesignerData === 'undefined' || 
        !window.kayakDesignerData.pluginUrl || 
        !window.kayakDesignerData.ajaxUrl || 
        !window.kayakDesignerData.nonce || 
        typeof window.kayakDesignerData.isUserLoggedIn === 'undefined') {
        console.error('Kayak Designer script failed to load: Missing required PHP-localized variables.');
        return;
    }
    
    console.log('kayakDesignerData:', window.kayakDesignerData);
    
    // Initialize the modular architecture with WordPress data
    initialize(window.kayakDesignerData);
    
    // Debug DOM elements after a short delay
    setTimeout(() => {
        window.debugKayakElements();
    }, 500);
});
