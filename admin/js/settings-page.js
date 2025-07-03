jQuery(document).ready(function($) {
    const mailerTypeSelect = $('select[name="kayak_designer_options[mailer_type]"]');
    const smtpFields = [
        'input[name="kayak_designer_options[smtp_host]"]',
        'input[name="kayak_designer_options[smtp_port]"]',
        'select[name="kayak_designer_options[smtp_encryption]"]',
        'input[name="kayak_designer_options[smtp_username]"]',
        'input[name="kayak_designer_options[smtp_password]"]'
    ];

    function toggleSmtpFields() {
        const selectedMailer = mailerTypeSelect.val();
        const smtpRows = smtpFields.map(selector => $(selector).closest('tr'));

        if (selectedMailer === 'smtp') {
            smtpRows.forEach(row => row.show());
        } else {
            smtpRows.forEach(row => row.hide());
        }
    }

    // Initial check on page load
    toggleSmtpFields();

    // Check on change
    mailerTypeSelect.on('change', toggleSmtpFields);
});
