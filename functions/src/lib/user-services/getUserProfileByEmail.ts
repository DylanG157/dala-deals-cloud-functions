import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";

export const getUserProfileByEmail = onCall({region: "europe-west2"}, async (request) => {
  try {
    const db = getFirestore();
    const {email} = request.data;

    if (!email || typeof email !== "string") {
      throw new HttpsError("invalid-argument", "A valid email is required.");
    }

    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", `User not found for email: ${email}`);
    }

    const userDoc = querySnapshot.docs[0];
    return {uid: userDoc.id, user: userDoc.data()};
  } catch (error: any) {
    console.error("Error fetching user profile:", error);

    if (error instanceof HttpsError) {
      throw error;
    } else {
      throw new HttpsError("internal", "Failed to fetch user profile.", error.message);
    }
  }
});
