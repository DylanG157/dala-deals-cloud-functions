import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import { nanoid } from "nanoid";
import { Order, OrderItem } from "../models/order.model";

if (!getApps().length) initializeApp();          // init Admin SDK once
const db = getFirestore();

export const createOrder = onCall({ region: "europe-west2" }, async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Login first");

  const { clientId, orderItems, totalPrice, specialNotes } = req.data;

  if (
    !clientId ||
    !Array.isArray(orderItems) ||
    orderItems.length === 0 ||
    typeof totalPrice !== "number"
  ) {
    throw new HttpsError("invalid-argument", "Bad order payload");
  }

  const validated: OrderItem[] = orderItems.map((i) => ({
    vendorId:  i.vendorId,
    productId: i.productId,
    quantity:  i.quantity,
    price:     i.price,
  }));

  const referenceNumber = crypto.randomBytes(3).toString("hex").toUpperCase();
  const redeemToken     = nanoid(10);

  const skeleton: Order = {
    clientId,
    orderItems: validated,
    totalPrice,
    status:      "pending",
    orderDate:   new Date(),
    paidAt:      null,
    redeemedAt:  null,
    collectedAt: null,
  };

  // 1. create
  const ref = await db.collection("orders").add({
    ...skeleton,
    specialNotes: specialNotes ?? "",
    referenceNumber,
    redeemToken,
    qrPayload: "",           // placeholder
  });

  // 2. patch QR payload
  const qrPayload = JSON.stringify({ orderId: ref.id, token: redeemToken });
  await ref.update({ qrPayload });

  return {
    orderId: ref.id,
    referenceNumber,
    message: "Order created successfully!",
  };
});
