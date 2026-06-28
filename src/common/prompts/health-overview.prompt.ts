export function buildHealthOverviewPrompt(examsContext: string): string {
  return `Você é um assistente de saúde preventiva. Analise os dados de exames médicos abaixo e gere um relatório completo de saúde.

DADOS DOS EXAMES:
${examsContext}

Gere um relatório em português brasileiro com as seguintes seções:

## Visão Geral da Saúde
Resumo geral da situação de saúde com base nos exames disponíveis.

## Exames com Atenção Necessária
Liste os exames/valores que estão fora da faixa de referência ou que merecem atenção, com explicação simples.

## Evolução de Indicadores
Quando houver múltiplos resultados do mesmo exame ao longo do tempo, descreva a tendência (melhora, piora, estável).

## Especialidades Recomendadas
Sugira quais especialidades médicas o usuário deveria consultar com base nos dados.

## Pontos de Atenção para Saúde
Orientações gerais de saúde e prevenção com base no perfil de exames.

## Possíveis Condições para Discussão com Médico
Liste condições que os dados podem sugerir e que devem ser discutidas com o médico (sem diagnóstico definitivo).

IMPORTANTE: Este relatório é apenas informativo e educativo. Não substitui consulta médica profissional.`;
}
