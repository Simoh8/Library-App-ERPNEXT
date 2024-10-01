// Copyright (c) 2024, simon muturi and contributors
// For license information, please see license.txt

// frappe.ui.form.on("LIbrary Member", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("LIbrary Member", {
    refresh: function(frm) {
        if (frm.doc.full_name) {
            // Fetch all transactions related to the current Library Member
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Book Transaction",
                    filters: {
                        library_member: frm.doc.full_name
                    },
                    fields: ["name", "outstanding_debt"]
                },
                callback: function(r) {
                    if (r.message) {
                        let total_debt = 0;
                        let total_books_issued = r.message.length;

                        // Aggregate outstanding debt
                        r.message.forEach(function(transaction) {
                            total_debt += transaction.outstanding_debt;
                        });

                        // Set the calculated outstanding debt and total books issued
                        frm.set_value('outstanding_debt', total_debt);
                        frm.set_value('total_books_issued', total_books_issued);

                        // Refresh fields
                        frm.refresh_field('outstanding_debt');
                        frm.refresh_field('total_books_issued');
                    }
                }
            });
        }
    }
});
