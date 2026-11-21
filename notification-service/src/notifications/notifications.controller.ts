import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

interface TransactionMessage {
  id: string;
  userEmail: string;
  amount: string;
  status: string;
}

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  // Passo III: lê a mensagem da fila e notifica o usuário
  // (por enquanto a "notificação" é um log no console)
  @EventPattern('transaction.received')
  handleTransactionReceived(@Payload() transaction: TransactionMessage) {
    this.logger.log(
      `Notificação para ${transaction.userEmail}: recebemos sua solicitação de pagamento de R$ ${transaction.amount} (transação ${transaction.id})`,
    );
  }
}
