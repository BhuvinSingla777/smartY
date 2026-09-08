import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      status: 'ok',
      message: 'BDG PODs Dashboard API is running',
    };
  }
}
