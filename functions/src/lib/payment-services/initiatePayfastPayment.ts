// functions/src/index.ts (continuing in the same file)

import {onRequest} from "firebase-functions/v2/https";
import cors from "cors";
import * as crypto from "crypto";

const corsHandler = cors({origin: true});

export const initiatePayfastPayment = onRequest({region: "europe-west2"}, async (req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const {totalAmount, orderId, itemName, userEmail} = req.body;

      if (!totalAmount || !orderId || !itemName || !userEmail) {
        return res.status(400).json({error: "Missing required fields."});
      }

      const merchantId = "10037460";
      const merchantKey = "rszxljolrzcho";
      const passphrase = "dalaDealsDev";

      // PayFast sandbox URLs
      const payfastUrl = "https://sandbox.payfast.co.za/eng/process";

      // We append ?orderId=XYZ so when payment completes,
      // PayFast sends user back to PaymentSuccess with the order ID
      const returnUrl = `http://localhost:4200/payment-success?orderId=${orderId}`;
      const cancelUrl = "http://localhost:4200/payment-cancel";
      const notifyUrl = "https://payfastnotify-arveg6cycq-nw.a.run.app"; // or your function

      // Prepare Payment Data (DO NOT SORT)
      const paymentData: Record<string, string> = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        amount: parseFloat(totalAmount).toFixed(2),
        item_name: itemName,

        // If you want PayFast to pass the orderId along in the IPN:
        custom_str1: orderId,
      };

      const signature = generatePayfastSignature(paymentData, passphrase);

      return res.status(200).json({
        success: true,
        payfastUrl,
        paymentData,
        signature,
      });
    } catch (error) {
      console.error("PayFast Error:", error);
      return res.status(500).json({error: "Internal Server Error"});
    }
  });
});

const generatePayfastSignature = (data: Record<string, string>, passPhrase?: string): string => {
  let pfOutput = Object.entries(data)
    .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`)
    .join("&");

  if (passPhrase && passPhrase.trim() !== "") {
    pfOutput += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
  }

  return crypto.createHash("md5").update(pfOutput).digest("hex");
};
