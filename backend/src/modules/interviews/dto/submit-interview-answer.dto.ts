import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SubmitInterviewAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  responseText?: string;
}
