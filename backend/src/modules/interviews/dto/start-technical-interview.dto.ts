import { IsUUID } from 'class-validator';

export class StartTechnicalInterviewDto {
  @IsUUID()
  vacancyId: string;
}
