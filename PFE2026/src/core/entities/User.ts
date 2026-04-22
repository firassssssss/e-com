/**
 * User entity aligned with better-auth schema
 */
export class User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  skinType: string | null;
  hairType: string | null;
  skinConcerns: string | null;
  discoverySource: string | null;
  onboardingDone: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    name: string,
    email: string,
    emailVerified: boolean = false,
    image: string | null = null,
    role: string = 'user',
    createdAt?: Date,
    updatedAt?: Date,
    skinType: string | null = null,
    hairType: string | null = null,
    skinConcerns: string | null = null,
    discoverySource: string | null = null,
    onboardingDone: boolean = false,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.emailVerified = emailVerified;
    this.image = image;
    this.role = role;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.skinType = skinType;
    this.hairType = hairType;
    this.skinConcerns = skinConcerns;
    this.discoverySource = discoverySource;
    this.onboardingDone = onboardingDone;
  }
}
