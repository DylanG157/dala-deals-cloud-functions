import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const deleteOrder = onCall({ region: "europe-west2" }, async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated to delete an order.");
  }

  const { orderId } = request.data;
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  try {
    await db.collection("orders").doc(orderId).delete();
    return { message: "Order deleted successfully!" };
  } catch (error) {
    console.error("Error deleting order:", error);
    throw new Error("Failed to delete order.");
  }
});
