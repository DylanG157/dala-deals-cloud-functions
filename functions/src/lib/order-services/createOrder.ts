import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as crypto from "crypto";
import { Order, OrderItem } from "../models/order.model";

export const createOrder = onCall(
  { region: "europe-west2" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    try {
      const { clientId, orderItems, totalPrice, specialNotes } = request.data;

      // Validate input data
      if (
        !clientId ||
        !Array.isArray(orderItems) ||
        orderItems.length === 0 ||
        typeof totalPrice !== "number"
      ) {
        throw new HttpsError(
          "invalid-argument",
          "Missing or invalid order details."
        );
      }

      // Ensure orderItems match the expected structure
      const validatedItems: OrderItem[] = orderItems.map((item) => ({
        vendorId: item.vendorId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const db = getFirestore();
      const referenceNumber = crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase();

      // Construct the order using the shared Order interface
      const newOrder: Order = {
        clientId,
        orderItems: validatedItems,
        totalPrice,
        status: "pending",
        orderDate: new Date(),
        paidAt: null,
        redeemedAt: null,
        collectedAt: null,
      };

      const orderRef = await db.collection("orders").add({
        ...newOrder,
        specialNotes: specialNotes ?? "",
        referenceNumber,
        qrData: "",
      });

      // Generate order verification QR link
      const orderQRLink = `http://localhost:4200/verify?orderId=${orderRef.id}`;
      await orderRef.update({ qrData: orderQRLink });

      return {
        orderId: orderRef.id,
        referenceNumber,
        message: "Order created successfully!",
      };
    } catch (error) {
      console.error("Error creating order:", error);
      throw new HttpsError("internal", "Failed to create order.");
    }
  }
);
