import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Комментарий не может быть длиннее 2000 символов' })
  body: string;
}