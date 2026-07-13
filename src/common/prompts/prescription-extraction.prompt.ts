const PRESCRIPTION_JSON_SCHEMA = `{
  "doctorName": "nome do médico prescritor ou null",
  "prescriptionDate": "data da receita no formato YYYY-MM-DD ou null",
  "notes": "observações gerais da receita ou null",
  "items": [
    {
      "medicationName": "nome do medicamento",
      "dosage": "posologia em texto livre (ex: 1 comprimido de 10mg) ou null",
      "scheduleTimes": ["08:00", "20:00"],
      "daysOfWeek": ["Mon", "Wed", "Fri"] ou null se todos os dias,
      "startDate": "YYYY-MM-DD ou null",
      "endDate": "YYYY-MM-DD ou null",
      "notes": "observações do item ou null"
    }
  ]
}`;

const PRESCRIPTION_RULES = `REGRAS:
- Cada medicamento deve ser um item separado no array items
- scheduleTimes: horários no formato HH:mm (24h); se não identificar, use ["08:00"]
- daysOfWeek: use Mon, Tue, Wed, Thu, Fri, Sat, Sun; null = todos os dias
- prescriptionDate e startDate/endDate: formato YYYY-MM-DD
- Se não conseguir identificar um campo, use null
- Retorne apenas o JSON, sem explicações adicionais`;

export function buildPrescriptionTextExtractionPrompt(text: string): string {
  return `Você é um assistente especializado em leitura de receituários médicos brasileiros.

Analise o texto abaixo de uma receita médica e extraia as informações em formato JSON.

TEXTO DA RECEITA:
${text}

Retorne SOMENTE um JSON válido com a seguinte estrutura (sem explicações, sem markdown):
${PRESCRIPTION_JSON_SCHEMA}

${PRESCRIPTION_RULES}`;
}

export function buildPrescriptionImageExtractionPrompt(): string {
  return `Você é um assistente especializado em leitura de receituários médicos brasileiros.

Analise a imagem abaixo de uma receita médica e extraia as informações em formato JSON.

Retorne SOMENTE um JSON válido com a seguinte estrutura (sem explicações, sem markdown):
${PRESCRIPTION_JSON_SCHEMA}

REGRAS:
- Cada medicamento deve ser um item separado
- scheduleTimes: HH:mm (24h); padrão ["08:00"] se não identificar
- daysOfWeek: Mon, Tue, Wed, Thu, Fri, Sat, Sun; null = todos os dias
- Retorne apenas o JSON`;
}
