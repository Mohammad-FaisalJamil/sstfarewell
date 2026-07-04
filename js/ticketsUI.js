import { TICKET_CONFIG, PAYMENT_CONFIG } from "./constants.js";
import { saveRegistration } from "./supabaseDB.js";

let quantity = 1;
let currentPrice = TICKET_CONFIG.originalPrice; // Default fallback

// Track selected payment file globally for supabaseDB to catch
window.selectedPaymentFile = null;

export function initializeTicketsPage() {
    setupTicketCountdown();
    determineCurrentPricing();
    setupEventListeners();
    updateUI();
}

function determineCurrentPricing() {
    const now = new Date();
    if (now <= new Date(TICKET_CONFIG.earlyBirdEndDate)) {
        currentPrice = TICKET_CONFIG.earlyBirdPrice;
    } else if (now <= new Date(TICKET_CONFIG.regularPriceEndDate)) {
        currentPrice = TICKET_CONFIG.regularPrice;
    } else {
        currentPrice = TICKET_CONFIG.originalPrice;
    }
}

function setupTicketCountdown() {
    const countdownEl = document.getElementById('ticket-countdown');
    if (!countdownEl) return;

    const target = new Date(TICKET_CONFIG.regularPriceEndDate).getTime();

    const interval = setInterval(() => {
        const distance = target - new Date().getTime();
        if (distance < 0) {
            clearInterval(interval);
            countdownEl.innerText = "Regular pricing has expired.";
            determineCurrentPricing();
            updateUI();
            return;
        }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        countdownEl.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s left for Regular Price!`;
    }, 1000);
}

function setupEventListeners() {
    const fileInput = document.getElementById('paymentScreenshot');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > PAYMENT_CONFIG.easypaisa.maxFileSize) {
                    alert('File size exceeds the 1MB limit. Please upload a compressed screenshot.');
                    fileInput.value = '';
                    window.selectedPaymentFile = null;
                    return;
                }
                window.selectedPaymentFile = file;
            }
        });
    }

    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const confirmBtn = document.getElementById('confirmBtn');
            if (confirmBtn) confirmBtn.disabled = true;

            try {
                const attendees = gatherAttendeeData();
                const ticketType = currentPrice === TICKET_CONFIG.earlyBirdPrice ? 'earlyBird' : 
                                   (currentPrice === TICKET_CONFIG.regularPrice ? 'regular' : 'standard');

                const payload = {
                    ticketType: ticketType,
                    quantity: quantity,
                    amount: currentPrice * quantity,
                    attendees: attendees
                };

                const registrationId = await saveRegistration(payload);
                
                // Route to successful rendering step or custom print logic window
                alert(`Registration submitted! Save your ID: ${registrationId}`);
                window.location.href = `status.html?id=${attendees[0].studentId}`;
                
            } catch (err) {
                alert(`Submission error: ${err.message}`);
                if (confirmBtn) confirmBtn.disabled = false;
            }
        });
    }
}

function gatherAttendeeData() {
    const attendees = [];
    for (let i = 0; i < quantity; i++) {
        attendees.push({
            studentId: document.getElementById(`studentId_${i}`)?.value || '',
            name: document.getElementById(`name_${i}`)?.value || '',
            email: document.getElementById(`email_${i}`)?.value || '',
            phone: document.getElementById(`phone_${i}`)?.value || '',
            batch: document.getElementById(`batch_${i}`)?.value || '',
            program: document.getElementById(`program_${i}`)?.value || '',
            gender: document.getElementById(`gender_${i}`)?.value || '',
            emergencyContact: document.getElementById(`emergency_${i}`)?.value || '',
            notes: document.getElementById(`notes_${i}`)?.value || ''
        });
    }
    return attendees;
}

function updateUI() {
    const basePriceEl = document.getElementById('base-price');
    const totalAmountEl = document.getElementById('total-amount');
    if (basePriceEl) basePriceEl.innerText = `PKR ${currentPrice.toLocaleString()}`;
    if (totalAmountEl) totalAmountEl.innerText = `PKR ${(currentPrice * quantity).toLocaleString()}`;
}

window.updateQty = function(amount) {
    quantity = Math.max(TICKET_CONFIG.minQuantity, Math.min(TICKET_CONFIG.maxQuantity, quantity + amount));
    const qtyInput = document.getElementById('ticket-qty');
    if (qtyInput) qtyInput.value = quantity;
    
    // Call out to your dynamic HTML generation logic to draw multiple input rows if quantity > 1
    if (typeof window.renderAttendeeForms === 'function') {
        window.renderAttendeeForms(quantity);
    }
    updateUI();
};

document.addEventListener('DOMContentLoaded', initializeTicketsPage);