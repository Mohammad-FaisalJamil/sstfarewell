// Tickets UI Logic
// Handles all UI interactions for the tickets page

import { TICKET_CONFIG, PAYMENT_CONFIG } from "../config/constants.js";
import { initializeFirebase, saveRegistration } from "../db/firebaseDB.js";

let currentPrice = TICKET_CONFIG.price;
let quantity = 1;
let activeStep = 1;

/**
 * Initialize the tickets page
 */
export async function initializeTicketsPage() {
    await initializeFirebase();
    setupTicketCountdown();
    initializeSteps();
    updateUI();
}

/**
 * Setup ticket countdown timer
 */
function setupTicketCountdown() {
    const eventStart = new Date(TICKET_CONFIG.eventStartDate);
    const now = new Date();
    const targetDate = eventStart > now ? eventStart : new Date(
        eventStart.getFullYear() + 1,
        eventStart.getMonth(),
        eventStart.getDate(),
        eventStart.getHours(),
        eventStart.getMinutes(),
        eventStart.getSeconds()
    );

    function updateTicketCountdown() {
        const currentTime = new Date().getTime();
        const distance = targetDate - currentTime;
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const ticketDays = document.getElementById("ticket-days");
        const ticketHours = document.getElementById("ticket-hours");
        const ticketMins = document.getElementById("ticket-mins");
        const ticketSecs = document.getElementById("ticket-secs");

        if (ticketDays) ticketDays.innerText = days.toString().padStart(2, '0');
        if (ticketHours) ticketHours.innerText = hours.toString().padStart(2, '0');
        if (ticketMins) ticketMins.innerText = minutes.toString().padStart(2, '0');
        if (ticketSecs) ticketSecs.innerText = seconds.toString().padStart(2, '0');
    }

    setInterval(updateTicketCountdown, 1000);
    updateTicketCountdown();
}

/**
 * Initialize all steps - hide all except step 1
 */
function initializeSteps() {
    document.addEventListener('DOMContentLoaded', function() {
        for (let i = 1; i <= 4; i++) {
            const content = document.getElementById('step-content-' + i);
            if (content) {
                content.style.display = (i === 1) ? 'block' : 'none';
            }
        }
    });
}

/**
 * Update quantity
 */
export function updateQty(delta) {
    quantity = Math.max(
        TICKET_CONFIG.minQuantity,
        Math.min(TICKET_CONFIG.maxQuantity, quantity + delta)
    );
    updateUI();
}

/**
 * Update UI elements with current values
 */
export function updateUI() {
    const subtotalText = document.getElementById('subtotal');
    const quantityText = document.getElementById('quantity');
    if (quantityText) quantityText.innerText = quantity;

    const subtotal = currentPrice * quantity;
    if (subtotalText) subtotalText.innerText = 'PKR ' + subtotal.toLocaleString();

    const summaryQty = document.getElementById('summary-qty');
    const summaryTotal = document.getElementById('summary-total');
    if (summaryQty) summaryQty.innerText = quantity + 'x Ticket(s)';
    if (summaryTotal) summaryTotal.innerText = 'PKR ' + subtotal.toLocaleString();
}

/**
 * Go to specific step
 */
export function goToStep(stepNumber) {
    activeStep = stepNumber;
    
    for (let i = 1; i <= 4; i++) {
        const content = document.getElementById('step-content-' + i);
        if (content) {
            content.style.display = (i === stepNumber) ? 'block' : 'none';
        }
    }

    updateStepIndicators(stepNumber);
    
    if (stepNumber === 2) {
        generateAttendeeForm();
    }
}

/**
 * Update step indicators
 */
function updateStepIndicators(currentStep) {
    for (let i = 1; i <= 4; i++) {
        const marker = document.getElementById('step-marker-' + i);
        const dot = document.getElementById('dot-' + i);
        const label = document.getElementById('label-' + i);
        
        if (!marker) continue;

        if (i < currentStep) {
            if (dot) dot.className = 'w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-surface shadow-xl';
            if (label) label.className = 'mt-3 font-label-sm text-label-sm text-primary';
        } else if (i === currentStep) {
            if (dot) dot.className = 'w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-dot border-4 border-surface shadow-xl';
            if (label) label.className = 'mt-3 font-label-sm text-label-sm text-primary';
        } else {
            if (dot) dot.className = 'w-10 h-10 rounded-full bg-surface-container-high border border-primary/30 flex items-center justify-center transition-colors duration-300';
            if (label) label.className = 'mt-3 font-label-sm text-label-sm text-on-surface/50';
        }
    }
}

/**
 * Generate attendee form fields
 */
function generateAttendeeForm() {
    const container = document.getElementById('attendee-forms-container');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < quantity; i++) {
        const formHTML = `
            <div class="p-8 bg-surface-container-low rounded-2xl border border-primary/10">
                <h3 class="font-headline-sm text-primary mb-6">Attendee ${i + 1}</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="md:col-span-2">
                        <label class="font-label-md text-label-md text-on-surface">Full Name *</label>
                        <input 
                            id="form-name-${i}" 
                            type="text" 
                            required 
                            class="w-full px-4 py-3 rounded-lg input-dark border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-2" 
                            placeholder="Enter full name"
                        />
                    </div>

                    <div>
                        <label class="font-label-md text-label-md text-on-surface">University ID / Roll Number *</label>
                        <input 
                            id="form-student-id-${i}" 
                            type="text" 
                            required 
                            class="w-full px-4 py-3 rounded-lg input-dark border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-2" 
                            placeholder="e.g., F2022-123"
                        />
                    </div>

                    <div>
                        <label class="font-label-md text-label-md text-on-surface">Phone Number *</label>
                        <input 
                            id="form-phone-${i}" 
                            type="tel" 
                            required 
                            class="w-full px-4 py-3 rounded-lg input-dark border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-2" 
                            placeholder="e.g., +923001234567"
                        />
                    </div>

                    <div>
                        <label class="font-label-md text-label-md text-on-surface">Gender *</label>
                        <select 
                            id="form-gender-${i}" 
                            required 
                            class="w-full px-4 py-3 rounded-lg input-dark border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-2"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label class="font-label-md text-label-md text-on-surface">Batch *</label>
                        <select 
                            id="form-batch-${i}" 
                            required 
                            class="w-full px-4 py-3 rounded-lg input-dark border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-2"
                        >
                            <option value="">Select Batch</option>
                            <option value="F2022">Fall 2022</option>
                            <option value="S2023">Spring 2023</option>
                        </select>
                    </div>

                    <div>
                        <label class="font-label-md text-label-md text-on-surface">Program *</label>
                        <input 
                            id="form-program-${i}" 
                            type="text" 
                            required 
                            class="w-full px-4 py-3 rounded-lg input-dark border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all mt-2" 
                            placeholder="e.g., BSCS"
                        />
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += formHTML;
    }

    const attendeeCount = document.getElementById('attendee-count');
    if (attendeeCount) attendeeCount.innerText = quantity;
}

/**
 * Validate attendee form and proceed
 */
export async function validateAndGoToStep3() {
    const terms = document.getElementById('form-terms');
    
    if (!terms.checked) {
        alert('You must agree to the Terms and Conditions');
        return;
    }

    // Validate all attendee forms
    for (let i = 0; i < quantity; i++) {
        const name = document.getElementById('form-name-' + i);
        const phone = document.getElementById('form-phone-' + i);
        const gender = document.getElementById('form-gender-' + i);
        const batch = document.getElementById('form-batch-' + i);
        const studentId = document.getElementById('form-student-id-' + i);
        const program = document.getElementById('form-program-' + i);
        
        if (!name || !name.value.trim() || !phone || !phone.value.trim() || 
            !gender || !gender.value || !batch || !batch.value || 
            !studentId || !studentId.value.trim() || !program || !program.value.trim()) {
            alert(`Please fill all required fields for Attendee ${i + 1}`);
            return;
        }
    }

    // Store form data in session for later use
    window.attendeeData = [];
    for (let i = 0; i < quantity; i++) {
        window.attendeeData.push({
            name: document.getElementById('form-name-' + i).value,
            phone: document.getElementById('form-phone-' + i).value,
            gender: document.getElementById('form-gender-' + i).value,
            batch: document.getElementById('form-batch-' + i).value,
            studentId: document.getElementById('form-student-id-' + i).value,
            program: document.getElementById('form-program-' + i).value
        });
    }

    goToStep(3);
}

/**
 * Validate payment screenshot and proceed
 */
export async function validatePaymentAndGoToStep4() {
    const paymentScreenshot = document.getElementById('payment-screenshot');
    
    if (!paymentScreenshot || !paymentScreenshot.files || !paymentScreenshot.files.length) {
        alert('Please upload a payment screenshot');
        return;
    }

    const file = paymentScreenshot.files[0];
    if (file.size > PAYMENT_CONFIG.easypaisa.maxFileSize) {
        alert('File size exceeds 500KB. Please upload a smaller image.');
        return;
    }

    const confirmBtn = document.getElementById('confirmBookingBtn');
    const confirmText = document.getElementById('confirmBookingText');
    const confirmSpinner = document.getElementById('confirmBookingSpinner');
    
    if (confirmBtn) confirmBtn.disabled = true;
    if (confirmText) confirmText.style.display = 'none';
    if (confirmSpinner) confirmSpinner.classList.remove('hidden');

    try {
        // Prepare registration data
        const registrationData = {
            attendees: window.attendeeData || [],
            amount: currentPrice * quantity,
            quantity: quantity,
            paymentMethod: 'Easypaisa',
            paymentScreenshot: file.name,
            status: 'pending'
        };

        // Save to Firebase
        const docId = await saveRegistration(registrationData);
        
        // Show success step
        goToStep(4);
    } catch (error) {
        console.error('Error saving registration:', error);
        alert('Error submitting registration. Please try again.');
        if (confirmBtn) confirmBtn.disabled = false;
        if (confirmText) confirmText.style.display = 'inline';
        if (confirmSpinner) confirmSpinner.classList.add('hidden');
    }
}

/**
 * Validate file size
 */
export function validateFileSize(input) {
    const file = input.files[0];
    if (file && file.size > PAYMENT_CONFIG.easypaisa.maxFileSize) {
        alert('File size exceeds 500KB. Please upload a smaller image.');
        input.value = '';
    }
}

// Make functions available globally
window.updateQty = updateQty;
window.updateUI = updateUI;
window.goToStep = goToStep;
window.validateAndGoToStep3 = validateAndGoToStep3;
window.validatePaymentAndGoToStep4 = validatePaymentAndGoToStep4;
window.validateFileSize = validateFileSize;
