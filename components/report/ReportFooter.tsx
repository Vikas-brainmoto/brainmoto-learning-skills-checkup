interface ReportFooterProps {
  className?: string;
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
          <span aria-hidden="true" className="ls-footer-icon">
            🌐
          </span>
          www.brainmoto.in
        </a>
        <a className="ls-report-footer-item" href="mailto:info@brainmoto.in">
          <span aria-hidden="true" className="ls-footer-icon">
            ✉
          </span>
          info@brainmoto.in
        </a>
        <a className="ls-report-footer-item" href="tel:+919960095665">
          <span aria-hidden="true" className="ls-footer-icon">
            ☎
          </span>
          +91 99600 95665
        </a>
        <a
          className="ls-report-footer-item"
          href="https://instagram.com/brainmoto_"
          target="_blank"
          rel="noreferrer"
        >
          <span aria-hidden="true" className="ls-footer-icon">
            📷
          </span>
          brainmoto_
        </a>
      </p>
    </footer>
  );
}
