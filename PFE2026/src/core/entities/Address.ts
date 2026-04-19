export class Address {
    constructor(
        public readonly id: string,
        public userId: string,
        public fullName: string,
        public phoneNumber: string,
        public streetAddress: string, // Includes apt/suite
        public city: string,
        public state: string | null, // Governorate in Tunisia
        public postalCode: string,
        public country: string = 'Tunisia',
        public isDefault: boolean = false,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date()
    ) { }

    toString(): string {
        return `${this.fullName}, ${this.streetAddress}, ${this.city}, ${this.state ? this.state + ', ' : ''}${this.postalCode}, ${this.country}`;
    }
}
