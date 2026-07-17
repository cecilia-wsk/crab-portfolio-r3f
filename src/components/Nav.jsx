import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, navigate] = useLocation();

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMenuOpen);
  }, [isMenuOpen]);

  const handleNav = (to) => (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    navigate(to);
  };

  return (
    <nav className="ui-nav" aria-label="Main">
      <a className="ui-brand" href="/" onClick={handleNav("/")}>
        Cecilia Wielonsky
      </a>

      <button
        type="button"
        className="ui-nav-mobile"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((p) => !p)}
      >
        <svg
          className="ui-nav-mobile-toggler-icon"
          width="40"
          height="40"
          viewBox="0 0 41 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="top"
            d="M39.5987 0H1.40127C0.622785 0 0 0.626826 0 1.41036C0 2.19389 0.622785 2.82071 1.40127 2.82071H39.5987C40.3772 2.82071 41 2.19389 41 1.41036C41 0.626826 40.3772 0 39.5987 0Z"
            fill="#a3a3a3"
          />
          <path
            className="middle"
            d="M39.5987 6.0896H1.40127C0.622785 6.0896 0 6.71643 0 7.49996C0 8.28349 0.622785 8.91031 1.40127 8.91031H39.5987C40.3772 8.91031 41 8.28349 41 7.49996C41 6.71643 40.3772 6.0896 39.5987 6.0896Z"
            fill="#a3a3a3"
          />
          <path
            className="bottom"
            d="M39.5987 12.1792H1.40127C0.622785 12.1792 0 12.806 0 13.5896C0 14.3731 0.622785 14.9999 1.40127 14.9999H39.5987C40.3772 14.9999 41 14.3731 41 13.5896C41 12.806 40.3772 12.1792 39.5987 12.1792Z"
            fill="#a3a3a3"
          />
        </svg>
      </button>

      <div
        className={`ui-links ${isMenuOpen ? "open" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <a
          href="/about"
          className={`ui-link ${location === "/about" ? "active" : ""}`}
          onClick={handleNav("/about")}
        >
          <span className="ui-num">01</span>ABOUT
        </a>
        <a
          href="/works"
          className={`ui-link ${location === "/works" ? "active" : ""}`}
          onClick={handleNav("/works")}
        >
          <span className="ui-num">02</span>WORKS
        </a>
        {/* <a
          href="/contact"
          className={`ui-link ${location === "/contact" ? "active" : ""}`}
          onClick={handleNav("/contact")}
        >
          <span className="ui-num">03</span>CONTACT
        </a> */}
      </div>
    </nav>
  );
}
