type LogResultsData<T extends readonly string[], U = any> = {
  [K in T[number]]: U | null;
};

// Função helper para logar resultados
export const logResultsPromises = <T extends readonly string[], U = any>(
  results: PromiseSettledResult<U>[],
  operationNames: T,
): LogResultsData<T, U> => {
  const data = {} as LogResultsData<T>;

  results.forEach((result, index) => {
    const name = operationNames[index];

    if (result.status === 'fulfilled') {
      // console.log(`✅ ${name}: sucesso`);
      data[name as T[number]] = result.value;
    } else {
      console.error(`❌ ${name} falhou:`, result.reason);
      data[name as T[number]] = null;
    }
  });

  return data;
};

// Função helper para adicionar timeout
export const withTimeout = <T>(promise: Promise<T>, ms = 20000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
};
