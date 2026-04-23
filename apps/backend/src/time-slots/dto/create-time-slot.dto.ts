import { IsString, IsInt, Matches, Min } from 'class-validator';

export class CreateTimeSlotDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'time must be in HH:MM format' })
  time: string;

  @IsInt()
  @Min(1)
  eventId: number;
}
