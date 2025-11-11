import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default function initSwagger(app) {
  const config = new DocumentBuilder()
    .setTitle('Ute Shop Service')
    .setDescription('The Ute Shop Service API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Ute shop')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('ute-shop/swagger-api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      maxBodyLength: Infinity,
      securityDefinitions: {
        bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  });
}
