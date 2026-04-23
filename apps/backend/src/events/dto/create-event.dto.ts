import { IsString, IsInt, IsOptional, MinLength, MaxLength, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  villageId: number;
}
