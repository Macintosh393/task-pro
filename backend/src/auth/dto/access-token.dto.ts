import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNzAyMTE5Zi0yMDQ1LTRmNTQtOTgwNS1mZWVhOTVlZjUwOWQifQ.7Yk1p2XWZ5aQ0m3nDq8sJgHt4vFbLcRuNxKyEwPzTaI',
  })
  accessToken: string;
}
