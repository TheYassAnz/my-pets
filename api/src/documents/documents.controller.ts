import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('animalId') animalId?: string,
    @Query('category') category?: string,
  ) {
    return this.documentsService.findAll(user.sub, animalId, category);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { title: string; category?: string; fileUrl?: string; fileSize?: string; animalId?: string },
  ) {
    return this.documentsService.create(user.sub, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.documentsService.remove(user.sub, id);
  }
}
