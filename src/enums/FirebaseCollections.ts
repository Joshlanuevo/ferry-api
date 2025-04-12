export enum FirebaseCollections {
    admin_markup_settings = "admin_markup_settings",
    admin_transactions = "admin_transactions",
    admin_transactions_report = "admin_transactions_report",
    agent_markup_settings = "agent_markup_settings",
    agent_transactions = "agent_transactions",
    agent_transactions_report = "agent_transactions_report",
    bus_bookings = "bus_bookings",
    bus_bookings_report = "bus_bookings_report",
    flight_bookings = "flight_bookings",
    flight_bookings_report = "flight_bookings_report",
    hotel_bookings = "hotel_bookings",
    hotel_bookings_report = "hotel_bookings_report",
    insurance_bookings = "insurance_bookings",
    insurance_bookings_report = "insurance_bookings_report",
    ferry_bookings = "ferry_bookings",
    ferry_bookings_report = "ferry_bookings_report",
    user_balance_transactions = "user_balance_transactions",
    user_balance = "user_balance",
    users = "users",
    user_sessions = "user_sessions",
    billspayment_bookings = "billspayment_bookings",
    billspayment_bookings_report = "billspayment_bookings_report",
    agencies = "agencies",
    bux_payment_codes = "bux_payment_codes",
    paymongo_payment_codes = "paymongo_payment_codes",
    pending_flight_bookings = "pending_flight_bookings",
    userid_email_map = "userid_email_map",
    flight_ticket_in_progress = "flight_ticket_in_progress",
    hotel_reservations = "hotel_reservations",
    holiday_packages = "holiday_packages",
    package_bookings = "package_bookings",
    package_booking_reservations = "package_booking_reservations",
    cancelled_hotel_bookings = "cancelled_hotel_bookings",
    hotel_booking_attempts = "hotel_booking_attempts",
    attractions_bookings = "attractions_bookings",
    attractions_bookings_report = "attractions_bookings_report",
    credit_transfers = "credit_transfers",
    credit_transfers_report = "credit_transfers_report",
    user_markup_settings = "user_markup_settings",
    user_transactions = "user_transactions",
    user_transactions_report = "user_transactions_report",
    visa_form_submissions = "visa_form_submissions",
    visa_forms = "visa_forms",
    visa_bookings = "visa_bookings",
    visa_bookings_report = "visa_bookings_report",
    support_tickets = "support_tickets",
    support_ticket_messages = "support_ticket_messages",
    access_levels = "access_levels",
    booking_approvals = "booking_approvals",
    holiday_package_submissions = "holiday_package_submissions",
    holiday_hotel_list = "holiday_hotel_list",
    holiday_operators_list = "holiday_operators_list",
    holiday_destinations_list = "holiday_destinations_list",
    package_vouchers = "package_vouchers",
    user_funds_on_hold = "user_funds_on_hold",
    billspayment_onprocess = "billspayment_onprocess",
    contact_submissions = "contact_submissions",
    package_bookings_report = "package_bookings_report",
    holiday_package_vouchers = "holiday_package_vouchers",
    whitelabel_configs = "whitelabel_configs",
    pricing_plans = "pricing_plans",
    balance_notification_config = "balance_notification_config",
    announcements = "announcements",
    ferry_2go_bookings = "ferry_2go_bookings",
    membership = "membership",
    maintenance_config = "maintenance_config",
    release_on_hold = "release_on_hold",
    esoa = "esoa",
    audit_logs = "audit_logs",
    api_config = "api_config",
    staff_markup_settings = "staff_markup_settings",
    installment_transactions = "installment_transactions",
    installment_payments = "installment_payments",
    slot_allocations = "slot_allocations",
  }
  
  export function getDocId(collection: FirebaseCollections): string {
    switch (collection) {
      case FirebaseCollections.bus_bookings:
      case FirebaseCollections.flight_bookings:
      case FirebaseCollections.hotel_bookings:
      case FirebaseCollections.insurance_bookings:
      case FirebaseCollections.ferry_bookings:
      case FirebaseCollections.user_balance_transactions:
      case FirebaseCollections.billspayment_bookings:
      case FirebaseCollections.pending_flight_bookings:
      case FirebaseCollections.package_bookings:
      case FirebaseCollections.attractions_bookings:
      case FirebaseCollections.visa_bookings:
        return 'transaction_id';
  
      case FirebaseCollections.user_balance:
      case FirebaseCollections.userid_email_map:
        return 'userId';
  
      case FirebaseCollections.user_sessions:
        return 'session_key';
  
      case FirebaseCollections.bux_payment_codes:
        return 'req_id';
  
      case FirebaseCollections.paymongo_payment_codes:
        return 'payment_intent_id';
  
      default:
        return 'id';
    }
  }
  
  export function getSortKey(collection: FirebaseCollections): string {
    switch (collection) {
      case FirebaseCollections.admin_markup_settings:
      case FirebaseCollections.agent_markup_settings:
      case FirebaseCollections.user_markup_settings:
        return 'created_time';
  
      case FirebaseCollections.admin_transactions:
        return 'created_by';
  
      case FirebaseCollections.agent_transactions:
      case FirebaseCollections.bus_bookings:
      case FirebaseCollections.flight_bookings:
      case FirebaseCollections.hotel_bookings:
      case FirebaseCollections.insurance_bookings:
      case FirebaseCollections.ferry_bookings:
      case FirebaseCollections.user_balance_transactions:
      case FirebaseCollections.billspayment_bookings:
      case FirebaseCollections.pending_flight_bookings:
      case FirebaseCollections.package_bookings:
      case FirebaseCollections.attractions_bookings:
      case FirebaseCollections.credit_transfers:
      case FirebaseCollections.user_transactions:
      case FirebaseCollections.booking_approvals:
      case FirebaseCollections.user_funds_on_hold:
      case FirebaseCollections.billspayment_onprocess:
        return 'timestamp';
  
      case FirebaseCollections.admin_transactions_report:
      case FirebaseCollections.agent_transactions_report:
      case FirebaseCollections.bus_bookings_report:
      case FirebaseCollections.flight_bookings_report:
      case FirebaseCollections.hotel_bookings_report:
      case FirebaseCollections.insurance_bookings_report:
      case FirebaseCollections.billspayment_bookings_report:
      case FirebaseCollections.package_bookings_report:
      case FirebaseCollections.credit_transfers_report:
      case FirebaseCollections.user_transactions_report:
      case FirebaseCollections.attractions_bookings_report:
        return 'userId';
  
      case FirebaseCollections.users:
        return 'created_at';
  
      case FirebaseCollections.agencies:
        return 'registered_date';
  
      case FirebaseCollections.bux_payment_codes:
      case FirebaseCollections.paymongo_payment_codes:
      case FirebaseCollections.flight_ticket_in_progress:
      case FirebaseCollections.hotel_reservations:
      case FirebaseCollections.hotel_booking_attempts:
      case FirebaseCollections.cancelled_hotel_bookings:
      case FirebaseCollections.package_booking_reservations:
      case FirebaseCollections.installment_transactions:
      case FirebaseCollections.installment_payments:
      case FirebaseCollections.slot_allocations:
        return 'timestamp';
  
      case FirebaseCollections.holiday_packages:
      case FirebaseCollections.visa_form_submissions:
      case FirebaseCollections.visa_forms:
      case FirebaseCollections.support_tickets:
      case FirebaseCollections.support_ticket_messages:
      case FirebaseCollections.holiday_package_submissions:
      case FirebaseCollections.holiday_hotel_list:
      case FirebaseCollections.holiday_operators_list:
      case FirebaseCollections.holiday_destinations_list:
      case FirebaseCollections.package_vouchers:
      case FirebaseCollections.contact_submissions:
      case FirebaseCollections.holiday_package_vouchers:
      case FirebaseCollections.whitelabel_configs:
      case FirebaseCollections.pricing_plans:
      case FirebaseCollections.balance_notification_config:
        return 'date_created';
  
      case FirebaseCollections.announcements:
      case FirebaseCollections.ferry_2go_bookings:
      case FirebaseCollections.membership:
      case FirebaseCollections.maintenance_config:
      case FirebaseCollections.release_on_hold:
      case FirebaseCollections.esoa:
      case FirebaseCollections.audit_logs:
      case FirebaseCollections.api_config:
      case FirebaseCollections.staff_markup_settings:
        return 'created_at';
  
      default:
        return 'created_at'; // fallback
    }
}