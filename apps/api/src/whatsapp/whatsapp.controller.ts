import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Get('webhook')
  verifyWebhook(@Query() query: any) {
    return this.whatsappService.verifyWebhook(query);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.whatsappService.processIncomingMessage(body);
  }

  @Post('send')
  async sendMessage(@Body() body: { to: string; message: string }) {
    return this.whatsappService.sendMessage(body.to, body.message);
  }
}
