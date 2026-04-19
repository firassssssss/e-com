export interface IStorageService {
  /** Upload a file buffer and return a public URL */
  upload(buffer: Buffer, contentType: string, destinationPath: string): Promise<string>;
}
