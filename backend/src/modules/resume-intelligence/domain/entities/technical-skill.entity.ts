export type TechnicalSkillProps = {
  id?: string;
  userId: string;
  name: string;
  estimatedProficiency: number;
};

export class TechnicalSkill {
  readonly id?: string;
  readonly userId: string;
  readonly name: string;
  readonly estimatedProficiency: number;

  constructor(props: TechnicalSkillProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name.trim();
    this.estimatedProficiency = Math.min(
      100,
      Math.max(0, Math.round(props.estimatedProficiency)),
    );
  }

  static fromExtracted(
    userId: string,
    item: { name?: string | null; estimatedProficiency?: number | null },
  ): TechnicalSkill | null {
    const name = item.name?.trim();
    if (!name) return null;
    const proficiency =
      typeof item.estimatedProficiency === 'number'
        ? item.estimatedProficiency
        : 60;
    return new TechnicalSkill({
      userId,
      name,
      estimatedProficiency: proficiency,
    });
  }
}
