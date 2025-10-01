import { IsNumber } from 'class-validator';

export class AssignUserDto {
  @IsNumber()
  userId: number;
}
