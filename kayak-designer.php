<?php
/**
 * Plugin Name:       Kayak Designer
 * Plugin URI:        https://example.com/plugins/the-basics/
 * Description:       Allows users to customize kayak designs with colors, patterns, and accessories, then download their creations as PDF or SVG files.
 * Version:           1.0.0
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
 * Add options page
 */
function kayak_designer_options_page() {
    add_options_page(
        'Kayak Designer Settings',
        'Kayak Designer',
        'manage_options',
        'kayak-designer',
        'kayak_designer_options_page_html'
    );
}
add_action('admin_menu', 'kayak_designer_options_page');

/**
 * Render the settings page
 */
function kayak_designer_options_page_html() {
    // check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <p>To display the Kayak Designer on any page, post, or widget, simply add the following shortcode:</p>
        <p><code>[kayak_designer]</code></p>
        <form action="options.php" method="post">
            <?php
            // output security fields for the registered setting "kayak_designer"
            settings_fields('kayak_designer');
            // output setting sections and their fields
            do_settings_sections('kayak-designer');
            // output save settings button
            submit_button('Save Settings');
            ?>
        </form>
    </div>
    <?php
}

/**
 * Register settings
 */
function kayak_designer_register_settings() {
    register_setting('kayak_designer', 'kayak_designer_options', [
        'default' => [
            'api_key' => '',
        ],
        'sanitize_callback' => 'kayak_designer_sanitize_options',
    ]);

    // API Settings Section (existing)
    add_settings_section(
        'kayak_designer_section_api',
        'API Settings',
        'kayak_designer_section_api_callback',
        'kayak-designer'
    );

    add_settings_field(
        'kayak_designer_field_api_key',
        'API Key',
        'kayak_designer_field_api_key_html',
        'kayak-designer',
        'kayak_designer_section_api'
    );

}

add_action('admin_init', 'kayak_designer_register_settings');

/**
 * Sanitize options
 */
function kayak_designer_sanitize_options($input) {
    $output = get_option('kayak_designer_options', []); // Get existing options to preserve them, default to empty array if not set
    
    // Sanitize API Key
    if (isset($input['api_key'])) {
        $output['api_key'] = sanitize_text_field($input['api_key']);
    }
    
    return $output;
}

/**
 * Section callback
 */
function kayak_designer_section_api_callback() {
    echo '<p>Enter your API settings below.</p>';
}

/**
 * Field HTML
 */
function kayak_designer_field_api_key_html() {
    $options = get_option('kayak_designer_options');
    ?>
    <input type="text" name="kayak_designer_options[api_key]" value="<?php echo esc_attr(isset($options['api_key']) ? $options['api_key'] : ''); ?>">
    <?php
}

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
function kayak_designer_render_ral_palette($name, $id, $default_color) {
    $ral_colors = [
        'RAL 1000' => '#CCC58F', 'RAL 1001' => '#D1B784', 'RAL 1002' => '#D2B471', 'RAL 1003' => '#F2C300', 'RAL 1004' => '#E6B800', 'RAL 1005' => '#D4A000', 'RAL 1006' => '#E1A100', 'RAL 1007' => '#E69400', 'RAL 1011' => '#A98358', 'RAL 1012' => '#C0AB5F', 'RAL 1013' => '#E9E5CE', 'RAL 1014' => '#DFCEA1', 'RAL 1015' => '#E9DAB9', 'RAL 1016' => '#F2F03C', 'RAL 1017' => '#F5D03D', 'RAL 1018' => '#F8F32B', 'RAL 1019' => '#A49C8D', 'RAL 1020' => '#9A9478', 'RAL 1021' => '#F2C300', 'RAL 1023' => '#F5BE00', 'RAL 1024' => '#B89C6B', 'RAL 1026' => '#F9FF00', 'RAL 1027' => '#9E906E', 'RAL 1028' => '#F4A800', 'RAL 1032' => '#DDB200', 'RAL 1033' => '#F3A505', 'RAL 1034' => '#EFA444', 'RAL 1035' => '#6F6756', 'RAL 1036' => '#6A5F4B', 'RAL 1037' => '#ECA529',
        'RAL 2000' => '#ED7E00', 'RAL 2001' => '#C15821', 'RAL 2002' => '#CB4A32', 'RAL 2003' => '#FA842B', 'RAL 2004' => '#E87700', 'RAL 2005' => '#FF2300', 'RAL 2007' => '#FFAA3C', 'RAL 2008' => '#F3752C', 'RAL 2009' => '#E56D28', 'RAL 2010' => '#D4652F', 'RAL 2011' => '#EC7C25', 'RAL 2012' => '#DB6A50', 'RAL 2013' => '#A34A28',
        'RAL 3000' => '#B22222', 'RAL 3001' => '#9B2423', 'RAL 3002' => '#9A2A29', 'RAL 3003' => '#8B2222', 'RAL 3004' => '#6E262F', 'RAL 3005' => '#5A2328', 'RAL 3007' => '#3E282A', 'RAL 3009' => '#6C3736', 'RAL 3011' => '#7B2E2E', 'RAL 3012' => '#C1877E', 'RAL 3013' => '#9C3436', 'RAL 3014' => '#D47479', 'RAL 3015' => '#E1A6AD', 'RAL 3016' => '#B14A3C', 'RAL 3017' => '#D8636F', 'RAL 3018' => '#D14257', 'RAL 3020' => '#C41E25', 'RAL 3022' => '#D56D4C', 'RAL 3024' => '#FF0000', 'RAL 3026' => '#FF0000', 'RAL 3027' => '#C83C50', 'RAL 3028' => '#D83E34', 'RAL 3031' => '#A73A46', 'RAL 3032' => '#742326', 'RAL 3033' => '#B54C43',
        'RAL 4001' => '#6A4975', 'RAL 4002' => '#863D4A', 'RAL 4003' => '#D15B8F', 'RAL 4004' => '#64244C', 'RAL 4005' => '#6C5996', 'RAL 4006' => '#923B7A', 'RAL 4007' => '#452947', 'RAL 4008' => '#864982', 'RAL 4009' => '#9D8499', 'RAL 4010' => '#CF4A7B', 'RAL 4011' => '#8A63AB', 'RAL 4012' => '#6B688C',
        'RAL 5000' => '#354D73', 'RAL 5001' => '#1F3453', 'RAL 5002' => '#20214F', 'RAL 5003' => '#2A3458', 'RAL 5004' => '#1D1E22', 'RAL 5005' => '#1E2460', 'RAL 5007' => '#3E5F8A', 'RAL 5008' => '#313C49', 'RAL 5009' => '#2E5A88', 'RAL 5010' => '#00508C', 'RAL 5011' => '#232837', 'RAL 5012' => '#2E84C5', 'RAL 5013' => '#252C48', 'RAL 5014' => '#606E8C', 'RAL 5015' => '#0071B5', 'RAL 5017' => '#00659D', 'RAL 5018' => '#25858E', 'RAL 5019' => '#005A93', 'RAL 5020' => '#00313C', 'RAL 5021' => '#007C80', 'RAL 5022' => '#2A2754', 'RAL 5023' => '#4D658D', 'RAL 5024' => '#5D8DBE', 'RAL 5025' => '#4A79A5', 'RAL 5026' => '#13264D',
        'RAL 6000' => '#316548', 'RAL 6001' => '#2E6444', 'RAL 6002' => '#285A43', 'RAL 6003' => '#424632', 'RAL 6004' => '#004242', 'RAL 6005' => '#0F2D24', 'RAL 6006' => '#3C3D34', 'RAL 6007' => '#283418', 'RAL 6008' => '#342D21', 'RAL 6009' => '#26392F', 'RAL 6010' => '#468641', 'RAL 6011' => '#648266', 'RAL 6012' => '#2C3E3B', 'RAL 6013' => '#7C7B52', 'RAL 6014' => '#444337', 'RAL 6015' => '#3B3C36', 'RAL 6016' => '#008463', 'RAL 6017' => '#448A64', 'RAL 6018' => '#599F45', 'RAL 6019' => '#BDECB6', 'RAL 6020' => '#354733', 'RAL 6021' => '#87A180', 'RAL 6022' => '#3A352A', 'RAL 6024' => '#3D775F', 'RAL 6025' => '#53755C', 'RAL 6026' => '#005A52', 'RAL 6027' => '#81C3C5', 'RAL 6028' => '#2E554A', 'RAL 6029' => '#007054', 'RAL 6032' => '#00846B', 'RAL 6033' => '#499E8D', 'RAL 6034' => '#7FB5B5', 'RAL 6035' => '#1E4531', 'RAL 6036' => '#005950', 'RAL 6037' => '#009B47', 'RAL 6038' => '#00B44F',
        'RAL 7000' => '#7E8B92', 'RAL 7001' => '#8A9597', 'RAL 7002' => '#817F65', 'RAL 7003' => '#7A7B6D', 'RAL 7004' => '#9EA1A1', 'RAL 7005' => '#6C7070', 'RAL 7006' => '#716A5C', 'RAL 7008' => '#6A5F31', 'RAL 7009' => '#5A6351', 'RAL 7010' => '#535A5C', 'RAL 7011' => '#535D69', 'RAL 7012' => '#586069', 'RAL 7013' => '#555548', 'RAL 7015' => '#4E545A', 'RAL 7016' => '#383E42', 'RAL 7021' => '#2E3236', 'RAL 7022' => '#4D4D44', 'RAL 7023' => '#808279', 'RAL 7024' => '#474A51', 'RAL 7026' => '#36454F', 'RAL 7030' => '#929284', 'RAL 7031' => '#5B6971', 'RAL 7032' => '#B9B79F', 'RAL 7033' => '#82897D', 'RAL 7034' => '#8F8B73', 'RAL 7035' => '#D7D7D7', 'RAL 7036' => '#939698', 'RAL 7037' => '#83898E', 'RAL 7038' => '#B5B8B1', 'RAL 7039' => '#6B685E', 'RAL 7040' => '#9DA3A6', 'RAL 7042' => '#91969A', 'RAL 7043' => '#4E5455', 'RAL 7044' => '#CACBCB', 'RAL 7045' => '#92999E', 'RAL 7046' => '#818C95', 'RAL 7047' => '#D0D0D0', 'RAL 7048' => '#898176',
        'RAL 8000' => '#8F734B', 'RAL 8001' => '#9C6B3C', 'RAL 8002' => '#79553D', 'RAL 8003' => '#87532F', 'RAL 8004' => '#8F4E35', 'RAL 8007' => '#6F4A2F', 'RAL 8008' => '#6F4F28', 'RAL 8011' => '#593C2D', 'RAL 8012' => '#603B3D', 'RAL 8014' => '#4A362B', 'RAL 8015' => '#5A3A35', 'RAL 8016' => '#4C2F27', 'RAL 8017' => '#45322E', 'RAL 8019' => '#473A39', 'RAL 8022' => '#212121', 'RAL 8023' => '#A25F2A', 'RAL 8024' => '#79503A', 'RAL 8025' => '#755C48', 'RAL 8028' => '#4E3B2B', 'RAL 8029' => '#8E402A',
        'RAL 9001' => '#FDF4E3', 'RAL 9002' => '#E7EBDA', 'RAL 9003' => '#F4F4F4', 'RAL 9004' => '#2E2E2E', 'RAL 9005' => '#0A0A0A', 'RAL 9006' => '#A5A9A8', 'RAL 9007' => '#8F8F8C', 'RAL 9010' => '#FFFFFF', 'RAL 9011' => '#1C1C1C', 'RAL 9016' => '#F6F6F6', 'RAL 9017' => '#2A2A2B', 'RAL 9018' => '#D7D9D8', 'RAL 9022' => '#9C9A9D', 'RAL 9023' => '#828385'
    ];

    // Find the name of the default color, or use the hex code if not found.
    $default_ral_name = array_search(strtoupper($default_color), array_map('strtoupper', $ral_colors));
    if ($default_ral_name === false) {
        $default_ral_name = $default_color;
    }

    echo '<div class="ral-palette-container">';
    echo "<input type='hidden' id='" . esc_attr($id) . "' name='" . esc_attr($name) . "' value='" . esc_attr($default_color) . "' class='color-input'>";
    
    // The currently selected color preview, which is also the dropdown toggle.
    echo '<div class="selected-color-preview" title="' . esc_attr($default_ral_name) . ' (' . esc_attr($default_color) . ')" style="background-color:' . esc_attr($default_color) . ';"></div>';

    // The hidden grid of all available colors.
    echo '<div class="ral-palette-grid-wrapper is-hidden">';
    echo '<div class="ral-palette-grid">';
    foreach ($ral_colors as $ral_name => $hex) {
        echo '<div class="ral-swatch" data-color="' . esc_attr($hex) . '" data-ral-name="' . esc_attr($ral_name) . '" title="' . esc_attr($ral_name) . ' (' . esc_attr($hex) . ')" style="background-color:' . esc_attr($hex) . ';"></div>';
    }
    echo '</div>'; // end .ral-palette-grid
    echo '</div>'; // end .ral-palette-grid-wrapper
    echo '</div>'; // end .ral-palette-container
}

function kayak_designer_shortcode_handler($atts) {
    // Retrieve saved options
    $options = get_option('kayak_designer_options');

    // Start output buffering
    ob_start();
    ?>
    <div id="kayak-designer-container">
        <div id="kayak-preview-area">
            <div id="kayak-top-view-container">
                <img id="kayak-top-view-img" src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'assets/images/placeholder_top.png'); ?>" alt="Kayak Top View">
                <!-- Color layers will be placed here -->
                <div id="kayak-top-view-deck-color" class="color-layer"></div>
                <div id="kayak-top-view-deck-seam-tape-color" class="color-layer"></div>
                <div id="kayak-top-view-lines-color" class="color-layer"></div>
                <div id="kayak-top-view-accent-front-color" class="color-layer"></div>
                <div id="kayak-top-view-accent-rear-color" class="color-layer"></div>
                <div id="kayak-top-view-cockpit-rim-color" class="color-layer"></div>
                <div id="kayak-top-view-seat-color" class="color-layer"></div>
                <div id="kayak-top-view-logo-color" class="color-layer logo-layer"></div>
                <img id="kayak-top-view-hardware" class="hardware-layer" src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'assets/images/hardware/top_view_hardware.png'); ?>" alt="Kayak Top Hardware">
                <!-- Overlays for patterns and logos will go on top of color layers -->
                <div class="view-controls"><span class="zoom-icon" data-view="top">&#x26F6;</span></div>
            </div>
            <div id="kayak-side-view-container">
                <img id="kayak-side-view-img" src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'assets/images/placeholder_side.png'); ?>" alt="Kayak Side View">
                <!-- Color layers will be placed here -->
                <div id="kayak-side-view-hull-color" class="color-layer"></div>
                <div id="kayak-side-view-deck-color" class="color-layer"></div>
                <div id="kayak-side-view-deck-seam-tape-color" class="color-layer"></div>
                <div id="kayak-side-view-lines-color" class="color-layer"></div>

                <div id="kayak-side-view-cockpit-rim-color" class="color-layer"></div>
                <div id="kayak-side-view-logo-color" class="color-layer logo-layer"></div>
                <img id="kayak-side-view-hardware" class="hardware-layer" src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'assets/images/hardware/side_view_hardware.png'); ?>" alt="Kayak Side Hardware">
                <!-- Overlays for patterns and logos will go on top of color layers -->
                <div class="view-controls"><span class="zoom-icon" data-view="side">&#x26F6;</span></div>
            </div>
        </div>

        <!-- Modal for Full-screen View -->
        <div id="kayak-designer-modal" class="modal-hidden">
            <span class="modal-close">&times;</span>
            <div id="modal-content-wrapper"></div>
        </div>

        <div id="kayak-color-controls">
            <h2>Choose colors & layup</h2>

            <!-- DECK OPTIONS -->
            <h3>Deck</h3>
            <div>
                <label for="deck-color">Deck base color:</label>
                <?php kayak_designer_render_ral_palette('deck-color', 'deck-color', '#F4F4F4'); ?>
            </div>

            <!-- HULL OPTIONS -->
            <h3>Hull</h3>
            <div>
                <label>Hull finish:</label>
                <select id="hull-finish" name="hull-finish">
                    <option value="standard">Standard</option>
                    <option value="carbon">Carbon</option> 
                </select>
            </div>
            <div>
                <label for="hull-color">Hull base color:</label>
                <?php kayak_designer_render_ral_palette('hull-color', 'hull-color', '#E0E0E0'); ?>
            </div>

            <!-- ACCESSORIES -->
            <h3>Accessories</h3>
            <div>
                <label for="deck-seam-tape-color">Deck seam tape:</label>
                <?php kayak_designer_render_ral_palette('deck-seam-tape-color', 'deck-seam-tape-color', '#0A0A0A'); ?>
            </div>
            <div>
                <label for="lines-color">Lines:</label>
                <?php kayak_designer_render_ral_palette('lines-color', 'lines-color', '#000000'); ?>
             </div>
            <div>
                <label for="accent-front-color">Front accent:</label>
                <?php kayak_designer_render_ral_palette('accent-front-color', 'accent-front-color', '#C0C0C0'); ?>
            </div>
            <div>
                <label for="accent-rear-color">Rear accent:</label>
                <?php kayak_designer_render_ral_palette('accent-rear-color', 'accent-rear-color', '#C0C0C0'); ?>
            </div>
            <div>
                <label for="cockpit-rim-color">Cockpit Rim:</label>
                <?php kayak_designer_render_ral_palette('cockpit-rim-color', 'cockpit-rim-color', '#333333'); ?>
            </div>
            <div>
                <label for="seat-color">Seat:</label>
                <?php kayak_designer_render_ral_palette('seat-color', 'seat-color', '#555555'); ?>
            </div>

            <!-- LOGOS -->
            <h3>Logos</h3>
            <div>
                <label for="logo-color">Logo color:</label>
                <?php kayak_designer_render_ral_palette('logo-color', 'logo-color', '#FFFFFF'); ?>
            </div>
            </div>

            <!-- EXPORT -->
            <h3>Export</h3>
            <div>
                <button id="export-png-button" class="button button-primary">Export as PNG</button>
                <button id="export-pdf-button" class="button">Export as PDF</button>
            </div>

            <!-- MANAGE DESIGN -->
            <h3>Manage Design</h3>
            <div id="design-management-controls">
                <div>
                    <label for="design-name">Design Name:</label>
                    <input type="text" id="design-name" name="design-name" placeholder="My Awesome Kayak">
                    <button id="save-design-button" class="button">Save Design</button>
                </div>
                <div style="margin-top: 10px;">
                    <label for="saved-designs-select">Load Design:</label>
                    <select id="saved-designs-select" name="saved-designs-select">
                        <option value="">-- Select a Design --</option>
                    </select>
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
    if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'kayak_designer')) {

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

        // Enqueue Kayak Designer JS
        wp_enqueue_script(
            'kayak-designer-js',
            plugin_dir_url(__FILE__) . 'assets/js/kayak-designer.js',
            ['html2canvas', 'jspdf'], // Add dependencies
            filemtime(plugin_dir_path(__FILE__) . 'assets/js/kayak-designer.js'),
            true
        );

        // Pass data from PHP to our JavaScript file
        $options = get_option('kayak_designer_options');
        wp_localize_script(
            'kayak-designer-js',
            'kayakDesignerData',
            [
                'apiKey'        => isset($options['api_key']) ? esc_attr($options['api_key']) : '',
                'pluginBaseUrl' => plugin_dir_url(__FILE__),
                'ajaxUrl'       => admin_url('admin-ajax.php'),
                'nonce'         => wp_create_nonce('kayak_designer_nonce'),
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
    $design_data = isset($_POST['design_data']) ? json_decode(stripslashes($_POST['design_data']), true) : null;

    if (empty($design_name) || !$design_data) {
        wp_send_json_error('Missing data.');
        return;
    }

    $saved_designs = get_user_meta($user_id, 'kayak_designs', true);
    if (!is_array($saved_designs)) {
        $saved_designs = [];
    }

    $design_id = sanitize_title($design_name);
    $saved_designs[$design_id] = [
        'name' => $design_name,
        'data' => $design_data
    ];

    update_user_meta($user_id, 'kayak_designs', $saved_designs);

    wp_send_json_success(['message' => 'Design saved!', 'design_id' => $design_id, 'design_name' => $design_name]);
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

    $user_id = get_current_user_id();
    $saved_designs = get_user_meta($user_id, 'kayak_designs', true);

    if (empty($saved_designs)) {
        wp_send_json_success([]);
        return;
    }

    // Return only names and IDs, not the full data
    $design_list = [];
    foreach ($saved_designs as $design_id => $design) {
        $design_list[] = ['id' => $design_id, 'name' => $design['name']];
    }

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

    $user_id = get_current_user_id();
    $design_id = isset($_POST['design_id']) ? sanitize_text_field($_POST['design_id']) : null;

    if (!$design_id) {
        wp_send_json_error('No design ID specified.');
        return;
    }

    $saved_designs = get_user_meta($user_id, 'kayak_designs', true);

    if (isset($saved_designs[$design_id])) {
        wp_send_json_success($saved_designs[$design_id]['data']);
    } else {
        wp_send_json_error('Design not found.');
    }
}
add_action('wp_ajax_load_kayak_design', 'kayak_designer_load_design');

