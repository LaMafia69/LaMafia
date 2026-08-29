// Função serverless (Vercel) que recebe a notificação do Mercado Pago
// quando um pagamento é aprovado e envia o comprovante automaticamente
// pro WhatsApp via CallMeBot (https://www.callmebot.com/blog/free-api-whatsapp-messages/).
//
// Variáveis de ambiente necessárias (configurar no painel da Vercel):
//   MP_ACCESS_TOKEN      -> Token de acesso de produção do Mercado Pago
//   CALLMEBOT_PHONE_1    -> Número em formato internacional, ex: 5598984985479
//   CALLMEBOT_APIKEY_1   -> Chave recebida do CallMeBot depois da ativação
//   (repita _2, _3... pra adicionar mais destinatários, ex: Junior/Lapela)

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

function contatosConfigurados() {
  const contatos = [];
  for (let i = 1; i <= 5; i++) {
    const telefone = process.env[`CALLMEBOT_PHONE_${i}`];
    const apikey = process.env[`CALLMEBOT_APIKEY_${i}`];
    if (telefone && apikey) contatos.push({ telefone, apikey });
  }
  return contatos;
}

const TAMANHOS_VALIDOS = ["P", "M", "G", "GG"];

function extrairTamanho(pagamento) {
  // Pagamentos criados via api/criar-pagamento.js levam o tamanho em
  // external_reference — é a forma confiável de identificar.
  const ref = String(pagamento.external_reference || "").toUpperCase();
  if (TAMANHOS_VALIDOS.includes(ref)) return ref;

  // Links de pagamento antigos (painel) não têm external_reference —
  // cai pra tentar ler da descrição, se houver.
  const descricao = pagamento.description || "";
  const explicito = descricao.match(/TAMANHO[:\s]+(\w{1,2})\b/i);
  if (explicito && TAMANHOS_VALIDOS.includes(explicito[1].toUpperCase())) {
    return explicito[1].toUpperCase();
  }
  const palavras = descricao.trim().split(/\s+/);
  const ultima = (palavras[palavras.length - 1] || "").toUpperCase();
  if (TAMANHOS_VALIDOS.includes(ultima)) return ultima;

  return "não identificado";
}

function extrairQuantidade(pagamento) {
  const item = pagamento.additional_info?.items?.[0];
  const quantidade = parseInt(item?.quantity, 10);
  return Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1;
}

async function enviarWhatsapp(contato, mensagem) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(contato.telefone)}&text=${encodeURIComponent(mensagem)}&apikey=${encodeURIComponent(contato.apikey)}`;
  try {
    const resposta = await fetch(url);
    const texto = await resposta.text();
    console.log(`CallMeBot (${contato.telefone}):`, resposta.status, texto);
  } catch (err) {
    console.error("Falha ao enviar WhatsApp:", err);
  }
}

async function buscarPagamento(paymentId) {
  const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  return resposta.json();
}

// Acha o id do pagamento a partir de uma notificação. O Mercado Pago manda
// pelo menos três formatos diferentes pro mesmo evento:
//   1. { type: "payment", data: { id } }              (Webhooks v2)
//   2. ?topic=payment&id=X                            (IPN clássico)
//   3. ?topic=merchant_order&id=X                      (IPN clássico, pedido)
// O formato 3 não traz o payment id direto — tem que buscar o pedido pra
// achar o pagamento aprovado dentro dele.
async function acharPaymentId(body, query) {
  const tipo = body?.type || query.type;
  const topico = body?.topic || query.topic;
  const dataId = body?.data?.id || query["data.id"] || query.id;

  console.log("acharPaymentId — query bruta:", JSON.stringify(query), "tipo:", tipo, "topico:", topico, "dataId:", dataId);

  if ((tipo === "payment" || topico === "payment") && dataId) return dataId;

  if (topico === "merchant_order" && dataId) {
    const resposta = await fetch(`https://api.mercadopago.com/merchant_orders/${dataId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const pedido = await resposta.json();
    console.log("merchant_order — status HTTP:", resposta.status, "payments:", JSON.stringify(pedido.payments), "erro:", pedido.error || pedido.message || null);
    const aprovado = (pedido.payments || []).find((p) => p.status === "approved");
    return aprovado?.id || null;
  }

  return null;
}

// Evita reenviar a mesma mensagem em retentativas dentro da mesma instância
// (não é garantido entre instâncias diferentes, mas reduz bastante).
const pagamentosProcessados = new Set();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(200).send("ok");
    return;
  }

  // Processa tudo ANTES de responder — em função serverless, responder
  // cedo e continuar trabalho assíncrono depois arrisca a execução ser
  // interrompida antes de terminar. O Mercado Pago espera até 22s.
  try {
    const body = req.body || {};
    const paymentId = await acharPaymentId(body, req.query);

    console.log("Notificação recebida — paymentId encontrado:", paymentId, "já processado?", pagamentosProcessados.has(paymentId));

    if (paymentId && !pagamentosProcessados.has(paymentId)) {
      const pagamento = await buscarPagamento(paymentId);
      console.log("Status do pagamento:", pagamento.status, "| erro da API:", pagamento.error || pagamento.message || null);

      if (pagamento.status === "approved") {
        pagamentosProcessados.add(paymentId);

        const tamanho = extrairTamanho(pagamento);
        const quantidade = extrairQuantidade(pagamento);
        const comprador = pagamento.payer?.first_name || pagamento.payer?.email || "não identificado";

        const mensagem =
          `🎉 Novo abadá pago!\n` +
          `Tamanho: ${tamanho}\n` +
          `Quantidade: ${quantidade}\n` +
          `Total: R$ ${pagamento.transaction_amount.toFixed(2).replace(".", ",")}\n` +
          `Comprador: ${comprador}\n` +
          `Pedido MP: #${paymentId}`;

        const contatos = contatosConfigurados();
        await Promise.all(contatos.map((c) => enviarWhatsapp(c, mensagem)));
      }
    }
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago:", err);
  }

  res.status(200).send("ok");
};
