// Status Check UI Logic
// Handles all UI interactions for the status page

import { initializeFirebase, checkRegistrationStatus } from "../db/firebaseDB.js";
import { STATUS_TYPES } from "../config/constants.js";

/**
 * Initialize the status page
 */
export async function initializeStatusPage() {
    await initializeFirebase();
}

/**
 * Check registration status
 */
export async function checkStatus(event) {
    event.preventDefault();
    
    const studentId = document.getElementById('studentId').value.trim().toUpperCase();
    const statusResult = document.getElementById('statusResult');
    
    if (!studentId) {
        alert('Please enter your University ID');
        return;
    }

    if (statusResult) {
        statusResult.classList.remove('hidden');
        statusResult.innerHTML = '<div class="text-center py-8"><p class="text-primary">Checking status...</p></div>';
    }

    try {
        const foundRegistration = await checkRegistrationStatus(studentId);
        
        if (foundRegistration) {
            showStatus(foundRegistration.status, foundRegistration);
        } else {
            showStatus(STATUS_TYPES.NOT_FOUND, null);
        }
    } catch (error) {
        console.error('Error checking status:', error);
        if (statusResult) {
            statusResult.innerHTML = `
                <div class="glass-card p-8 rounded-2xl status-not-found">
                    <div class="text-center">
                        <span class="material-symbols-outlined text-5xl text-gray-400 mb-4">error</span>
                        <h3 class="font-headline-md text-xl text-gray-400 mb-2">Error Checking Status</h3>
                        <p class="font-body-md text-on-surface/70">Unable to check status. Please try again later.</p>
                    </div>
                </div>
            `;
        }
    }
}

/**
 * Display status result
 */
function showStatus(status, registration) {
    const statusResult = document.getElementById('statusResult');
    if (!statusResult) return;
    
    let statusHTML = '';
    
    if (status === STATUS_TYPES.NOT_FOUND) {
        statusHTML = `
            <div class="glass-card p-8 rounded-2xl status-not-found">
                <div class="text-center">
                    <span class="material-symbols-outlined text-5xl text-gray-400 mb-4">search_off</span>
                    <h3 class="font-headline-md text-xl text-gray-400 mb-2">No Registration Found</h3>
                    <p class="font-body-md text-on-surface/70 mb-4">No registration found with this University ID.</p>
                    <a href="tickets.html" class="inline-block px-6 py-3 bg-primary text-black rounded-full font-label-md uppercase tracking-wider hover:bg-white transition-all">
                        Register Now
                    </a>
                </div>
            </div>
        `;
    } else if (status === STATUS_TYPES.PENDING) {
        const primaryAttendee = registration.attendees && registration.attendees.length > 0 ? registration.attendees[0] : {};
        const attendeeCount = registration.attendees ? registration.attendees.length : 1;
        
        let attendeesHTML = '';
        if (attendeeCount > 1) {
            attendeesHTML = `
                <div class="text-sm text-primary mb-4 mt-6">All Attendees in this Registration (${attendeeCount}):</div>
                ${registration.attendees.map((attendee, index) => `
                    <div class="mb-3 p-3 bg-black/40 rounded border border-primary/10">
                        <div class="font-medium text-sm mb-1">${index + 1}. ${attendee.name || 'N/A'}</div>
                        <div class="text-xs text-on-surface/70">
                            Roll: ${attendee.studentId || 'N/A'} | 
                            Batch: ${attendee.batch || 'N/A'}
                        </div>
                    </div>
                `).join('')}
            `;
        }
        
        statusHTML = `
            <div class="glass-card p-8 rounded-2xl status-pending">
                <div class="text-center">
                    <span class="material-symbols-outlined text-5xl text-primary mb-4">pending</span>
                    <h3 class="font-headline-md text-xl text-primary mb-2">Pending Approval</h3>
                    <p class="font-body-md text-on-surface/70 mb-6">Your registration is awaiting admin approval.</p>
                    
                    <div class="bg-black/40 p-6 rounded-xl border border-primary/20 mb-6 text-left">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-primary text-xs uppercase tracking-wider mb-1">Registration ID</p>
                                <p class="font-label-md">${registration.id || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-primary text-xs uppercase tracking-wider mb-1">Name</p>
                                <p class="font-label-md">${primaryAttendee.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-primary text-xs uppercase tracking-wider mb-1">Batch</p>
                                <p class="font-label-md">${primaryAttendee.batch || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-primary text-xs uppercase tracking-wider mb-1">Amount</p>
                                <p class="font-label-md">PKR ${(registration.amount || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        ${attendeesHTML}
                    </div>
                    
                    <p class="text-on-surface/60 text-sm">Please check your email for updates. The approval process typically takes 24-48 hours.</p>
                </div>
            </div>
        `;
    } else if (status === STATUS_TYPES.APPROVED) {
        const primaryAttendee = registration.attendees && registration.attendees.length > 0 ? registration.attendees[0] : {};
        const attendeeCount = registration.attendees ? registration.attendees.length : 1;
        
        let attendeesHTML = '';
        if (attendeeCount > 1) {
            attendeesHTML = `
                <div class="text-sm text-green-500 mb-4 mt-6">All Attendees in this Registration (${attendeeCount}):</div>
                ${registration.attendees.map((attendee, index) => `
                    <div class="mb-3 p-3 bg-black/40 rounded border border-green-500/20">
                        <div class="font-medium text-sm mb-1">${index + 1}. ${attendee.name || 'N/A'}</div>
                        <div class="text-xs text-on-surface/70">
                            Roll: ${attendee.studentId || 'N/A'} | 
                            Batch: ${attendee.batch || 'N/A'}
                        </div>
                    </div>
                `).join('')}
            `;
        }
        
        statusHTML = `
            <div class="glass-card p-8 rounded-2xl status-approved">
                <div class="text-center">
                    <span class="material-symbols-outlined text-5xl text-green-500 mb-4" style="font-variation-settings: 'FILL' 1;">verified</span>
                    <h3 class="font-headline-md text-xl text-green-500 mb-2">Registration Approved!</h3>
                    <p class="font-body-md text-on-surface/70 mb-6">Your registration has been approved.</p>
                    
                    <div class="bg-black/40 p-6 rounded-xl border border-green-500/20 mb-6 text-left">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-green-500 text-xs uppercase tracking-wider mb-1">Registration ID</p>
                                <p class="font-label-md">${registration.id || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-green-500 text-xs uppercase tracking-wider mb-1">Name</p>
                                <p class="font-label-md">${primaryAttendee.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-green-500 text-xs uppercase tracking-wider mb-1">Batch</p>
                                <p class="font-label-md">${primaryAttendee.batch || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-green-500 text-xs uppercase tracking-wider mb-1">Amount</p>
                                <p class="font-label-md">PKR ${(registration.amount || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        ${attendeesHTML}
                    </div>
                    
                    <p class="text-on-surface/60 text-sm">Your tickets have been sent to your registered email address.</p>
                </div>
            </div>
        `;
    } else if (status === STATUS_TYPES.REJECTED) {
        statusHTML = `
            <div class="glass-card p-8 rounded-2xl status-rejected">
                <div class="text-center">
                    <span class="material-symbols-outlined text-5xl text-red-500 mb-4">close</span>
                    <h3 class="font-headline-md text-xl text-red-500 mb-2">Registration Rejected</h3>
                    <p class="font-body-md text-on-surface/70 mb-6">Your registration was not approved.</p>
                    <p class="text-on-surface/60 text-sm mb-6">Please contact support for more information.</p>
                    <a href="tickets.html" class="inline-block px-6 py-3 bg-primary text-black rounded-full font-label-md uppercase tracking-wider hover:bg-white transition-all">
                        Try Again
                    </a>
                </div>
            </div>
        `;
    }
    
    statusResult.innerHTML = statusHTML;
}

// Make functions available globally
window.checkStatus = checkStatus;
