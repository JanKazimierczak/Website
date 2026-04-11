document.addEventListener("DOMContentLoaded", () => {
  const yearNode = document.querySelector("[data-year]");
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  if (toggle && mobileNav) {
    const closeMenu = () => {
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
    };

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.classList.toggle("is-open", !expanded);
      toggle.setAttribute("aria-expanded", String(!expanded));
      mobileNav.classList.toggle("is-open", !expanded);
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) {
        closeMenu();
      }
    });
  }

  const onScroll = () => {
    document.body.classList.toggle("nav-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const brandMark = document.querySelector("[data-brand-mark]");
  const brandMarkLink = document.querySelector("[data-brand-mark-link]");
  const brandToggle = document.querySelector("[data-brand-toggle]");

  if (brandMark && brandMarkLink && brandToggle) {
    let stockMode = false;

    const syncBrandMode = () => {
      brandMark.classList.toggle("is-stock-link", stockMode);
      brandMarkLink.href = stockMode ? "stocks.html" : "index.html";
      brandMarkLink.setAttribute("aria-label", stockMode ? "Go to stocks" : "Go to homepage");
      brandToggle.classList.toggle("is-active", stockMode);
      brandToggle.setAttribute("aria-pressed", String(stockMode));
    };

    syncBrandMode();

    brandToggle.addEventListener("click", () => {
      stockMode = !stockMode;
      syncBrandMode();
    });
  }

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const lightboxTitle = document.querySelector("[data-lightbox-title]");
  const lightboxCaption = document.querySelector("[data-lightbox-caption]");
  const lightboxClose = document.querySelector("[data-lightbox-close]");

  if (lightbox && lightboxImage) {
    const closeLightbox = () => {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.src = "";
      lightboxImage.alt = "";
    };

    document.addEventListener("click", (event) => {
      const zoomTarget = event.target.closest("[data-zoom-image]");
      if (!zoomTarget) {
        return;
      }

      lightboxImage.src = zoomTarget.getAttribute("data-zoom-image") || "";
      lightboxImage.alt = zoomTarget.getAttribute("data-zoom-alt") || "";
      if (lightboxTitle) {
        lightboxTitle.textContent = zoomTarget.getAttribute("data-zoom-title") || "Expanded image";
      }
      if (lightboxCaption) {
        lightboxCaption.textContent = zoomTarget.getAttribute("data-zoom-caption") || "";
      }
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    });

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  const ctmfModal = document.querySelector("[data-ctmf-modal]");
  const ctmfModalBody = document.querySelector("[data-ctmf-modal-body]");
  const ctmfModalTitle = document.querySelector("[data-ctmf-modal-title]");
  const ctmfModalClose = document.querySelector("[data-ctmf-close]");

  if (ctmfModal && ctmfModalBody) {
    const closeCtmfModal = () => {
      ctmfModal.classList.remove("is-open");
      ctmfModal.setAttribute("aria-hidden", "true");
      if (ctmfModalTitle) {
        ctmfModalTitle.textContent = "CTMF detail";
      }
      ctmfModalBody.innerHTML = "";
      document.body.classList.remove("modal-locked");
    };

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-ctmf-open]");
      if (!trigger) {
        return;
      }

      const templateId = trigger.getAttribute("data-ctmf-open");
      const template = templateId ? document.getElementById(templateId) : null;
      if (!template || !(template instanceof HTMLTemplateElement)) {
        return;
      }

      ctmfModalBody.innerHTML = "";
      ctmfModalBody.appendChild(template.content.cloneNode(true));
      if (ctmfModalTitle) {
        ctmfModalTitle.textContent = trigger.getAttribute("data-ctmf-title") || "CTMF detail";
      }
      ctmfModal.classList.add("is-open");
      ctmfModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-locked");
      ctmfModalBody.scrollTop = 0;
    });

    if (ctmfModalClose) {
      ctmfModalClose.addEventListener("click", closeCtmfModal);
    }

    ctmfModal.addEventListener("click", (event) => {
      if (event.target === ctmfModal) {
        closeCtmfModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && ctmfModal.classList.contains("is-open")) {
        closeCtmfModal();
      }
    });
  }

  const sectionNav = document.querySelector("[data-section-nav]");
  if (sectionNav) {
    const sectionNavShell = sectionNav.closest(".design-nav-shell");
    const siteNav = document.querySelector(".site-nav");
    const sectionNavMarker = document.createElement("div");
    sectionNavMarker.hidden = true;
    if (sectionNavShell?.parentNode) {
      sectionNavShell.parentNode.insertBefore(sectionNavMarker, sectionNavShell);
    }

    const sectionLinks = Array.from(sectionNav.querySelectorAll("[data-section-link]"));
    const trackedSections = sectionLinks
      .map((link) => {
        const sectionId = link.getAttribute("data-section-link");
        return sectionId ? document.getElementById(sectionId) : null;
      })
      .filter((section) => section instanceof HTMLElement);

    const setActiveSection = (activeId) => {
      sectionLinks.forEach((link) => {
        const isActive = link.getAttribute("data-section-link") === activeId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const syncSectionNavPlacement = () => {
      if (!sectionNavShell || !siteNav || !sectionNavMarker.parentNode) {
        return;
      }

      const shouldInlineHeader = window.innerWidth <= 1700;
      if (shouldInlineHeader) {
        const navLinks = siteNav.querySelector(".nav-links");
        const navToggle = siteNav.querySelector("[data-nav-toggle]");
        const insertionPoint = navLinks || navToggle || null;

        if (sectionNavShell.parentElement !== siteNav) {
          siteNav.insertBefore(sectionNavShell, insertionPoint);
        }
        sectionNavShell.classList.add("is-inline-header");
        siteNav.classList.add("has-inline-section-nav");
        return;
      }

      if (sectionNavShell.parentElement !== sectionNavMarker.parentNode || sectionNavMarker.nextSibling !== sectionNavShell) {
        sectionNavMarker.parentNode.insertBefore(sectionNavShell, sectionNavMarker.nextSibling);
      }
      sectionNavShell.classList.remove("is-inline-header");
      siteNav.classList.remove("has-inline-section-nav");
    };

    const getTrackingLine = () => {
      const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
      if (sectionNavShell?.classList.contains("is-inline-header")) {
        const inlineDepth = Math.min(Math.max(window.innerHeight * 0.16, 88), 140);
        return headerHeight + inlineDepth;
      }

      const desktopDepth = Math.min(Math.max(window.innerHeight * 0.24, 150), 260);
      return headerHeight + desktopDepth;
    };

    const syncActiveSection = () => {
      if (!trackedSections.length) {
        return;
      }

      const trackingLine = getTrackingLine();
      const sectionRects = trackedSections.map((section) => ({
        id: section.id,
        rect: section.getBoundingClientRect()
      }));
      let activeId = sectionRects[0].id;

      const containingSection = sectionRects.find(({ rect }) => rect.top <= trackingLine && rect.bottom >= trackingLine);
      if (containingSection) {
        activeId = containingSection.id;
      } else if (trackingLine < sectionRects[0].rect.top) {
        activeId = sectionRects[0].id;
      } else {
        const nearestSection = sectionRects.reduce(
          (closest, current) => {
            const distance = current.rect.top > trackingLine
              ? current.rect.top - trackingLine
              : trackingLine - current.rect.bottom;

            if (distance < closest.distance) {
              return { id: current.id, distance };
            }

            return closest;
          },
          { id: sectionRects[0].id, distance: Number.POSITIVE_INFINITY }
        );

        activeId = nearestSection.id;
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 16) {
        activeId = trackedSections[trackedSections.length - 1].id;
      }

      setActiveSection(activeId);
    };

    syncSectionNavPlacement();
    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", () => {
      syncSectionNavPlacement();
      syncActiveSection();
    });

    sectionLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const activeId = link.getAttribute("data-section-link");
        if (activeId) {
          setActiveSection(activeId);
        }
      });
    });
  }

  const form = document.querySelector("[data-contact-form]");
  if (!form) {
    return;
  }

  const statusNode = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector("[data-submit-button]");
  const submitLabel = form.querySelector("[data-submit-label]");
  const formPanel = document.querySelector("[data-form-panel]");
  const successPanel = document.querySelector("[data-form-success]");
  const resetButton = document.querySelector("[data-reset-form]");
  const WEB3FORMS_KEY = "5ad3db76-ab4a-462e-a12d-24ffc97a4ac6";

  const setStatus = (message, type) => {
    if (!statusNode) {
      return;
    }
    statusNode.textContent = message;
    statusNode.className = `form-message ${type}`;
    statusNode.hidden = !message;
  };

  const restoreSubmit = () => {
    if (submitButton) {
      submitButton.disabled = false;
    }
    if (submitLabel) {
      submitLabel.textContent = "Send message";
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("", "error");

    const name = form.querySelector("#fname")?.value.trim() || "";
    const email = form.querySelector("#femail")?.value.trim() || "";
    const subject = form.querySelector("#fsubject")?.value.trim() || "Portfolio enquiry";
    const topic = form.querySelector("#ftype")?.value || "General enquiry";
    const message = form.querySelector("#fmessage")?.value.trim() || "";

    if (!name || !email || !message) {
      setStatus("Enter your name, email address, and message.", "error");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
    }
    if (submitLabel) {
      submitLabel.textContent = "Sending...";
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name,
          email,
          subject,
          message: `Topic: ${topic}\n\n${message}`
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error("Form submission failed");
      }

      form.reset();
      if (formPanel) {
        formPanel.hidden = true;
      }
      if (successPanel) {
        successPanel.hidden = false;
      }
      restoreSubmit();
    } catch (error) {
      setStatus("Message delivery failed. Retry or use direct email instead.", "error");
      restoreSubmit();
    }
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (successPanel) {
        successPanel.hidden = true;
      }
      if (formPanel) {
        formPanel.hidden = false;
      }
      setStatus("", "error");
    });
  }
});
