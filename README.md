# atividade-rabbitmq

Desafio 2 de **Desenvolvimento de Sistemas Distribuídos**: aplicação de pagamento da loja fictícia **CompreFácil** usando microsserviços.

São dois serviços independentes em NestJS que conversam de forma **assíncrona** pelo RabbitMQ:

- **payment-service**: recebe a solicitação de pagamento, salva no Postgres e confirma a transação
- **notification-service**: lê as mensagens da fila e notifica o usuário

Cada serviço roda sozinho e pode ser escalado separadamente, sem depender do outro estar no ar.

## Arquitetura

```mermaid
flowchart LR
    C[Cliente] -- "POST /transactions" --> P[payment-service<br/>porta 3001]
    P -- Prisma --> DB[(Postgres)]
    P -- "transaction.received<br/>transaction.confirmed" --> Q[[RabbitMQ<br/>fila notifications]]
    Q --> N[notification-service<br/>porta 3002]
    N -- "notificação (log)" --> U[Usuário]
```

## Fluxo de uma transação

| Passo | Serviço | O que acontece |
| --- | --- | --- |
| I | payment-service | Salva a transação com status `PENDING` |
| II | payment-service | Publica `transaction.received` na fila `notifications` |
| III | notification-service | Lê a mensagem e avisa o usuário que a solicitação foi recebida |
| IV | payment-service | Confirma a transação e muda o status para `SUCCESS` |
| V | payment-service | Publica `transaction.confirmed` na fila |
| VI | notification-service | Lê a mensagem e avisa o usuário que o pagamento foi confirmado |

A resposta do `POST /transactions` volta logo após o passo II. A confirmação (passos IV a VI) acontece em segundo plano.

## Tecnologias

- [NestJS](https://nestjs.com) com `@nestjs/microservices` (transporte RMQ)
- [RabbitMQ](https://www.rabbitmq.com) para a mensageria
- [PostgreSQL](https://www.postgresql.org) com [Prisma ORM](https://www.prisma.io)
- [Docker Compose](https://docs.docker.com/compose/) para subir o banco e o RabbitMQ

## Estrutura

```
.
├── docker-compose.yml          # Postgres + RabbitMQ
├── payment-service/
│   ├── prisma/                 # schema e migrations do banco
│   └── src/
│       ├── prisma/             # conexão com o banco
│       └── transactions/       # rotas, regras e publicação na fila
└── notification-service/
    └── src/
        └── notifications/      # consumidor da fila
```

## Como rodar

Pré-requisitos: **Node.js 22+** e **Docker**.

### 1. Subir o Postgres e o RabbitMQ

```bash
docker compose up -d
```

| Serviço | Endereço | Usuário / senha |
| --- | --- | --- |
| Postgres | `localhost:5433`, banco `payments` | `postgres` / `postgres` |
| RabbitMQ | `localhost:5672` | `guest` / `guest` |
| Painel do RabbitMQ | http://localhost:15672 | `guest` / `guest` |

### 2. notification-service

```bash
cd notification-service
cp .env.example .env
npm install
npm run start:dev
```

### 3. payment-service

Em outro terminal:

```bash
cd payment-service
cp .env.example .env
npm install                # também gera o client do Prisma
npx prisma migrate deploy  # cria as tabelas
npm run start:dev
```

## Variáveis de ambiente

| Variável | Serviço | Padrão |
| --- | --- | --- |
| `PORT` | payment-service | `3001` |
| `DATABASE_URL` | payment-service | `postgresql://postgres:postgres@localhost:5433/payments?schema=public` |
| `RABBITMQ_URL` | os dois | `amqp://guest:guest@localhost:5672` |
| `PORT` | notification-service | `3002` |

## API do payment-service

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/transactions` | Cria uma transação |
| `GET` | `/transactions` | Lista as transações |
| `GET` | `/transactions/:id` | Busca uma transação |

Corpo do `POST /transactions`:

```json
{
  "userId": "1",
  "userEmail": "cliente@email.com",
  "amount": 100
}
```

`userId`, `userEmail` e `amount` são obrigatórios, e `amount` precisa ser maior que zero.

## Testando o fluxo

Com tudo rodando:

```bash
curl -X POST http://localhost:3001/transactions \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","userEmail":"cliente@email.com","amount":100}'
```

1. A resposta traz a transação com status `PENDING`.
2. No terminal do notification-service aparecem as duas notificações:
   ```
   Notificação para cliente@email.com: recebemos sua solicitação de pagamento de R$ 100 (transação ...)
   Notificação para cliente@email.com: seu pagamento de R$ 100 foi confirmado (transação ...)
   ```
3. `GET http://localhost:3001/transactions` mostra a transação com status `SUCCESS`.
4. No painel do RabbitMQ (aba **Queues**) dá para ver a fila `notifications`.

## Banco de dados

Tabela `transactions` (definida em `payment-service/prisma/schema.prisma`):

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | UUID | Identificador da transação |
| `user_id` | texto | Usuário que fez o pagamento |
| `user_email` | texto | E-mail usado na notificação |
| `amount` | decimal(12,2) | Valor |
| `status` | `PENDING` / `SUCCESS` / `FAILED` | Situação da transação |
| `created_at` / `updated_at` | data e hora | Controle de criação e atualização |
