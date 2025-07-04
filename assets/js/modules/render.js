/**
 * Render module - Canvas rendering and export functionality
 */
import { loadImage, getUrlFromCss } from './utils.js';
// Configuration object with paths and settings
let config = {};

/**
 * Initialize render module with WordPress data
 * @param {Object} wpConfig - Configuration object with WordPress data
 */
export const initRender = (wpConfig) => {
    config = wpConfig;
};

/**
 * Render a kayak view to a canvas
 * @param {string} viewContainerId - ID of the view container element
 * @returns {Promise<HTMLCanvasElement>} - Canvas with rendered view
 */
export const renderViewToCanvas = async (viewContainerId) => {
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
    
    // 2. Sort color layers by layer type for correct stacking order
    // The correct order is: hull base (deck/hull) -> accent colors (accent-front/rear) -> lines
    const hullLayers = [];
    const accentLayers = [];
    const lineLayers = [];
    
    // Categorize each layer
    for (const layer of colorLayers) {
        const layerId = layer.id || '';
        if (layerId.includes('lines') || layerId.includes('deck-seam-tape')) {
            lineLayers.push(layer);
        } else if (layerId.includes('accent')) {
            accentLayers.push(layer);
        } else {
            // Hull, deck, rim, seat, and any other base layers
            hullLayers.push(layer);
        }
    }
    
    console.log('Layer categorization:', {
        hullLayers: hullLayers.map(l => l.id || 'unknown'),
        accentLayers: accentLayers.map(l => l.id || 'unknown'), 
        lineLayers: lineLayers.map(l => l.id || 'unknown')
    });
    
    // Function to draw a layer
    const drawLayer = async (layer) => {
        const style = window.getComputedStyle(layer);
        const maskUrl = getUrlFromCss(style.webkitMaskImage || style.maskImage);
        const bgColor = style.backgroundColor;
        const bgImage = getUrlFromCss(style.backgroundImage);

        if (maskUrl && (bgColor !== 'rgba(0, 0, 0, 0)' || bgImage)) {
            console.log('Drawing layer:', layer.id || 'unknown');
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
    };
    
    // Draw layers in the correct order:
    // 1. Hull and base layers first
    for (const layer of hullLayers) {
        await drawLayer(layer);
    }
    
    // 2. Accent colors next
    for (const layer of accentLayers) {
        await drawLayer(layer);
    }
    
    // 3. Lines on top of accents
    for (const layer of lineLayers) {
        await drawLayer(layer);
    }
    
    // 4. Hardware layer at the very top
    if (hardwareLayerEl && hardwareLayerEl.src) {
        console.log('Drawing hardware layer');
        const hardwareImage = await loadImage(hardwareLayerEl.src);
        ctx.drawImage(hardwareImage, 0, 0);
    }

    return canvas;
};

/**
 * Create a combined canvas with top and side views
 * @returns {Promise<HTMLCanvasElement>} - Combined canvas
 */
export const createCombinedCanvas = async () => {
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

/**
 * Export kayak design as PNG
 * @returns {Promise<void>}
 */
export const exportToPng = async () => {
    const canvas = await createCombinedCanvas();
    const link = document.createElement('a');
    link.download = 'kayak-design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

/**
 * Export kayak design as PDF
 * @returns {Promise<void>}
 */
export const exportToPdf = async () => {
    // Make sure jspdf library is available (loaded by WordPress)
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF library not loaded!');
        alert('Error: PDF export library not available.');
        return;
    }
    
    const canvas = await createCombinedCanvas();
    const imgData = canvas.toDataURL('image/png');
    
    // Access the library as loaded by WordPress
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('kayak-design.pdf');
};
