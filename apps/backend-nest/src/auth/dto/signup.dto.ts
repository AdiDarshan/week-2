import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { normalizeEmail } from '../../users/email.utils';

export class SignupDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeEmail(value) : value,
  )
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 30)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;
}
