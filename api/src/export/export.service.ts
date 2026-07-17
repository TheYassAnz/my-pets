import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Animal, HealthEvent } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma.service';

const TYPE_LABELS: Record<HealthEvent['type'], string> = {
  VACCINE: 'Vaccin',
  TREATMENT: 'Traitement',
  VISIT: 'Visite',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async buildHealthRecordPdf(
    ownerId: string,
    animalId: string,
  ): Promise<{ filename: string; doc: PDFKit.PDFDocument }> {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: { healthEvents: { orderBy: { date: 'desc' } } },
    });
    if (!animal) {
      throw new NotFoundException('Animal introuvable');
    }
    if (animal.ownerId !== ownerId) {
      throw new ForbiddenException();
    }

    return {
      filename: `carnet-${animal.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      doc: this.renderPdf(animal, animal.healthEvents),
    };
  }

  private renderPdf(animal: Animal, events: HealthEvent[]): PDFKit.PDFDocument {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(`Carnet de santé — ${animal.name}`);
    doc.moveDown(0.3);
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#555555')
      .text(`Espèce : ${animal.species}`);
    if (animal.birthDate) {
      doc.text(`Né(e) le : ${formatDate(animal.birthDate)}`);
    }
    doc.text(`Document généré le ${formatDate(new Date())}`);
    doc.fillColor('#000000');
    doc.moveDown(1.5);

    if (events.length === 0) {
      doc.fontSize(12).text('Aucun événement de santé enregistré.');
      doc.end();
      return doc;
    }

    doc.fontSize(16).font('Helvetica-Bold').text('Historique des événements');
    doc.moveDown(0.8);

    for (const event of events) {
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(`${TYPE_LABELS[event.type]} — ${event.title}`);
      doc.fontSize(11).font('Helvetica').fillColor('#555555');
      doc.text(`Date : ${formatDate(event.date)}`);
      if (event.dosage) doc.text(`Dosage : ${event.dosage}`);
      if (event.vet) doc.text(`Vétérinaire : ${event.vet}`);
      if (event.nextDueDate) {
        doc.text(`Prochain rappel : ${formatDate(event.nextDueDate)}`);
      }
      if (event.notes) doc.text(`Notes : ${event.notes}`);
      doc.fillColor('#000000');
      doc.moveDown(0.8);
    }

    doc.end();
    return doc;
  }
}
