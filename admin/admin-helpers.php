<?php
/**
 * Admin helper functions for Kayak Designer
 *
 * @since 1.4
 */

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Generate an admin edit button for a design
 * Only displayed to users with manage_options capability (superadmins)
 *
 * @param int $design_id The design ID to edit
 * @param string $button_class Optional CSS class for the button
 * @return string The HTML for the edit button or empty string if user lacks permission
 */
function kayak_designer_admin_edit_button($design_id, $button_class = '') {
    // Only show edit button to superadmins
    if (!current_user_can('manage_options')) {
        return '';
    }
    
    $class = 'admin-edit-button button';
    if (!empty($button_class)) {
        $class .= ' ' . esc_attr($button_class);
    }
    
    $url = admin_url('admin.php?page=kayak-designer-designs&action=edit&design_id=' . intval($design_id));
    
    return sprintf(
        '<a href="%s" class="%s" title="Admin Edit">Edit</a>',
        esc_url($url),
        $class
    );
}
