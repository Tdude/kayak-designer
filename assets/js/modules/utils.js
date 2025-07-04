/**
 * Utils module - Common utility functions for the Kayak Designer plugin
 */

/**
 * Load an image and handle CORS
 * @param {string} src - The image source URL
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
};

/**
 * Extract URL from CSS properties like `url("...")`
 * @param {string} cssProperty - CSS property value
 * @returns {string|null} - Extracted URL or null
 */
export const getUrlFromCss = (cssProperty) => {
    if (!cssProperty || cssProperty === 'none') return null;
    const match = cssProperty.match(/url\("(.*?)"\)/);
    return match ? match[1] : null;
};

/**
 * Check if an element exists in the DOM
 * @param {string} selector - CSS selector
 * @returns {boolean} - Whether the element exists
 */
export const elementExists = (selector) => {
    return document.querySelector(selector) !== null;
};

/**
 * Get local storage item with error handling
 * @param {string} key - Storage key
 * @returns {any} - Parsed data or empty object
 */
export const getLocalStorageItem = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error(`Error reading from local storage: ${e}`);
        return {};
    }
};

/**
 * Set local storage item with error handling
 * @param {string} key - Storage key
 * @param {any} data - Data to store
 * @returns {boolean} - Success status
 */
export const setLocalStorageItem = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error(`Error writing to local storage: ${e}`);
        return false;
    }
};
