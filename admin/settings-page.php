<?php
// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

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
    if (!current_user_can('manage_options')) {
        return;
    }
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <p>To display the Kayak Designer on any page, post, or widget, simply add the following shortcode:</p>
        <p><code>[kayak_designer]</code></p>

        <p>To show off the designs in a gallery, use the following shortcode:</p>
        <p><code>[kayak_designer_gallery]</code></p>
        <form action="options.php" method="post">
            <?php
            settings_fields('kayak_designer');
            do_settings_sections('kayak-designer');
            submit_button('Save Settings');
            ?>
        </form>
    </div>
    <?php
}

/**
 * Register settings, sections, and fields.
 */
function kayak_designer_register_settings() {
    register_setting('kayak_designer', 'kayak_designer_options', [
        'default' => [
            'api_key' => '',
            'mailer_type' => 'php_mail',
            'smtp_host' => '',
            'smtp_port' => 587,
            'smtp_encryption' => 'tls',
            'smtp_username' => '',
            'smtp_password' => '',
        ],
        'sanitize_callback' => 'kayak_designer_sanitize_options',
    ]);

    // API Settings Section
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

    // Mail Settings Section
    add_settings_section(
        'kayak_designer_section_mail',
        'Mail Settings',
        'kayak_designer_section_mail_callback',
        'kayak-designer'
    );

    add_settings_field(
        'kayak_designer_field_mailer_type',
        'Mailer Type',
        'kayak_designer_field_mailer_type_html',
        'kayak-designer',
        'kayak_designer_section_mail'
    );

    add_settings_field(
        'kayak_designer_field_smtp_host',
        'SMTP Host',
        'kayak_designer_field_smtp_host_html',
        'kayak-designer',
        'kayak_designer_section_mail'
    );

    add_settings_field(
        'kayak_designer_field_smtp_port',
        'SMTP Port',
        'kayak_designer_field_smtp_port_html',
        'kayak-designer',
        'kayak_designer_section_mail'
    );

    add_settings_field(
        'kayak_designer_field_smtp_encryption',
        'SMTP Encryption',
        'kayak_designer_field_smtp_encryption_html',
        'kayak-designer',
        'kayak_designer_section_mail'
    );

    add_settings_field(
        'kayak_designer_field_smtp_username',
        'SMTP Username',
        'kayak_designer_field_smtp_username_html',
        'kayak-designer',
        'kayak_designer_section_mail'
    );

    add_settings_field(
        'kayak_designer_field_smtp_password',
        'SMTP Password',
        'kayak_designer_field_smtp_password_html',
        'kayak-designer',
        'kayak_designer_section_mail'
    );
}
add_action('admin_init', 'kayak_designer_register_settings');

/**
 * Sanitize options
 */
function kayak_designer_sanitize_options($input) {
    $output = get_option('kayak_designer_options', []);

    if (isset($input['api_key'])) {
        $output['api_key'] = sanitize_text_field($input['api_key']);
    }

    $mail_options = [
        'mailer_type',
        'smtp_host',
        'smtp_encryption',
        'smtp_username',
    ];

    foreach ($mail_options as $key) {
        if (isset($input[$key])) {
            $output[$key] = sanitize_text_field($input[$key]);
        }
    }
    
    if (isset($input['smtp_port'])) {
        $output['smtp_port'] = absint($input['smtp_port']);
    }

    // Do not sanitize password field to allow special characters
    if (isset($input['smtp_password'])) {
        $output['smtp_password'] = $input['smtp_password'];
    }

    return $output;
}

/**
 * Section callback for API settings
 */
function kayak_designer_section_api_callback() {
    echo '<p>Enter your API credentials below.</p>';
}

/**
 * Field HTML for API Key
 */
function kayak_designer_field_api_key_html() {
    $options = get_option('kayak_designer_options');
    $api_key = isset($options['api_key']) ? $options['api_key'] : '';
    ?>
    <input type="text" name="kayak_designer_options[api_key]" value="<?php echo esc_attr($api_key); ?>" class="regular-text">
    <?php
}

/**
 * Section callback for Mail settings
 */
function kayak_designer_section_mail_callback() {
    echo '<p>Configure how the plugin sends emails for vote confirmations. These settings will override the default WordPress email behavior.</p>';
}

/**
 * Field HTML for Mailer Type
 */
function kayak_designer_field_mailer_type_html() {
    $options = get_option('kayak_designer_options');
    $mailer_type = isset($options['mailer_type']) ? $options['mailer_type'] : 'php_mail';
    ?>
    <select name="kayak_designer_options[mailer_type]">
        <option value="php_mail" <?php selected($mailer_type, 'php_mail'); ?>>Default PHP mail()</option>
        <option value="smtp" <?php selected($mailer_type, 'smtp'); ?>>SMTP</option>
    </select>
    <?php
}

/**
 * Field HTML for SMTP Host
 */
function kayak_designer_field_smtp_host_html() {
    $options = get_option('kayak_designer_options');
    $smtp_host = isset($options['smtp_host']) ? $options['smtp_host'] : '';
    ?>
    <input type="text" name="kayak_designer_options[smtp_host]" value="<?php echo esc_attr($smtp_host); ?>" class="regular-text">
    <?php
}

/**
 * Field HTML for SMTP Port
 */
function kayak_designer_field_smtp_port_html() {
    $options = get_option('kayak_designer_options');
    $smtp_port = isset($options['smtp_port']) ? $options['smtp_port'] : '';
    ?>
    <input type="number" name="kayak_designer_options[smtp_port]" value="<?php echo esc_attr($smtp_port); ?>" class="small-text">
    <?php
}

/**
 * Field HTML for SMTP Encryption
 */
function kayak_designer_field_smtp_encryption_html() {
    $options = get_option('kayak_designer_options');
    $smtp_encryption = isset($options['smtp_encryption']) ? $options['smtp_encryption'] : 'none';
    ?>
    <select name="kayak_designer_options[smtp_encryption]">
        <option value="none" <?php selected($smtp_encryption, 'none'); ?>>None</option>
        <option value="ssl" <?php selected($smtp_encryption, 'ssl'); ?>>SSL</option>
        <option value="tls" <?php selected($smtp_encryption, 'tls'); ?>>TLS</option>
    </select>
    <?php
}

/**
 * Field HTML for SMTP Username
 */
function kayak_designer_field_smtp_username_html() {
    $options = get_option('kayak_designer_options');
    $smtp_username = isset($options['smtp_username']) ? $options['smtp_username'] : '';
    ?>
    <input type="text" name="kayak_designer_options[smtp_username]" value="<?php echo esc_attr($smtp_username); ?>" class="regular-text">
    <?php
}

/**
 * Field HTML for SMTP Password
 */
function kayak_designer_field_smtp_password_html() {
    $options = get_option('kayak_designer_options');
    $smtp_password = isset($options['smtp_password']) ? $options['smtp_password'] : '';
    ?>
    <input type="password" name="kayak_designer_options[smtp_password]" value="<?php echo esc_attr($smtp_password); ?>" class="regular-text">
    <?php
}