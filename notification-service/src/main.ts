import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { NOTIFICATIONS_QUEUE } from './notifications/notification.constants';

const rabbitmqUrl =
  process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Conecta no RabbitMQ para consumir a fila de notificações
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: NOTIFICATIONS_QUEUE,
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
}
void bootstrap();
