interface ReportFooterProps {
  className?: string;
}

function FooterIcon({ kind }: { kind: "web" | "email" | "phone" | "instagram" }) {
  if (kind === "web") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="ls-footer-icon-svg">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (kind === "email") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="ls-footer-icon-svg">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m4.5 7.5 7.5 6 7.5-6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (kind === "phone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="ls-footer-icon-svg">
        <path
          d="M6.6 3.8a2 2 0 0 1 2.2-.9l2 .8a2 2 0 0 1 1.2 2l-.2 2a2 2 0 0 1-.8 1.4l-1.2 1a14.4 14.4 0 0 0 4.1 4.1l1-1.2a2 2 0 0 1 1.4-.8l2-.2a2 2 0 0 1 2 1.2l.8 2a2 2 0 0 1-.9 2.2l-1.5 1a4 4 0 0 1-3.9.3c-3.4-1.6-6.2-4.4-7.8-7.8a4 4 0 0 1 .3-3.9l1-1.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ls-footer-icon-svg">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function ReportFooter({ className }: ReportFooterProps) {
  const footerClassName = className
    ? `report-section report-footer ls-report-footer ${className}`
    : "report-section report-footer ls-report-footer";

  return (
    <footer className={footerClassName}>
      <a
        className="ls-report-footer-cta"
        href="https://brainmoto.in"
        target="_blank"
        rel="noreferrer"
      >
        Click here to understand this report better
      </a>
      <p className="ls-report-footer-links">
        <a
          className="ls-report-footer-item"
          href="https://www.brainmoto.in"
          target="_blank"
          rel="noreferrer"
        >
          <FooterIcon kind="web" />
          www.brainmoto.in
        </a>
        <a className="ls-report-footer-item" href="mailto:info@brainmoto.in">
          <FooterIcon kind="email" />
          info@brainmoto.in
        </a>
        <a className="ls-report-footer-item" href="tel:+919960095665">
          <FooterIcon kind="phone" />
          +91 99600 95665
        </a>
        <a
          className="ls-report-footer-item"
          href="https://instagram.com/brainmoto_"
          target="_blank"
          rel="noreferrer"
        >
          <FooterIcon kind="instagram" />
          brainmoto_
        </a>
      </p>
    </footer>
  );
}
