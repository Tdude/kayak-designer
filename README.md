# Kayak Design Plugin - Complete Project Documentation

## Plugin Overview
A WordPress plugin that allows users to customize kayak designs with colors, patterns, and accessories, then download their creations as PDF or SVG files.

## Basic usage
Add this shortcode to any post/page in a full width view:
[kayak_designer]

---


## Core Documentation Files Needed

### 1. Technical Requirements Document (TRD.md)

#### System Requirements
- WordPress 5.0+
- PHP 7.4+
- Modern browsers with Canvas/SVG support
- jQuery 3.0+

#### Browser Storage Strategy
- Use `localStorage` for design saves (max 5-10MB typical limit)
- Provide export/import functionality for design backup and sharing
- Clear old designs in UI (LRU cache approach)

### 2. Functional Requirements Document (FRD.md)

#### Core Features
1. **Kayak Template Selection**
   - Kayaks' lineup
   - Possibly: Scalable SVG templates for clean rendering
   - Template switching with design preservation

2. **Design Customization**
   - Color picker for hull, deck, deck seam tape, lines, logos and deck accent fields
   - Pattern overlays (logo, geometric on deck)
   - Texture options (wood, carbon, carbon-kevlar, all need a high resolution image)
   - Accessory design (line color, logo color, rim/seat color and hull seam color) Paddle holders, hatches, etc. are stationary per-model.

3. **Real-time Preview**
   - Live design updates as user makes changes
   - 360-degree rotation preview (in the future)
   - Zoom in/out functionality or full screen
   - Design history (undo/redo or similar)

4. **Export Functionality**
   - High-resolution PNG download
   - Vector SVG export (maybe)
   - PDF generation with design specs
   - Social media sharing formats for Instagram, Facebook etc. with back link to Kayak Designer.

5. **Design Management**
   - Save current design to localStorage in own browser with names
   - Option to save several designs (local storage?)
   - Load previously saved designs
   - If needed, a robust Design Gallery/library (needs to be saved in Database as a logged in user/subscriber in WP)
   - Import/export design files in structured data format, like json
  

### 3. User Interface Specification (UI-Spec.md)

#### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│                   Header Bar                        │
│  [Template] [Colors] [Patterns] [Save] [Export]     │
├─────────────────┬───────────────────────────────────┤
│                 │                                   │
│   Design Tools  │        Kayak Preview             │
│                 │                                   │
│  - Color Picker │     [3D Kayak Rendering]         │
│  - Pattern List │                                   │
│  - Accessories  │                                   │
│  - Saved Designs│                                   │
│                 │                                   │
├─────────────────┴───────────────────────────────────┤
│              Export Options Panel                   │
│    [PNG] [SVG] [PDF] [Share] [Print Preview]       │
└─────────────────────────────────────────────────────┘
```

#### Design Tool Panels
1. **Template Selector**: Grid of kayak silhouettes
2. **Color Palette**: WordPress color picker + custom swatches (RAL colors + 2 clear coatings with "pattern" image)
3. **Pattern Library**: Clickable pattern previews
4. **Accessory Drawer**: Drag-and-drop accessories?
5. **Saved Designs**: Thumbnail gallery with load/delete options (saved to plugin's upload folder to not clutter WP)


### 4. API Documentation (API.md)

#### WordPress Hooks
```php
// Plugin activation
register_activation_hook(__FILE__, 'kayak_designer_activate');

// Shortcode registration
add_shortcode('kayak_designer', 'render_kayak_designer');

// AJAX endpoints
add_action('wp_ajax_save_design', 'handle_save_design');
add_action('wp_ajax_nopriv_save_design', 'handle_save_design');
add_action('wp_ajax_generate_pdf', 'handle_pdf_generation');
add_action('wp_ajax_nopriv_generate_pdf', 'handle_pdf_generation');
```

#### JavaScript API
```javascript
// Main designer object
window.KayakDesigner = {
    init: function(containerId, options) {},
    loadTemplate: function(templateId) {},
    setColor: function(component, color) {},
    applyPattern: function(patternId) {},
    saveDesign: function(name) {},
    loadDesign: function(designId) {},
    exportSVG: function() {},
    exportPDF: function(options) {}
};
```

### 5. Database Schema (DB-Schema.md)

#### WordPress Options Table Storage
```php
// Plugin settings
'kayak_designer_settings' => [
    'default_template' => 'recreational',
    'color_palettes' => [...],
    'max_saved_designs' => 10,
    'export_quality' => 'high'
];

// User design metadata (if user accounts integration needed)
'kayak_designs_meta' => [
    'user_id' => 123,
    'design_name' => 'My Blue Kayak',
    'created_date' => '2025-06-11',
    'design_data' => '{json_compressed_design}'
];
```

### 6. Installation Guide

#### Plugin Installation Steps
1. Upload plugin files to `/wp-content/plugins/kayak-designer/`
2. Activate through WordPress admin
3. Add `[kayak_designer]` shortcode to desired page/post
4. Configure settings in admin panel

#### Shortcode Usage
```php
// Basic usage
[kayak_designer]

// With custom options
[kayak_designer width="800" height="600" template="touring" theme="dark"]
```
