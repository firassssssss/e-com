export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly body: string,
    public readonly data: Record<string, any>,
    public readonly read: boolean,
    public readonly createdAt: Date,
  ) {}
}
