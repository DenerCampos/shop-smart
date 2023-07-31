import { Injectable } from '@nestjs/common';

export type paginationMeta = {
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

export type paginationLinks = {
  first: string;
  previous: string | null;
  next: string | null;
  last: string;
};

export type paginationData<Model> = {
  data: Model[];
  meta: paginationMeta;
  links: paginationLinks;
};

@Injectable()
export class Pagination {
  private createMeta(
    dataLength: number,
    totalItems: number,
    limit: number,
    page: number,
  ): paginationMeta {
    return {
      itemCount: dataLength,
      totalItems,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };
  }

  private createLinks(
    limit: number,
    page: number,
    totalPages: number,
    baseUrl: string,
  ): paginationLinks {
    return {
      first: `${baseUrl}?limit=${limit}`,
      previous: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null,
      next:
        page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null,
      last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
    };
  }

  paginateData<Model>(
    queryResults: Model[],
    page: number,
    limit: number,
    totalItems: number,
    baseUrl: string,
  ): paginationData<Model> {
    const meta = this.createMeta(queryResults.length, totalItems, limit, page);

    const links = this.createLinks(limit, page, meta.totalPages, baseUrl);

    return {
      data: queryResults,
      meta,
      links,
    };
  }

  getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
