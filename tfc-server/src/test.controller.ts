import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  test() {
    return { message: 'Test endpoint works' };
  }

  @Get('available-users')
  availableUsers() {
    return { message: 'Available users endpoint works' };
  }
}
