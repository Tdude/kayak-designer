/**
 * Main entry point for Kayak Designer plugin
 * This file serves as the WordPress entry point and initializes the modular architecture
 */

// Get the current script path to determine plugin URL if not available from WordPress
const getCurrentScriptPath = () => {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
        const src = scripts[i].src;
        if (src.includes('kayak-designer.js')) {
            return src.substring(0, src.lastIndexOf('/') + 1);
        }
    }
    return '';
};

// Determine the plugin URL either from WordPress data or by deriving from script path
const pluginUrl = window.kayakDesignerData?.pluginUrl || 
    getCurrentScriptPath().replace('/assets/js/', '/');

// Using a dynamic import to ensure the path works correctly in WordPress
const modulePath = pluginUrl ? 
    new URL('assets/js/modules/core.js', pluginUrl).href : 
    './modules/core.js';

// Import the core module using dynamic import
import(modulePath)
    .then(module => {
        window.kayakDesignerCore = module;
    })
    .catch(err => {
        console.error('Failed to load core module:', err);
    });

document.addEventListener('DOMContentLoaded', () => {
    
    // Create a default kayakDesignerData if it doesn't exist
    if (typeof window.kayakDesignerData === 'undefined') {
        console.warn('Kayak Designer: kayakDesignerData not provided by WordPress, using fallbacks');
        window.kayakDesignerData = {};
    }
    
    // Set fallback values for any missing data
    window.kayakDesignerData = {
        pluginUrl: pluginUrl,
        ajaxUrl: window.kayakDesignerData.ajaxUrl || (window.ajaxurl || '/wp-admin/admin-ajax.php'),
        patternsPath: window.kayakDesignerData.patternsPath || (pluginUrl + 'assets/img/patterns/'),
        nonce: window.kayakDesignerData.nonce || '',
        isUserLoggedIn: window.kayakDesignerData.isUserLoggedIn || 'false',
        modelsList: window.kayakDesignerData.modelsList || ['default'],
        modelsBaseUrl: window.kayakDesignerData.modelsBaseUrl || (pluginUrl + 'assets/img/models/'),
        ...window.kayakDesignerData
    };
    
    // Wait for the core module to be loaded before initializing
    if (window.kayakDesignerCore) {
        // If already loaded, initialize directly
        window.kayakDesignerCore.initialize(window.kayakDesignerData);
    } else {
        // Set up an interval to check when the module is loaded
        const initializationCheck = setInterval(() => {
            if (window.kayakDesignerCore) {
                clearInterval(initializationCheck);
                window.kayakDesignerCore.initialize(window.kayakDesignerData);
            }
        }, 50);

        // Safety timeout after 5 seconds
        setTimeout(() => {
            if (!window.kayakDesignerCore) {
                clearInterval(initializationCheck);
                console.error('Kayak Designer initialization timed out. Core module not loaded.');
            }
        }, 5000);
    }
});
