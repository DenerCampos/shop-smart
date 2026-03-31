import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ForbiddenException, forwardRef, Inject, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/constants';
import { UserService } from 'src/user/user.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { ShoppingListService } from './shopping-list.service';
import { NotExistException } from 'src/exception/notExistException';

const shoppingListSocketCors = () => {
  const appConfig = new AppConfig();
  return {
    origin: appConfig.getCorsOrigins(),
    credentials: true,
  };
};

@WebSocketGateway({
  namespace: '/shopping-list',
  cors: shoppingListSocketCors(),
})
export class ShoppingListGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ShoppingListGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ShoppingListService))
    private readonly shoppingListService: ShoppingListService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      const user = await this.userService.find(payload.sub);

      if (!user) {
        this.logger.warn(`Client ${client.id} rejected: user not found`);
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.data.userName = user.name;

      this.logger.log(`Client connected: ${user.name} (${client.id})`);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinList')
  async handleJoinList(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { listId: string },
  ): Promise<void> {
    if (!data?.listId) {
      client.emit('join_error', { message: 'listId é obrigatório.' });
      return;
    }

    const user = await this.userService.find(client.data.userId);

    if (!user) {
      client.emit('join_error', { message: 'Usuário inválido.' });
      return;
    }

    try {
      await this.shoppingListService.ensureCanAccessList(data.listId, user);
    } catch (err) {
      if (
        err instanceof NotExistException ||
        err instanceof ForbiddenException
      ) {
        client.emit('join_error', {
          message: 'Lista não encontrada ou acesso negado.',
        });
        return;
      }
      throw err;
    }

    const room = `list_${data.listId}`;
    await client.join(room);

    this.logger.log(`${client.data.userName} joined room ${room}`);

    client.to(room).emit('user_joined', {
      userId: client.data.userId,
      userName: client.data.userName,
    });
  }

  @SubscribeMessage('leaveList')
  async handleLeaveList(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { listId: string },
  ): Promise<void> {
    if (!data?.listId) {
      return;
    }

    const room = `list_${data.listId}`;
    await client.leave(room);

    this.logger.log(`${client.data.userName} left room ${room}`);

    client.to(room).emit('user_left', {
      userId: client.data.userId,
      userName: client.data.userName,
    });
  }

  emitToList(listId: string, event: string, payload: unknown): void {
    const room = `list_${listId}`;
    this.server.to(room).emit(event, payload);
  }
}
