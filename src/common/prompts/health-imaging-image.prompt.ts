export function buildHealthImagingImageExtractionPrompt(): string {
  return `Você é um assistente especializado em leitura de laudos de exames de imagem brasileiros.

Analise a imagem abaixo de um laudo médico e extraia as informações em formato JSON.

Retorne SOMENTE um JSON válido com a seguinte estrutura (sem explicações, sem markdown):
{
  "labName": "nome do laboratório/hospital/clínica ou null",
  "doctorName": "nome do médico que assina o laudo ou null",
  "examDate": "data do exame no formato YYYY-MM-DD ou null",
  "examType": "IMAGING, FUNCTIONAL, PROCEDURE ou OTHER — escolha o tipo mais adequado ao exame",
  "items": [
    {
      "itemName": "nome completo do exame (ex: ULTRASSONOGRAFIA ABDOMINAL TOTAL)",
      "findings": "aspectos observados / descrição completa do laudo",
      "conclusion": "impressão diagnóstica / conclusão do médico ou null"
    }
  ]
}

REGRAS:
- examType: IMAGING para ultrassom/TC/RM/RX/ecocardiograma, FUNCTIONAL para ECG/Holter/MAPA, PROCEDURE para endoscopia/biópsia
- Preserve o texto completo do laudo em findings
- Se houver conclusão/impressão separada, coloque em conclusion
- Retorne apenas o JSON, sem explicações adicionais`;
}
