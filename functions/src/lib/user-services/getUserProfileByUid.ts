import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";

export const getUserProfileByUid = onCall({region: "europe-west2"}, async (request) => {
  const db = getFirestore();

  try {
    const {uid} = request.data;
    if (!uid) {
      throw new HttpsError("invalid-argument", "UID is required.");
    }

    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return {message: `User not found for UID: ${uid}`};
    }

    return {user: userDoc.data()};
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new HttpsError("internal", "Failed to fetch user profile.");
  }
});
