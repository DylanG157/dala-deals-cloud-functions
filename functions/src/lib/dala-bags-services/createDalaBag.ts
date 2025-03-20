import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * Cloud Function: Securely create a Dala Bag
 */
export const createDalaBag = onCall(
  { region: 'europe-west2' },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to create a Dala Bag.'
      );
    }

    const { vendorId, dalaBagData } = request.data;

    if (!vendorId || !dalaBagData) {
      throw new HttpsError(
        'invalid-argument',
        'Missing vendorId or Dala Bag data.'
      );
    }

    // Add minimum price validation: Price must be at least R30.
    if (typeof dalaBagData.price !== 'undefined') {
      const price = Number(dalaBagData.price);
      if (price < 30) {
        throw new HttpsError('invalid-argument', 'Price must be at least R30.');
      }
    }

    const { collectionStartTime, collectionEndTime } = dalaBagData;

    if (!collectionStartTime || !collectionEndTime) {
      throw new HttpsError(
        'invalid-argument',
        'Collection start and end times are required.'
      );
    }

    const startTime = new Date(collectionStartTime);
    const endTime = new Date(collectionEndTime);

    if (startTime >= endTime) {
      throw new HttpsError(
        'invalid-argument',
        'Collection start time must be before the end time.'
      );
    }

    const db = getFirestore();

    // 🔒 Ensure the user is authorized to create a Dala Bag
    const vendorRef = await db.collection('vendors').doc(vendorId).get();
    if (!vendorRef.exists) {
      throw new HttpsError('not-found', 'Vendor does not exist.');
    }

    if (vendorRef.data()?.['ownerId'] !== request.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        'You are not authorized to create a Dala Bag for this vendor.'
      );
    }

    // Create the Dala Bag with vendorId included in the document data.
    const dalaBagRef = await db
      .collection('vendors')
      .doc(vendorId)
      .collection('dalaBags')
      .add({
        vendorId, // Include vendorId field.
        ...dalaBagData,
        collectionStartTime: startTime,
        collectionEndTime: endTime,
        createdAt: new Date(),
      });

    return {
      dalaBagId: dalaBagRef.id,
      message: 'Dala Bag created successfully!',
    };
  }
);
