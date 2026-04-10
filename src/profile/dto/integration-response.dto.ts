export class IntegrationItemDto {
  connected: boolean;
  linkedAt?: Date;
}

export type IntegrationsResponseDto = Record<string, IntegrationItemDto>;
