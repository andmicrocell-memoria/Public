export interface FlowFallbackConfig {
  name?: string;
  businessHours?: string;
}

export const sanitizeReplyText = (replyText: string | null | undefined, fallbackText: string): string => {
  if (typeof replyText !== 'string') return fallbackText;
  const cleaned = replyText.trim();
  return cleaned.length > 0 ? cleaned : fallbackText;
};

export const createFallbackReply = (config: FlowFallbackConfig, customerName: string, messageText: string): string => {
  const businessName = config.name || 'nossa equipe';
  const businessHours = config.businessHours || 'nosso horário comercial';
  const customerLabel = customerName?.trim() || 'cliente';
  const preview = messageText?.trim() ? `Recebi sua mensagem: "${messageText.trim()}".` : 'Recebi sua mensagem.';
  return `${preview} ${customerLabel}, estou processando sua solicitação e em breve retorno com uma resposta mais completa. Sou o assistente da ${businessName}. Nosso horário é ${businessHours}.`;
};
