import { Service } from 'typedi';
import { IStorageService } from '../../core/services/IStorageService.js';
import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';

@Service()
export class FirebaseStorageService implements IStorageService {
  private initialized = false;

  private init() {
    if (this.initialized) return;
    // Expect GOOGLE_APPLICATION_CREDENTIALS env var or service account JSON in env
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_BUCKET_NAME,
    });
    this.initialized = true;
  }

  async upload(buffer: Buffer, contentType: string, destinationPath: string): Promise<string> {
    this.init();
    const bucket = admin.storage().bucket();
    const filePath = destinationPath || `uploads/${uuid()}`;

    const file = bucket.file(filePath);
    await file.save(buffer, { contentType, public: true, metadata: { firebaseStorageDownloadTokens: uuid() } });
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  }
}
