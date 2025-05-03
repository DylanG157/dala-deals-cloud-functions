import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as crypto from "crypto";
import { OrderItem, Order } from "../models/order.model";

// CREATE ORDER FUNCTION
export const createOrder = onCall(
  { region: "europe-west2" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { clientId, orderItems, totalPrice, specialNotes } = request.data;

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

    const validatedItems: OrderItem[] = orderItems.map((item) => ({
      vendorId: item.vendorId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const db = getFirestore();
    const referenceNumber = crypto.randomBytes(3).toString("hex").toUpperCase();

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

    const orderQRLink = `http://localhost:4200/verify?orderId=${orderRef.id}`;
    await orderRef.update({ qrData: orderQRLink });

    return {
      orderId: orderRef.id,
      referenceNumber,
      message: "Order created successfully!",
    };
  }
);

// INITIATE PAYFAST PAYMENT FUNCTION
export const initiatePayfastPayment = onCall(
  { region: "europe-west2" },
  async (request) => {
    const { totalAmount, orderId, itemName, userEmail } = request.data;

    if (
      typeof totalAmount !== "number" ||
      !orderId ||
      !itemName ||
      !userEmail
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Missing or invalid payment initiation fields."
      );
    }

    const merchantId = "10037460";
    const merchantKey = "rszxljolrzcho";
    const passphrase = "dalaDealsDev";
    const payfastUrl = "https://sandbox.payfast.co.za/eng/process";
    const returnUrl = `https://discount-food-app.web.app/payment-success.html?orderId=${orderId}`;
    const cancelUrl = `https://discount-food-app.web.app/payment-cancel.html`;
    const notifyUrl = "https://your-ipn-endpoint.example.com";

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      amount: totalAmount.toFixed(2),
      item_name: itemName,
      custom_str1: orderId,
    };

    const signature = generatePayfastSignature(paymentData, passphrase);

    return {
      success: true,
      payfastUrl,
      paymentData,
      signature,
    };
  }
);

// SIGNATURE GENERATOR
function generatePayfastSignature(
  data: Record<string, string>,
  passPhrase?: string
): string {
  let str = Object.entries(data)
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([k, v]) =>
        `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`
    )
    .join("&");

  if (passPhrase) {
    str += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(
      /%20/g,
      "+"
    )}`;
  }

  return crypto.createHash("md5").update(str).digest("hex");
}
