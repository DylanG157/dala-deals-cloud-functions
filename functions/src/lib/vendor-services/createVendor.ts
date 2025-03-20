import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import sgMail from '@sendgrid/mail';

const db = getFirestore();

export const createVendor = onCall(
  { region: 'europe-west2', secrets: ['SENDGRID_API_KEY'] },
  async (request) => {
    try {
      // 1. Ensure user is authenticated
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
      }

      // 2. Retrieve user info from the token
      const callerUid = request.auth.uid; // The caller's UID

      // 3. Get the SendGrid API key and set it up
      const sendGridApiKey = process.env['SENDGRID_API_KEY'];
      sgMail.setApiKey(sendGridApiKey || '');

      // 4. Grab vendorData from request data
      const { vendorData } = request.data;
      if (!vendorData || typeof vendorData !== 'object') {
        throw new HttpsError('invalid-argument', 'Vendor data is required.');
      }

      // 5. Retrieve the user doc of the caller
      const userDocRef = db.collection('users').doc(callerUid);
      const userDocSnap = await userDocRef.get();
      if (!userDocSnap.exists) {
        throw new HttpsError(
          'not-found',
          'User record not found in Firestore.'
        );
      }
      const userData = userDocSnap.data();
      const ownerEmail = userData?.['email'];
      if (!ownerEmail) {
        throw new HttpsError(
          'not-found',
          'User record has no email field in Firestore.'
        );
      }

      // 6. Determine which email template to use based on existing vendors
      // If vendorIds exist and have at least one vendor, use the second template.
      const existingVendors = userData['vendorIds'] || [];
      const firstTemplateId = 'd-72d730d637ed42899a0f4c0665e706a6';
      const additionalTemplateId = 'd-349b669fd9c94694b178d8fefd130bfc'; // Replace with your additional vendor template ID
      const chosenTemplateId =
        existingVendors.length > 0 ? additionalTemplateId : firstTemplateId;

      // 7. Create the vendor document
      const newVendor = {
        ...vendorData,
        ownerId: callerUid,
        createdAt: new Date().toISOString(),
      };
      const vendorRef = await db.collection('vendors').add(newVendor);
      const vendorId = vendorRef.id;

      // 8. Update the user's vendorIds array
      await userDocRef.update({
        vendorIds: FieldValue.arrayUnion(vendorId),
      });

      // 9. Build the list of recipients.
      // Start with the owner email.
      const recipients = [ownerEmail];
      // If a business email exists in vendorData and is different, add it.
      if (vendorData.businessEmail && vendorData.businessEmail !== ownerEmail) {
        recipients.push(vendorData.businessEmail);
      }

      // 10. Prepare dynamic data for the SendGrid template
      const msg = {
        to: recipients,
        from: 'noreply@daladeals.co.za',
        templateId: chosenTemplateId,
        dynamic_template_data: {
          vendorName: vendorData.name,
          vendorId,
          vendorContactNumber: vendorData.phone,
          vendorAddress: vendorData.address,
          loginLink: `http://localhost:4200/dashboard/vendor/${vendorId}`,
        },
      };

      // 11. Send the email
      await sgMail.send(msg);

      return {
        vendorId,
        message: 'Vendor created and email sent to the caller successfully.',
      };
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw new HttpsError('internal', 'Failed to create vendor.');
    }
  }
);
