import rateLimit from 'express-rate-limit';

/*
 Rate limiter specifically for OTP-related authentication endpoints.
 Limits each IP to 5 requests per hour to mitigate brute-force and spam.
 For production, consider using a Redis store (rate-limit-redis) to share
 limits across instances.
*/
export const otpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error: 'Too many OTP requests from this IP, please try again after an hour.',
  },
});
