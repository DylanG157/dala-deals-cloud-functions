import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export const updateVendor = onCall(
  { region: "europe-west2" },
  async (request) => {
    const db = getFirestore();

    try {
      const { vendorId, updateData } = request.data;

      if (!vendorId || !updateData) {
        throw new HttpsError(
          "invalid-argument",
          "Vendor ID and update data are required."
        );
      }

      const vendorRef = db.collection("vendors").doc(vendorId);
      const vendorDoc = await vendorRef.get();

      if (!vendorDoc.exists) {
        throw new HttpsError(
          "not-found",
          `Vendor with ID ${vendorId} not found.`
        );
      }

      await vendorRef.update(updateData);

      return { message: `Vendor ${vendorId} updated successfully.` };
    } catch (error) {
      console.error("Error updating vendor:", error);
      throw new HttpsError("internal", "Failed to update vendor.");
    }
  }
);
