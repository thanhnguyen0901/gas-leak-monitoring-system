import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ cors: { origin: (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',') } })
export class MonitorGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  handleConnection(client: Socket) {
    if (process.env.APP_TOKEN && client.handshake.auth.token !== process.env.APP_TOKEN) client.disconnect(true);
  }
  emit(event: string, value: unknown) { this.server?.emit(event, value); }
}
