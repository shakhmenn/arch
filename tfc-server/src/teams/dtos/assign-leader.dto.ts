import { IsInt, IsPositive } from 'class-validator';

export class AssignLeaderDto {
  @IsInt()
  @IsPositive()
  leaderId: number;
}
