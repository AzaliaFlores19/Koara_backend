import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [   
      'http://localhost:3000', 
      'http://localhost:3001',  
      process.env.FRONTEND_URL, 
    ].filter(Boolean) as string[],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,           
    allowedHeaders: 'Content-Type, Accept, Authorization', 
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Koara Skincare API')
      .setDescription(
        'Documentación oficial de la API de Koara (Facturación y Catálogo)',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
   
    if (document.paths) {
      Object.keys(document.paths).forEach((path) => {
        const methods = document.paths[path];
        Object.keys(methods).forEach((method) => {
          if (!methods[method].responses) {
            methods[method].responses = {};
          }
          methods[method].responses['500'] = {
            description: 'Error interno del servidor. Ocurrió un error inesperado al procesar la solicitud.',
          };
        });
      });
    }

    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();