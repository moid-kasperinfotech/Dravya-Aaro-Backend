import admin from "firebase-admin";
// if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
//   throw new Error("FIREBASE_SERVICE_ACCOUNT missing in .env");
// }
// const serviceAccount = JSON.parse(
//   process.env.FIREBASE_SERVICE_ACCOUNT
// );
const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!base64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 missing");
}
const serviceAccount = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
// ✅ Prevent re-initialization
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}
export default admin;
