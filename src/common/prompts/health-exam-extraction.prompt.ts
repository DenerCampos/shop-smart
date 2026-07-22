/** Schema JSON unificado — campos de item variam conforme examType detectado. */
export function buildHealthExamExtractionJsonSchema(): string {
  return `{
  "labName": "nome do laboratório/hospital/clínica ou null",
  "doctorName": "nome do médico solicitante, radiologista ou responsável ou null",
  "examDate": "data do exame no formato YYYY-MM-DD ou null",
  "examType": "LABORATORY | IMAGING | FUNCTIONAL | PROCEDURE | OTHER",
  "items": [
    {
      "itemName": "nome canônico do exame/analito (Title Case + sufixo de painel quando aplicável)",
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
- IMAGING: ultrassom/US, doppler, tomografia/TC, ressônância/RM, raio-X/RX, mamografia, densitometria; laudo descritivo com "Aspectos observados", medidas anatômicas, impressão radiológica.
- FUNCTIONAL: exames funcionais/cardiológicos/pulmonares — ECG/eletrocardiograma, Holter, MAPA/monitorização ambulatorial da pressão, teste ergométrico, espirometria, polissonografia, EEG, potencial evocado; laudo com parâmetros, traçados descritos ou conclusão funcional (não é tabela de analitos como laboratório).
- PROCEDURE: laudos de procedimentos — endoscopia (EDA, colonoscopia), biópsia, anatomopatológico/AP, citologia, histeroscopia, broncoscopia, laparoscopia diagnóstica; descreve achados do procedimento e conclusão/diagnóstico histológico ou endoscópico.
- OTHER: documentos médicos de exame que não se encaixem claramente nos tipos acima.

PADRONIZAÇÃO OBRIGATÓRIA DE itemName (importante para evolução temporal):
1. CAPITALIZAÇÃO: cada palavra com a PRIMEIRA letra maiúscula e o RESTANTE minúsculo (Title Case).
   - Ex.: "Ureia", "Creatinina", "Colesterol Hdl", "Proteína C Reativa - Pcr", "Hemácias (Hemograma)".
   - NÃO use TUDO MAIÚSCULO ("UREIA", "COLESTEROL HDL", "ALBUMINA, DOSAGEM").
   - NÃO use tudo minúsculo ("ureia", "plaquetas").
   - Aplique Title Case também dentro de parênteses de painel: "(Hemograma)", "(Urina)", "(Gasometria Venosa)".
   - Preserve acentos corretos em português: Hemácias, Hematócrito, Proteína, Proteinúria, Potássio, Sódio, Cálcio, Bilirrubina, Leucócitos.

2. NOME CANÔNICO CURTO: remova ruído do laudo do itemName.
   - Remova prefixos de painel no nome: "Hemograma - ", "Urina Rotina - ", "Eas - ", "Sumário De Urina - ".
   - Remova sufixos genéricos: ", Dosagem", "- Dosagem", "Dosagem", "Pesquisa De", "Quantificação".
   - Não coloque unidade, método ou faixa de referência no itemName (use resultUnit / method / referenceRange).
   - material: preencha "Sangue", "Urina", etc. quando souber; NÃO use o material como substituto do sufixo de painel abaixo.

3. SUFIXO (Hemograma) — quando o analito fizer parte do hemograma / série vermelha-branca-plaquetas:
   - Sempre termine o itemName com " (Hemograma)".
   - Exemplos CORRETOS: "Hemácias (Hemograma)", "Hemoglobina (Hemograma)", "Hematócrito (Hemograma)", "Plaquetas (Hemograma)", "Leucócitos (Hemograma)", "Neutrófilos Segmentados (Hemograma)", "Neutrófilos Bastonetes (Hemograma)", "Linfócitos (Hemograma)", "Monócitos (Hemograma)", "Eosinófilos (Hemograma)", "Basófilos (Hemograma)", "Rdw (Hemograma)", "Mcv (Hemograma)", "Mch (Hemograma)", "Mchc (Hemograma)", "Vcm (Hemograma)", "Hcm (Hemograma)", "Chcm (Hemograma)", "Blastos (Hemograma)", "Mielócitos (Hemograma)", "Metamielócitos (Hemograma)", "Promielócitos (Hemograma)", "Reticulócitos Absoluto (Hemograma)".
   - Exemplos ERRADOS: "HEMOGRAMA - Hemacias", "Hemacias", "Leucocitos - Global", "Segmentados" (sem contexto).
   - Se o documento for só hemograma, TODOS os analitos dele levam " (Hemograma)".
   - Diferencie percentuais vs absolutos no nome quando o laudo distinguir: "Linfócitos (%) (Hemograma)", "Linfócitos (Absolutos) (Hemograma)".

4. SUFIXO (Urina) — quando o analito for de urina (EAS / urina rotina / urina 24h / microalbuminúria urinária etc.):
   - Sempre termine o itemName com " (Urina)".
   - Exemplos CORRETOS: "Hemoglobina (Urina)", "Hemácias (Urina)", "Proteína (Urina)", "Proteinúria 24h (Urina)", "Glicose (Urina)", "Leucócito Esterase (Urina)", "Nitrito (Urina)", "Ph (Urina)", "Densidade (Urina)", "Cristais (Urina)", "Cilindros Hialinos (Urina)", "Cilindros Patológicos (Urina)", "Piócitos (Urina)", "Corpos Cetônicos (Urina)", "Creatinina (Urina)", "Relação Proteína/Creatinina (Urina)", "Volume Urinário (24 Horas) (Urina)".
   - Exemplos ERRADOS: "URINA ROTINA - PROTEÍNA", "PROTEÍNA (URINA)", "HEMÁCIAS (URINA)", "Proteínas - Dosagem" (quando for urina).
   - Se o mesmo analito existir em sangue e urina, o de urina DEVE ter " (Urina)" (ex.: "Creatinina" vs "Creatinina (Urina)"; "Hemoglobina (Hemograma)" vs "Hemoglobina (Urina)").

5. OUTROS PAINÉIS (manter consistência, sem inventar sufixos demais):
   - Gasometria: use " (Gasometria Venosa)" ou " (Gasometria)" quando o laudo indicar — ex.: "Pco2 (Gasometria Venosa)", "Saturação De O2 (Gasometria Venosa)".
   - Bioquímica / sorologia / hormônios sem painel especial: nome canônico SEM sufixo — "Ureia", "Creatinina", "Sódio", "Potássio", "Glicose", "Albumina", "Proteínas Totais", "Colesterol Total", "Colesterol Hdl", "Colesterol Ldl", "Triglicérides", "Tsh Ultra Sensível", "Vitamina D (25-Hidroxi Vitamina D)".

6. NÃO duplique sufixo: se já terminar com " (Hemograma)" ou " (Urina)", não acrescente de novo.
7. NÃO use o nome do painel sozinho como item quando houver analitos: preferir desmembrar. Só use "Hemograma" / "Urina Rotina" como itemName se não houver linhas de resultado individuais.

SE examType = LABORATORY:
- Cada analito/medida = um item (desmembre hemograma e urina conforme regras acima).
- Preencha resultValue, resultUnit, referenceRange, isAbnormal, itemNotes (e material/method quando disponíveis).
- NÃO use findings nem conclusion.
- NÃO classifique como LABORATORY laudos descritivos de imagem, ECG, endoscopia etc.

SE examType = IMAGING, FUNCTIONAL ou PROCEDURE:
- Use SOMENTE itemName, findings e conclusion (mesmo formato do cadastro para esses tipos).
- Preferir 1 item por exame/modalidade/procedimento principal.
- itemName também em Title Case (ex.: "Ultrassonografia Abdominal Total", "Radiografia Do Tórax").
- findings: corpo do laudo — descrição completa, achados, parâmetros descritos em texto, resultados do exame (preserve parágrafos).
- conclusion: impressão, conclusão, opinião, diagnóstico ou recomendação final; null se não houver seção separada.
- NÃO preencha resultValue, resultUnit, referenceRange, material, method, itemNotes.
- NÃO fragmente cada frase ou achado em itens separados — agrupe no findings do exame.
- Valores numéricos citados no laudo (ex: "FC 72 bpm", "Rim direito mede 11,3 cm") ficam DENTRO de findings, não em resultValue.

EXEMPLOS POR TIPO:
- LABORATORY hemograma: Hemoglobina 12,5 g/dL → itemName "Hemoglobina (Hemograma)", resultValue/referenceRange preenchidos.
- LABORATORY urina: proteína no EAS → itemName "Proteína (Urina)"; proteinúria 24h → "Proteinúria 24h (Urina)".
- LABORATORY bioquímica: ureia sérica → itemName "Ureia" (sem sufixo).
- IMAGING: "ULTRASSONOGRAFIA ABDOMINAL TOTAL" + Aspectos observados + Impressão → examType IMAGING, 1 item "Ultrassonografia Abdominal Total" com findings e conclusion.
- FUNCTIONAL: laudo de ECG → examType FUNCTIONAL, 1 item; Holter/MAPA/espirometria seguem o mesmo padrão (findings + conclusion).
- PROCEDURE: laudo de colonoscopia → examType PROCEDURE, 1 item; anatomopatológico: findings = descrição, conclusion = diagnóstico.
- OTHER: documento ambíguo → examType OTHER, itemName + findings quando possível.`;
}

export function buildHealthExamTextExtractionPrompt(text: string): string {
  return `Você é um assistente especializado em leitura de laudos e resultados de exames médicos brasileiros.

Tipos suportados: laboratorial (LABORATORY), imagem (IMAGING), funcional (FUNCTIONAL — ECG, Holter, MAPA...), procedimento (PROCEDURE — endoscopia, biópsia...) e OTHER.

Analise o texto abaixo, identifique o tipo de exame e extraia as informações em JSON conforme o mapeamento de campos de cada tipo.
Padronize TODOS os itemName (Title Case + sufixos Hemograma/Urina) para permitir evolução temporal consistente.

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
Padronize TODOS os itemName (Title Case + sufixos Hemograma/Urina) para permitir evolução temporal consistente.

Retorne SOMENTE um JSON válido com a estrutura:
${buildHealthExamExtractionJsonSchema()}

${buildHealthExamExtractionRules()}`;
}
