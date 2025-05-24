import { initializeApp } from "firebase-admin/app";
// Initialize Firebase Admin
initializeApp();

// Orders
export { createOrder } from "./lib/order-services/createOrder";
export { updateOrder } from "./lib/order-services/updateOrder";
export { deleteOrder } from "./lib/order-services/deleteOrder";
export { fetchOrdersByVendor } from "./lib/order-services/fetchOrdersByVendor";
export { fetchOrdersByClient } from "./lib/order-services/fetchOrdersByClient";
export { redeemOrder } from "./lib/order-services/redeemOrder";

// dala-bags
export { createDalaBag } from "./lib/dala-bags-services/createDalaBag";
export { updateDalaBag } from "./lib/dala-bags-services/updateDalaBag";
export { deleteDalaBag } from "./lib/dala-bags-services/deleteDalaBag";

// user-services
export { addVendorToUser } from "./lib/user-services/addVendorToUser";
export { createUserProfile } from "./lib/user-services/createUserProfile";
export { getUserProfileByEmail } from "./lib/user-services/getUserProfileByEmail";
export { updateUserProfile } from "./lib/user-services/updateUserProfile";
export { getUserProfileByUid } from "./lib/user-services/getUserProfileByUid";

// vendor-services
export { createVendor } from "./lib/vendor-services/createVendor";
export { updateVendor } from "./lib/vendor-services/updateVendor";
export { inviteEmployeeToVendor } from "./lib/vendor-services/inviteEmployeeToVendor";
export { removeVendorFromUser } from "./lib/vendor-services/removeVendorFromUser";

// payment-services
export { initiatePayfastPayment } from "./lib/payment-services/initiatePayfastPayment";
export { payfastNotify } from "./lib/payment-services/payfastNotify";
