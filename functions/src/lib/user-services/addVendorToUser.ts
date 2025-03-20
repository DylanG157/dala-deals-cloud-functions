import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export const addVendorToUser = onCall({ region: "europe-west2" }, async (request) => {
  const db = getFirestore();

  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  try {
    const { uid, vendorId, role } = request.data;

    const requestingUserDoc = await db.collection("users").doc(request.auth.uid).get();
    const requestingUser = requestingUserDoc.data();
    
    if (!requestingUser || !requestingUser["roleByVendor"]) {
      throw new HttpsError("permission-denied", "Unauthorized.");
    }

    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      vendorIds: vendorId,
      [`roleByVendor.${vendorId}`]: role,
    });

    return { message: "Vendor added to user profile successfully." };
  } catch (error) {
    console.error("Error adding vendor to user:", error);
    throw new HttpsError("internal", "Failed to add vendor.");
  }
});
