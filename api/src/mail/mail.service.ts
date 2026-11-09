import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = this.config.getOrThrow<string>('EMAIL_FROM');
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Réinitialisation de votre mot de passe my-pets',
      text: `Votre code de réinitialisation est : ${code}\n\nCe code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    });

    // Le SDK Resend renvoie { error } au lieu de throw : sans ce check, un envoi
    // qui échoue silencieusement laisse croire à l'utilisateur qu'un email est parti
    if (error) {
      this.logger.error(`Échec envoi email reset password: ${error.message}`);
      throw new InternalServerErrorException("Échec de l'envoi de l'email");
    }
  }

  async sendReminderDigest(email: string, lines: string[]): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Rappels santé my-pets',
      text: lines.join('\n'),
    });
    if (error) {
      this.logger.error(`Échec envoi email de rappel: ${error.message}`);
      throw new InternalServerErrorException("Échec de l'envoi de l'email");
    }
  }
}
