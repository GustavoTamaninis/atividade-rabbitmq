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

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  async create(dto: CreateTransactionDto) {
    if (!dto?.userId || !dto?.userEmail || !(Number(dto.amount) > 0)) {
      throw new BadRequestException(
        'Informe userId, userEmail e amount (maior que zero)',
      );
    }

    // Passo I: salva a transação com status PENDING
    const transaction = await this.prisma.transaction.create({
      data: {
        userId: dto.userId,
        userEmail: dto.userEmail,
        amount: dto.amount,
      },
    });

    // Passo II: avisa o notification-service que a solicitação foi recebida
    this.notificationClient.emit('transaction.received', transaction);

    // Passo IV: confirma em segundo plano, sem segurar a resposta da requisição
    void this.confirm(transaction.id);

    return transaction;
  }

  // Passo IV: atualiza o status para SUCCESS
  // TODO: passo V (publicar 'transaction.confirmed')
  private async confirm(id: string) {
    try {
      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: { status: 'SUCCESS' },
      });
      this.logger.log(`Transação ${transaction.id} confirmada`);
    } catch (error) {
      this.logger.error(`Erro ao confirmar a transação ${id}`, error);
    }
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
}
