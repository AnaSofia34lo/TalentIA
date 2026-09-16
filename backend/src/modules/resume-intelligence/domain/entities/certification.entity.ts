export type CertificationProps = {
  id?: string;
  userId: string;
  name: string;
  issuer?: string | null;
  date?: string | null;
};

export class Certification {
  readonly id?: string;
  readonly userId: string;
  readonly name: string;
  readonly issuer: string | null;
  readonly date: string | null;

  constructor(props: CertificationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name.trim();
    this.issuer = props.issuer?.trim() || null;
    this.date = props.date?.trim() || null;
  }

  static fromExtracted(
    userId: string,
    item: { name?: string | null; issuer?: string | null; date?: string | null },
  ): Certification | null {
    const name = item.name?.trim();
    if (!name) return null;
    return new Certification({
      userId,
      name,
      issuer: item.issuer,
      date: item.date,
    });
  }
}
