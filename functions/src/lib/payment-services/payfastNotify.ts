import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";


export const payfastNotify = onRequest({ region: "europe-west2" }, async (req, res) => {
  try {
 
    const { custom_str1, payment_status } = req.body;
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
