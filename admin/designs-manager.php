<?php
/**
 * Kayak Designer - Admin Designs Manager
 * 
 * Allows administrators to view, edit, and delete any kayak design
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Add menu items for Kayak Designer admin
 */
function kayak_designer_admin_menu() {
    // Main plugin settings page
    add_menu_page(
        'Kayak Designer',
        'Kayak Designer',
        'manage_options',
        'kayak-designer',
        'kayak_designer_admin_page',
        'dashicons-art',
        30
    );
    
    // Add submenu for designs management
    add_submenu_page(
        'kayak-designer',
        'Manage Designs',
        'Manage Designs',
        'manage_options',
        'kayak-designer-designs',
        'kayak_designer_designs_page'
    );
    
    // Add submenu for settings
    add_submenu_page(
        'kayak-designer',
        'Settings',
        'Settings',
        'manage_options',
        'kayak-designer-settings',
        'kayak_designer_options_page_html' // Function from settings-page.php
    );
}
add_action('admin_menu', 'kayak_designer_admin_menu');

/**
 * Main admin page content
 */
function kayak_designer_admin_page() {
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <p>Welcome to the Kayak Designer admin page. Use the tabs below to manage different aspects of the plugin.</p>
        
        <h2 class="nav-tab-wrapper">
            <a href="?page=kayak-designer" class="nav-tab nav-tab-active">General</a>
            <a href="?page=kayak-designer-designs" class="nav-tab">Manage Designs</a>
        </h2>
        
        <div class="tab-content">
            <h3>General Settings</h3>
            <p>Configure general settings for the Kayak Designer plugin here.</p>
            
            <?php
            // Gallery Page setting
            $gallery_page_id = get_option('kayak_designer_gallery_page_id', 0);
            ?>
            <form method="post" action="options.php">
                <?php settings_fields('kayak_designer_options'); ?>
                <?php do_settings_sections('kayak_designer'); ?>
                <table class="form-table">
                    <tr valign="top">
                        <th scope="row">Gallery Page</th>
                        <td>
                            <?php
                            wp_dropdown_pages(array(
                                'name' => 'kayak_designer_gallery_page_id',
                                'selected' => $gallery_page_id,
                                'show_option_none' => '-- Select Page --'
                            ));
                            ?>
                            <p class="description">Select the page where the kayak gallery is displayed.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
    </div>
    <?php
}

/**
 * Register designs-specific settings
 */
function kayak_designer_designs_register_settings() {
    register_setting('kayak_designer_options', 'kayak_designer_gallery_page_id');
}
add_action('admin_init', 'kayak_designer_designs_register_settings');

/**
 * Designs management page
 */
function kayak_designer_designs_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'kayak_designs';
    
    // Handle actions
    if (isset($_GET['action']) && isset($_GET['design_id'])) {
        $design_id = intval($_GET['design_id']);
        
        // Delete action
        if ($_GET['action'] === 'delete' && isset($_GET['_wpnonce']) && wp_verify_nonce($_GET['_wpnonce'], 'delete_design_' . $design_id)) {
            $wpdb->delete($table_name, array('id' => $design_id), array('%d'));
            add_settings_error('kayak_designer', 'design_deleted', 'Design successfully deleted.', 'updated');
        }
    }
    
    // Search handling
    $search = isset($_GET['design_search']) ? sanitize_text_field($_GET['design_search']) : '';
    
    // Pagination
    $per_page = 20;
    $current_page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
    $offset = ($current_page - 1) * $per_page;
    
    // Search query
    $search_condition = '';
    $search_params = array();
    
    if (!empty($search)) {
        $search_condition = "AND (design_name LIKE %s)";
        $search_params[] = '%' . $wpdb->esc_like($search) . '%';
    }
    
    // Count total designs (for pagination)
    if (!empty($search_params)) {
        $count_query = "SELECT COUNT(*) FROM $table_name WHERE 1=1 $search_condition";
        $total_designs = $wpdb->get_var($wpdb->prepare($count_query, $search_params));
    } else {
        $count_query = "SELECT COUNT(*) FROM $table_name WHERE 1=1";
        $total_designs = $wpdb->get_var($count_query);
    }
    
    // Get designs for current page
    $designs_query = "SELECT d.*, u.display_name as creator_name 
                    FROM $table_name d 
                    LEFT JOIN {$wpdb->users} u ON d.user_id = u.ID 
                    WHERE 1=1 $search_condition 
                    ORDER BY created_at DESC 
                    LIMIT %d OFFSET %d";
    
    $query_params = array_merge($search_params, array($per_page, $offset));
    $designs = $wpdb->get_results($wpdb->prepare($designs_query, $query_params));
    
    // Calculate total pages
    $total_pages = ceil($total_designs / $per_page);
    
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        
        <h2 class="nav-tab-wrapper">
            <a href="?page=kayak-designer" class="nav-tab">General</a>
            <a href="?page=kayak-designer-designs" class="nav-tab nav-tab-active">Manage Designs</a>
        </h2>
        
        <div class="tab-content">
            <h3>Manage All Kayak Designs</h3>
            <p>View, edit, and delete kayak designs created by users.</p>
            
            <!-- Search form -->
            <form method="get">
                <input type="hidden" name="page" value="kayak-designer-designs">
                <p class="search-box">
                    <label class="screen-reader-text" for="design-search-input">Search Designs:</label>
                    <input type="search" id="design-search-input" name="design_search" value="<?php echo esc_attr($search); ?>">
                    <input type="submit" id="search-submit" class="button" value="Search Designs">
                </p>
            </form>
            
            <!-- Settings errors -->
            <?php settings_errors('kayak_designer'); ?>
            
            <!-- Designs table -->
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Preview</th>
                        <th>Design Name</th>
                        <th>Creator</th>
                        <th>Model</th>
                        <th>Created</th>
                        <th>Votes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($designs)) : ?>
                        <tr>
                            <td colspan="8">No designs found.</td>
                        </tr>
                    <?php else : ?>
                        <?php foreach ($designs as $design) : ?>
                            <tr>
                                <td><?php echo esc_html($design->id); ?></td>
                                <td>
                                    <?php if (!empty($design->preview_image)) : ?>
                                        <img src="<?php echo esc_attr($design->preview_image); ?>" alt="Design Preview" style="max-width: 80px; max-height: 60px;">
                                    <?php else : ?>
                                        No preview
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html($design->design_name); ?></td>
                                <td><?php echo esc_html($design->creator_name); ?></td>
                                <td><?php echo esc_html($design->model_name); ?></td>
                                <td><?php echo esc_html(date_i18n(get_option('date_format'), strtotime($design->created_at))); ?></td>
                                <td><?php echo esc_html($design->votes); ?></td>
                                <td>
                                    <a href="<?php echo esc_url(admin_url('admin.php?page=kayak-designer-designs&action=edit&design_id=' . $design->id)); ?>" class="button button-small">Edit</a>
                                    <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=kayak-designer-designs&action=delete&design_id=' . $design->id), 'delete_design_' . $design->id); ?>" class="button button-small" onclick="return confirm('Are you sure you want to delete this design?');">Delete</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
            
            <!-- Pagination -->
            <?php if ($total_pages > 1) : ?>
                <div class="tablenav bottom">
                    <div class="tablenav-pages">
                        <span class="displaying-num"><?php echo esc_html(sprintf('%d designs', $total_designs)); ?></span>
                        <span class="pagination-links">
                            <?php
                            echo paginate_links(array(
                                'base' => add_query_arg('paged', '%#%'),
                                'format' => '',
                                'prev_text' => '&laquo;',
                                'next_text' => '&raquo;',
                                'total' => $total_pages,
                                'current' => $current_page
                            ));
                            ?>
                        </span>
                    </div>
                </div>
            <?php endif; ?>
            
            <!-- Edit design form - shown when in edit mode -->
            <?php if (isset($_GET['action']) && $_GET['action'] === 'edit' && isset($_GET['design_id'])) : 
                $design_id = intval($_GET['design_id']);
                $design = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $design_id));
                
                if ($design) :
                    // Handle form submission for editing
                    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_design']) && 
                        isset($_POST['_wpnonce']) && wp_verify_nonce($_POST['_wpnonce'], 'edit_design_' . $design_id)) {
                        
                        $updated_data = array(
                            'design_name' => sanitize_text_field($_POST['design_name']),
                            'model_name' => sanitize_text_field($_POST['model_name'])
                            // We don't update design_data here as it would require re-rendering the design
                        );
                        
                        $wpdb->update(
                            $table_name,
                            $updated_data,
                            array('id' => $design_id),
                            array('%s', '%s'),
                            array('%d')
                        );
                        
                        echo '<div class="updated notice"><p>Design updated successfully.</p></div>';
                        $design = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $design_id));
                    }
                ?>
                
                <h3>Edit Design #<?php echo esc_html($design_id); ?></h3>
                <form method="post">
                    <?php wp_nonce_field('edit_design_' . $design_id); ?>
                    <table class="form-table">
                        <tr>
                            <th scope="row">Design Name</th>
                            <td>
                                <input type="text" name="design_name" value="<?php echo esc_attr($design->design_name); ?>" class="regular-text" required>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Model</th>
                            <td>
                                <input type="text" name="model_name" value="<?php echo esc_attr($design->model_name); ?>" class="regular-text">
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Preview</th>
                            <td>
                                <?php if (!empty($design->preview_image)) : ?>
                                    <img src="<?php echo esc_attr($design->preview_image); ?>" alt="Design Preview" style="max-width: 300px;">
                                <?php else : ?>
                                    No preview image available
                                <?php endif; ?>
                            </td>
                        </tr>
                    </table>
                    
                    <p class="submit">
                        <input type="submit" name="save_design" class="button button-primary" value="Update Design">
                        <a href="?page=kayak-designer-designs" class="button">Cancel</a>
                    </p>
                </form>
                <?php else : ?>
                    <div class="notice notice-error"><p>Design not found.</p></div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
    <?php
}
