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
const PRECO_UNITARIO = 75;

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

function extrairTamanho(descricao = "") {
  // Tenta primeiro o padrão explícito "Tamanho X".
  const explicito = descricao.match(/TAMANHO[:\s]+(\w{1,2})\b/i);
  if (explicito && TAMANHOS_VALIDOS.includes(explicito[1].toUpperCase())) {
    return explicito[1].toUpperCase();
  }

  // Senão, aceita quando a última palavra da descrição já é o tamanho
  // (ex: "Abadá Lá Máfia P").
  const palavras = descricao.trim().split(/\s+/);
  const ultima = (palavras[palavras.length - 1] || "").toUpperCase();
  if (TAMANHOS_VALIDOS.includes(ultima)) return ultima;

  return "não identificado";
}

async function enviarWhatsapp(contato, mensagem) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(contato.telefone)}&text=${encodeURIComponent(mensagem)}&apikey=${encodeURIComponent(contato.apikey)}`;
  try {
    await fetch(url);
  } catch (err) {
    console.error("Falha ao enviar WhatsApp:", err);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(200).send("ok");
    return;
  }

  // Responde rápido — o Mercado Pago reenvia a notificação se demorar.
  res.status(200).send("ok");

  try {
    const body = req.body || {};
    const paymentId = body?.data?.id || req.query["data.id"];
    const tipo = body?.type || req.query.type;

    if (tipo !== "payment" || !paymentId) return;

    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const pagamento = await resposta.json();

    if (pagamento.status !== "approved") return;

    const tamanho = extrairTamanho(pagamento.description);
    const quantidade = Math.max(1, Math.round(pagamento.transaction_amount / PRECO_UNITARIO));
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
  } catch (err) {
    console.error("Erro ao processar webhook do Mercado Pago:", err);
  }
};
