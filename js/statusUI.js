import { checkRegistrationStatus } from "./supabaseDB.js";

document.addEventListener('DOMContentLoaded', () => {
    const statusForm = document.getElementById('statusForm');
    const statusResult = document.getElementById('statusResult');

    if (statusForm) {
        statusForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('studentId').value.trim().toUpperCase();
            if (!studentId) return;

            statusResult.innerHTML = '<p class="text-primary text-center">Scanning database configurations...</p>';
            statusResult.classList.remove('hidden');

            try {
                const record = await checkRegistrationStatus(studentId);
                if (!record) {
                    statusResult.innerHTML = `
                        <div class="glass-card p-6 rounded-xl border border-red-900/40 text-center">
                            <p class="text-red-500 font-bold">No registration found for ID: ${studentId}</p>
                            <p class="text-sm text-white/60 mt-2">Please double-check your ID or proceed to the tickets panel to sign up.</p>
                        </div>`;
                    return;
                }

                let badgeColor = record.status === 'approved' ? 'text-green-500' : (record.status === 'rejected' ? 'text-red-500' : 'text-yellow-500');

                statusResult.innerHTML = `
                    <div class="glass-card p-6 rounded-xl border border-primary/20 space-y-4">
                        <div class="flex justify-between items-center border-b border-white/10 pb-3">
                            <div>
                                <h3 class="font-bold text-lg text-white">${record.attendees[0].name}</h3>
                                <p class="text-xs text-white/40">${studentId} — ${record.attendees[0].program}</p>
                            </div>
                            <span class="uppercase font-bold tracking-wider text-sm ${badgeColor}">${record.status}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-white/40 text-xs">Ticket Bracket</p>
                                <p class="text-white capitalize">${record.ticketType}</p>
                            </div>
                            <div>
                                <p class="text-white/40 text-xs">Total Amount Paid</p>
                                <p class="text-white">PKR ${record.amount.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>`;
            } catch (err) {
                statusResult.innerHTML = `<p class="text-red-500 text-center">Error: ${err.message}</p>`;
            }
        });
    }
});