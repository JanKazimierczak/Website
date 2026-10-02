document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const siteShell = document.querySelector(".site-shell");

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");

  if (navToggle && mobileNav) {
    const navLinks = Array.from(mobileNav.querySelectorAll("a"));

    const closeMenu = ({ restoreFocus = false } = {}) => {
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      if (restoreFocus) {
        navToggle.focus({ preventScroll: true });
      }
    };

    const openMenu = () => {
      navToggle.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close menu");
      mobileNav.classList.add("is-open");
      mobileNav.setAttribute("aria-hidden", "false");
    };

    mobileNav.setAttribute("aria-hidden", "true");

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navLinks.forEach((link) => link.addEventListener("click", () => closeMenu()));

    document.addEventListener("click", (event) => {
      if (
        navToggle.getAttribute("aria-expanded") === "true"
        && !navToggle.contains(event.target)
        && !mobileNav.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeMenu({ restoreFocus: true });
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) {
        closeMenu();
      }
    });
  }

  const syncHeaderState = () => {
    body.classList.toggle("nav-scrolled", window.scrollY > 12);
  };

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      if (!child.hasAttribute("data-reveal")) {
        child.setAttribute("data-reveal", "rise");
      }
      child.style.setProperty("--reveal-index", String(index));
    });
  });

  const automaticRevealSelectors = [
    ".page-hero > *",
    ".about-hero > *",
    ".contact-hero > *",
    ".section-heading:not([data-reveal-group]) > *",
    ".project-index-item",
    ".principle-grid > article",
    ".evidence-capability-list > article",
    ".education-card",
    ".profile-link-grid > a",
    ".contact-note",
    ".result-ledger",
    ".gallery-item",
    ".gallery-tile",
    ".ctmf-trigger"
  ].join(",");

  document.querySelectorAll(automaticRevealSelectors).forEach((element) => {
    if (!element.hasAttribute("data-reveal")) {
      element.setAttribute("data-reveal", "rise");
    }
  });

  const revealTargets = Array.from(document.querySelectorAll("[data-reveal]"));
  const revealAll = () => revealTargets.forEach((target) => target.classList.add("is-revealed"));

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    });

    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealAll();
  }

  const syncMotionPreference = () => {
    document.documentElement.classList.toggle("motion-ready", !motionPreference.matches);
    if (motionPreference.matches) revealAll();
  };
  syncMotionPreference();
  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
  motionPreference.addEventListener?.("change", syncMotionPreference);

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const setBackgroundInert = (isInert) => {
    if (siteShell && "inert" in siteShell) {
      siteShell.inert = isInert;
    }
  };

  const trapFocus = (event, container) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = Array.from(container.querySelectorAll(focusableSelector)).filter((element) => {
      return element instanceof HTMLElement && !element.hidden && element.offsetParent !== null;
    });

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxTitle = document.querySelector("[data-lightbox-title]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");
  let lightboxOpener = null;

  const zoomTargets = Array.from(document.querySelectorAll("[data-zoom-image]"));
  zoomTargets.forEach((target) => {
    const isNativeInteractive = target.matches("button, a[href]");
    if (!isNativeInteractive) {
      target.setAttribute("role", "button");
      target.setAttribute("tabindex", "0");
    }
    const title = target.getAttribute("data-zoom-title");
    const image = target.querySelector("img");
    const alternative = image?.getAttribute("alt") || "project image";
    target.setAttribute("aria-label", `Expand image: ${title || alternative}`);
  });

  if (lightbox && lightboxImage) {
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-labelledby", "lightbox-dialog-title");
    if (lightboxTitle) {
      lightboxTitle.id = "lightbox-dialog-title";
    }

    // WebP versions exist for most zoom targets; fall back to the original on decode failure.
    lightboxImage.addEventListener("error", () => {
      const original = lightboxImage.getAttribute("data-fallback-src");
      if (original && !lightboxImage.src.endsWith(original)) {
        lightboxImage.src = original;
      }
    });

    const openLightbox = (target) => {
      lightboxOpener = target;
      const original = target.getAttribute("data-zoom-image") || "";
      lightboxImage.setAttribute("data-fallback-src", original);
      lightboxImage.src = target.getAttribute("data-zoom-image-webp") || original;
      lightboxImage.alt = target.getAttribute("data-zoom-alt") || "";
      if (lightboxTitle) {
        lightboxTitle.textContent = target.getAttribute("data-zoom-title") || "Expanded project image";
      }
      if (lightboxCaption) {
        lightboxCaption.textContent = target.getAttribute("data-zoom-caption") || "";
      }
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      body.classList.add("modal-locked");
      setBackgroundInert(true);
      lightboxClose?.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.removeAttribute("data-fallback-src");
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "";
      body.classList.remove("modal-locked");
      setBackgroundInert(false);
      if (lightboxOpener instanceof HTMLElement) {
        lightboxOpener.focus();
      }
      lightboxOpener = null;
    };

    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-zoom-image]");
      if (target) {
        openLightbox(target);
      }
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target.closest?.("[data-zoom-image]");
      if (target && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openLightbox(target);
        return;
      }

      if (!lightbox.classList.contains("is-open")) {
        return;
      }

      if (event.key === "Escape") {
        closeLightbox();
      } else {
        trapFocus(event, lightbox);
      }
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  const ctmfModal = document.querySelector("[data-ctmf-modal]");
  const ctmfModalBody = document.querySelector("[data-ctmf-modal-body]");
  const ctmfModalTitle = document.querySelector("[data-ctmf-modal-title]");
  const ctmfModalClose = document.querySelector("[data-ctmf-close]");
  let ctmfOpener = null;

  if (ctmfModal && ctmfModalBody) {
    ctmfModal.setAttribute("role", "dialog");
    ctmfModal.setAttribute("aria-modal", "true");
    ctmfModal.setAttribute("aria-labelledby", "ctmf-dialog-title");
    if (ctmfModalTitle) {
      ctmfModalTitle.id = "ctmf-dialog-title";
    }

    const closeCtmfModal = () => {
      ctmfModal.classList.remove("is-open");
      ctmfModal.setAttribute("aria-hidden", "true");
      ctmfModalBody.innerHTML = "";
      body.classList.remove("modal-locked");
      setBackgroundInert(false);
      if (ctmfOpener instanceof HTMLElement) {
        ctmfOpener.focus();
      }
      ctmfOpener = null;
    };

    const openCtmfModal = (trigger) => {
      const templateId = trigger.getAttribute("data-ctmf-open");
      const template = templateId ? document.getElementById(templateId) : null;
      if (!(template instanceof HTMLTemplateElement)) {
        return;
      }

      ctmfOpener = trigger;
      ctmfModalBody.innerHTML = "";
      ctmfModalBody.appendChild(template.content.cloneNode(true));
      ctmfModalTitle.textContent = trigger.getAttribute("data-ctmf-title") || "Detailed project review";
      ctmfModal.classList.add("is-open");
      ctmfModal.setAttribute("aria-hidden", "false");
      body.classList.add("modal-locked");
      setBackgroundInert(true);
      ctmfModalBody.scrollTop = 0;
      ctmfModalClose?.focus();
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-ctmf-open]");
      if (trigger) {
        openCtmfModal(trigger);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!ctmfModal.classList.contains("is-open")) {
        return;
      }
      if (event.key === "Escape") {
        closeCtmfModal();
      } else {
        trapFocus(event, ctmfModal);
      }
    });

    ctmfModalClose?.addEventListener("click", closeCtmfModal);
    ctmfModal.addEventListener("click", (event) => {
      if (event.target === ctmfModal) {
        closeCtmfModal();
      }
    });
  }

  const sectionNav = document.querySelector("[data-section-nav]");
  if (sectionNav) {
    const sectionLinks = Array.from(sectionNav.querySelectorAll("[data-section-link]"));
    const sections = sectionLinks
      .map((link) => document.getElementById(link.getAttribute("data-section-link")))
      .filter((section) => section instanceof HTMLElement);
    let frameRequested = false;

    const setActiveSection = (activeId) => {
      sectionLinks.forEach((link) => {
        const active = link.getAttribute("data-section-link") === activeId;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const updateActiveSection = () => {
      frameRequested = false;
      const trackingLine = Math.min(220, window.innerHeight * 0.28);
      let activeId = sections[0]?.id;

      sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= trackingLine) {
          activeId = section.id;
        }
      });

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        activeId = sections[sections.length - 1]?.id;
      }

      if (activeId) {
        setActiveSection(activeId);
      }
    };

    const requestSectionUpdate = () => {
      if (!frameRequested) {
        frameRequested = true;
        window.requestAnimationFrame(updateActiveSection);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", requestSectionUpdate, { passive: true });
    window.addEventListener("resize", requestSectionUpdate);
    sectionLinks.forEach((link) => {
      link.addEventListener("click", () => setActiveSection(link.getAttribute("data-section-link")));
    });
  }

  const contactForm = document.querySelector("[data-contact-form]");
  if (contactForm instanceof HTMLFormElement) {
    const statusNode = contactForm.querySelector("[data-form-status]");
    const submitButton = contactForm.querySelector("[data-submit-button]");
    const submitLabel = contactForm.querySelector("[data-submit-label]");
    const messageField = contactForm.querySelector("#contact-message");
    const messageCount = contactForm.querySelector("[data-message-count]");
    const honeypot = contactForm.querySelector("[name='_honey']");
    const formUrlField = contactForm.querySelector("[data-contact-url]");
    const serviceNote = contactForm.querySelector("[data-contact-service-note]");
    const successPanel = document.querySelector("[data-contact-success]");
    const successHeading = successPanel?.querySelector("[data-success-heading]");
    const resetButton = successPanel?.querySelector("[data-reset-form]");
    let isSubmitting = false;
    const isLocalPreview = window.location.protocol === "file:" || ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    const formRecipient = (() => {
      try {
        return decodeURIComponent(new URL(contactForm.action).pathname.split("/").filter(Boolean).pop() || "");
      } catch {
        return "";
      }
    })();

    if (formUrlField instanceof HTMLInputElement) {
      formUrlField.value = window.location.href.split(/[?#]/)[0];
    }

    if (serviceNote instanceof HTMLElement && isLocalPreview) {
      serviceNote.hidden = false;
      serviceNote.textContent = "Local preview only: email delivery becomes available after this page is published at a public HTTPS address. The first live submission will send a one-time FormSubmit activation email to Jan.";
      contactForm.dataset.deliveryMode = "preview";
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-describedby", "contact-service-note");
      }
      if (submitLabel) {
        submitLabel.textContent = "Publish to enable";
      }
    }

    const updateMessageCount = () => {
      if (messageField instanceof HTMLTextAreaElement && messageCount) {
        messageCount.textContent = `${messageField.value.length} / ${messageField.maxLength}`;
      }
    };

    const setFormStatus = (message, type = "") => {
      if (!statusNode) {
        return;
      }
      statusNode.textContent = message;
      statusNode.className = `form-message${type ? ` ${type}` : ""}`;
      statusNode.hidden = !message;
      statusNode.setAttribute("role", type === "error" ? "alert" : "status");
    };

    const setSubmitting = (submitting) => {
      isSubmitting = submitting;
      contactForm.setAttribute("aria-busy", String(submitting));
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = submitting;
      }
      if (submitLabel) {
        submitLabel.textContent = submitting ? "Sending…" : "Send message";
      }
    };

    const showSuccess = () => {
      setSubmitting(false);
      contactForm.reset();
      updateMessageCount();
      contactForm.hidden = true;
      if (successPanel instanceof HTMLElement) {
        successPanel.hidden = false;
      }
      if (successHeading instanceof HTMLElement) {
        successHeading.focus({ preventScroll: true });
      }
    };

    const showForm = () => {
      if (successPanel instanceof HTMLElement) {
        successPanel.hidden = true;
      }
      contactForm.hidden = false;
      setFormStatus("");
      contactForm.querySelector("input:not([type='hidden']):not([tabindex='-1'])")?.focus({ preventScroll: true });
    };

    updateMessageCount();
    messageField?.addEventListener("input", updateMessageCount);

    contactForm.addEventListener("invalid", (event) => {
      if (event.target instanceof HTMLElement) {
        event.target.setAttribute("aria-invalid", "true");
      }
    }, true);

    contactForm.addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        if (event.target.checkValidity()) {
          event.target.removeAttribute("aria-invalid");
        }
      }
    });

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (isLocalPreview) {
        setFormStatus("Email delivery is disabled in local preview. Publish the site at an HTTPS address, then activate FormSubmit from the first live submission.", "error");
        return;
      }
      if (isSubmitting || !contactForm.reportValidity()) {
        return;
      }

      if (honeypot instanceof HTMLInputElement && honeypot.value) {
        showSuccess();
        return;
      }

      const endpoint = contactForm.action;
      const formData = new FormData(contactForm);
      const payload = Object.fromEntries(formData.entries());
      payload.source = "Jan Kazimierczak engineering portfolio";

      setSubmitting(true);
      setFormStatus("Sending your message…", "pending");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 25000);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        const result = await response.json().catch(() => null);
        const providerMessage = typeof result?.message === "string" ? result.message.trim() : "";
        const activationPending = /activat|confirm|verif/i.test(providerMessage);
        const deliveryConfirmed = response.ok && result && !activationPending && (result.success === true || result.success === "true");
        if (!deliveryConfirmed) {
          const error = new Error(providerMessage || `FormSubmit returned HTTP ${response.status}`);
          error.name = "ContactProviderError";
          error.providerMessage = providerMessage;
          error.status = response.status;
          throw error;
        }
        showSuccess();
      } catch (error) {
        setSubmitting(false);
        const providerMessage = typeof error?.providerMessage === "string" ? error.providerMessage : "";
        const normalizedMessage = providerMessage.toLowerCase();
        let userMessage;

        if (error?.name === "AbortError") {
          userMessage = "FormSubmit took too long to respond. Your message was not confirmed as delivered; please retry.";
        } else if (/activat|confirm|verif/.test(normalizedMessage)) {
          userMessage = `Delivery needs one-time FormSubmit activation. Check ${formRecipient || "the recipient inbox"} (including spam), confirm the form, then retry.`;
        } else if (/captcha|spam|bot|rate|limit/.test(normalizedMessage)) {
          userMessage = "FormSubmit's anti-spam check rejected this attempt. Please use a complete message and retry in a moment.";
        } else if (isLocalPreview) {
          userMessage = `This local preview was rejected by FormSubmit. Activate the form from ${formRecipient || "the recipient inbox"}, then test again from the final HTTPS contact page.`;
        } else if (providerMessage) {
          userMessage = `FormSubmit could not confirm delivery: ${providerMessage.slice(0, 220)}`;
        } else {
          userMessage = "The message was not confirmed as delivered. Please retry, or use the direct email fallback.";
        }

        console.warn("Contact form delivery was not confirmed", {
          status: error?.status || 0,
          type: error?.name || "Error",
          providerMessage: providerMessage || "No JSON error message returned"
        });
        setFormStatus(userMessage, "error");
        statusNode?.focus({ preventScroll: true });
      } finally {
        window.clearTimeout(timeout);
      }
    });

    resetButton?.addEventListener("click", showForm);
  }
});
