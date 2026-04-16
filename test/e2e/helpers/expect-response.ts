/** Resposta típica do ValidationPipe (array de mensagens ou objeto message). */
export function expectClientError(res: { status: number; body: unknown }): void {
  expect(res.status).toBeGreaterThanOrEqual(400);
  expect(res.status).toBeLessThan(500);
}

export function expectPaginatedEnvelope(body: unknown): void {
  expect(body).toEqual(
    expect.objectContaining({
      data: expect.any(Array),
      meta: expect.objectContaining({
        itemCount: expect.any(Number),
        totalItems: expect.any(Number),
        itemsPerPage: expect.any(Number),
        totalPages: expect.any(Number),
        currentPage: expect.any(Number),
      }),
      links: expect.objectContaining({
        first: expect.any(String),
        last: expect.any(String),
      }),
    }),
  );
}
