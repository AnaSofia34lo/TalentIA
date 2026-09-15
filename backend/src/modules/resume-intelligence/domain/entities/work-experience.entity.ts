export type WorkExperienceProps = {
  id?: string;
  userId: string;
  company: string;
  role: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
};

export class WorkExperience {
  readonly id?: string;
  readonly userId: string;
  readonly company: string;
  readonly role: string;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly description: string | null;

  constructor(props: WorkExperienceProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.company = props.company.trim();
    this.role = props.role.trim();
    this.startDate = props.startDate?.trim() || null;
    this.endDate = props.endDate?.trim() || null;
    this.description = props.description?.trim() || null;
  }

  static fromExtracted(
    userId: string,
    item: {
      company?: string | null;
      role?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      description?: string | null;
    },
  ): WorkExperience | null {
    const company = item.company?.trim();
    const role = item.role?.trim();
    if (!company || !role) return null;
    return new WorkExperience({
      userId,
      company,
      role,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
    });
  }
}
