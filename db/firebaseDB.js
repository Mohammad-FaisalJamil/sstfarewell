// Firebase Database Operations Module
// Handles all database interactions with Firestore

import firebaseConfig from "../config/firebase.js";
import { FIREBASE_COLLECTIONS, STATUS_TYPES } from "../config/constants.js";

let firebaseDB = null;
let firebaseApp = null;

// Firebase SDK references (will be set globally)
let firebaseAddDoc = null;
let firebaseCollection = null;
let firebaseServerTimestamp = null;
let firebaseGetDocs = null;
let firebaseQuery = null;
let firebaseWhere = null;

/**
 * Initialize Firebase and set up database connection
 */
export async function initializeFirebase() {
    if (firebaseApp) return firebaseApp; // Already initialized
    
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js");
    const { 
        getFirestore, 
        collection, 
        addDoc, 
        serverTimestamp,
        getDocs,
        query,
        where
    } = await import("https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js");

    firebaseApp = initializeApp(firebaseConfig);
    firebaseDB = getFirestore(firebaseApp);
    
    // Store globally for use in other modules
    firebaseAddDoc = addDoc;
    firebaseCollection = collection;
    firebaseServerTimestamp = serverTimestamp;
    firebaseGetDocs = getDocs;
    firebaseQuery = query;
    firebaseWhere = where;

    // Make available globally
    window.firebaseDB = firebaseDB;
    window.firebaseAddDoc = firebaseAddDoc;
    window.firebaseCollection = firebaseCollection;
    window.firebaseServerTimestamp = firebaseServerTimestamp;
    window.firebaseGetDocs = firebaseGetDocs;
    window.firebaseQuery = firebaseQuery;
    window.firebaseWhere = firebaseWhere;

    return firebaseApp;
}

/**
 * Save registration to Firestore
 * @param {Object} registrationData - The registration data to save
 * @returns {Promise<string>} - Document ID
 */
export async function saveRegistration(registrationData) {
    if (!firebaseDB) throw new Error("Firebase not initialized");
    
    try {
        const docRef = await firebaseAddDoc(
            firebaseCollection(firebaseDB, FIREBASE_COLLECTIONS.registrations),
            {
                ...registrationData,
                createdAt: firebaseServerTimestamp(),
                status: STATUS_TYPES.PENDING
            }
        );
        return docRef.id;
    } catch (error) {
        console.error("Error saving registration:", error);
        throw error;
    }
}

/**
 * Check registration status by student ID
 * @param {string} studentId - University ID to search
 * @returns {Promise<Object|null>} - Registration data or null if not found
 */
export async function checkRegistrationStatus(studentId) {
    if (!firebaseDB) throw new Error("Firebase not initialized");
    
    try {
        const querySnapshot = await firebaseGetDocs(
            firebaseCollection(firebaseDB, FIREBASE_COLLECTIONS.registrations)
        );
        
        let foundRegistration = null;
        let latestTime = 0;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Check if any attendee has matching student ID
            if (data.attendees && data.attendees.length > 0) {
                const matchingAttendee = data.attendees.find(attendee =>
                    attendee.studentId && attendee.studentId.toUpperCase() === studentId.toUpperCase()
                );
                
                if (matchingAttendee) {
                    // Get the most recent registration
                    const regTime = data.createdAt ? data.createdAt.seconds : 0;
                    if (regTime > latestTime) {
                        latestTime = regTime;
                        foundRegistration = { ...data, id: doc.id };
                    }
                }
            }
        });
        
        return foundRegistration;
    } catch (error) {
        console.error("Error checking status:", error);
        throw error;
    }
}

/**
 * Get Firebase database instance
 * @returns {Object} - Firestore database instance
 */
export function getDatabase() {
    return firebaseDB;
}

/**
 * Get Firebase app instance
 * @returns {Object} - Firebase app instance
 */
export function getFirebaseApp() {
    return firebaseApp;
}

export { firebaseConfig };
