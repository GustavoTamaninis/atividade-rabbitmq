import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  TRANSACTION_RECEIVED_EVENT,
  TRANSACTION_CONFIRMED_EVENT
} from './notification.constants';

// Dados da transação enviados pelo payment-service
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
  // (por enquanto a notificação é só um log no console)
  @EventPattern(TRANSACTION_RECEIVED_EVENT)
  handleTransactionReceived(@Payload() transaction: TransactionMessage) {
    const { userEmail, amount, id } = transaction;

    this.logger.log(
      `Notificação para ${userEmail}: recebemos sua solicitação de pagamento de R$ ${amount} (transação ${id})`,
    );
  }

  // Passo VI: recebe a mensagem de confirmação da transação e notifica o usuário
  @EventPattern(TRANSACTION_CONFIRMED_EVENT)
  handleTransactionConfirmed(@Payload() transaction: TransactionMessage){
    const { userEmail, amount, id} = transaction;

    this.logger.log(
      `Notificação para ${userEmail}: seu pagamento de R$ ${amount} foi confirmado (transação ${id})`,
    )
  }
}
