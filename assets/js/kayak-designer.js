document.addEventListener('DOMContentLoaded', () => {
    // Ensure localized data from PHP is available
    if (typeof window.kayakDesignerData === 'undefined' || !window.kayakDesignerData.patternsPath || !window.kayakDesignerData.ajaxUrl || !window.kayakDesignerData.nonce || typeof window.kayakDesignerData.isUserLoggedIn === 'undefined') {
        console.error('Kayak Designer script failed to load: Missing required PHP-localized variables.');
        return;
    }

    const { ajaxUrl, nonce, patternsPath, isUserLoggedIn } = window.kayakDesignerData;

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
        const hullColorInput = document.getElementById('hull-color'); // This is the hidden input
        const hullSideView = document.getElementById('kayak-side-view-hull-color');
        const hullColorPickerContainer = hullColorInput?.closest('.control-group-horizontal > div');

        if (!finishSelect || !hullSideView || !hullColorPickerContainer) return;

        const selectedFinish = finishSelect.value;

        // Check if the selected finish is a pattern (e.g., 'carbon', 'carbon_kevlar')
        // Assumes non-pattern options have a value like 'solid' or similar.
        if (selectedFinish.includes('carbon')) { // A simple check to identify pattern options
            const patternUrl = `${patternsPath}${selectedFinish}.png`;
            hullSideView.style.backgroundColor = ''; // Clear solid color
            hullSideView.style.backgroundImage = `url(${patternUrl})`;
            hullSideView.classList.add('pattern-active');
            hullColorPickerContainer.style.display = 'none'; // Hide the solid color picker
        } else { // Handle solid color
            hullSideView.style.backgroundImage = 'none'; // Remove pattern
            hullSideView.classList.remove('pattern-active');
            if (hullColorInput) updateKayakPartColor('hull-color', hullColorInput.value);
            hullColorPickerContainer.style.display = ''; // Show the solid color picker
        }
    };

    // --- 2. EXPORT FUNCTIONALITY ---

    // --- Canvas-based Export --- 

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

    // --- 3. DESIGN MANAGEMENT (SAVE/LOAD) ---

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
                const container = input.closest('.ral-palette-container');
                const preview = container?.querySelector('.selected-color-preview');
                if (preview) preview.style.backgroundColor = value;
                updateKayakPartColor(key, value);
            }
        });
        handleHullAppearanceChange(); // Refresh hull view after applying data
    };

    const saveDesign = async () => {
        const designNameInput = document.getElementById('design-name');
        const designName = designNameInput.value.trim();
        if (!designName) {
            alert('Please enter a name for your design.');
            return;
        }
        const designData = collectDesignData();

        if (isUserLoggedIn) {
            // Logged-in user: Save to database via AJAX
            const body = new URLSearchParams({
                action: 'save_kayak_design',
                nonce: nonce,
                design_name: designName,
                design_data: JSON.stringify(designData)
            });
            const response = await fetch(ajaxUrl, { method: 'POST', body });
            const result = await response.json();
            alert(result.success ? 'Design saved to your account!' : `Error: ${result.data}`);
            if (result.success) loadDesigns();
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
        
        const placeholder = isUserLoggedIn ? 'Select a design from your account...' : 'Select a design from your browser...';
        select.innerHTML = `<option value="">${placeholder}</option>`;

        if (isUserLoggedIn) {
            // Logged-in user: Load from database
            const response = await fetch(`${ajaxUrl}?action=get_kayak_designs&nonce=${nonce}`);
            const result = await response.json();
            if (result.success) {
                result.data.forEach(design => {
                    select.add(new Option(design.name, design.id));
                });
            }
        } else {
            // Guest user: Load from local storage
            const designs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
            Object.keys(designs).forEach(name => {
                select.add(new Option(name, name));
            });
        }
    };

    const handleDesignLoad = async (e) => {
        const selectedValue = e.target.value;
        const designNameInput = document.getElementById('design-name');
        if (!selectedValue) return;

        if (isUserLoggedIn) {
            // Logged-in user: Load from database
            const response = await fetch(`${ajaxUrl}?action=load_kayak_design&nonce=${nonce}&design_id=${selectedValue}`);
            const result = await response.json();
            if (result.success) {
                applyDesign(result.data);
                // Set design name in input field from the selected option's text
                designNameInput.value = e.target.options[e.target.selectedIndex].text;
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

    // --- 4. MODAL (FULL-SCREEN VIEW) ---

    const initializeModal = () => {
        const modal = document.getElementById('kayak-designer-modal');
        if (!modal) return;
        const closeBtn = modal.querySelector('.modal-close');
        const contentWrapper = document.getElementById('modal-content-wrapper');

        document.querySelectorAll('.zoom-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                const containerToClone = document.getElementById(`kayak-${view}-view-container`);
                const clone = containerToClone.cloneNode(true);
                clone.querySelector('.zoom-icon').remove(); // Remove icon from cloned view
                contentWrapper.innerHTML = '';
                contentWrapper.appendChild(clone);
                modal.classList.add('modal-visible');
            });
        });

        closeBtn.addEventListener('click', () => modal.classList.remove('modal-visible'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('modal-visible');
        });
    };

    // --- 5. INITIALIZATION ---

    const initializeDesigner = () => {
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
                if (colorInput) colorInput.value = newColor;
                if (preview) preview.style.backgroundColor = newColor;
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
        loadDesigns(); 
        console.log('Kayak Designer Initialized');
    };

    // Run the initializer
    initializeDesigner();
});