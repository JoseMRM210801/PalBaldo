(() => {
  const app = document.getElementById("app");
  const sections = document.querySelectorAll(".slide");
  const typingTarget = document.getElementById("typingText");
  const phrases = [
    "Una noche dorada, elegante y vaquera",
    "Recuerdos únicos para los XV de Ximena",
    "Comparte tu mejor momento de la fiesta",
  ];

  function setTheme(section) {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const bg = section.dataset.bg || "zodiac";
    const rgb = section.dataset.endcolor || "5,3,8";
    document.body.classList.remove("bg-zodiac", "bg-blackGold", "bg-eternal");
    document.body.classList.add(`bg-${bg}`);
    if (metaTheme) {
      metaTheme.setAttribute("content", `rgb(${rgb})`);
    }
  }

  function restartReveal(section) {
    const reveals = section.querySelectorAll(".reveal");
    reveals.forEach((item) => {
      item.classList.remove("animate-in");
      void item.offsetWidth;
      item.classList.add("animate-in");
    });
  }

  if (app && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          sections.forEach((s) => s.classList.remove("in-view"));
          entry.target.classList.add("in-view");
          setTheme(entry.target);
          restartReveal(entry.target);
        });
      },
      { root: app, threshold: 0.55 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  if (!typingTarget) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    typingTarget.textContent = phrases.join(" · ");
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function type() {
    const current = phrases[phraseIndex];
    typingTarget.textContent = deleting
      ? current.slice(0, charIndex--)
      : current.slice(0, charIndex++);

    let delay = deleting ? 45 : 85;
    if (!deleting && charIndex > current.length) {
      deleting = true;
      delay = 1200;
    }
    if (deleting && charIndex < 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      charIndex = 0;
      delay = 330;
    }

    window.setTimeout(type, delay);
  }

  type();
})();
