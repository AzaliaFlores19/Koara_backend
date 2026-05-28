import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class PasswordResetMailService {
  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(email: string, resetLink: string) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const from =
      this.configService.get<string>('MAIL_FROM') ??
      (user ? `Koara <${user}>` : 'Koara <no-reply@koara.com>');

    if (!host) {
      console.log(`Password reset link for ${email}: ${resetLink}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'Recuperacion de contrasena - Koara',
      text: `Para restablecer tu contrasena, abre este enlace: ${resetLink}`,
      html: `
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer tu contrasena en Koara.</p>
        <p><a href="${resetLink}">Restablecer contrasena</a></p>
        <p>Este enlace vence en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      `,
    });
  }
}
