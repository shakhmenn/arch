import { IsInt, IsPositive } from 'class-validator';

export class TransferMemberDto {
  @IsInt()
  @IsPositive()
  userId: number;

  @IsInt()
  @IsPositive()
  fromTeamId: number;

  @IsInt()
  @IsPositive()
  toTeamId: number;
}
