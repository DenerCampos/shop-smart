/** Schema JSON unificado — campos de item variam conforme examType detectado. */
export function buildHealthExamExtractionJsonSchema(): string {
  return `{
  "labName": "nome do laboratório/hospital/clínica ou null",
  "doctorName": "nome do médico solicitante, radiologista ou responsável ou null",
  "examDate": "data do exame no formato YYYY-MM-DD ou null",
  "examType": "LABORATORY | IMAGING | FUNCTIONAL | PROCEDURE | OTHER",
  "items": [
    {
      "itemName": "nome do exame, analito ou procedimento",
      "material": "SOMENTE se examType = LABORATORY — material (Sangue, Urina...) ou null",
      "method": "SOMENTE se examType = LABORATORY — método ou null",
      "resultValue": "SOMENTE se examType = LABORATORY — valor numérico/texto do resultado ou null",
      "resultUnit": "SOMENTE se examType = LABORATORY — unidade (mg/dL, g/dL...) ou null",
      "referenceRange": "SOMENTE se examType = LABORATORY — faixa de referência ou null",
      "isAbnormal": "SOMENTE se examType = LABORATORY — true/false ou null",
      "itemNotes": "SOMENTE se examType = LABORATORY — observação curta do analito ou null",
      "findings": "SOMENTE se examType = IMAGING, FUNCTIONAL ou PROCEDURE — laudo / descrição / resultados descritivos ou null",
      "conclusion": "SOMENTE se examType = IMAGING, FUNCTIONAL ou PROCEDURE — impressão / conclusão / opinião ou null"
    }
  ]
}`;
}

export function buildHealthExamExtractionRules(): string {
  return `REGRAS GERAIS:
1. PRIMEIRO identifique examType analisando título, cabeçalho e conteúdo do documento.
2. examDate em YYYY-MM-DD (converta DD/MM/YYYY).
3. Retorne SOMENTE JSON válido, sem markdown.
4. O sistema suporta 5 tipos de cadastro: LABORATORY, IMAGING, FUNCTIONAL, PROCEDURE e OTHER.

MAPA DE CAMPOS POR TIPO (igual ao formulário de cadastro):
- LABORATORY → itemName, material, method, resultValue, resultUnit, referenceRange, isAbnormal, itemNotes
- IMAGING, FUNCTIONAL, PROCEDURE → itemName, findings, conclusion
- OTHER → itemName, findings, conclusion (ou o que couber melhor)

IDENTIFICAÇÃO DE examType:
- LABORATORY: hemograma, bioquímica, urina, hormônios, coagulação, PCR, eletrólitos, sorologias; tabelas com analitos, valores numéricos e faixas de referência.
- IMAGING: ultrassom/US, doppler, tomografia/TC, ressônancia/RM, raio-X/RX, mamografia, densitometria; laudo descritivo com "Aspectos observados", medidas anatômicas, impressão radiológica.
- FUNCTIONAL: exames funcionais/cardiológicos/pulmonares — ECG/eletrocardiograma, Holter, MAPA/monitorização ambulatorial da pressão, teste ergométrico, espirometria, polissonografia, EEG, potencial evocado; laudo com parâmetros, traçados descritos ou conclusão funcional (não é tabela de analitos como laboratório).
- PROCEDURE: laudos de procedimentos — endoscopia (EDA, colonoscopia), biópsia, anatomopatológico/AP, citologia, histeroscopia, broncoscopia, laparoscopia diagnóstica; descreve achados do procedimento e conclusão/diagnóstico histológico ou endoscópico.
- OTHER: documentos médicos de exame que não se encaixem claramente nos tipos acima.

SE examType = LABORATORY:
- Cada analito/medida = um item (desmembre hemograma: Hemácias, Hemoglobina, Ureia...).
- Preencha resultValue, resultUnit, referenceRange, isAbnormal, itemNotes (e material/method quando disponíveis).
- NÃO use findings nem conclusion.
- NÃO classifique como LABORATORY laudos descritivos de imagem, ECG, endoscopia etc.

SE examType = IMAGING, FUNCTIONAL ou PROCEDURE:
- Use SOMENTE itemName, findings e conclusion (mesmo formato do cadastro para esses tipos).
- Preferir 1 item por exame/modalidade/procedimento principal.
- findings: corpo do laudo — descrição completa, achados, parâmetros descritos em texto, resultados do exame (preserve parágrafos).
- conclusion: impressão, conclusão, opinião, diagnóstico ou recomendação final; null se não houver seção separada.
- NÃO preencha resultValue, resultUnit, referenceRange, material, method, itemNotes.
- NÃO fragmente cada frase ou achado em itens separados — agrupe no findings do exame.
- Valores numéricos citados no laudo (ex: "FC 72 bpm", "Rim direito mede 11,3 cm") ficam DENTRO de findings, não em resultValue.

EXEMPLOS POR TIPO:
- LABORATORY: hemograma com Hemoglobina 12,5 g/dL → examType LABORATORY, vários itens com resultValue/referenceRange.
- IMAGING: "ULTRASSONOGRAFIA ABDOMINAL TOTAL" + Aspectos observados + Impressão → examType IMAGING, 1 item com findings e conclusion.
- FUNCTIONAL: laudo de ECG com descrição do ritmo, eixo, alterações + conclusão "ECG dentro dos limites da normalidade" → examType FUNCTIONAL, 1 item; Holter/MAPA/espirometria seguem o mesmo padrão (findings + conclusion).
- PROCEDURE: laudo de colonoscopia com achados + "Conclusão: pólipos removidos..." → examType PROCEDURE, 1 item; anatomopatológico: findings = descrição microscópica/macroscópica, conclusion = diagnóstico.
- OTHER: documento ambíguo → examType OTHER, itemName + findings quando possível.`;
}

export function buildHealthExamTextExtractionPrompt(text: string): string {
  return `Você é um assistente especializado em leitura de laudos e resultados de exames médicos brasileiros.

Tipos suportados: laboratorial (LABORATORY), imagem (IMAGING), funcional (FUNCTIONAL — ECG, Holter, MAPA...), procedimento (PROCEDURE — endoscopia, biópsia...) e OTHER.

Analise o texto abaixo, identifique o tipo de exame e extraia as informações em JSON conforme o mapeamento de campos de cada tipo.

TEXTO DO DOCUMENTO:
${text}

Retorne SOMENTE um JSON válido com a estrutura:
${buildHealthExamExtractionJsonSchema()}

${buildHealthExamExtractionRules()}`;
}

export function buildHealthExamImageExtractionPrompt(): string {
  return `Você é um assistente especializado em leitura de laudos e resultados de exames médicos brasileiros.

Tipos suportados: laboratorial (LABORATORY), imagem (IMAGING), funcional (FUNCTIONAL — ECG, Holter, MAPA...), procedimento (PROCEDURE — endoscopia, biópsia...) e OTHER.

Analise a imagem ou PDF abaixo (JPEG, PNG ou PDF — laudo escaneado, resultado laboratorial, laudo de imagem, ECG, endoscopia etc.).

Identifique o tipo de exame e extraia as informações em JSON conforme o mapeamento de campos de cada tipo.

Retorne SOMENTE um JSON válido com a estrutura:
${buildHealthExamExtractionJsonSchema()}

${buildHealthExamExtractionRules()}`;
}
