import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const fetchOrdersByClient = onCall({region: "europe-west2"}, async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated to view orders.");
  }

  const {clientId} = request.data;
  if (!clientId) {
    throw new Error("Client ID is required.");
  }

  try {
    const snapshot = await db.collection("orders").where("clientId", "==", clientId).get();
    const orders = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    return orders;
  } catch (error) {
    console.error("Error fetching client orders:", error);
    throw new Error("Failed to fetch orders.");
  }
});
