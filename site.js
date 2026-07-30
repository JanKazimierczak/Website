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
      if (window.innerWidth > 820) {
        closeMenu();
      }
    });
  }

  const syncHeaderState = () => {
    body.classList.toggle("nav-scrolled", window.scrollY > 12);
  };

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const heroMotionQuery = window.matchMedia("(min-width: 981px) and (min-height: 720px)");
  const root = document.documentElement;
  const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
  const smoothstep = (minimum, maximum, value) => {
    const normalized = clamp((value - minimum) / (maximum - minimum));
    return normalized * normalized * (3 - 2 * normalized);
  };

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

  const heroScene = document.querySelector("[data-hero-motion]");
  const projectScroll = document.querySelector("[data-project-scroll]");
  const projectSteps = Array.from(document.querySelectorAll("[data-project-step]"));
  const projectPanels = Array.from(document.querySelectorAll("[data-project-panel]"));
  const projectCount = document.querySelector("[data-project-count]");
  const projectPinnedCount = document.querySelector("[data-project-pinned-count]");
  const projectStageSticky = document.querySelector(".project-stage-sticky");
  const themedSections = Array.from(document.querySelectorAll("[data-page-theme]"));
  const heroCopyLayer = heroScene?.querySelector("[data-hero-layer='copy']");
  const heroVisualLayer = heroScene?.querySelector("[data-hero-layer='visual']");
  let activeProjectIndex = 0;
  let homeMotionFrame = 0;
  let renderedHeroProgress = 0;
  let renderedHeroHandoff = 0;
  let renderedHeroCopyHold = 0;
  let renderedHeroVisualHold = 0;
  let heroProgressInitialized = false;
  let lastHeroMotionTime = 0;

  const activateProject = (index) => {
    if (!projectSteps.length || index === activeProjectIndex && projectSteps[index]?.classList.contains("is-active")) {
      return;
    }

    activeProjectIndex = index;
    projectSteps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === index));
    projectPanels.forEach((panel, panelIndex) => panel.classList.toggle("is-active", panelIndex === index));
    if (projectCount) {
      projectCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(projectSteps.length).padStart(2, "0")}`;
    }
    if (projectPinnedCount) {
      projectPinnedCount.textContent = `${String(index + 1).padStart(2, "0")} / ${String(projectSteps.length).padStart(2, "0")}`;
    }
  };

  const clearHeroMotion = () => {
    if (!heroScene) {
      return;
    }
    renderedHeroProgress = 0;
    renderedHeroHandoff = 0;
    renderedHeroCopyHold = 0;
    renderedHeroVisualHold = 0;
    heroProgressInitialized = false;
    lastHeroMotionTime = 0;
    ["--hero-copy-y", "--hero-copy-opacity", "--hero-visual-y", "--hero-visual-scale", "--hero-visual-opacity", "--hero-prompt-opacity"].forEach((property) => {
      heroScene.style.removeProperty(property);
    });
  };

  const updatePageTheme = () => {
    const trackingLine = Math.min(96, window.innerHeight * 0.14);
    const activeTheme = themedSections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= trackingLine && rect.bottom > trackingLine;
    })?.getAttribute("data-page-theme");
    body.classList.toggle("theme-dark", activeTheme === "dark");
  };

  const updateHomeMotion = (timestamp = window.performance.now()) => {
    homeMotionFrame = 0;
    let continueHeroMotion = false;
    syncHeaderState();
    updatePageTheme();
    const projectRect = projectScroll?.getBoundingClientRect();

    if (heroScene && heroMotionQuery.matches && !motionPreference.matches) {
      const heroRect = heroScene.getBoundingClientRect();
      const startLine = Math.min(112, window.innerHeight * 0.14);
      const travel = Math.max(320, heroRect.height - window.innerHeight + startLine);
      const rawProgress = clamp((startLine - heroRect.top) / travel);
      const targetProgress = smoothstep(0.1, 0.96, rawProgress);
      const targetHandoff = projectRect
        ? 1 - smoothstep(window.innerHeight * 0.35, window.innerHeight * 0.75, projectRect.top)
        : 0;
      const stickyTop = clamp(window.innerHeight * 0.135, 116, 140);
      const heroPaddingBottom = Number.parseFloat(window.getComputedStyle(heroScene).paddingBottom) || 0;
      const heroLayerBoundary = heroRect.bottom - heroPaddingBottom;
      const targetCopyHold = heroCopyLayer
        ? Math.max(0, stickyTop + heroCopyLayer.offsetHeight - heroLayerBoundary)
        : 0;
      const targetVisualHold = heroVisualLayer
        ? Math.max(0, stickyTop + heroVisualLayer.offsetHeight - heroLayerBoundary)
        : 0;

      if (!heroProgressInitialized) {
        renderedHeroProgress = targetProgress;
        renderedHeroHandoff = targetHandoff;
        renderedHeroCopyHold = targetCopyHold;
        renderedHeroVisualHold = targetVisualHold;
        heroProgressInitialized = true;
      } else {
        const elapsed = clamp(timestamp - lastHeroMotionTime, 8, 34);
        const easing = 1 - Math.exp(-elapsed / 92);
        const progressDifference = targetProgress - renderedHeroProgress;
        const handoffDifference = targetHandoff - renderedHeroHandoff;

        renderedHeroProgress += progressDifference * easing;
        renderedHeroHandoff += handoffDifference * easing;
        renderedHeroCopyHold = targetCopyHold;
        renderedHeroVisualHold = targetVisualHold;

        if (Math.abs(progressDifference) < 0.0005) {
          renderedHeroProgress = targetProgress;
        }
        if (Math.abs(handoffDifference) < 0.0005) {
          renderedHeroHandoff = targetHandoff;
        }

        if (
          Math.abs(progressDifference) >= 0.0005
          || Math.abs(handoffDifference) >= 0.0005
        ) {
          continueHeroMotion = true;
        }
      }

      lastHeroMotionTime = timestamp;
      const progress = renderedHeroProgress;
      const handoffVisibility = 1 - renderedHeroHandoff;
      const holdVisibility = 1 - smoothstep(0.92, 1, renderedHeroHandoff);
      heroScene.style.setProperty("--hero-copy-y", `${(-progress * 22 + renderedHeroCopyHold * holdVisibility).toFixed(2)}px`);
      heroScene.style.setProperty("--hero-copy-opacity", handoffVisibility.toFixed(3));
      heroScene.style.setProperty("--hero-visual-y", `${(progress * 14 + renderedHeroVisualHold * holdVisibility).toFixed(2)}px`);
      heroScene.style.setProperty("--hero-visual-scale", (1 + progress * 0.024).toFixed(4));
      heroScene.style.setProperty("--hero-visual-opacity", handoffVisibility.toFixed(3));
      heroScene.style.setProperty("--hero-prompt-opacity", (1 - clamp(progress / 0.22)).toFixed(3));
    } else {
      clearHeroMotion();
    }

    if (projectScroll && projectSteps.length && projectRect) {
      const sectionRect = projectRect;
      const projectProgress = clamp((window.innerHeight - sectionRect.top) / (sectionRect.height + window.innerHeight));
      projectScroll.style.setProperty("--project-scroll-progress", projectProgress.toFixed(4));
      if (sectionRect.top < window.innerHeight && sectionRect.bottom > 0) {
        const stageRect = projectStageSticky?.getBoundingClientRect();
        const targetLine = stageRect && stageRect.width > 0
          ? clamp(stageRect.top + stageRect.height * 0.52, window.innerHeight * 0.38, window.innerHeight * 0.62)
          : window.innerHeight * 0.5;
        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;
        projectSteps.forEach((step, index) => {
          const rect = step.getBoundingClientRect();
          const distance = Math.abs(rect.top + rect.height / 2 - targetLine);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        activateProject(closestIndex);
      }
    }

    if (continueHeroMotion) {
      requestHomeMotion();
    }
  };

  const requestHomeMotion = () => {
    if (!homeMotionFrame) {
      homeMotionFrame = window.requestAnimationFrame(updateHomeMotion);
    }
  };

  projectSteps.forEach((step, index) => {
    step.addEventListener("focus", () => activateProject(index));
    step.addEventListener("mouseenter", () => activateProject(index));
  });

  const syncMotionPreference = () => {
    root.classList.toggle("motion-ready", !motionPreference.matches);
    if (motionPreference.matches) {
      revealAll();
    }
    requestHomeMotion();
  };

  syncMotionPreference();
  requestHomeMotion();
  window.addEventListener("scroll", requestHomeMotion, { passive: true });
  window.addEventListener("resize", requestHomeMotion);
  motionPreference.addEventListener?.("change", syncMotionPreference);
  heroMotionQuery.addEventListener?.("change", requestHomeMotion);

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

    const openLightbox = (target) => {
      lightboxOpener = target;
      lightboxImage.src = target.getAttribute("data-zoom-image") || "";
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
