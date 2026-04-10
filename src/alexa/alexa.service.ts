import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { ShoppingListService } from 'src/shopping-list/shopping-list.service';
import { AlexaIntentRequestDto } from './dto/alexa-intent-request.dto';
import { jwtConstants } from 'src/auth/constants';

export interface AlexaResponse {
  version: string;
  response: {
    outputSpeech: { type: string; text: string };
    shouldEndSession: boolean;
  };
}

@Injectable()
export class AlexaService {
  constructor(
    private readonly shoppingListService: ShoppingListService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async handleIntent(dto: AlexaIntentRequestDto): Promise<AlexaResponse> {
    const user = await this.resolveUser(dto);

    if (dto.request.type !== 'IntentRequest' || !dto.request.intent) {
      return this.buildResponse('Desculpe, não entendi o comando.');
    }

    const { name, slots } = dto.request.intent;

    switch (name) {
      case 'AddItemIntent':
        return this.handleAddItem(user, slots ?? {});
      case 'RemoveItemIntent':
        return this.handleRemoveItem(user, slots ?? {});
      case 'ListItemsIntent':
        return this.handleListItems(user);
      default:
        return this.buildResponse('Comando não reconhecido.');
    }
  }

  private async resolveUser(dto: AlexaIntentRequestDto): Promise<User> {
    const token =
      dto.session?.user?.accessToken ?? dto.context?.System?.user?.accessToken;

    if (!token) {
      throw new UnauthorizedException('accessToken não encontrado no payload');
    }

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
    } catch {
      throw new UnauthorizedException('accessToken inválido ou expirado');
    }

    const user = await this.userService.find(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }

  private async handleAddItem(
    user: User,
    slots: Record<string, { value?: string }>,
  ): Promise<AlexaResponse> {
    const item = slots['item']?.value;

    if (!item) {
      return this.buildResponse('Qual item você quer adicionar?');
    }

    const quantidade = slots['quantidade']?.value;
    const listaNome = slots['lista']?.value?.trim().toLowerCase();
    const text = quantidade ? `${quantidade} ${item}` : item;

    try {
      const activeLists = await this.shoppingListService.getActiveLists(user);

      if (activeLists.length === 0) {
        await this.shoppingListService.addItemFromAlexa(user, text);
        const msg = quantidade
          ? `Adicionado! ${quantidade} ${item} na sua lista.`
          : `${item} adicionado na sua lista.`;
        return this.buildResponse(msg);
      }

      if (listaNome) {
        const targetList = activeLists.find((l) =>
          l.name.toLowerCase().includes(listaNome),
        );

        if (!targetList) {
          const nomes = activeLists.map((l) => l.name).join(', ');
          return this.buildResponse(
            `Não encontrei a lista "${slots['lista']?.value}". Suas listas são: ${nomes}.`,
          );
        }

        await this.shoppingListService.addItemFromAlexaToList(
          user,
          targetList.id,
          text,
        );

        const msg = quantidade
          ? `Adicionado! ${quantidade} ${item} na lista ${targetList.name}.`
          : `${item} adicionado na lista ${targetList.name}.`;

        return this.buildResponse(msg);
      }

      if (activeLists.length === 1) {
        await this.shoppingListService.addItemFromAlexaToList(
          user,
          activeLists[0].id,
          text,
        );

        const msg = quantidade
          ? `Adicionado! ${quantidade} ${item} na lista ${activeLists[0].name}.`
          : `${item} adicionado na lista ${activeLists[0].name}.`;

        return this.buildResponse(msg);
      }

      const nomes = activeLists.map((l) => l.name).join(', ');
      return this.buildResponse(
        `Você tem ${activeLists.length} listas: ${nomes}. Em qual delas devo adicionar ${item}?`,
      );
    } catch {
      return this.buildResponse(
        `Não consegui adicionar ${item} na sua lista. Tente novamente.`,
      );
    }
  }

  private async handleRemoveItem(
    user: User,
    slots: Record<string, { value?: string }>,
  ): Promise<AlexaResponse> {
    const item = slots['item']?.value;

    if (!item) {
      return this.buildResponse('Qual item você quer remover?');
    }

    const listaNome = slots['lista']?.value?.trim().toLowerCase();

    try {
      const activeLists = await this.shoppingListService.getActiveLists(user);

      if (activeLists.length === 0) {
        return this.buildResponse('Você não tem nenhuma lista ativa.');
      }

      if (listaNome) {
        const targetList = activeLists.find((l) =>
          l.name.toLowerCase().includes(listaNome),
        );

        if (!targetList) {
          const nomes = activeLists.map((l) => l.name).join(', ');
          return this.buildResponse(
            `Não encontrei a lista "${slots['lista']?.value}". Suas listas são: ${nomes}.`,
          );
        }

        const removed =
          await this.shoppingListService.removeItemByNameFromList(
            user,
            targetList.id,
            item,
          );

        if (!removed) {
          return this.buildResponse(
            `Não encontrei ${item} na lista ${targetList.name}.`,
          );
        }

        return this.buildResponse(
          `${item} removido da lista ${targetList.name}.`,
        );
      }

      if (activeLists.length === 1) {
        const removed =
          await this.shoppingListService.removeItemByNameFromList(
            user,
            activeLists[0].id,
            item,
          );

        if (!removed) {
          return this.buildResponse(`Não encontrei ${item} na sua lista.`);
        }

        return this.buildResponse(`${item} removido da sua lista.`);
      }

      const nomes = activeLists.map((l) => l.name).join(', ');
      return this.buildResponse(
        `Você tem ${activeLists.length} listas: ${nomes}. De qual delas devo remover ${item}?`,
      );
    } catch {
      return this.buildResponse(
        `Não consegui remover ${item} da sua lista. Tente novamente.`,
      );
    }
  }

  private async handleListItems(user: User): Promise<AlexaResponse> {
    try {
      const items = await this.shoppingListService.getActiveListItems(user);

      if (!items || items.length === 0) {
        return this.buildResponse('Sua lista de compras está vazia.');
      }

      const pending = items.filter((i) => i.status === 'pending');

      if (pending.length === 0) {
        return this.buildResponse('Todos os itens já estão no carrinho.');
      }

      const names = pending.map((i) =>
        i.quantity > 1 ? `${i.quantity} ${i.name}` : i.name,
      );

      const list =
        names.length === 1
          ? names[0]
          : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;

      return this.buildResponse(`Sua lista tem: ${list}.`);
    } catch {
      return this.buildResponse(
        'Não consegui ler sua lista agora. Tente novamente.',
      );
    }
  }

  private buildResponse(text: string): AlexaResponse {
    return {
      version: '1.0',
      response: {
        outputSpeech: { type: 'PlainText', text },
        shouldEndSession: true,
      },
    };
  }
}
