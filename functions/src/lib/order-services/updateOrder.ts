import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const updateOrder = onCall({region: "europe-west2"}, async (request) => {
  if (!request.auth) {
    throw new Error("User must be authenticated to update an order.");
  }

  const {orderId, updateData} = request.data;
  if (!orderId || !updateData) {
    throw new Error("Order ID and update data are required.");
  }

  try {
    const orderRef = db.collection("orders").doc(orderId);
    await orderRef.update(updateData);
    return {message: "Order updated successfully!"};
  } catch (error) {
    console.error("Error updating order:", error);
    throw new Error("Failed to update order.");
  }
});
