/** Intervalo antes de reprocessar automaticamente um exame com status FAILED. */
export const HEALTH_PROCESSING_AUTO_RETRY_AFTER_MS = 2 * 60 * 60 * 1000; // 2 horas

/** Máximo de arquivos processados por execução do cron. */
export const HEALTH_PROCESSING_BATCH_SIZE = 3;

/** Limite de tamanho por arquivo (upload e download no processamento). */
export const HEALTH_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
