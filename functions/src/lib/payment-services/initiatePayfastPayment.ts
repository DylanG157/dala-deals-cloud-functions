import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as crypto from "crypto";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Initiates a PayFast payment for an order.
 * 
 * PayFast URL Requirements:
 * - return_url and cancel_url MUST be valid HTTP/HTTPS URLs
 * - Custom scheme URLs (e.g., myapp://) are NOT accepted by PayFast
 * 
 * For mobile app integration:
 * 1. Create web pages at your return/cancel URLs
 * 2. These pages should detect if on mobile and redirect to your app using:
 *    - Universal Links (iOS)
 *    - App Links (Android)
 *    - Or JavaScript redirect: window.location.href = "myapp://payment-success"
 */

export const initiatePayfastPayment = onCall(
  { region: "europe-west2" },
  async (req) => {
    const { 
      totalAmount, 
      orderId, 
      itemName, 
      userEmail,
      returnUrl: customReturnUrl,
      cancelUrl: customCancelUrl
    } = req.data;

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
    // IMPORTANT: Verify these credentials match your PayFast sandbox account
    const merchantId  = "10037460";
    const merchantKey = "rszxljolrzcho";
    const passphrase  = "dalaDealsDev"; // Correct passphrase from PayFast account
    const payfastUrl  = "https://sandbox.payfast.co.za/eng/process";

    // PayFast requires valid HTTP/HTTPS URLs - these should point to your web domain
    // The web pages can then redirect to your mobile app using deep links
    const baseUrl = "https://discount-food-app.web.app";
    
    // Use custom URLs if provided, otherwise use defaults
    const returnUrl = customReturnUrl || `${baseUrl}/payment/success?orderId=${orderId}`;
    const cancelUrl = customCancelUrl || `${baseUrl}/payment/cancel?orderId=${orderId}`;
    const notifyUrl = "https://payfastnotify-arveg6cycq-nw.a.run.app";
    
    // Validate that URLs are HTTP/HTTPS
    if (!returnUrl.startsWith('http://') && !returnUrl.startsWith('https://')) {
      throw new HttpsError(
        "invalid-argument", 
        "Return URL must be a valid HTTP/HTTPS URL. PayFast does not accept custom scheme URLs."
      );
    }
    
    if (!cancelUrl.startsWith('http://') && !cancelUrl.startsWith('https://')) {
      throw new HttpsError(
        "invalid-argument", 
        "Cancel URL must be a valid HTTP/HTTPS URL. PayFast does not accept custom scheme URLs."
      );
    }

    // Payment data in PayFast's required order
    const paymentData: Record<string, string> = {
      merchant_id:   merchantId,
      merchant_key:  merchantKey,
      return_url:    returnUrl,
      cancel_url:    cancelUrl,
      notify_url:    notifyUrl,
      email_address: userEmail,
      amount:        totalAmount.toFixed(2),
      item_name:     itemName,
      custom_str1:   orderId,
    };

    const signature = generatePayfastSignature(paymentData, passphrase);
    
    // Add signature to payment data
    const paymentDataWithSignature = {
      ...paymentData,
      signature
    };

    // Debug info (remove in production)
    console.log("PayFast Debug Info:", {
      paramString: Object.keys(paymentData)
        .sort()
        .filter(key => paymentData[key] != null && paymentData[key] !== "")
        .map(key => `${key}=${paymentData[key]}`)
        .join("&"),
      signature,
      passphrase: passphrase ? "Set" : "Not set"
    });

    return { 
      success: true, 
      payfastUrl, 
      paymentData: paymentDataWithSignature, 
      signature 
    };
  }
);

/* Utility */
function generatePayfastSignature(
  data: Record<string, string>,
  passPhrase?: string
): string {
  // PayFast requires specific field order for signature generation
  const fieldOrder = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_int1",
    "custom_int2",
    "custom_int3",
    "custom_int4",
    "custom_int5",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "email_confirmation",
    "confirmation_address",
    "currency",
    "payment_method"
  ];

  // Build parameter string in the correct order
  let paramString = fieldOrder
    .filter(key => data[key] !== "" && data[key] !== null && data[key] !== undefined)
    .map(key => `${key}=${encodeURIComponent(String(data[key]).trim()).replace(/%20/g, "+")}`)
    .join("&");

  // Append passphrase as the last parameter
  if (passPhrase && passPhrase.trim() !== "") {
    paramString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
  }

  console.log("Signature generation debug:", {
    paramString,
    hasPassphrase: !!passPhrase
  });

  // Generate MD5 hash (lowercase)
  return crypto.createHash("md5").update(paramString).digest("hex");
}
