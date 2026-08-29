/* =========================
   CONTADOR
========================= */

const evento = new Date("2027-02-16T16:00:00-03:00").getTime();

let fogosIniciados = false;
let intervalosAnimacao = [];
let rafId = null;

const intervalo = setInterval(() => {

  const agora = new Date().getTime();
  const diferenca = evento - agora;

  if (diferenca <= 0) {

    document.getElementById("dias").innerText = 0;
    document.getElementById("horas").innerText = 0;
    document.getElementById("minutos").innerText = 0;
    document.getElementById("segundos").innerText = 0;

    clearInterval(intervalo);

    if (!fogosIniciados) {
      iniciarCelebracao();
      fogosIniciados = true;
    }

    return;
  }

  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferenca / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diferenca / (1000 * 60)) % 60);
  const segundos = Math.floor((diferenca / 1000) % 60);

  document.getElementById("dias").innerText = dias;
  document.getElementById("horas").innerText = horas;
  document.getElementById("minutos").innerText = minutos;
  document.getElementById("segundos").innerText = segundos;

}, 1000);


/* =========================
   LIGHTBOX GALERIA
========================= */

const fotos = document.querySelectorAll('.foto-card img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('btn-fechar');

fotos.forEach(img => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
});

closeBtn.addEventListener('click', fecharLightbox);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) fecharLightbox();
});

function fecharLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}


/* =========================
   CELEBRAÇÃO PRINCIPAL
========================= */

function iniciarCelebracao() {

  document.getElementById("overlay-festa").style.display = "block";
  document.getElementById("fogos").style.display = "block";
  document.getElementById("btn-fechar-festa").style.display = "block";

  const canvas = document.getElementById("fogos");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const resizeHandler = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", resizeHandler);

  let particulas = [];
  let confetes = [];

  function criarExplosao() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.6;
    for (let i = 0; i < 80; i++) {
      particulas.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 100,
        cor: `hsl(${Math.random() * 360},100%,60%)`
      });
    }
  }

  function criarConfete() {
    for (let i = 0; i < 10; i++) {
      confetes.push({
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 6 + 4,
        speed: Math.random() * 3 + 2,
        cor: `hsl(${Math.random() * 360},100%,60%)`
      });
    }
  }

  function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particulas.length - 1; i >= 0; i--) {
      const p = particulas[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        particulas.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = p.cor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.cor;
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    for (let i = confetes.length - 1; i >= 0; i--) {
      const c = confetes[i];
      c.y += c.speed;
      if (c.y > canvas.height) {
        confetes.splice(i, 1);
        continue;
      }
      ctx.fillStyle = c.cor;
      ctx.fillRect(c.x, c.y, c.size, c.size);
    }

    rafId = requestAnimationFrame(animar);
  }

  const explosoesId = setInterval(criarExplosao, 700);
  const confeteId = setInterval(criarConfete, 200);
  intervalosAnimacao = [explosoesId, confeteId];

  animar();
  mostrarMensagem();
  tocarSom();
  vibrarCelular();
}


/* =========================
   BOTÃO FECHAR FESTA
========================= */

document.getElementById("btn-fechar-festa").addEventListener("click", () => {

  document.getElementById("overlay-festa").style.display = "none";
  document.getElementById("fogos").style.display = "none";
  document.getElementById("btn-fechar-festa").style.display = "none";

  const msg = document.getElementById("mensagem-evento");
  msg.classList.remove("show");

  intervalosAnimacao.forEach(id => clearInterval(id));
  intervalosAnimacao = [];
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
});


/* =========================
   MENSAGEM
========================= */

function mostrarMensagem() {
  const msg = document.getElementById("mensagem-evento");
  setTimeout(() => {
    msg.classList.add("show");
  }, 500);
}


/* =========================
   SOM
========================= */

function tocarSom() {
  const audio = document.getElementById("som-fogos");
  if (audio) {
    audio.volume = 0.6;
    audio.play().catch(() => { });
  }
}


/* =========================
   VIBRAÇÃO
========================= */

function vibrarCelular() {
  if (navigator.vibrate) {
    navigator.vibrate([500, 200, 500, 200, 800]);
  }
}

let audioLiberado = false;

document.addEventListener("click", () => {
  if (!audioLiberado) {
    const audio = document.getElementById("som-fogos");
    if (audio) {
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.6;
        audioLiberado = true;
      }).catch(() => { });
    }
  }
});


/* =========================
   CHECKOUT ABADÁ (PIX/CARTÃO)
========================= */

// O pagamento é criado dinamicamente via api/criar-pagamento.js (Preferences
// API do Mercado Pago) — não usa mais link fixo, porque links criados pelo
// painel não disparam webhook. O valor cobrado de verdade está definido lá.
//
// ATENÇÃO: valor de TESTE (R$ 0,01) de propósito por enquanto — precisa
// bater com PRECO_UNITARIO em api/criar-pagamento.js. Trocar os dois pro
// valor definitivo (R$ 75,00) antes de divulgar o site.
const PAGAMENTO_ATIVO = true;
const WHATSAPP_FALLBACK = "559884456488"; // Junior

const PRECO_UNITARIO = 0.01;
let tamanhoSelecionado = "P";
let quantidade = 1;

const tamanhoSelector = document.getElementById("tamanho-selector");
const qtdValorEl = document.getElementById("qtd-valor");
const qtdMenosBtn = document.getElementById("qtd-menos");
const qtdMaisBtn = document.getElementById("qtd-mais");
const precoTotalEl = document.getElementById("preco-total");
const btnPix = document.getElementById("btn-pix");
const btnCartao = document.getElementById("btn-cartao");

function atualizarTotal() {
  const total = PRECO_UNITARIO * quantidade;
  if (precoTotalEl) {
    precoTotalEl.innerText = `R$ ${total.toFixed(2).replace(".", ",")}`;
  }
}

if (tamanhoSelector) {
  tamanhoSelector.querySelectorAll(".tamanho-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      tamanhoSelector.querySelectorAll(".tamanho-btn").forEach(b => b.classList.remove("selecionado"));
      btn.classList.add("selecionado");
      tamanhoSelecionado = btn.dataset.tamanho;
    });
  });
}

if (qtdMenosBtn && qtdMaisBtn && qtdValorEl) {
  qtdMenosBtn.addEventListener("click", () => {
    if (quantidade > 1) {
      quantidade--;
      qtdValorEl.innerText = quantidade;
      atualizarTotal();
    }
  });

  qtdMaisBtn.addEventListener("click", () => {
    if (quantidade < 10) {
      quantidade++;
      qtdValorEl.innerText = quantidade;
      atualizarTotal();
    }
  });
}

function cairNoFallbackWhatsapp() {
  const total = PRECO_UNITARIO * quantidade;
  const mensagem = encodeURIComponent(
    `Quero comprar ${quantidade} abadá(s) tamanho ${tamanhoSelecionado} da La Mafia 2027 - Total R$ ${total.toFixed(2).replace(".", ",")}`
  );
  // Navega na mesma aba (em vez de abrir nova) pra não esbarrar no
  // bloqueador de pop-up, já que essa chamada pode vir depois de um await.
  window.location.href = `https://wa.me/${WHATSAPP_FALLBACK}?text=${mensagem}`;
}

async function irParaPagamento() {
  if (!PAGAMENTO_ATIVO) {
    cairNoFallbackWhatsapp();
    return;
  }

  try {
    const resposta = await fetch("/api/criar-pagamento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tamanho: tamanhoSelecionado, quantidade }),
    });
    const dados = await resposta.json();

    if (!resposta.ok || !dados.init_point) {
      throw new Error(dados.erro || "Falha ao criar pagamento");
    }

    window.location.href = dados.init_point;
  } catch (err) {
    console.error("Erro ao iniciar pagamento:", err);
    cairNoFallbackWhatsapp();
  }
}

if (btnPix) {
  btnPix.addEventListener("click", (e) => {
    e.preventDefault();
    irParaPagamento();
  });
}

if (btnCartao) {
  btnCartao.addEventListener("click", (e) => {
    e.preventDefault();
    irParaPagamento();
  });
}
