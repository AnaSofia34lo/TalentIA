export type VacancyProps = {
  id?: string;
  name: string;
  description: string;
  createdByUserId: string;
  organizationId: string;
  slug?: string;
  status?: string;
};

export class Vacancy {
  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly createdByUserId: string;
  readonly organizationId: string;
  readonly slug?: string;
  readonly status?: string;

  constructor(props: VacancyProps) {
    const name = props.name.trim();
    const description = props.description.trim();

    if (name.length < 3) {
      throw new Error('El nombre de la vacante debe tener al menos 3 caracteres.');
    }
    if (description.length < 20) {
      throw new Error(
        'La descripción de la vacante debe tener al menos 20 caracteres.',
      );
    }

    this.id = props.id;
    this.name = name;
    this.description = description;
    this.createdByUserId = props.createdByUserId;
    this.organizationId = props.organizationId;
    this.slug = props.slug;
    this.status = props.status;
  }
}
