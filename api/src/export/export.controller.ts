import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('animals/:animalId/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  async exportPdf(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
    @Res() res: Response,
  ) {
    const { filename, doc } = await this.exportService.buildHealthRecordPdf(
      user.sub,
      animalId,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
  }
}
