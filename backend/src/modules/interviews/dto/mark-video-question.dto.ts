import { IsInt, IsUUID, Min } from 'class-validator';

export class MarkVideoQuestionDto {
  @IsUUID()
  questionId: string;

  @IsInt()
  @Min(0)
  timestampMs: number;
}
