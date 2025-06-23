document.addEventListener('DOMContentLoaded', () => {
    const designerContainer = document.getElementById('kayak-designer-container');
    if (!designerContainer) {
        console.error('Kayak Designer container not found. Script will not run.');
        return;
    }
    console.log('Kayak Designer script initialized.');

    // --- 1. GET ALL DOM ELEMENTS ---
    const pluginData = window.kayakDesignerData || {};
    const PLUGIN_BASE_URL = pluginData.pluginBaseUrl || '';
    const PATTERNS_PATH = PLUGIN_BASE_URL + 'assets/patterns/';
    const LOGOS_PATH = PLUGIN_BASE_URL + 'assets/logos/';

    const topViewContainer = document.getElementById('kayak-top-view-container');
    const sideViewContainer = document.getElementById('kayak-side-view-container');
    const hullFinishSolidRadio = document.getElementById('hull-finish-solid');
    const hullFinishCarbonBlackRadio = document.getElementById('hull-finish-carbon-black');
    const hullFinishCarbonGoldRadio = document.getElementById('hull-finish-carbon-gold');
    const hullLogoSelect = document.getElementById('hull-logo');
    const deckLogoSelect = document.getElementById('deck-logo');
    const hullColorPickerContainer = document.getElementById('hull-solid-color-picker-container');
    const modal = document.getElementById('kayak-designer-modal');
    const closeButton = document.querySelector('.modal-close');
    const modalContentWrapper = document.getElementById('modal-content-wrapper');

    // --- 2. DEFINE ALL FUNCTIONS ---
    const updateKayakPartColor = (partName, color) => {
        const topViewLayer = document.getElementById(`kayak-top-view-${partName}`);
        const sideViewLayer = document.getElementById(`kayak-side-view-${partName}`);
        if (topViewLayer) topViewLayer.style.backgroundColor = color;
        if (sideViewLayer) sideViewLayer.style.backgroundColor = color;
    };

    const applyOverlay = (viewContainer, layerType, imageUrl) => {
        if (!viewContainer) return;
        const viewType = viewContainer.id.includes('top-view') ? 'top' : 'side';
        const existingOverlayId = `kayak-${viewType}-view-${layerType}-overlay`;
        const existingOverlay = document.getElementById(existingOverlayId);
        if (existingOverlay) existingOverlay.remove();

        if (!imageUrl || imageUrl.trim() === '') return;

        const overlayImg = document.createElement('img');
        overlayImg.id = existingOverlayId;
        overlayImg.src = imageUrl;
        overlayImg.alt = `${viewType} ${layerType} overlay`;
        overlayImg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: auto; pointer-events: none;';
        overlayImg.style.zIndex = (layerType === 'pattern') ? '10' : '20';
        overlayImg.onerror = () => overlayImg.remove();
        viewContainer.appendChild(overlayImg);
    };

    const handleHullAppearanceChange = () => {
        const isSolidFinish = hullFinishSolidRadio ? hullFinishSolidRadio.checked : true;
        if (hullColorPickerContainer) hullColorPickerContainer.style.display = isSolidFinish ? '' : 'none';

        let patternUrl = null;
        if (hullFinishCarbonBlackRadio && hullFinishCarbonBlackRadio.checked) patternUrl = PATTERNS_PATH + 'carbon_black.png';
        else if (hullFinishCarbonGoldRadio && hullFinishCarbonGoldRadio.checked) patternUrl = PATTERNS_PATH + 'carbon_gold_kevlar.png';
        
        applyOverlay(topViewContainer, 'pattern', patternUrl);
        applyOverlay(sideViewContainer, 'pattern', patternUrl);

        const hullLogoUrl = hullLogoSelect && hullLogoSelect.value ? LOGOS_PATH + hullLogoSelect.value : null;
        applyOverlay(topViewContainer, 'logo', hullLogoUrl);
        applyOverlay(sideViewContainer, 'logo', hullLogoUrl);
    };

    const handleDeckAppearanceChange = () => {
        const deckLogoUrl = deckLogoSelect && deckLogoSelect.value ? LOGOS_PATH + deckLogoSelect.value : null;
        applyOverlay(topViewContainer, 'logo', deckLogoUrl);
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('modal-visible');
        setTimeout(() => { if (modalContentWrapper) modalContentWrapper.innerHTML = ''; }, 300);
    };

    const initializeDesigner = () => {
        const colorInputs = designerContainer.querySelectorAll('.color-input');
        colorInputs.forEach(input => {
            const partName = input.name;
            const color = input.value;
            updateKayakPartColor(partName, color);
            const paletteContainer = input.closest('.ral-palette-container');
            if (paletteContainer) {
                paletteContainer.querySelectorAll('.ral-swatch').forEach(s => s.classList.remove('selected'));
                const selectedSwatch = paletteContainer.querySelector(`.ral-swatch[data-color='${color}']`);
                if (selectedSwatch) selectedSwatch.classList.add('selected');
            }
        });
        handleHullAppearanceChange();
        handleDeckAppearanceChange();
        console.log('Designer state initialized successfully.');
    };

    // --- 3. ATTACH ALL EVENT LISTENERS ---
    const swatches = designerContainer.querySelectorAll('.ral-swatch');
    console.log(`Found ${swatches.length} swatches to attach listeners to.`);
    swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const paletteContainer = swatch.closest('.ral-palette-container');
            if (!paletteContainer) return;
            const hiddenInput = paletteContainer.querySelector('.color-input');
            if (!hiddenInput) return;

            const newColor = swatch.dataset.color;
            hiddenInput.value = newColor;

            paletteContainer.querySelectorAll('.ral-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            updateKayakPartColor(hiddenInput.name, newColor);
        });
    });

    designerContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('zoom-icon')) {
            if (!modal || !modalContentWrapper) return;
            const view = event.target.dataset.view;
            const sourceContainer = document.getElementById(`kayak-${view}-view-container`);
            if (sourceContainer) {
                modalContentWrapper.innerHTML = '';
                const clonedContainer = sourceContainer.cloneNode(true);
                const clonedIcon = clonedContainer.querySelector('.zoom-icon');
                if (clonedIcon) clonedIcon.parentElement.remove();
                modalContentWrapper.appendChild(clonedContainer);
                modal.classList.add('modal-visible');
            }
        }
    });

    if (hullFinishSolidRadio) hullFinishSolidRadio.addEventListener('change', handleHullAppearanceChange);
    if (hullFinishCarbonBlackRadio) hullFinishCarbonBlackRadio.addEventListener('change', handleHullAppearanceChange);
    if (hullFinishCarbonGoldRadio) hullFinishCarbonGoldRadio.addEventListener('change', handleHullAppearanceChange);
    if (hullLogoSelect) hullLogoSelect.addEventListener('change', handleHullAppearanceChange);
    if (deckLogoSelect) deckLogoSelect.addEventListener('change', handleDeckAppearanceChange);
    if (modal && closeButton) {
        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    }

    // --- 4. RUN INITIALIZATION ---
    initializeDesigner();
});
