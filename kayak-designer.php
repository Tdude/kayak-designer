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
        'RAL 1021' => '#F2C300', // Rape yellow
        'RAL 2004' => '#E87700', // Pure orange
        'RAL 3020' => '#C41E25', // Traffic red
        'RAL 5010' => '#00508C', // Gentian blue
        'RAL 6018' => '#599F45', // Yellow green
        'RAL 7035' => '#D7D7D7', // Light grey
        'RAL 9003' => '#F4F4F4', // Signal white
        'RAL 9005' => '#0A0A0A', // Jet black
    ];

    // Ensure default color is in the list to be marked as selected
    if (!in_array(strtoupper($default_color), array_map('strtoupper', $ral_colors))) {
        $ral_colors['Default'] = strtoupper($default_color);
    }

    echo '<div class="ral-palette-container" data-for-input="' . esc_attr($id) . '">';
    echo "<input type='hidden' id='{$id}' name='{$name}' value='{$default_color}' class='color-input'>";
    
    foreach ($ral_colors as $ral_name => $hex) {
        $selected_class = (strcasecmp($hex, $default_color) == 0) ? ' selected' : '';
        echo '<div class="ral-swatch' . $selected_class . '" data-color="' . esc_attr($hex) . '" title="' . esc_attr($ral_name) . ' (' . esc_attr($hex) . ')" style="background-color:' . esc_attr($hex) . ';"></div>';
    }

    echo '</div>';
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
                <div id="kayak-top-view-hull-color" class="color-layer"></div>
                <div id="kayak-top-view-deck-color" class="color-layer"></div>
                <div id="kayak-top-view-deck-seam-tape-color" class="color-layer"></div>
                <div id="kayak-top-view-lines-color" class="color-layer"></div>
                <div id="kayak-top-view-accent-color-1" class="color-layer"></div>
                <div id="kayak-top-view-accent-color-2" class="color-layer"></div>
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
                <div id="kayak-side-view-accent-color-1" class="color-layer"></div>
                <div id="kayak-side-view-accent-color-2" class="color-layer"></div>
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
            <div>
                <label for="deck-logo">Deck logo:</label>
                <select id="deck-logo" name="deck-logo">
                    <option value="">None</option>
                    <option value="logo_placeholder_01.png">Logo A (Placeholder)</option> 
                    <option value="logo_placeholder_02.png">Logo B (Placeholder)</option> 
                </select>
            </div>
            <div>
                <label for="deck-logo-color">Deck logo color:</label>
                <?php kayak_designer_render_ral_palette('deck-logo-color', 'deck-logo-color', '#0A0A0A'); ?>
            </div>

            <!-- HULL OPTIONS -->
            <h3>Hull</h3>
            <div>
                <label>Hull finish:</label>
                <input type="radio" id="hull-finish-solid" name="hull-finish" value="solid" checked> <label for="hull-finish-solid">Solid color</label>
                <input type="radio" id="hull-finish-carbon-black" name="hull-finish" value="carbon_black"> <label for="hull-finish-carbon-black">Clear carbon</label>
                <input type="radio" id="hull-finish-carbon-gold" name="hull-finish" value="carbon_gold"> <label for="hull-finish-carbon-gold">Clear kevlar/carbon</label>
            </div>
            <div id="hull-solid-color-picker-container">
                <label for="hull-color">Hull base color:</label>
                <?php kayak_designer_render_ral_palette('hull-color', 'hull-color', '#D7D7D7'); ?>
            </div>
            <div>
                <label for="hull-logo">Hull logo:</label>
                <select id="hull-logo" name="hull-logo">
                    <option value="">None</option>
                    <option value="logo_placeholder_01.png">Logo A (Placeholder)</option> 
                    <option value="logo_placeholder_02.png">Logo B (Placeholder)</option> 
                </select>
            </div>
            <div>
                <label for="hull-logo-color">Hull logo color:</label>
                <?php kayak_designer_render_ral_palette('hull-logo-color', 'hull-logo-color', '#0A0A0A'); ?>
            </div>

            <!-- OTHER EXISTING COLOR PICKERS -->
            <h4>Other elements</h4>
            <div>
                <label for="deck-seam-tape-color">Deck seam tape:</label>
                <?php kayak_designer_render_ral_palette('deck-seam-tape-color', 'deck-seam-tape-color', '#0A0A0A'); ?>
            </div>
            <div>
                <label for="lines-color">Lines color:</label>
                <?php kayak_designer_render_ral_palette('lines-color', 'lines-color', '#599F45'); ?>
            </div>
            <div>
                <label for="accent-color-1">Accent color 1:</label>
                <?php kayak_designer_render_ral_palette('accent-color-1', 'accent-color-1', '#E87700'); ?>
            </div>
             <div>
                <label for="accent-color-2">Accent color 2:</label>
                <?php kayak_designer_render_ral_palette('accent-color-2', 'accent-color-2', '#00508C'); ?>
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

        // Enqueue Kayak Designer JS
        wp_enqueue_script(
            'kayak-designer-js',
            plugin_dir_url(__FILE__) . 'assets/js/kayak-designer.js',
            [], // No dependencies
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
            ]
        );
    }
}


add_action('wp_enqueue_scripts', 'kayak_designer_enqueue_assets');

