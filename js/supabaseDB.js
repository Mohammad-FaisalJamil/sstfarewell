import { supabase } from './supabaseClient.js';

/**
 * Save a new registration transaction and its nested attendees array into Supabase
 */
export async function saveRegistration(registrationData) {
    try {
        let paymentProofUrl = null;

        // 1. Upload the payment receipt screenshot directly to the public bucket
        if (window.selectedPaymentFile) {
            const file = window.selectedPaymentFile;
            const fileName = `receipt_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(fileName, file);

            if (uploadError) throw new Error(`Receipt upload failed: ${uploadError.message}`);

            // Fetch the clean public text URL path
            const { data } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
            paymentProofUrl = data.publicUrl;
        }

        // 2. Insert core transaction metadata into registrations table
        const { data: regResult, error: regError } = await supabase
            .from('registrations')
            .insert([{
                ticket_type: registrationData.ticketType || 'regular',
                quantity: parseInt(registrationData.quantity) || 1,
                amount: parseFloat(registrationData.amount) || 0,
                payment_proof_url: paymentProofUrl,
                status: 'pending'
            }])
            .select()
            .single();

        if (regError) throw regError;

        // 3. Associate the newly generated registration ID to all input attendees and batch-insert
        if (registrationData.attendees && registrationData.attendees.length > 0) {
            const attendeesPayload = registrationData.attendees.map(attendee => ({
                registration_id: regResult.id,
                student_id: attendee.studentId.toUpperCase().trim(),
                name: attendee.name.trim(),
                email: attendee.email ? attendee.email.trim() : null,
                phone: attendee.phone ? attendee.phone.trim() : null,
                batch: attendee.batch,
                program: attendee.program,
                gender: attendee.gender,
                emergency_contact: attendee.emergencyContact,
                notes: attendee.notes || ''
            }));

            const { error: attendeeError } = await supabase
                .from('attendees')
                .insert(attendeesPayload);

            if (attendeeError) throw attendeeError;
        }

        return regResult.id; // Returns the UUID token for the UI confirmation step

    } catch (error) {
        console.error('Database write operation critical failure:', error);
        throw error;
    }
}

/**
 * Scan database records using Student ID to securely check workflow status.
 * Looks up which registration the student belongs to, then returns the FULL
 * registration record along with every attendee in that group (not just the
 * one that was searched for), with field names normalized to camelCase so
 * they match what the UI expects.
 */
export async function checkRegistrationStatus(studentId) {
    try {
        const normalizedId = studentId.toUpperCase().trim();

        // Step 1: find which registration this student belongs to
        const { data: attendeeRow, error: attendeeError } = await supabase
            .from('attendees')
            .select('registration_id')
            .eq('student_id', normalizedId)
            .maybeSingle();

        if (attendeeError) throw attendeeError;
        if (!attendeeRow) return null; // no matching student found

        // Step 2: fetch the full registration, with ALL of its attendees
        const { data: registration, error: regError } = await supabase
            .from('registrations')
            .select('*, attendees(*)')
            .eq('id', attendeeRow.registration_id)
            .maybeSingle();

        if (regError) throw regError;
        if (!registration) return null;

        return {
            id: registration.id,
            status: registration.status,
            amount: Number(registration.amount) || 0,
            ticketType: registration.ticket_type,
            rejectionReason: registration.admin_comment,
            attendees: (registration.attendees || []).map(a => ({
                name: a.name,
                studentId: a.student_id,
                batch: a.batch,
                program: a.program,
                email: a.email,
                phone: a.phone,
                gender: a.gender,
                notes: a.notes,
                emergencyContact: a.emergency_contact
            }))
        };
    } catch (error) {
        console.error('Database lookup operation critical failure:', error);
        throw error;
    }
}
