import { Controller, Get } from '@nestjs/common';

@Controller('')
export class AppController {
  @Get('robots.txt')
  public robotsTxt(): string {
    return 'User-agent: *\nDisallow: /\n';
  }
}
