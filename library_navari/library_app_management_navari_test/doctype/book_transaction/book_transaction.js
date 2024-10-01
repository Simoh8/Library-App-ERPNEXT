frappe.ui.form.on("Book Transaction", {
    refresh(frm) {
        calculate_outstanding_debt(frm); // Ensure the debt is calculated on refresh
    },

    library_member: function(frm) {
        if (frm.doc.library_member) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "LIbrary Member",
                    name: frm.doc.library_member
                },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value('full_name', r.message.full_name);
                        frm.set_value('email_address', r.message.email_address);
                        frm.set_value('phone_number', r.message.phone_number);
                        frm.set_value('address', r.message.address);
                    }
                }
            });
        }
    },

    book_title: function(frm) {
        if (frm.doc.book_title) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Library Book",
                    filters: { name: frm.doc.book_title },
                    fieldname: ['rent_fee', 'late_fee_per_day']

                },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value('book_author', r.message.author);
                        frm.set_value('isbn', r.message.isbn);
                        frm.set_value('rent_fee_per_day', r.message.rent_fee);
                        frm.set_value('late_fee_per_day', r.message.late_fee_per_day);

                        // Recalculate total fee when the rent fee per day changes
                        calculate_total_fee(frm);
                    }
                }
            });
        }
    },

    total_borrowing_days: function(frm) {
        calculate_total_fee(frm);
        calculate_return_date(frm);
    },

    borrowed_on: function(frm) {
        calculate_return_date(frm);
    },

    rent_fee_per_day: function(frm) {
        calculate_total_fee(frm);
    },

    return_by: function(frm) {
        calculate_outstanding_debt(frm);
    },

    late_fee_per_day: function(frm) {
        calculate_outstanding_debt(frm);
    },

});

// Helper function to calculate the total fee
function calculate_total_fee(frm) {
    if (frm.doc.total_borrowing_days && frm.doc.rent_fee_per_day) {
        let total_fee = frm.doc.total_borrowing_days * frm.doc.rent_fee_per_day;
        frm.set_value('total_fee', total_fee);
    }
}

// Helper function to calculate the Return By date
function calculate_return_date(frm) {
    if (frm.doc.total_borrowing_days && frm.doc.borrowed_on) {
        let borrowed_on = new Date(frm.doc.borrowed_on);
        let return_by = frappe.datetime.add_days(borrowed_on, frm.doc.total_borrowing_days);
        frm.set_value('return_by', return_by);
    }
}

// Function to calculate Outstanding Debt based on overdue days
function calculate_outstanding_debt(frm) {
    // Check if transaction type is "return"
    if (frm.doc.transaction_type === 'Return') {
        frm.set_value('outstanding_debt', 0);
        return; // Exit the function as there's no debt for returns
    }

    if (frm.doc.return_by && frm.doc.late_fee_per_day) {
        let today = new Date();
        let return_by = new Date(frm.doc.return_by);

        // Calculate the number of overdue days
        let overdue_days = Math.ceil((today - return_by) / (1000 * 60 * 60 * 24));

        // If the book is overdue, calculate outstanding debt
        if (overdue_days > 0) {
            let outstanding_debt = overdue_days * frm.doc.late_fee_per_day;
            frm.set_value('outstanding_debt', outstanding_debt);
        } else {
            // No outstanding debt if not overdue
            frm.set_value('outstanding_debt', 0);
        }
    }
}
