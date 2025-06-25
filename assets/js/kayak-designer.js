document.addEventListener('DOMContentLoaded', () => {
    const designerContainer = document.getElementById('kayak-designer-container');
    if (!designerContainer) {
        console.error('Kayak Designer container not found. Script will not run.');
        return;
    }
    console.log('Kayak Designer script initialized.');

    // --- 1. GET ALL DOM ELEMENTS ---
    const modal = document.getElementById('kayak-designer-modal');
    const closeButton = document.querySelector('.modal-close');
    const modalContentWrapper = document.getElementById('modal-content-wrapper');

    const pluginData = window.kayakDesignerData || {};
    const PLUGIN_BASE_URL = pluginData.pluginBaseUrl || '';
    const PATTERNS_PATH = PLUGIN_BASE_URL + 'assets/patterns/';

    const topViewContainer = document.getElementById('kayak-top-view-container');
    const sideViewContainer = document.getElementById('kayak-side-view-container');
    const hullFinishSelect = document.getElementById('hull-finish');
    const exportPngButton = document.getElementById('export-png-button');
    const exportPdfButton = document.getElementById('export-pdf-button');
    const saveDesignButton = document.getElementById('save-design-button');
    const designNameInput = document.getElementById('design-name');
    const savedDesignsSelect = document.getElementById('saved-designs-select');

    // --- 2. DEFINE ALL FUNCTIONS ---
    const updateKayakPartColor = (partName, color) => {
        // Special handling for parts visible only in one view
        if (partName === 'seat-color') {
            const topViewLayer = document.getElementById(`kayak-top-view-${partName}`);
            if (topViewLayer) {
                topViewLayer.style.backgroundColor = color;
            }
            return; // Seat is only on top view
        }

        // Default behavior: apply color to both views if the elements exist
        const topViewPart = document.getElementById(`kayak-top-view-${partName}`);
        if (topViewPart) {
            topViewPart.style.backgroundColor = color;
        }

        const sideViewPart = document.getElementById(`kayak-side-view-${partName}`);
        if (sideViewPart) {
            sideViewPart.style.backgroundColor = color;
        }
    };

    const applyOverlay = (viewContainer, layerType, imageUrl) => {
        if (!viewContainer) return;
        const viewType = viewContainer.id.includes('top-view') ? 'top' : 'side';
        const existingOverlayId = `kayak-${viewType}-view-${layerType}-overlay`;
        let existingOverlay = document.getElementById(existingOverlayId);
        
        if (!imageUrl || imageUrl.trim() === '') {
            if (existingOverlay) existingOverlay.remove();
            return;
        }

        if (!existingOverlay) {
            existingOverlay = document.createElement('img');
            existingOverlay.id = existingOverlayId;
            existingOverlay.alt = `${viewType} ${layerType} overlay`;
            existingOverlay.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: auto; pointer-events: none; z-index: 10;';
            viewContainer.appendChild(existingOverlay);
        }
        existingOverlay.src = imageUrl;
        existingOverlay.onerror = () => existingOverlay.remove();
    };

    const handleHullAppearanceChange = () => {
        if (!hullFinishSelect) return;
        
        // Handle pattern overlay
        let patternUrl = null;
        if (hullFinishSelect.value === 'carbon') {
            patternUrl = PATTERNS_PATH + 'carbon_black.png';
        }
        applyOverlay(topViewContainer, 'pattern', patternUrl);
        applyOverlay(sideViewContainer, 'pattern', patternUrl);

        // Handle visibility of the hull color picker
        const hullColorPicker = document.querySelector('label[for=\"hull-color\"]').parentElement;
        if (hullColorPicker) {
            hullColorPicker.style.display = hullFinishSelect.value === 'standard' ? '' : 'none';
        }
    };
    
    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('modal-visible');
        setTimeout(() => { if (modalContentWrapper) modalContentWrapper.innerHTML = ''; }, 300);
    };

    const initializeDesigner = () => {
        designerContainer.querySelectorAll('.color-input').forEach(input => {
            const partId = input.name;
            const color = input.value;
            updateKayakPartColor(partId, color);
        });
        handleHullAppearanceChange(); // Call this to set initial state
        console.log('Designer state initialized successfully.');
    };

    // --- 3. ATTACH ALL EVENT LISTENERS ---
    designerContainer.addEventListener('click', (event) => {
        const target = event.target;

        if (target.classList.contains('selected-color-preview')) {
            const gridWrapper = target.nextElementSibling;
            if (gridWrapper && gridWrapper.classList.contains('ral-palette-grid-wrapper')) {
                const isAlreadyOpen = !gridWrapper.classList.contains('is-hidden');
                document.querySelectorAll('.ral-palette-grid-wrapper').forEach(w => w.classList.add('is-hidden'));
                if (!isAlreadyOpen) {
                    gridWrapper.classList.remove('is-hidden');
                }
            }
        }

        if (target.classList.contains('ral-swatch')) {
            const paletteContainer = target.closest('.ral-palette-container');
            if (paletteContainer) {
                const hiddenInput = paletteContainer.querySelector('.color-input');
                const preview = paletteContainer.querySelector('.selected-color-preview');
                const gridWrapper = paletteContainer.querySelector('.ral-palette-grid-wrapper');
                const newColor = target.dataset.color;
                const newRalName = target.dataset.ralName;
                const partId = hiddenInput.name;

                hiddenInput.value = newColor;
                preview.style.backgroundColor = newColor;
                preview.title = `${newRalName} (${newColor})`;
                
                if (partId === 'logo-color') {
                    document.querySelectorAll('.logo-layer').forEach(layer => {
                        layer.style.backgroundColor = newColor;
                    });
                } else {
                    updateKayakPartColor(partId, newColor);
                }

                if (gridWrapper) gridWrapper.classList.add('is-hidden');
            }
        }

        if (target.classList.contains('zoom-icon')) {
            if (!modal || !modalContentWrapper) return;
            const view = target.dataset.view;
            const sourceContainer = document.getElementById(`kayak-${view}-view-container`);
            if (sourceContainer) {
                modalContentWrapper.innerHTML = '';
                const clonedContainer = sourceContainer.cloneNode(true);
                const clonedIcon = clonedContainer.querySelector('.view-controls');
                if (clonedIcon) clonedIcon.remove();
                modalContentWrapper.appendChild(clonedContainer);
                modal.classList.add('modal-visible');
            }
        }
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.ral-palette-container')) {
            document.querySelectorAll('.ral-palette-grid-wrapper').forEach(wrapper => {
                wrapper.classList.add('is-hidden');
            });
        }
    });

    if (hullFinishSelect) {
        hullFinishSelect.addEventListener('change', handleHullAppearanceChange);
    }
    
    if (modal && closeButton) {
        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    const generateDesignCanvas = () => {
        return new Promise((resolve, reject) => {
            const topView = document.getElementById('kayak-top-view-container');
            const sideView = document.getElementById('kayak-side-view-container');

            if (!topView || !sideView) {
                return reject('Kayak view containers not found for export.');
            }

            const topZoomIcon = topView.querySelector('.view-controls');
            const sideZoomIcon = sideView.querySelector('.view-controls');
            if (topZoomIcon) topZoomIcon.style.display = 'none';
            if (sideZoomIcon) sideZoomIcon.style.display = 'none';

            const canvasOptions = {
                allowTaint: true,
                useCORS: true,
                backgroundColor: null,
                scale: 2
            };

            Promise.all([
                html2canvas(topView, canvasOptions),
                html2canvas(sideView, canvasOptions)
            ]).then(([topCanvas, sideCanvas]) => {
                if (topZoomIcon) topZoomIcon.style.display = '';
                if (sideZoomIcon) sideZoomIcon.style.display = '';

                const combinedCanvas = document.createElement('canvas');
                const ctx = combinedCanvas.getContext('2d');
                const padding = 40;
                combinedCanvas.width = Math.max(topCanvas.width, sideCanvas.width) + padding;
                combinedCanvas.height = topCanvas.height + sideCanvas.height + (padding * 1.5);

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

                ctx.drawImage(topCanvas, (combinedCanvas.width - topCanvas.width) / 2, padding / 2);
                ctx.drawImage(sideCanvas, (combinedCanvas.width - sideCanvas.width) / 2, topCanvas.height + padding);
                
                resolve(combinedCanvas);
            }).catch(err => {
                if (topZoomIcon) topZoomIcon.style.display = '';
                if (sideZoomIcon) sideZoomIcon.style.display = '';
                reject(err);
            });
        });
    };

    if (exportPngButton) {
        exportPngButton.addEventListener('click', () => {
            generateDesignCanvas().then(canvas => {
                const link = document.createElement('a');
                link.download = 'kayak-design.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error('Error exporting PNG:', err);
            });
        });
    }

    if (exportPdfButton) {
        exportPdfButton.addEventListener('click', () => {
            generateDesignCanvas().then(canvas => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });

                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                doc.save('kayak-design.pdf');

            }).catch(err => {
                console.error('Error exporting PDF:', err);
            });
        });
    }

    // --- Design Management Functions ---

    const getCurrentDesignData = () => {
        const data = { colors: {}, finish: '' };
        document.querySelectorAll('.ral-palette-container input[type="hidden"]').forEach(input => {
            data.colors[input.name] = input.value;
        });
        if (hullFinishSelect) {
            data.finish = hullFinishSelect.value;
        }
        return data;
    };

    const applyDesign = (designData) => {
        // Apply colors
        for (const partName in designData.colors) {
            const color = designData.colors[partName];
            const colorInput = document.querySelector(`input[name="${partName}"]`);
            if (colorInput) {
                colorInput.value = color;
                const preview = colorInput.closest('.ral-palette-container').querySelector('.selected-color-preview');
                if (preview) {
                    preview.style.backgroundColor = color;
                }
                updateKayakPartColor(partName, color);
            }
        }

        // Apply hull finish
        if (hullFinishSelect && designData.finish) {
            hullFinishSelect.value = designData.finish;
            updateHullFinish(designData.finish);
        }
    };

    const populateSavedDesigns = () => {
        if (!savedDesignsSelect) return;

        const params = new URLSearchParams();
        params.append('action', 'get_kayak_designs');
        params.append('nonce', kayakDesignerData.nonce);

        fetch(kayakDesignerData.ajaxUrl, { method: 'POST', body: params })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    savedDesignsSelect.innerHTML = '<option value="">-- Select a Design --</option>'; // Reset
                    result.data.forEach(design => {
                        const option = document.createElement('option');
                        option.value = design.id;
                        option.textContent = design.name;
                        savedDesignsSelect.appendChild(option);
                    });
                } else {
                    console.error('Failed to fetch designs:', result.data);
                }
            });
    };

    if (saveDesignButton) {
        saveDesignButton.addEventListener('click', () => {
            const designName = designNameInput.value.trim();
            if (!designName) {
                alert('Please enter a name for your design.');
                return;
            }

            const designData = getCurrentDesignData();

            const params = new URLSearchParams();
            params.append('action', 'save_kayak_design');
            params.append('nonce', kayakDesignerData.nonce);
            params.append('design_name', designName);
            params.append('design_data', JSON.stringify(designData));

            fetch(kayakDesignerData.ajaxUrl, { method: 'POST', body: params })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert('Design saved successfully!');
                        populateSavedDesigns(); // Refresh the list
                    } else {
                        alert('Error saving design: ' + result.data);
                    }
                });
        });
    }

    if (savedDesignsSelect) {
        savedDesignsSelect.addEventListener('change', (event) => {
            const designId = event.target.value;
            if (!designId) return;

            const params = new URLSearchParams();
            params.append('action', 'load_kayak_design');
            params.append('nonce', kayakDesignerData.nonce);
            params.append('design_id', designId);

            fetch(kayakDesignerData.ajaxUrl, { method: 'POST', body: params })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        applyDesign(result.data);
                        designNameInput.value = savedDesignsSelect.options[savedDesignsSelect.selectedIndex].text;
                    } else {
                        alert('Error loading design: ' + result.data);
                    }
                });
        });
    }

    // --- 4. RUN INITIALIZATION ---
    initializeDesigner();
    populateSavedDesigns(); // Also load designs on initial page load
});