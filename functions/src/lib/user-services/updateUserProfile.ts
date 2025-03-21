import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";

export const updateUserProfile = onCall({region: "europe-west2"}, async (request) => {
  const db = getFirestore();

  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  try {
    const {uid, updateData} = request.data;

    if (request.auth.uid !== uid) {
      throw new HttpsError("permission-denied", "You can only update your own profile.");
    }

    const userDocRef = db.collection("users").doc(uid);
    await userDocRef.update(updateData);

    return {message: "User profile updated successfully."};
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new HttpsError("internal", "Failed to update user profile.");
  }
});
