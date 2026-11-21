# atividade-rabbitmq

Desafio 2 - Sistemas Distribuídos: serviço de pagamento e serviço de notificação (NestJS) se comunicando de forma assíncrona via RabbitMQ, com Postgres + Prisma.

## Subir a infraestrutura

```bash
docker compose up -d
```

- RabbitMQ: `localhost:5672` (painel em http://localhost:15672, guest/guest)
- Postgres: `localhost:5433` (postgres/postgres, banco `payments`)

## payment-service

```bash
cd payment-service
cp .env.example .env
npm install            # já roda o prisma generate
npx prisma migrate deploy
npm run start:dev
```

Endpoints (porta 3001):

- `POST /transactions` com `{ "userId": "1", "userEmail": "a@a.com", "amount": 100 }` cria a transação com status `PENDING`
- `GET /transactions` lista
- `GET /transactions/:id` busca uma

## Status do fluxo

- [x] I. salvar transação com status pendente
- [ ] II. publicar mensagem de "solicitação recebida" na fila
- [ ] III. notification-service consumir e notificar
- [ ] IV. confirmar a transação (status SUCCESS)
- [ ] V. publicar mensagem de "transação confirmada"
- [ ] VI. notification-service consumir e notificar
