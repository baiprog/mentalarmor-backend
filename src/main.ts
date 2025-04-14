import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'https://mentalarmor-miniapp.onrender.com',
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(3000);
}
bootstrap();

