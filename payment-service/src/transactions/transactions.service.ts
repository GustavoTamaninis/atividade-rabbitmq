import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Passo I do fluxo: salva a transação com status PENDING.
  // TODO: publicar mensagem no RabbitMQ (passo II) e depois confirmar (passos IV e V).
  async create(dto: CreateTransactionDto) {
    if (!dto?.userId || !dto?.userEmail || !(Number(dto.amount) > 0)) {
      throw new BadRequestException(
        'Informe userId, userEmail e amount (maior que zero)',
      );
    }

    return this.prisma.transaction.create({
      data: {
        userId: dto.userId,
        userEmail: dto.userEmail,
        amount: dto.amount,
      },
    });
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
