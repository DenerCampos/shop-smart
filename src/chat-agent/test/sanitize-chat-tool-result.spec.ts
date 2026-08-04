import { sanitizeChatToolResult } from '../utils/sanitize-chat-tool-result';

describe('sanitizeChatToolResult', () => {
  it('remove password/token de user aninhado', () => {
    const result = sanitizeChatToolResult({
      id: 'exp-1',
      name: 'Mercado',
      user: {
        id: 'u1',
        name: 'Admin',
        password: 'hash-secreto',
        token: 'jwt',
        refreshtoken: 'rt',
        email: 'a@a.com',
      },
    });

    expect(result).toEqual({
      id: 'exp-1',
      name: 'Mercado',
      user: { id: 'u1', name: 'Admin' },
    });
  });

  it('remove chaves sensíveis no nível raiz', () => {
    const result = sanitizeChatToolResult({
      id: 'u1',
      name: 'Admin',
      email: 'a@a.com',
      password: 'hash',
      token: 't',
    });

    expect(result).toEqual({
      id: 'u1',
      name: 'Admin',
      email: 'a@a.com',
    });
  });

  it('remove uri/url/photos do payload', () => {
    const result = sanitizeChatToolResult({
      id: 'exp-1',
      name: 'Mercado',
      uri: 'https://storage.example/file.pdf',
      url: 'https://storage.example/page',
      photos: [{ id: 'p1' }],
      photoCount: 1,
    });

    expect(result).toEqual({
      id: 'exp-1',
      name: 'Mercado',
      photoCount: 1,
    });
  });
});
