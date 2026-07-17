import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma.service';

const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export type ExtractedHealthEvent = {
  type: 'VACCINE' | 'TREATMENT' | 'VISIT' | null;
  title: string | null;
  date: string | null;
  dosage: string | null;
  vet: string | null;
  notes: string | null;
  nextDueDate: string | null;
};

// Schéma JSON imposé au modèle (structured outputs) — tous les champs sont
// nullables : un document illisible ne doit pas produire de valeurs inventées
const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: ['string', 'null'],
      enum: ['VACCINE', 'TREATMENT', 'VISIT', null],
      description: "Type d'événement de santé identifié sur le document",
    },
    title: {
      type: ['string', 'null'],
      description: 'Nom du vaccin, du produit ou motif de la visite',
    },
    date: {
      type: ['string', 'null'],
      description: "Date de l'acte au format AAAA-MM-JJ",
    },
    dosage: { type: ['string', 'null'], description: 'Dosage ou posologie' },
    vet: {
      type: ['string', 'null'],
      description: 'Nom du vétérinaire ou de la clinique',
    },
    notes: {
      type: ['string', 'null'],
      description: 'Autres informations utiles (numéro de lot, remarques...)',
    },
    nextDueDate: {
      type: ['string', 'null'],
      description: 'Date du prochain rappel au format AAAA-MM-JJ',
    },
  },
  required: ['type', 'title', 'date', 'dosage', 'vet', 'notes', 'nextDueDate'],
  additionalProperties: false,
} as const;

@Injectable()
export class ExtractionService {
  // Fonctionnalité désactivable : sans ANTHROPIC_API_KEY, l'API démarre
  // normalement et l'endpoint répond 503 — remettre la clé la réactive
  private readonly client: Anthropic | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async extractFromImage(
    ownerId: string,
    animalId: string,
    file: { buffer: Buffer; mimetype: string },
  ): Promise<ExtractedHealthEvent> {
    const client = this.client;
    if (!client) {
      throw new ServiceUnavailableException(
        'Extraction IA momentanément indisponible',
      );
    }
    await this.assertAnimalOwned(ownerId, animalId);

    if (!SUPPORTED_MIME_TYPES.includes(file.mimetype as SupportedMimeType)) {
      throw new BadRequestException(
        'Format non supporté (JPEG, PNG, WebP ou GIF attendu)',
      );
    }

    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: [
        "Tu extrais les informations d'un document de santé animale",
        '(ordonnance, carnet de santé, facture vétérinaire) photographié.',
        "Renseigne uniquement ce qui est lisible sur l'image : ne devine",
        'jamais une valeur absente, laisse-la à null. Les dates sont au',
        `format AAAA-MM-JJ. Nous sommes le ${new Date().toISOString().slice(0, 10)}.`,
      ].join(' '),
      output_config: {
        format: { type: 'json_schema', schema: EXTRACTION_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: file.mimetype as SupportedMimeType,
                data: file.buffer.toString('base64'),
              },
            },
            {
              type: 'text',
              text: "Extrais l'événement de santé principal de ce document.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      throw new BadRequestException("Ce document n'a pas pu être analysé");
    }

    const text = response.content.find((block) => block.type === 'text');
    if (!text) {
      throw new BadRequestException("Aucune information extraite de l'image");
    }
    return JSON.parse(text.text) as ExtractedHealthEvent;
  }

  // Même règle que pour les événements santé : ne rien révéler si l'animal
  // n'appartient pas à l'utilisateur
  private async assertAnimalOwned(ownerId: string, animalId: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
    });
    if (!animal) {
      throw new NotFoundException('Animal introuvable');
    }
    if (animal.ownerId !== ownerId) {
      throw new ForbiddenException();
    }
  }
}
