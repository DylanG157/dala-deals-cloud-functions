import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export const createUserProfile = onCall({ region: "europe-west2" }, async (request) => {
  const db = getFirestore();

  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  try {
    const profile = request.data;
    const userDocRef = db.collection("users").doc(request.auth.uid);

    await userDocRef.set({
      ...profile,
      createdAt: new Date(),
    });

    return { message: "User profile created successfully." };
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw new HttpsError("internal", "Failed to create user profile.");
  }
});
