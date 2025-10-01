import { IsNumber, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNumber()
  taskId: number;

  @IsString()
  @MinLength(1)
  body: string;
}
