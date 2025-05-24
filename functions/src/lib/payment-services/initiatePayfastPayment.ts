import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const initiatePayfastPayment = onCall(
  { region: "europe-west2" },
  async (req) => {
    const { totalAmount, orderId, itemName, userEmail } = req.data;

    if (
      typeof totalAmount !== "number" ||
      !orderId ||
      !itemName ||
      !userEmail
    ) {
      throw new HttpsError("invalid-argument", "Missing payment fields");
    }

    /* 1️⃣  Confirm the order is still pending */
    const snap = await db.doc(`orders/${orderId}`).get();
    if (!snap.exists) throw new HttpsError("not-found", "Order not found");
    if (snap.data()!.status !== "pending") {
      throw new HttpsError("failed-precondition", "Order already paid");
    }

    /* 2️⃣  Build the PayFast form payload */
    const merchantId  = "10037460";
    const merchantKey = "rszxljolrzcho";
    const passphrase  = "dalaDealsDev";
    const payfastUrl  = "https://sandbox.payfast.co.za/eng/process";

    const returnUrl = `myapp://payment-success?orderId=${orderId}`;
    const cancelUrl = `myapp://payment-cancel`;
    const notifyUrl = "https://payfastnotify-arveg6cycq-nw.a.run.app";

    const paymentData: Record<string, string> = {
      merchant_id:   merchantId,
      merchant_key:  merchantKey,
      return_url:    returnUrl,
      cancel_url:    cancelUrl,
      notify_url:    notifyUrl,
      amount:        totalAmount.toFixed(2),
      item_name:     itemName,
      custom_str1:   orderId,
      email_address: userEmail,
    };

    const signature = generatePayfastSignature(paymentData, passphrase);

    return { success: true, payfastUrl, paymentData, signature };
  }
);

/* Utility */
function generatePayfastSignature(
  data: Record<string, string>,
  passPhrase?: string
) {
  let str = Object.entries(data)
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([k, v]) => `${k}=${encodeURIComponent(v.trim()).replace(/%20/g, "+")}`
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
