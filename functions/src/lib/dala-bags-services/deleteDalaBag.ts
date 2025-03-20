import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/https";

export const deleteDalaBag = onCall({ region: "europe-west2" }, async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "You must be logged in to delete a Dala Bag.");
    }
  
    const { vendorId, dalaBagId } = request.data;
    if (!vendorId || !dalaBagId) {
      throw new HttpsError("invalid-argument", "Missing vendorId or dalaBagId.");
    }
  
    const db = getFirestore();
    const dalaBagRef = db.collection("vendors").doc(vendorId).collection("dalaBags").doc(dalaBagId);
    const dalaBagDoc = await dalaBagRef.get();
  
    if (!dalaBagDoc.exists) {
      throw new HttpsError("not-found", "Dala Bag not found.");
    }
  
    const vendorRef = await db.collection("vendors").doc(vendorId).get();
    if (vendorRef.data()?.["ownerId"] !== request.auth.uid) {
      throw new HttpsError("permission-denied", "You are not authorized to delete this Dala Bag.");
    }
  
    await dalaBagRef.delete();
    return { message: "Dala Bag deleted successfully!" };
  });
  