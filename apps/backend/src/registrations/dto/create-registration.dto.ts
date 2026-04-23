import { IsString, IsInt, IsDateString, MinLength, MaxLength, Min, Max } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  groupName: string;

  @IsInt()
  @Min(1)
  @Max(500)
  participantCount: number;

  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  timeSlotId: number;
}
