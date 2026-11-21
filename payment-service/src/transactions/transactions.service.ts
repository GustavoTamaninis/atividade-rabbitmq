import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  NOTIFICATION_CLIENT,
  TRANSACTION_RECEIVED_EVENT,
} from './notification.constants';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,
  ) {}

  async create(dto: CreateTransactionDto) {
    this.validate(dto);

    // Passo I: salva a transação com status PENDING
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: dto.userId,
        userEmail: dto.userEmail,
        amount: dto.amount,
      },
    });

    // Passo II: avisa o notification-service que a solicitação foi recebida
    this.notificationClient.emit(TRANSACTION_RECEIVED_EVENT, transaction);

    // Passo IV: confirma em segundo plano, sem esperar para responder
    void this.confirm(transaction.id);

    return transaction;
  }

  findAll() {
    return this.prisma.transaction.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return transaction;
  }

  private validate(dto: CreateTransactionDto) {
    const hasUser = Boolean(dto?.userId && dto?.userEmail);
    const hasValidAmount = Number(dto?.amount) > 0;

    if (!hasUser || !hasValidAmount) {
      throw new BadRequestException(
        'Informe userId, userEmail e amount (maior que zero)',
      );
    }
  }

  // Passo IV: atualiza o status da transação para SUCCESS
  // TODO: passo V (publicar 'transaction.confirmed')
  private async confirm(id: string) {
    try {
      await this.prisma.transaction.update({
        where: { id },
        data: { status: 'SUCCESS' },
      });
      this.logger.log(`Transação ${id} confirmada`);
    } catch (error) {
      this.logger.error(`Erro ao confirmar a transação ${id}`, error);
    }
  }
}
