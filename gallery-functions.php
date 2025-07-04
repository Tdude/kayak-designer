<?php

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// --- Public Design Gallery Shortcode ---

/**
 * Handles the [kayak_designer_gallery] shortcode.
 */
function kayak_designer_gallery_shortcode_handler($atts) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'kayak_designs';

    // --- Sorting Logic ---
    $allowed_orderby = ['votes', 'created_at', 'display_name'];
    $orderby = isset($_GET['orderby']) && in_array($_GET['orderby'], $allowed_orderby) ? $_GET['orderby'] : 'created_at';
    $order = 'DESC'; // Default order

    $users_table = $wpdb->prefix . 'users';
    $query = "SELECT d.*, u.display_name FROM {$table_name} d LEFT JOIN {$users_table} u ON d.user_id = u.ID";

    // Handle sorting order
    if ($orderby === 'display_name') {
        $order = 'ASC'; // Sort names alphabetically
    }
    
    // Correctly and safely add order by clause
    $query .= " ORDER BY " . esc_sql($orderby) . " " . esc_sql($order);

    $designs = $wpdb->get_results($query);

    if (empty($designs)) {
        return '<p>No designs have been shared yet.</p>';
    }

    // --- Sorting Form with AJAX ---
    $nonce = wp_create_nonce('kayak_designer_gallery_nonce');
    $output = '<div class="kayak-gallery-sorting">
        <select id="gallery-sort-select" data-nonce="' . $nonce . '">
            <option value="created_at" ' . selected($orderby, 'created_at', false) . '>Sort by Newest</option>
            <option value="votes" ' . selected($orderby, 'votes', false) . '>Sort by Most Voted</option>
            <option value="display_name" ' . selected($orderby, 'display_name', false) . '>Sort by Author</option>
        </select>
        <span id="gallery-loading-indicator" style="display:none;">Loading...</span>
    </div>';

    // --- Gallery Grid ---
    $output .= '<div class="kayak-design-gallery">';

    foreach ($designs as $design) {
        $user_info = get_userdata($design->user_id);
        $author_name = $user_info ? $user_info->display_name : 'Anonymous';
        $design_date = date_format(date_create($design->created_at), 'F j, Y');

        $output .= '<div class="gallery-item">';
        $output .= '<h3>' . esc_html($design->design_name) . '</h3>';
        
        if (!empty($design->preview_image)) {
            // Make the image clickable and add data attributes for the modal
            $output .= '<div class="gallery-item-preview" data-high-res-image="' . esc_attr($design->preview_image) . '">';
            $output .= '<img src="' . esc_attr($design->preview_image) . '" alt="' . esc_attr($design->design_name) . '">';
            $output .= '<span class="zoom-icon" data-modal-image="' . esc_attr($design->preview_image) . '" data-modal-title="' . esc_attr($design->design_name) . '">&#x26F6;</span>';
            $output .= '</div>';
        } else {
            $output .= '<div class="kayak-preview-placeholder">[No Preview]</div>';
        } 
        
        $output .= '<p>By: ' . esc_html($author_name) . '</p>';
        $output .= '<p>Date: ' . esc_html($design_date) . '</p>';
        $output .= '<p>Votes: <span class="vote-count">' . intval($design->votes) . '</span></p>';
        $output .= '<button class="vote-button" data-design-id="' . esc_attr($design->id) . '" data-nonce="' . wp_create_nonce('kayak_designer_vote_nonce') . '">Vote</button>';
        $output .= '</div>';
    }

    $output .= '</div>'; // End .kayak-design-gallery

    // --- Modal Structure ---
    $output .= '<div id="kayak-gallery-modal" class="kayak-modal" style="display:none;">';
    $output .= '  <div class="kayak-modal-content-wrapper">';
    $output .= '      <span class="kayak-modal-close">&times;</span>';
    $output .= '      <h3 id="kayak-gallery-modal-title"></h3>';
    $output .= '      <img class="kayak-modal-content" id="kayak-gallery-modal-image" src="" alt="Full-size design preview">';
    $output .= '  </div>';
    $output .= '</div>';

    return $output;
}
add_shortcode('kayak_designer_gallery', 'kayak_designer_gallery_shortcode_handler');

/**
 * Handles vote confirmation from the email link.
 */
function kayak_designer_confirm_vote() {
    if (!isset($_GET['vote_token'])) {
        return;
    }

    global $wpdb;
    $token = sanitize_text_field($_GET['vote_token']);
    $votes_table = $wpdb->prefix . 'kayak_design_votes';
    $designs_table = $wpdb->prefix . 'kayak_designs';

    $vote = $wpdb->get_row($wpdb->prepare("SELECT * FROM $votes_table WHERE confirmation_token = %s AND status = 'pending'", $token));

    if ($vote) {
        // Confirm the vote
        $wpdb->update($votes_table, ['status' => 'confirmed', 'confirmation_token' => null], ['vote_id' => $vote->vote_id]);
        
        // Increment the master vote count
        $wpdb->query($wpdb->prepare("UPDATE $designs_table SET votes = votes + 1 WHERE id = %d", $vote->design_id));
        
        // Find the gallery page to redirect back to
        $gallery_page_url = home_url('/'); // Default to home page
        $pages = get_pages();
        foreach ($pages as $page) {
            if (has_shortcode($page->post_content, 'kayak_designer_gallery')) {
                $gallery_page_url = get_permalink($page->ID);
                break;
            }
        }
        wp_redirect(add_query_arg('vote_confirmed', '1', $gallery_page_url));
        exit();
    } else {
        wp_die('This confirmation link is invalid or has already been used.', 'Invalid Link');
    }
}
add_action('init', 'kayak_designer_confirm_vote');

/**
 * Handles the initial AJAX request for a guest vote (collects email).
 */
function kayak_designer_request_guest_vote() {
    // Nonce check
    $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';
    if (!wp_verify_nonce($nonce, 'kayak_designer_vote_nonce')) {
        wp_send_json_error('Nonce verification failed!');
    }

    global $wpdb;
    $design_id = isset($_POST['design_id']) ? absint($_POST['design_id']) : 0;
    $email = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';

    if (!$design_id || !is_email($email)) {
        wp_send_json_error('Invalid data provided.');
    }

    $votes_table = $wpdb->prefix . 'kayak_design_votes';

    // Check if this email has already voted for this design
    $existing_vote = $wpdb->get_var($wpdb->prepare("SELECT vote_id FROM $votes_table WHERE design_id = %d AND email = %s", $design_id, $email));
    if ($existing_vote) {
        wp_send_json_error('This email address has already been used to vote for this design.');
    }

    // Create a pending vote
    $token = wp_generate_password(32, false);
    $wpdb->insert($votes_table, [
        'design_id' => $design_id,
        'email' => $email,
        'confirmation_token' => $token,
        'status' => 'pending'
    ]);

    // Send confirmation email
    $confirmation_link = add_query_arg('vote_token', $token, home_url());
    $subject = 'Confirm Your Vote';
    $message = "Please click the link below to confirm your vote:\n\n" . $confirmation_link;
    $headers = ['From: Kayak Designer <noreply@' . parse_url(home_url(), PHP_URL_HOST) . '>'];
    
    wp_mail($email, $subject, $message, $headers);

    // For local testing, we also provide the link directly in the success message.
    $success_message = 'Thank you! Please check your email to confirm your vote. <br><br>For testing on localhost, you can use this link: <a href="' . esc_url($confirmation_link) . '" target="_blank">Confirm Vote</a>';

    wp_send_json_success($success_message);
}
add_action('wp_ajax_nopriv_kayak_designer_request_guest_vote', 'kayak_designer_request_guest_vote');

/**
 * Handles AJAX request for voting from a logged-in user.
 */
function kayak_designer_handle_vote() {
    $nonce = isset($_POST['nonce']) ? $_POST['nonce'] : '';
    if (!wp_verify_nonce($nonce, 'kayak_designer_vote_nonce')) {
        wp_send_json_error('Nonce verification failed!');
    }

    if (!is_user_logged_in()) {
        wp_send_json_error('You must be logged in to vote this way.');
    }

    global $wpdb;
    $design_id = isset($_POST['design_id']) ? absint($_POST['design_id']) : 0;
    $user_id = get_current_user_id();

    $votes_table = $wpdb->prefix . 'kayak_design_votes';
    $designs_table = $wpdb->prefix . 'kayak_designs';

    // Check for existing vote
    $existing_vote = $wpdb->get_var($wpdb->prepare("SELECT vote_id FROM $votes_table WHERE design_id = %d AND user_id = %d", $design_id, $user_id));
    if ($existing_vote) {
        wp_send_json_error('You have already voted for this design.');
    }

    // Record the vote
    $inserted = $wpdb->insert($votes_table, [
        'design_id' => $design_id,
        'user_id' => $user_id,
        'status' => 'confirmed'
    ]);

    if (!$inserted) {
        wp_send_json_error('Could not record your vote. You may have already voted.');
        return;
    }

    // Increment the master vote count
    $wpdb->query($wpdb->prepare("UPDATE $designs_table SET votes = votes + 1 WHERE id = %d", $design_id));

    $new_vote_count = $wpdb->get_var($wpdb->prepare("SELECT votes FROM $designs_table WHERE id = %d", $design_id));

    wp_send_json_success(['new_vote_count' => $new_vote_count]);
}
add_action('wp_ajax_kayak_designer_handle_vote', 'kayak_designer_handle_vote');

/**
 * Configure SMTP settings for wp_mail.
 */
function kayak_designer_smtp_config($phpmailer) {
    $options = get_option('kayak_designer_options');

    if (!isset($options['mailer_type']) || $options['mailer_type'] !== 'smtp') {
        return;
    }

    $phpmailer->isSMTP();
    $phpmailer->Host       = isset($options['smtp_host']) ? $options['smtp_host'] : '';
    $phpmailer->SMTPAuth   = true;
    $phpmailer->Port       = isset($options['smtp_port']) ? $options['smtp_port'] : 587;
    $phpmailer->Username   = isset($options['smtp_username']) ? $options['smtp_username'] : '';
    $phpmailer->Password   = isset($options['smtp_password']) ? $options['smtp_password'] : '';
    $phpmailer->SMTPSecure = isset($options['smtp_encryption']) ? $options['smtp_encryption'] : 'tls';
}
add_action('phpmailer_init', 'kayak_designer_smtp_config');

/**
 * AJAX handler for gallery filtering
 */
function kayak_designer_gallery_filter() {
    // Verify nonce for security
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'kayak_designer_gallery_nonce')) {
        wp_send_json_error('Security check failed');
        return;
    }
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'kayak_designs';
    
    // --- Sorting Logic ---
    $allowed_orderby = ['votes', 'created_at', 'display_name'];
    $orderby = isset($_POST['orderby']) && in_array($_POST['orderby'], $allowed_orderby) ? $_POST['orderby'] : 'created_at';
    $order = 'DESC'; // Default order
    
    $users_table = $wpdb->prefix . 'users';
    $query = "SELECT d.*, u.display_name FROM {$table_name} d LEFT JOIN {$users_table} u ON d.user_id = u.ID";
    
    // Handle sorting order
    if ($orderby === 'display_name') {
        $order = 'ASC'; // Sort names alphabetically
    }
    
    // Correctly and safely add order by clause
    $query .= " ORDER BY " . esc_sql($orderby) . " " . esc_sql($order);
    
    $designs = $wpdb->get_results($query);
    
    if (empty($designs)) {
        wp_send_json_success(['html' => '<p>No designs have been shared yet.</p>']);
        return;
    }
    
    // --- Gallery Grid ---
    $output = '';
    
    foreach ($designs as $design) {
        $user_info = get_userdata($design->user_id);
        $author_name = $user_info ? $user_info->display_name : 'Anonymous';
        $design_date = date_format(date_create($design->created_at), 'F j, Y');
        
        $output .= '<div class="gallery-item">';
        $output .= '<h3>' . esc_html($design->design_name) . '</h3>';
        
        if (!empty($design->preview_image)) {
            // Make the image clickable and add data attributes for the modal
            $output .= '<div class="gallery-item-preview" data-high-res-image="' . esc_attr($design->preview_image) . '">';
            $output .= '<img src="' . esc_attr($design->preview_image) . '" alt="' . esc_attr($design->design_name) . '">';
            $output .= '<span class="zoom-icon" data-modal-image="' . esc_attr($design->preview_image) . '" data-modal-title="' . esc_attr($design->design_name) . '">&#x26F6;</span>';
            $output .= '</div>';
        } else {
            $output .= '<div class="kayak-preview-placeholder">[No Preview]</div>';
        }
        
        $output .= '<p>By: ' . esc_html($author_name) . '</p>';
        $output .= '<p>Date: ' . esc_html($design_date) . '</p>';
        $output .= '<p>Votes: <span class="vote-count">' . intval($design->votes) . '</span></p>';
        $output .= '<button class="vote-button" data-design-id="' . esc_attr($design->id) . '" data-nonce="' . wp_create_nonce('kayak_designer_vote_nonce') . '">Vote</button>';
        $output .= '</div>';
    }
    
    wp_send_json_success(['html' => $output]);
}
add_action('wp_ajax_kayak_designer_gallery_filter', 'kayak_designer_gallery_filter');
add_action('wp_ajax_nopriv_kayak_designer_gallery_filter', 'kayak_designer_gallery_filter');
