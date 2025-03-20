import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export const removeVendorFromUser = onCall(
  { region: "europe-west2" },
  async (request) => {
    const db = getFirestore();

    try {
      const { uid, vendorId } = request.data;

      if (!uid || !vendorId) {
        throw new HttpsError(
          "invalid-argument",
          "User ID and Vendor ID are required."
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

      const vendorData = vendorDoc.data();
      const updatedEmployees = (vendorData?.["employees"] || []).filter(
        (emp: any) => emp.uid !== uid
      );

      await vendorRef.update({ employees: updatedEmployees });

      return { message: `Vendor ${vendorId} removed from user ${uid}.` };
    } catch (error) {
      console.error("Error removing vendor from user:", error);
      throw new HttpsError("internal", "Failed to remove vendor from user.");
    }
  }
);
