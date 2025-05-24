import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

export const addVendorToUser = onCall({region: "europe-west2"}, async (request) => {
  const db = getFirestore();

  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  try {
    const {uid, vendorId, role} = request.data;

    const requestingUserDoc = await db.collection("users").doc(request.auth.uid).get();
    const requestingUser = requestingUserDoc.data();

    if (!requestingUser || !requestingUser["roleByVendor"]) {
      throw new HttpsError("permission-denied", "Unauthorized.");
    }

    const userRef = db.collection("users").doc(uid);
    
    // Use arrayUnion to safely add vendorId to the array
    await userRef.update({
      vendorIds: FieldValue.arrayUnion(vendorId),
      [`roleByVendor.${vendorId}`]: role,
    });

    return {message: "Vendor added to user profile successfully."};
  } catch (error) {
    console.error("Error adding vendor to user:", error);
    throw new HttpsError("internal", "Failed to add vendor.");
  }
});
