import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";

const db = getFirestore();

export const inviteEmployeeToVendor = onCall({region: "europe-west2"}, async (request) => {
  try {
    const {vendorId, userEmail, role} = request.data;

    if (!vendorId || !userEmail || !role) {
      throw new HttpsError("invalid-argument", "Vendor ID, user email, and role are required.");
    }

    const usersRef = db.collection("users");
    const querySnapshot = await usersRef.where("email", "==", userEmail).limit(1).get();

    if (querySnapshot.empty) {
      throw new HttpsError("not-found", `User with email ${userEmail} not found.`);
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    const vendorRef = db.collection("vendors").doc(vendorId);
    const vendorDoc = await vendorRef.get();

    if (!vendorDoc.exists) {
      throw new HttpsError("not-found", `Vendor with ID ${vendorId} not found.`);
    }

    const vendorData = vendorDoc.data();
    const employees = vendorData?.["employees"] || [];

    const isAlreadyEmployee = employees.some((emp: any) => emp.uid === userId);

    if (isAlreadyEmployee) {
      throw new HttpsError("already-exists", `User ${userEmail} is already an employee.`);
    }

    const updatedEmployees = [...employees, {uid: userId, role}];

    await vendorRef.update({employees: updatedEmployees});

    return {message: `User ${userEmail} (UID: ${userId}) invited successfully.`};
  } catch (error) {
    console.error("Error inviting employee:", error);
    throw new HttpsError("internal", "Failed to invite employee.");
  }
});
