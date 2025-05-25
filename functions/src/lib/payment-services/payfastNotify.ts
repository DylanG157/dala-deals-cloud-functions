import {onRequest} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import * as crypto from "crypto";


export const payfastNotify = onRequest({region: "europe-west2"}, async (req, res) => {
  try {
    const passphrase = "dalaDealsDev"; // Same passphrase as in initiatePayfastPayment
    
    // Validate signature
    const signature = req.body.signature;
    const validSignature = generatePayfastSignature(req.body, passphrase);
    
    if (signature !== validSignature) {
      console.error("Invalid PayFast signature", {
        received: signature,
        expected: validSignature
      });
      res.status(400).send("Invalid signature");
      return;
    }
    
    const {custom_str1, payment_status} = req.body;
    const orderId = custom_str1;

    const db = getFirestore();
    if (orderId && payment_status === "COMPLETE") {
      await db.collection("orders").doc(orderId).update({
        status: "paid",
        paidAt: new Date(),
      });
    }
    res.status(200).send("IPN received");
  } catch (err) {
    console.error("Error in payfastNotify:", err);
    res.status(400).send("Bad Request");
  }
});

function generatePayfastSignature(
  data: Record<string, string>,
  passPhrase?: string
): string {
  // IMPORTANT: Do NOT sort parameters - maintain order as provided
  // This matches the original working implementation
  
  // Create a copy and remove signature if present
  const params = { ...data };
  delete params.signature;
  
  let paramString = Object.entries(params)
    .filter(([_, value]) => value !== "" && value !== null && value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`)
    .join("&");

  // Append passphrase if provided (URL encoded as in original)
  if (passPhrase && passPhrase.trim() !== "") {
    paramString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
  }

  // Generate MD5 hash
  return crypto.createHash("md5").update(paramString).digest("hex");
}
