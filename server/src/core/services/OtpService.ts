import Prelude from "@prelude.so/sdk";
import { Service } from "typedi";
import redis from '../../infrastructure/redis/index.js';
import * as dotenv from "dotenv";
import { v4 } from "uuid";

dotenv.config();

const OTP_REQUEST_LIMIT = 5; // per phone per hour
const OTP_REQUEST_WINDOW = 60 * 60; // seconds
const OTP_TTL = 5 * 60; // seconds (expiration for verification metadata)

@Service()
export class OtpService {
  private client: Prelude;

  constructor() {
    if (!process.env.PRELUDE_API_KEY) {
      throw new Error("PRELUDE_API_KEY is not set in environment variables");
    }
    this.client = new Prelude({ apiToken: process.env.PRELUDE_API_KEY });
  }

  private getCountKey(phone: string) {
    return `otp:count:${phone}`;
  }

  private getVerificationKey(phone: string) {
    return `otp:v:${phone}`;
  }

  /**
   * Sends an OTP via Prelude to the given phone number.
   * @returns verificationId issued by Prelude
   */
  public async sendOtp(phone: string): Promise<string> {
    // Rate limiting
    const countKey = this.getCountKey(phone);
    const current = Number(await redis.get(countKey)) || 0;
    if (current >= OTP_REQUEST_LIMIT) {
      throw new Error("OTP request rate limit exceeded. Please try again later.");
    }

    const multi = redis.multi();
    multi.incr(countKey);
    multi.expire(countKey, OTP_REQUEST_WINDOW);
    await multi.exec();

    let verification: { id: string } = { id: v4() };

    if (process.env.BYPASS_OTP !== 'true') {
      // Create verification via Prelude
      verification = await this.client.verification.create({
        target: {
          type: "phone_number",
          value: phone,
        },
      });
    }
    // Persist verification metadata for later verification
    const verificationKey = this.getVerificationKey(phone);
    await redis.set(verificationKey, verification.id, {
      EX: OTP_TTL,
    });

    return verification.id;
  }

  /**
   * Verifies a user-provided OTP code for a phone number.
   * @returns true if valid, otherwise false.
   */
  public async verifyOtp(phone: string, code: string): Promise<boolean> {
    const verificationKey = this.getVerificationKey(phone);
    const verificationId = await redis.get(verificationKey);
    if (!verificationId) {
      return false;
    }

    try {
      let result;
      if (process.env.BYPASS_OTP !== 'true') {
        result = await this.client.verification.check({
          code,
          target: {
            type: "phone_number",
            value: phone,
          },
        });
      } else {
        result = { status: "success" };
      }
      if (result.status === "success") {
        // Clean up redis keys
        await redis.del(verificationKey);
        await redis.del(this.getCountKey(phone));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }
}
