/* =========================
   CONTADOR
========================= */

//const evento = new Date("2026-02-16T16:00:00-03:00").getTime();
const evento = new Date(Date.now() + 5000).getTime(); // teste 5 segundos

let fogosIniciados = false;

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
  img.addEventListener('click', (e) => {
    e.preventDefault();
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

  iniciarFogos();
  iniciarConfete();
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

});


/* =========================
   FOGOS
========================= */

function iniciarFogos() {

  const canvas = document.getElementById("fogos");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const particulas = [];

  function criarExplosao() {

    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.6;

    for (let i = 0; i < 80; i++) {

      particulas.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 100,
        cor: `hsl(${Math.random() * 360},100%,60%)`
      });

    }
  }

  function animar() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particulas.forEach((p, i) => {

      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = p.cor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.cor;
      ctx.fill();

      if (p.life <= 0) particulas.splice(i, 1);

    });

    requestAnimationFrame(animar);

  }

  setInterval(criarExplosao, 700);
  animar();

}


/* =========================
   CONFETE
========================= */

function iniciarConfete() {

  const canvas = document.getElementById("fogos");
  const ctx = canvas.getContext("2d");

  const confetes = [];

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

  function animarConfete() {

    confetes.forEach((c, i) => {

      c.y += c.speed;

      ctx.fillStyle = c.cor;
      ctx.fillRect(c.x, c.y, c.size, c.size);

      if (c.y > canvas.height) confetes.splice(i, 1);

    });

    requestAnimationFrame(animarConfete);

  }

  setInterval(criarConfete, 200);
  animarConfete();

}


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

