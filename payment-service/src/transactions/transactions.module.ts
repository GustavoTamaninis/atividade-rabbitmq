import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  NOTIFICATION_CLIENT,
  NOTIFICATIONS_QUEUE,
} from './notification.constants';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

const rabbitmqUrl =
  process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NOTIFICATION_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl],
          queue: NOTIFICATIONS_QUEUE,
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
