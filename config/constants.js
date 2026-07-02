// Application Constants and Configuration

export const PAYMENT_CONFIG = {
    easypaisa: {
        phone: "03228423598",
        accountName: "Muhammad Jamil",
        maxFileSize: 500 * 1024 // 500KB in bytes
    }
};

export const TICKET_CONFIG = {
    price: 2950,
    originalPrice: 3600,
    maxQuantity: 100,
    minQuantity: 1,
    eventStartDate: "2026-07-17T16:00:00"
};

export const CONTACT_INFO = {
    phone: "03228423598",
    email: "sst.pc@umt.edu.pk",
    instagram: "https://www.instagram.com/sst_pc"
};

export const EVENT_INFO = {
    name: "SST Farewell",
    location: "UMT Lahore Campus, Lahore",
    date: "July 17th & 18th, 2026",
    batches: "F2022 & S2023"
};

export const FIREBASE_COLLECTIONS = {
    registrations: "registrations",
    approvals: "approvals"
};

export const STATUS_TYPES = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    NOT_FOUND: "not-found"
};
