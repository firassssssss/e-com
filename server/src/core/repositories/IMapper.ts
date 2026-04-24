export interface IMapper<T, U> {
  toDomain(db: U): T;
  fromDomain?(domain: T): U;
}
