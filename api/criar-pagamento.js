// Função serverless (Vercel) que cria um pagamento via API do Mercado Pago
// (Checkout Pro / Preferences) em vez de usar um Link de pagamento fixo do
// painel. Isso é necessário porque links criados pelo painel NÃO disparam
// webhooks — só pagamentos criados via API ficam associados à aplicação e
// avisam automaticamente quando são aprovados.

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const SITE_URL = "https://la-mafia-iota.vercel.app";

// ATENÇÃO: valor de TESTE (R$ 0,01) de propósito por enquanto.
// Trocar para 75 antes de divulgar o site pra não vender abadá por 1 centavo.
const PRECO_UNITARIO = 0.01;

const TAMANHOS_VALIDOS = ["P", "M", "G", "GG"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Método não permitido" });
    return;
  }

  try {
    const body = req.body || {};
    const tamanho = String(body.tamanho || "").toUpperCase();
    const quantidade = Math.min(10, Math.max(1, parseInt(body.quantidade, 10) || 1));

    if (!TAMANHOS_VALIDOS.includes(tamanho)) {
      res.status(400).json({ erro: "Tamanho inválido" });
      return;
    }

    const resposta = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Abadá La Mafia 2027 - Tamanho ${tamanho}`,
            quantity: quantidade,
            unit_price: PRECO_UNITARIO,
            currency_id: "BRL",
          },
        ],
        external_reference: tamanho,
        notification_url: `${SITE_URL}/api/mercadopago-webhook`,
        back_urls: {
          success: `${SITE_URL}/?pago=sucesso`,
          failure: `${SITE_URL}/?pago=erro`,
          pending: `${SITE_URL}/?pago=pendente`,
        },
        auto_return: "approved",
      }),
    });

    const preferencia = await resposta.json();

    if (!resposta.ok || !preferencia.init_point) {
      console.error("Erro ao criar preferência:", preferencia);
      res.status(502).json({ erro: "Não foi possível criar o pagamento" });
      return;
    }

    res.status(200).json({ init_point: preferencia.init_point });
  } catch (err) {
    console.error("Erro ao criar pagamento:", err);
    res.status(500).json({ erro: "Erro interno" });
  }
};
