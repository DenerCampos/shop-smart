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

export type paginationData = {
  baseUrl: string;
  dataLength: number;
  totalItems: number;
  limit: number;
  page: number;
};

@Injectable()
export class Paginations {
  private meta: paginationMeta;
  private baseUrl: string;
  private links: paginationLinks;

  constructor({
    baseUrl,
    dataLength,
    totalItems,
    limit,
    page,
  }: paginationData) {
    this.baseUrl = baseUrl;
    this.meta = this.createMeta(dataLength, totalItems, limit, page);
    this.links = this.createLinks(limit, page);
  }

  private createMeta(dataLength, totalItems, limit, page): paginationMeta {
    return {
      itemCount: dataLength,
      totalItems,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    };
  }

  private createLinks(limit, page): paginationLinks {
    return {
      first: `${this.baseUrl}?limit=${limit}`,
      previous:
        page > 1 ? `${this.baseUrl}?page=${page - 1}&limit=${limit}` : null,
      next:
        page < this.meta.totalPages
          ? `${this.baseUrl}?page=${page + 1}&limit=${limit}`
          : null,
      last: `${this.baseUrl}?page=${this.meta.totalPages}&limit=${limit}`,
    };
  }

  getMeta() {
    return this.meta;
  }

  getLinks() {
    return this.links;
  }
}
