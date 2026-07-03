import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.client = createClient<object>(
      this.config.getOrThrow('SUPABASE_URL'),
      this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucket =
      this.config.get('SUPABASE_ANIMAL_PHOTOS_BUCKET') ?? 'animal-photos';
  }

  async uploadAnimalPhoto(
    ownerId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
  ): Promise<string> {
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const path = `${ownerId}/${randomUUID()}.${ext}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      throw new Error(`Échec de l'upload de la photo : ${error.message}`);
    }

    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
