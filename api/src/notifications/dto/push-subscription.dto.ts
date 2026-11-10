import { Type } from 'class-transformer';
import {
  IsDefined,
  IsString,
  MaxLength,
  MinLength,
  ValidateBy,
  ValidateNested,
} from 'class-validator';

const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
];

// Anti-SSRF : le serveur POSTera vers cet endpoint, on n'accepte donc que
// https et les hôtes (ou sous-domaines) des services push connus.
// Comparaison sur le hostname analysé, jamais sur une sous-chaîne de l'URL.
export function isAllowedPushEndpoint(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
  );
}

const IsPushEndpoint = () =>
  ValidateBy({
    name: 'isPushEndpoint',
    validator: {
      validate: isAllowedPushEndpoint,
      defaultMessage: () => 'endpoint doit être un service push https connu',
    },
  });

class PushKeysDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  p256dh: string;

  @IsString()
  @MinLength(1)
  @MaxLength(256)
  auth: string;
}

export class PushSubscriptionDto {
  @IsPushEndpoint()
  @MaxLength(2048)
  endpoint: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys: PushKeysDto;
}

export class RemoveSubscriptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  endpoint: string;
}
