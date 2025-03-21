import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const fetchOrdersByVendor = onCall({region: "europe-west2"}, async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated to view orders.");
  }

  const {vendorId} = request.data;
  if (!vendorId) {
    throw new Error("Vendor ID is required.");
  }

  try {
    const snapshot = await db.collection("orders").where("vendorId", "==", vendorId).get();
    const orders = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    return orders;
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    throw new Error("Failed to fetch orders.");
  }
});
