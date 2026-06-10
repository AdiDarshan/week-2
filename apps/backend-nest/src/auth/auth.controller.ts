import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import type { LoginResponse } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: SignupDto): Promise<LoginResponse> {
    return this.authService.signup(body.email, body.password, body.name);
  }

  @Post('login')
  login(@Body() body: LoginDto): Promise<LoginResponse> {
    return this.authService.login(body.email, body.password);
  }
}
