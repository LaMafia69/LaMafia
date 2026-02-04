/* =========================
   CONTADOR
========================= */
const evento = new Date("2026-02-16T16:00:00-03:00").getTime();

setInterval(() => {
  const agora = new Date().getTime();
  const diferenca = evento - agora;

  if (diferenca <= 0) return;

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

/* ABRIR FOTO (FUNCIONA NO CELULAR) */
fotos.forEach(img => {
  img.addEventListener('click', (e) => {
    e.preventDefault();
    lightboxImg.src = img.src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
});


/* FECHAR NO X */
closeBtn.addEventListener('click', () => {
  fecharLightbox();
});

/* FECHAR TOCANDO FORA */
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    fecharLightbox();
  }
});

function fecharLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

