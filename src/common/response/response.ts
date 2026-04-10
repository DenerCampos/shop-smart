import { Injectable } from '@nestjs/common';
import {
  ClassConstructor,
  instanceToPlain,
  plainToClass,
} from 'class-transformer';
import { paginationData } from '../pagination/pagination';

@Injectable()
export class ResponseService {
  /**
   * Mapeia uma entidade para um DTO
   */
  mapToDto<TEntity, TDto>(
    dtoClass: ClassConstructor<TDto>,
    entity: TEntity,
  ): TDto {
    const plain =
      entity !== null &&
      entity !== undefined &&
      typeof entity === 'object' &&
      entity.constructor?.name !== 'Object'
        ? instanceToPlain(entity)
        : (entity as Record<string, unknown>);
    return plainToClass(dtoClass, plain, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Mapeia um array de entidades para um array de DTOs
   */
  mapArrayToDto<TEntity, TDto>(
    dtoClass: ClassConstructor<TDto>,
    entities: TEntity[],
  ): TDto[] {
    return entities.map((entity) => this.mapToDto(dtoClass, entity));
  }

  /**
   * Mapeia resultado paginado de entidades para DTOs
   */
  mapPaginatedToDto<TEntity, TDto>(
    dtoClass: ClassConstructor<TDto>,
    paginatedResult: paginationData<TEntity>,
  ): paginationData<TDto> {
    return {
      data: this.mapArrayToDto(dtoClass, paginatedResult.data),
      meta: paginatedResult.meta,
      links: paginatedResult.links,
    };
  }

  /**
   * Mapeia entidade opcional (pode ser null/undefined)
   */
  mapOptionalToDto<TEntity, TDto>(
    dtoClass: ClassConstructor<TDto>,
    entity: TEntity | null | undefined,
  ): TDto | null {
    if (!entity) {
      return null;
    }
    return this.mapToDto(dtoClass, entity);
  }

  /**
   * Resposta de sucesso simples
   */
  success<TDto>(data: TDto): { success: true; data: TDto } {
    return {
      success: true,
      data,
    };
  }

  /**
   * Resposta de sucesso com mapeamento
   */
  successWithMapping<TEntity, TDto>(
    dtoClass: ClassConstructor<TDto>,
    entity: TEntity,
  ): { success: true; data: TDto } {
    return {
      success: true,
      data: this.mapToDto(dtoClass, entity),
    };
  }

  /**
   * Resposta de sucesso paginada com mapeamento
   */
  successPaginatedWithMapping<TEntity, TDto>(
    dtoClass: ClassConstructor<TDto>,
    paginatedResult: paginationData<TEntity>,
  ): { success: true; data: paginationData<TDto> } {
    return {
      success: true,
      data: this.mapPaginatedToDto(dtoClass, paginatedResult),
    };
  }
}
