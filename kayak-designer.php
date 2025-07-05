<?php
/**
 * Plugin Name:       Kayak Designer
 * Plugin URI:        https://example.com/plugins/the-basics/
 * Description:       Allows users to customize kayak designs with colors, patterns, and accessories, then download their creations as PDF or SVG files.
 * Version:           1.4
 * Requires at least: 5.2
 * Requires PHP:      7.2
 * Author:            Tibor Berki
 * Author URI:        https://github.com/tiborberki
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       kayak-designer
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Define plugin version
define('KAYAK_DESIGNER_VERSION', '1.4');

/**
 * Enqueue scripts and styles for the admin area.
 */
function kayak_designer_admin_enqueue_scripts($hook) {
    // Only load on our plugin's settings page
    if ('settings_page_kayak-designer' !== $hook) {
        return;
    }

    wp_enqueue_script(
        'kayak-designer-admin-settings',
        plugin_dir_url(__FILE__) . 'admin/js/settings-page.js',
        ['jquery'],
        KAYAK_DESIGNER_VERSION,
        true
    );
}
add_action('admin_enqueue_scripts', 'kayak_designer_admin_enqueue_scripts');

/**
 * Create custom database table on plugin activation.
 */
function kayak_designer_activate() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'kayak_designs';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        created_at datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        user_id bigint(20) UNSIGNED NOT NULL,
        design_name tinytext NOT NULL,
        design_data longtext NOT NULL,
        model_name varchar(55) DEFAULT '' NOT NULL,
        votes int(11) DEFAULT 0 NOT NULL,
        preview_image longtext NOT NULL,
        PRIMARY KEY  (id),
        KEY user_id (user_id)
    ) $charset_collate;";

    // Create a table for tracking votes with email confirmation
    $votes_table_name = $wpdb->prefix . 'kayak_design_votes';
    $sql_votes = "CREATE TABLE $votes_table_name (
        vote_id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        design_id BIGINT(20) UNSIGNED NOT NULL,
        user_id BIGINT(20) UNSIGNED DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        confirmation_token VARCHAR(64) DEFAULT NULL,
        status ENUM('pending', 'confirmed') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (vote_id),
        UNIQUE KEY unique_user_vote (design_id, user_id),
        UNIQUE KEY unique_email_vote (design_id, email)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    dbDelta($sql_votes);
}
register_activation_hook(__FILE__, 'kayak_designer_activate');

/**
 * The code that runs during plugin activation.
 */
function activate_kayak_designer() {
	// Activation code here.
}
register_activation_hook( __FILE__, 'activate_kayak_designer' );

/**
 * The code that runs during plugin deactivation.
 */
function deactivate_kayak_designer() {
	// Deactivation code here.
}
register_deactivation_hook( __FILE__, 'deactivate_kayak_designer' );

/**
 * Shortcode to display the Kayak Designer.
 *
 * Usage: [kayak_designer]
 *
 * @param array $atts Shortcode attributes.
 * @return string HTML output for the Kayak Designer.
 */
/**
 * Renders a RAL color palette selector.
 *
 * @param string $name The name for the hidden input field.
 * @param string $id The id for the hidden input field.
 * @param string $default_color The default hex color value.
 */
function kayak_designer_render_ral_palette($id, $name, $default_color) {
    $ral_colors = [
        'RAL 1000' => '#CCC58F', 'RAL 1001' => '#D1B784', 'RAL 1002' => '#D2B471', 'RAL 1003' => '#F2C300', 'RAL 1004' => '#E6B800', 'RAL 1005' => '#D4A000', 'RAL 1006' => '#E1A100', 'RAL 1007' => '#E69400', 'RAL 1011' => '#A98358', 'RAL 1012' => '#C0AB5F', 'RAL 1013' => '#E9E5CE', 'RAL 1014' => '#DFCEA1', 'RAL 1015' => '#E9DAB9', 'RAL 1016' => '#F2F03C', 'RAL 1017' => '#F5D03D', 'RAL 1018' => '#F8F32B', 'RAL 1019' => '#A49C8D', 'RAL 1020' => '#9A9478', 'RAL 1021' => '#F2C300', 'RAL 1023' => '#F5BE00', 'RAL 1024' => '#B89C6B', 'RAL 1026' => '#F9FF00', 'RAL 1027' => '#9E906E', 'RAL 1028' => '#F4A800', 'RAL 1032' => '#DDB200', 'RAL 1033' => '#F3A505', 'RAL 1034' => '#EFA444', 'RAL 1035' => '#6F6756', 'RAL 1036' => '#6A5F4B', 'RAL 1037' => '#ECA529',
        'RAL 2000' => '#ED7E00', 'RAL 2001' => '#C15821', 'RAL 2002' => '#CB4A32', 'RAL 2003' => '#FA842B', 'RAL 2004' => '#E87700', 'RAL 2005' => '#FF2300', 'RAL 2007' => '#FFAA3C', 'RAL 2008' => '#F3752C', 'RAL 2009' => '#E56D28', 'RAL 2010' => '#D4652F', 'RAL 2011' => '#EC7C25', 'RAL 2012' => '#DB6A50', 'RAL 2013' => '#A34A28',
        'RAL 3000' => '#C1121C', 'RAL 3001' => '#A1232B', 'RAL 3002' => '#A1232B', 'RAL 3003' => '#8A1E25', 'RAL 3004' => '#701F29', 'RAL 3005' => '#5A1F26', 'RAL 3007' => '#412227', 'RAL 3009' => '#642F28', 'RAL 3011' => '#792429', 'RAL 3012' => '#C3877B', 'RAL 3013' => '#A23D3B', 'RAL 3014' => '#D47479', 'RAL 3015' => '#E2A6B3', 'RAL 3016' => '#B14A3C', 'RAL 3017' => '#D46A73', 'RAL 3018' => '#D15368', 'RAL 3020' => '#C1121C', 'RAL 3022' => '#D57E68', 'RAL 3024' => '#C8242B', 'RAL 3026' => '#D31F31', 'RAL 3027' => '#C12036', 'RAL 3028' => '#CB3234', 'RAL 3031' => '#B5334D',
        'RAL 4001' => '#6D5484', 'RAL 4002' => '#8F3F51', 'RAL 4003' => '#D15B8F', 'RAL 4004' => '#641C34', 'RAL 4005' => '#8179B7', 'RAL 4006' => '#992572', 'RAL 4007' => '#4A2545', 'RAL 4008' => '#8F4386', 'RAL 4009' => '#A4869D', 'RAL 4010' => '#CF458C', 'RAL 4011' => '#8660A0', 'RAL 4012' => '#696A9F',
        'RAL 5000' => '#354D73', 'RAL 5001' => '#1F4274', 'RAL 5002' => '#20214F', 'RAL 5003' => '#2A3756', 'RAL 5004' => '#1D1E22', 'RAL 5005' => '#1E428A', 'RAL 5007' => '#49678D', 'RAL 5008' => '#363E4A', 'RAL 5009' => '#41677D', 'RAL 5010' => '#254E83', 'RAL 5011' => '#232C3F', 'RAL 5012' => '#3B83BD', 'RAL 5013' => '#1E253A', 'RAL 5014' => '#626C86', 'RAL 5015' => '#2575B0', 'RAL 5017' => '#00538A', 'RAL 5018' => '#3F888F', 'RAL 5019' => '#1B5583', 'RAL 5020' => '#1E3441', 'RAL 5021' => '#25796D', 'RAL 5022' => '#252850', 'RAL 5023' => '#49678D', 'RAL 5024' => '#5D9DBB', 'RAL 5025' => '#256D7B', 'RAL 5026' => '#002E63',
        'RAL 6000' => '#316548', 'RAL 6001' => '#2E6444', 'RAL 6002' => '#285A43', 'RAL 6003' => '#424632', 'RAL 6004' => '#004242', 'RAL 6005' => '#0F2D24', 'RAL 6006' => '#3C3D34', 'RAL 6007' => '#283418', 'RAL 6008' => '#342D21', 'RAL 6009' => '#26392F', 'RAL 6010' => '#468641', 'RAL 6011' => '#648266', 'RAL 6012' => '#2C3E3B', 'RAL 6013' => '#7C7B52', 'RAL 6014' => '#444337', 'RAL 6015' => '#3B3C36', 'RAL 6016' => '#008463', 'RAL 6017' => '#448A64', 'RAL 6018' => '#599F45', 'RAL 6019' => '#BDECB6', 'RAL 6020' => '#354733', 'RAL 6021' => '#87A180', 'RAL 6022' => '#3A352A', 'RAL 6024' => '#3D775F', 'RAL 6025' => '#53755C', 'RAL 6026' => '#005A52', 'RAL 6027' => '#81C3C5', 'RAL 6028' => '#2E554A', 'RAL 6029' => '#007054', 'RAL 6032' => '#00846B', 'RAL 6033' => '#499E8D', 'RAL 6034' => '#7FB5B5', 'RAL 6035' => '#1E4531', 'RAL 6036' => '#005950', 'RAL 6037' => '#009B47', 'RAL 6038' => '#00B44F',
        'RAL 7000' => '#7E8B92', 'RAL 7001' => '#8A9597', 'RAL 7002' => '#817F65', 'RAL 7003' => '#7A7B6D', 'RAL 7004' => '#9EA1A1', 'RAL 7005' => '#6C7070', 'RAL 7006' => '#716A5C', 'RAL 7008' => '#6A5F31', 'RAL 7009' => '#5A6351', 'RAL 7010' => '#535A5C', 'RAL 7011' => '#535D69', 'RAL 7012' => '#586069', 'RAL 7013' => '#555548', 'RAL 7015' => '#4E545A', 'RAL 7016' => '#383E42', 'RAL 7021' => '#2E3236', 'RAL 7022' => '#4D4D44', 'RAL 7023' => '#808279', 'RAL 7024' => '#474A51', 'RAL 7026' => '#36454F', 'RAL 7030' => '#929284', 'RAL 7031' => '#5B6971', 'RAL 7032' => '#B9B79F', 'RAL 7033' => '#82897D', 'RAL 7034' => '#8F8B73', 'RAL 7035' => '#D7D7D7', 'RAL 7036' => '#939698', 'RAL 7037' => '#83898E', 'RAL 7038' => '#B5B8B1', 'RAL 7039' => '#6B685E', 'RAL 7040' => '#9DA3A6', 'RAL 7042' => '#91969A', 'RAL 7043' => '#4E5455', 'RAL 7044' => '#CACBCB', 'RAL 7045' => '#92999E', 'RAL 7046' => '#818C95', 'RAL 7047' => '#D0D0D0', 'RAL 7048' => '#898176',
        'RAL 8000' => '#8F734B', 'RAL 8001' => '#9C6B3C', 'RAL 8002' => '#79553D', 'RAL 8003' => '#87532F', 'RAL 8004' => '#8F4E35', 'RAL 8007' => '#6F4A2F', 'RAL 8008' => '#6F4F28', 'RAL 8011' => '#593C2D', 'RAL 8012' => '#603B3D', 'RAL 8014' => '#4A362B', 'RAL 8015' => '#5A3A35', 'RAL 8016' => '#4C2F27', 'RAL 8017' => '#45322E', 'RAL 8019' => '#473A39', 'RAL 8022' => '#212121', 'RAL 8023' => '#A25F2A', 'RAL 8024' => '#79503A', 'RAL 8025' => '#755C48', 'RAL 8028' => '#4E3B2B', 'RAL 8029' => '#8E402A',
        'RAL 9001' => '#FDF4E3', 'RAL 9002' => '#E7EBDA', 'RAL 9003' => '#F4F4F4', 'RAL 9004' => '#2E2E2E', 'RAL 9005' => '#0A0A0A', 'RAL 9006' => '#A5A9A8', 'RAL 9007' => '#8F8F8C', 'RAL 9010' => '#FFFFFF', 'RAL 9011' => '#1C1C1C', 'RAL 9016' => '#F6F6F6', 'RAL 9017' => '#2A2A2B', 'RAL 9018' => '#D7D9D8', 'RAL 9022' => '#9C9A9D', 'RAL 9023' => '#828385'
    ];

    // Find the name of the default color
    $default_color_name = array_search(strtoupper($default_color), array_map('strtoupper', $ral_colors));
    if ($default_color_name === false) {
        $default_color_name = 'Select Color'; // Fallback
    }

    echo '<div class="ral-palette-container">';
    echo '  <input type="hidden" id="' . esc_attr($id) . '" name="' . esc_attr($name) . '" value="' . esc_attr($default_color) . '" class="color-input">';
    echo '  <div class="selected-color-wrapper">';
    echo '      <div class="selected-color-preview" style="background-color:' . esc_attr($default_color) . ';"></div>';
    echo '      <span class="selected-color-name">' . esc_html($default_color_name) . '</span>';
    echo '  </div>';
    echo '  <div class="ral-palette-grid-wrapper is-hidden">';
    echo '      <div class="ral-palette-grid">';
    foreach ($ral_colors as $ral_name => $hex) {
        echo '<div class="ral-swatch" data-color="' . esc_attr($hex) . '" data-color-name="' . esc_attr($ral_name) . '" title="' . esc_attr($ral_name) . '" style="background-color:' . esc_attr($hex) . ';"></div>';
    }
    echo '      </div>'; // .ral-palette-grid
    echo '  </div>'; // .ral-palette-grid-wrapper
    echo '</div>'; // .ral-palette-container
}

/**
 * Scans the models directory to find available kayak models.
 */
function get_kayak_models() {
    $models_path = plugin_dir_path(__FILE__) . 'assets/img/models/';
    $models = [];
    if (is_dir($models_path)) {
        $items = scandir($models_path);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            if (is_dir($models_path . $item)) {
                $models[] = $item;
            }
        }
    }
    return $models;
}

function kayak_designer_shortcode_handler($atts) {
    // Get available models
    $models = get_kayak_models();
    $default_model = 'default';
    if (!in_array($default_model, $models) && !empty($models)) {
        $default_model = $models[0];
    }
    $models_base_url = plugin_dir_url(__FILE__) . 'assets/img/models/';

    // Start output buffering
    ob_start();
    ?>
    <div id="kayak-designer-container">
        <div id="kayak-preview-area">
            <div id="kayak-top-view-container" data-model="<?php echo esc_attr($default_model); ?>">
                <img id="kayak-top-view-img" class="kayak-outline-image" src="<?php echo esc_url($models_base_url . $default_model . '/top_view_outline.png'); ?>" alt="Kayak Top View">
                <!-- Color layers -->
                <div id="kayak-top-view-deck-color" class="color-layer"></div>
                <div id="kayak-top-view-lines-color" class="color-layer"></div>
                <div id="kayak-top-view-accent-front-color" class="color-layer"></div>
                <div id="kayak-top-view-accent-rear-color" class="color-layer"></div>
                <div id="kayak-top-view-cockpit-rim-color" class="color-layer"></div>
                <div id="kayak-top-view-seat-color" class="color-layer"></div>
                <div id="kayak-top-view-logo-color" class="color-layer logo-layer"></div>
                <img id="kayak-top-view-hardware" class="hardware-layer" src="<?php echo esc_url($models_base_url . $default_model . '/top_view_hardware.png'); ?>" alt="Kayak Top Hardware">
                <div class="view-controls"><span class="zoom-icon" data-view="top">&#x26F6;</span></div>
            </div>
            <div id="kayak-side-view-container" data-model="<?php echo esc_attr($default_model); ?>">
                <img id="kayak-side-view-img" class="kayak-outline-image" src="<?php echo esc_url($models_base_url . $default_model . '/side_view_outline.png'); ?>" alt="Kayak Side View">
                <!-- Color layers -->
                <div id="kayak-side-view-hull-color" class="color-layer"></div>
                <div id="kayak-side-view-deck-color" class="color-layer"></div>
                <div id="kayak-side-view-deck-seam-tape-color" class="color-layer"></div>
                <div id="kayak-side-view-lines-color" class="color-layer"></div>
                <div id="kayak-side-view-cockpit-rim-color" class="color-layer"></div>
                <div id="kayak-side-view-accent-front-color" class="color-layer"></div>
                <div id="kayak-side-view-accent-rear-color" class="color-layer"></div>
                <div id="kayak-side-view-logo-color" class="color-layer logo-layer"></div>
                <img id="kayak-side-view-hardware" class="hardware-layer" src="<?php echo esc_url($models_base_url . $default_model . '/side_view_hardware.png'); ?>" alt="Kayak Side Hardware">
                <div class="view-controls"><span class="zoom-icon" data-view="side">&#x26F6;</span></div>
            </div>
        </div>

        <!-- Modal for Full-screen View -->
        <div id="kayak-designer-modal" class="kayak-modal" style="display:none;">
            <span class="kayak-modal-close">&times;</span>
            <div class="kayak-modal-content-wrapper"></div>
        </div>

        <div id="kayak-color-controls">
            <h3>Choose Model, Colors &amp; Layup</h3>

            <div class="controls-grid">
                <div class="control-section">
                    <h4>Kayak Model</h4>
                    <label for="kayak-model-select">Select Model:</label>
                    <select id="kayak-model-select" name="kayak-model-select">
                        <?php foreach ($models as $model) : ?>
                            <option value="<?php echo esc_attr($model); ?>" <?php selected($model, $default_model); ?>>
                                <?php echo esc_html(ucwords(str_replace(['_', '-'], ' ', $model))); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>

                    <h4 style="margin-top: 15px;">Deck/Hull colors</h4>
                    <div class="grid-2-col">
                        <div class="control-group">
                            <label for="deck-color">Deck base:</label>
                            <?php kayak_designer_render_ral_palette('deck-color', 'deck-color', '#F4F4F4'); ?>
                        </div>
                        <div class="control-group">
                            <label for="hull-color">Hull base:</label>
                            <?php kayak_designer_render_ral_palette('hull-color', 'hull-color', '#E0E0E0'); ?>
                        </div>
                    </div>
                    <label for="hull-finish" style="margin-top: 15px;">Hull material finish:</label>
                    <select id="hull-finish" name="hull-finish">
                        <option value="standard">Standard</option>
                        <option value="carbon">Carbon</option>
                        <option value="carbon_kevlar">Carbon Kevlar</option> 
                    </select>

                    <h4>Logos</h4>
                    <label for="logo-color">Logo color:</label>
                    <?php kayak_designer_render_ral_palette('logo-color', 'logo-color', '#FFFFFF'); ?>
                </div>

                <div class="control-section">
                    <h4>Accessories</h4>
                    <div class="grid-2-col">
                        <div class="control-group">
                            <label for="deck-seam-tape-color">Seam tape:</label>
                            <?php kayak_designer_render_ral_palette('deck-seam-tape-color', 'deck-seam-tape-color', '#0A0A0A'); ?>
                        </div>
                        <div class="control-group">
                            <label for="lines-color">Lines:</label>
                            <?php kayak_designer_render_ral_palette('lines-color', 'lines-color', '#000000'); ?>
                        </div>
                        <div class="control-group">
                            <label for="accent-front-color">Front accent:</label>
                            <?php kayak_designer_render_ral_palette('accent-front-color', 'accent-front-color', '#C0C0C0'); ?>
                        </div>
                        <div class="control-group">
                            <label for="accent-rear-color">Rear accent:</label>
                            <?php kayak_designer_render_ral_palette('accent-rear-color', 'accent-rear-color', '#C0C0C0'); ?>
                        </div>
                        <div class="control-group">
                            <label for="cockpit-rim-color">Cockpit rim:</label>
                            <?php kayak_designer_render_ral_palette('cockpit-rim-color', 'cockpit-rim-color', '#333333'); ?>
                        </div>
                        <div class="control-group">
                            <label for="seat-color">Seat color:</label>
                            <?php kayak_designer_render_ral_palette('seat-color', 'seat-color', '#555555'); ?>
                        </div>
                    </div>
                </div>

                <div class="control-section">
                    <h4>Manage &amp; Save</h4>
                    <div id="saved-designs-container">
                        <label for="saved-designs-select">Load Design:</label>
                        <select id="saved-designs-select" name="saved-designs-select" style="margin-bottom: 15px;">
                            <option value="">Select a Design...</option>
                        </select>
                    </div>
                    <label for="design-name">Design Name:</label>
                    <input type="text" id="design-name" name="design-name" placeholder="e.g., My Awesome Kayak">
                    <button id="save-design-button" class="button" style="margin: 1em 0; width: 100%;">Save Design</button>

                    <h4>Export</h4>
                    <p>Download your creation.</p>
                    <button id="export-png-button" class="button button-primary" style="width: 100%; margin-bottom: 10px;">Export as PNG</button>
                    <button id="export-pdf-button" class="button" style="width: 100%;">Export as PDF</button>
                </div>
            </div>
        </div>
    <?php
    // Return the buffered output
    return ob_get_clean();
}
add_shortcode('kayak_designer', 'kayak_designer_shortcode_handler');

/**
 * Enqueue scripts and styles for the Kayak Designer.
 */
function kayak_designer_enqueue_assets() {
    global $post;
    if (is_a($post, 'WP_Post') && (has_shortcode($post->post_content, 'kayak_designer') || has_shortcode($post->post_content, 'kayak_designer_gallery'))) {

        // Enqueue Kayak Designer CSS
        wp_enqueue_style(
            'kayak-designer-css',
            plugin_dir_url(__FILE__) . 'assets/css/kayak-designer.css',
            [], // No dependencies
            filemtime(plugin_dir_path(__FILE__) . 'assets/css/kayak-designer.css')
        );

        // Enqueue html2canvas for export functionality
        wp_enqueue_script(
            'html2canvas',
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
            [], // No dependencies
            '1.4.1',
            true
        );

        // Enqueue jsPDF for PDF export functionality
        wp_enqueue_script(
            'jspdf',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            [], // No dependencies
            '2.5.1',
            true
        );

        // Register and enqueue all module scripts separately so we can apply type="module" to them
        $modules_path = plugin_dir_url(__FILE__) . 'assets/js/modules/';
        $modules_dir = plugin_dir_path(__FILE__) . 'assets/js/modules/';
        
        // Define all our module scripts
        $module_scripts = [
            'kayak-designer-js' => [
                'path' => plugin_dir_url(__FILE__) . 'assets/js/kayak-designer.js',
                'file_path' => plugin_dir_path(__FILE__) . 'assets/js/kayak-designer.js',
                'deps' => ['html2canvas', 'jspdf']
            ],
            'kayak-designer-utils' => [
                'path' => $modules_path . 'utils.js',
                'file_path' => $modules_dir . 'utils.js',
                'deps' => []
            ],
            'kayak-designer-core' => [
                'path' => $modules_path . 'core.js',
                'file_path' => $modules_dir . 'core.js',
                'deps' => ['kayak-designer-utils']
            ],
            'kayak-designer-designer' => [
                'path' => $modules_path . 'designer.js',
                'file_path' => $modules_dir . 'designer.js',
                'deps' => ['kayak-designer-utils']
            ],
            'kayak-designer-gallery' => [
                'path' => $modules_path . 'gallery.js',
                'file_path' => $modules_dir . 'gallery.js',
                'deps' => ['kayak-designer-utils']
            ],
            'kayak-designer-modal' => [
                'path' => $modules_path . 'modal.js',
                'file_path' => $modules_dir . 'modal.js',
                'deps' => []
            ],
            'kayak-designer-render' => [
                'path' => $modules_path . 'render.js',
                'file_path' => $modules_dir . 'render.js',
                'deps' => ['kayak-designer-utils']
            ],
            'kayak-designer-storage' => [
                'path' => $modules_path . 'storage.js',
                'file_path' => $modules_dir . 'storage.js',
                'deps' => ['kayak-designer-utils']
            ]
        ];
        
        // Register each module script
        foreach ($module_scripts as $handle => $script) {
            wp_register_script(
                $handle,
                $script['path'],
                $script['deps'],
                filemtime($script['file_path']),
                true
            );
        }
        
        // Only need to enqueue the main script, as dependencies will be loaded automatically
        wp_enqueue_script('kayak-designer-js');
        
        // Add type="module" attribute to all our module script tags
        add_filter('script_loader_tag', function($tag, $handle) use ($module_scripts) {
            if (array_key_exists($handle, $module_scripts)) {
                $tag = str_replace(' src', ' type="module" src', $tag);
            }
            return $tag;
        }, 10, 2);

        // Pass data from PHP to our JavaScript file
        $options = get_option('kayak_designer_options');
        wp_localize_script(
            'kayak-designer-js',
            'kayakDesignerData',
            [
                'apiKey'         => isset($options['api_key']) ? esc_attr($options['api_key']) : '',
                'pluginUrl'      => plugin_dir_url(__FILE__),
                'ajaxUrl'        => admin_url('admin-ajax.php'),
                'patternsPath'   => plugin_dir_url(__FILE__) . 'assets/img/patterns/',
                'nonce'          => wp_create_nonce('kayak_designer_nonce'),
                'isUserLoggedIn' => is_user_logged_in() ? 'true' : 'false',
                'isSuperAdmin'   => current_user_can('manage_options') ? 'true' : 'false',
                'adminUrl'       => admin_url('admin.php?page=kayak-designer-designs'),
                'modelsList'     => get_kayak_models(),
                'modelsBaseUrl'  => plugin_dir_url(__FILE__) . 'assets/img/models/'
            ]
        );
    }
}


add_action('wp_enqueue_scripts', 'kayak_designer_enqueue_assets');

// --- AJAX Handlers for Design Management ---

/**
 * Save a user's kayak design.
 */
function kayak_designer_save_design() {
    if (!is_user_logged_in() || !check_ajax_referer('kayak_designer_nonce', 'nonce', false)) {
        wp_send_json_error('Authentication failed.');
        return;
    }

    $user_id = get_current_user_id();
    $design_name = isset($_POST['design_name']) ? sanitize_text_field($_POST['design_name']) : 'Untitled Design';
    $design_data = isset($_POST['design_data']) ? stripslashes($_POST['design_data']) : null;
    $model_name = isset($_POST['model_name']) ? sanitize_text_field($_POST['model_name']) : 'default';
    $preview_image = isset($_POST['preview_image']) ? $_POST['preview_image'] : '';

    if (empty($design_name) || !$design_data) {
        wp_send_json_error('Missing data.');
        return;
    }

    global $wpdb;
    $table_name = $wpdb->prefix . 'kayak_designs';

    // Check for an existing identical design for the same user
    $existing_design = $wpdb->get_var($wpdb->prepare(
        "SELECT id FROM $table_name WHERE user_id = %d AND design_name = %s AND design_data = %s",
        $user_id,
        $design_name,
        $design_data
    ));

    if ($existing_design) {
        wp_send_json_error('You have already saved this exact design with the same name.');
        return;
    }

    $result = $wpdb->insert(
        $table_name,
        [
            'created_at'  => current_time('mysql'),
            'user_id'     => $user_id,
            'design_name' => $design_name,
            'design_data' => $design_data, // Already a JSON string from the client
            'model_name'  => $model_name,
            'preview_image' => $preview_image,
        ],
        ['%s', '%d', '%s', '%s', '%s', '%s']
    );

    if ($result) {
        wp_send_json_success('Design saved successfully.');
    } else {
        wp_send_json_error('Could not save design to the database. DB Error: ' . $wpdb->last_error);
    }
}
add_action('wp_ajax_save_kayak_design', 'kayak_designer_save_design');

/**
 * Get all saved designs for the current user.
 */
function kayak_designer_get_designs() {
    if (!is_user_logged_in() || !check_ajax_referer('kayak_designer_nonce', 'nonce', false)) {
        wp_send_json_error('Authentication failed.');
        return;
    }

    global $wpdb;
    $user_id = get_current_user_id();
    $table_name = $wpdb->prefix . 'kayak_designs';

    $designs = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT id, design_name FROM $table_name WHERE user_id = %d ORDER BY created_at DESC",
            $user_id
        )
    );

    if (is_null($designs)) {
        wp_send_json_error('Failed to retrieve designs.');
        return;
    }

    // The JS expects an array of objects with 'id' and 'name' keys.
    $design_list = array_map(function($design) {
        return ['id' => $design->id, 'name' => $design->design_name];
    }, $designs);

    wp_send_json_success($design_list);
}
add_action('wp_ajax_get_kayak_designs', 'kayak_designer_get_designs');

/**
 * Load a specific design's data.
 */
function kayak_designer_load_design() {
    if (!is_user_logged_in() || !check_ajax_referer('kayak_designer_nonce', 'nonce', false)) {
        wp_send_json_error('Authentication failed.');
        return;
    }

    global $wpdb;
    $user_id = get_current_user_id();
    // Check both GET and POST for the design_id parameter
    $design_id = 0;
    if (isset($_POST['design_id'])) {
        $design_id = absint($_POST['design_id']);
    } elseif (isset($_GET['design_id'])) {
        $design_id = absint($_GET['design_id']);
    }

    if (!$design_id) {
        wp_send_json_error('No design ID specified.');
        return;
    }

    $table_name = $wpdb->prefix . 'kayak_designs';

    $design_data = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT design_data FROM $table_name WHERE id = %d AND user_id = %d",
            $design_id,
            $user_id
        )
    );

    if ($design_data) {
        // The data is stored as a JSON string, which the client-side JS will parse.
        wp_send_json_success($design_data);
    } else {
        wp_send_json_error('Design not found or you do not have permission to access it.');
    }
}
add_action('wp_ajax_load_kayak_design', 'kayak_designer_load_design');

/**
 * Delete a specific design.
 */
function kayak_designer_delete_design() {
    if (!is_user_logged_in() || !check_ajax_referer('kayak_designer_nonce', 'nonce', false)) {
        wp_send_json_error('Authentication failed.');
        return;
    }

    global $wpdb;
    $user_id = get_current_user_id();
    $design_id = isset($_POST['design_id']) ? absint($_POST['design_id']) : 0;

    if (!$design_id) {
        wp_send_json_error('No design ID specified.');
        return;
    }

    $table_name = $wpdb->prefix . 'kayak_designs';

    // First check if the design belongs to the current user
    $design_exists = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT id FROM $table_name WHERE id = %d AND user_id = %d",
            $design_id,
            $user_id
        )
    );

    if (!$design_exists) {
        wp_send_json_error('Design not found or you do not have permission to delete it.');
        return;
    }

    // Delete the design
    $result = $wpdb->delete(
        $table_name,
        [
            'id' => $design_id,
            'user_id' => $user_id // Extra safety to ensure only the owner can delete
        ],
        ['%d', '%d']
    );

    if ($result) {
        wp_send_json_success('Design deleted successfully.');
    } else {
        wp_send_json_error('Could not delete the design. DB Error: ' . $wpdb->last_error);
    }
}
add_action('wp_ajax_delete_kayak_design', 'kayak_designer_delete_design');

// Include required files
require_once plugin_dir_path(__FILE__) . 'gallery-functions.php';
require_once plugin_dir_path(__FILE__) . 'admin/admin-helpers.php';

// Load admin-only files
if (is_admin()) {
    require_once plugin_dir_path(__FILE__) . 'admin/settings-page.php';
    require_once plugin_dir_path(__FILE__) . 'admin/designs-manager.php';
}