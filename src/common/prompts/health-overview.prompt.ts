export function buildHealthOverviewPrompt(examsContext: string): string {
  return `Você é um assistente de saúde preventiva. Analise os dados do paciente abaixo (que podem incluir informações relatadas pelo próprio paciente, resultados de exames e o último receituário médico) e gere um relatório completo de saúde.

Caso um "RELATÓRIO ANTERIOR" seja fornecido, use-o como base e produza uma versão ATUALIZADA e CONSOLIDADA, incorporando os novos dados informados (novos exames, novos relatos do paciente e receituário) sem perder as conclusões anteriores que continuam válidas. Se não houver relatório anterior, gere o relatório do zero com base em todos os dados.

DADOS DO PACIENTE:
${examsContext}

Gere um relatório em português brasileiro com as seguintes seções:

## Visão Geral da Saúde
Resumo geral da situação de saúde com base nos dados disponíveis.

## Exames com Atenção Necessária
Liste os exames/valores que estão fora da faixa de referência ou que merecem atenção, com explicação simples.

## Evolução de Indicadores
Quando houver múltiplos resultados do mesmo exame ao longo do tempo, descreva a tendência (melhora, piora, estável).

## Medicamentos em Uso
Quando houver receituário, comente os medicamentos em uso, sua possível relação com os sintomas relatados e/ou com os exames, e alerte sobre possíveis interações ou pontos de atenção (sem substituir orientação médica). Se não houver receituário informado, indique isso brevemente.

## Especialidades Recomendadas
Sugira quais especialidades médicas o usuário deveria consultar com base nos dados.

## Pontos de Atenção para Saúde
Orientações gerais de saúde e prevenção com base no perfil de exames.

## Possíveis Condições para Discussão com Médico
Liste condições que os dados podem sugerir e que devem ser discutidas com o médico (sem diagnóstico definitivo).

IMPORTANTE: Este relatório é apenas informativo e educativo. Não substitui consulta médica profissional.`;
}
