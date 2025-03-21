import {getFirestore} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";

export const updateDalaBag = onCall(
  {region: "europe-west2"},
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to update a Dala Bag."
      );
    }

    const {vendorId, dalaBagId, updateData} = request.data;

    if (!vendorId || !dalaBagId || !updateData) {
      throw new HttpsError("invalid-argument", "Missing required parameters.");
    }

    // Add minimum price validation for update (if price is provided)
    if (typeof updateData.price !== "undefined") {
      const price = Number(updateData.price);
      if (price < 30) {
        throw new HttpsError("invalid-argument", "Price must be at least R30.");
      }
    }

    const db = getFirestore();
    const dalaBagRef = db
      .collection("vendors")
      .doc(vendorId)
      .collection("dalaBags")
      .doc(dalaBagId);
    const dalaBagDoc = await dalaBagRef.get();

    if (!dalaBagDoc.exists) {
      console.error("Dala Bag not found:", dalaBagId);
      throw new HttpsError("not-found", "Dala Bag not found.");
    }

    // Ensure user is authorized (owner check)
    const vendorRef = await db.collection("vendors").doc(vendorId).get();
    const vendorData = vendorRef.data();

    if (!vendorData || vendorData["ownerId"] !== request.auth.uid) {
      console.error("Unauthorized update attempt by:", request.auth.uid);
      throw new HttpsError(
        "permission-denied",
        "You are not authorized to update this Dala Bag."
      );
    }

    // Validate collection window times if being updated
    if (updateData.collectionStartTime || updateData.collectionEndTime) {
      const startTime = updateData.collectionStartTime ?
        new Date(updateData.collectionStartTime) :
        null;
      const endTime = updateData.collectionEndTime ?
        new Date(updateData.collectionEndTime) :
        null;

      if (startTime && endTime && startTime >= endTime) {
        throw new HttpsError(
          "invalid-argument",
          "Collection start time must be before the end time."
        );
      }
    }

    await dalaBagRef.update({
      ...updateData,
      vendorId,
      updatedAt: new Date(),
    });

    return {message: "Dala Bag updated successfully!"};
  }
);
