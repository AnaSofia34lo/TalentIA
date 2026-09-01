import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async validateUser(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, passwordHash);

    if (!email || !isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      id: 'demo-user-id',
      email,
      role: 'admin',
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
