document.documentElement.classList.add("js-enabled");

const targetDate = new Date("2026-08-29T15:00:00+03:00").getTime();

const pad = (value) => String(value).padStart(2, "0");

const countdownNodes = {
  days: document.querySelector("[data-days]"),
  hours: document.querySelector("[data-hours]"),
  minutes: document.querySelector("[data-minutes]"),
  seconds: document.querySelector("[data-seconds]"),
};

function updateCountdown() {
  const now = Date.now();
  const distance = Math.max(targetDate - now, 0);
  const dayMs = 1000 * 60 * 60 * 24;
  const hourMs = 1000 * 60 * 60;
  const minuteMs = 1000 * 60;

  const days = Math.floor(distance / dayMs);
  const hours = Math.floor((distance % dayMs) / hourMs);
  const minutes = Math.floor((distance % hourMs) / minuteMs);
  const seconds = Math.floor((distance % minuteMs) / 1000);

  countdownNodes.days.textContent = pad(days);
  countdownNodes.hours.textContent = pad(hours);
  countdownNodes.minutes.textContent = pad(minutes);
  countdownNodes.seconds.textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealItems = document.querySelectorAll("[data-reveal]");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
);

revealItems.forEach((item) => revealObserver.observe(item));

const carousel = document.querySelector("[data-gallery-carousel]");

if (carousel) {
  const slides = [...carousel.querySelectorAll("[data-gallery-slide]")];
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsWrap = carousel.querySelector("[data-carousel-dots]");
  const initialActiveIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  let activeIndex = initialActiveIndex >= 0 ? initialActiveIndex : 0;

  slides.forEach((slide) => {
    const photo = slide.querySelector("img");
    const caption = slide.querySelector("figcaption");

    photo.classList.add("gallery-photo");

    if (!slide.querySelector(".gallery-card")) {
      const card = document.createElement("div");
      card.className = "gallery-card";
      slide.insertBefore(card, photo);
      card.append(photo, caption);
    }
  });

  const getPosition = (index) => {
    const total = slides.length;
    let offset = (index - activeIndex + total) % total;

    if (offset > total / 2) {
      offset -= total;
    }

    if (offset === 0) return "active";
    if (offset === -1) return "prev";
    if (offset === 1) return "next";
    if (offset === -2) return "far-prev";
    if (offset === 2) return "far-next";
    return "hidden";
  };

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Показати фото ${index + 1}`);
    dot.addEventListener("click", () => goToSlide(index));
    dotsWrap.append(dot);
    return dot;
  });

  function updateCarousel() {
    slides.forEach((slide, index) => {
      const position = getPosition(index);

      slide.dataset.position = position;
      slide.classList.toggle("is-active", position === "active");
      slide.setAttribute("aria-hidden", position === "hidden" ? "true" : "false");
    });

    dots.forEach((dot, index) => {
      dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  }

  function goToSlide(index) {
    activeIndex = (index + slides.length) % slides.length;
    updateCarousel();
  }

  const showPrevious = () => goToSlide(activeIndex - 1);
  const showNext = () => goToSlide(activeIndex + 1);

  prevButton.addEventListener("click", showPrevious);
  nextButton.addEventListener("click", showNext);
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      showPrevious();
    }

    if (event.key === "ArrowRight") {
      showNext();
    }
  });
  updateCarousel();
}

document.querySelectorAll("[data-choice-group]").forEach((group) => {
  const input = group.querySelector('input[type="hidden"]');
  const choices = group.querySelectorAll(".choice");

  choices.forEach((choice) => {
    choice.addEventListener("click", () => {
      choices.forEach((button) => button.classList.remove("active"));
      choice.classList.add("active");
      input.value = choice.dataset.value;
    });
  });
});

document.querySelectorAll("[data-multi-group]").forEach((group) => {
  const input = group.querySelector('input[type="hidden"]');
  const choices = group.querySelectorAll(".choice");

  choices.forEach((choice) => {
    choice.addEventListener("click", () => {
      choice.classList.toggle("active");
      const selected = [...choices]
        .filter((button) => button.classList.contains("active"))
        .map((button) => button.dataset.value);
      input.value = selected.join(", ");
    });
  });
});

const rsvpForm = document.querySelector(".rsvp-form");
const formStatus = document.querySelector(".form-status");
const submitButton = rsvpForm.querySelector(".submit-button");
const formEndpoint = "https://formsubmit.co/ajax/ak.snitko@gmail.com";

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(rsvpForm);
  const guestName = formData.get("guestName")?.toString().trim() || "Гостю";

  if (formData.get("_honey")) {
    return;
  }

  const submission = {
    _subject: `Нова відповідь від ${guestName}`,
    _template: "table",
    "Ім’я та прізвище": guestName,
    "Присутність": formData.get("attendance") || "Не вказано",
    "Напої": formData.get("drinks") || "Не вказано",
    "Житло": formData.get("hotel") || "Не вказано",
    "Побажання": formData.get("message") || "Без побажань",
  };

  submitButton.disabled = true;
  submitButton.classList.add("is-sending");
  submitButton.setAttribute("aria-busy", "true");
  formStatus.className = "form-status";
  formStatus.textContent = "Надсилаємо вашу відповідь...";

  try {
    const response = await fetch(formEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(submission),
    });
    const result = await response.json();

    if (!response.ok || result.success === false || result.success === "false") {
      throw new Error(result.message || "FormSubmit request failed");
    }

    localStorage.setItem("wedding-rsvp", JSON.stringify(submission));
    formStatus.classList.add("is-success");
    formStatus.textContent = `${guestName}, дякуємо! Вашу відповідь надіслано.`;
  } catch (error) {
    console.error("RSVP submission failed", error);
    formStatus.classList.add("is-error");
    formStatus.textContent = "Не вдалося надіслати відповідь. Перевірте інтернет і спробуйте ще раз.";
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("is-sending");
    submitButton.removeAttribute("aria-busy");
  }
});
