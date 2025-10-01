import { IsInt, IsPositive } from 'class-validator';

export class RemoveMemberDto {
  @IsInt()
  @IsPositive()
  userId: number;
}
