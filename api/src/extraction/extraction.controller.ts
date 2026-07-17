import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtractionService } from './extraction.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

@Controller('animals/:animalId/extractions')
@UseGuards(JwtAuthGuard)
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_SIZE } }),
  )
  extract(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image requise');
    }
    return this.extractionService.extractFromImage(user.sub, animalId, file);
  }
}
