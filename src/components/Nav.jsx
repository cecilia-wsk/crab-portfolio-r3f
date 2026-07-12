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
        className="ui-hamburger"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((p) => !p)}
      >
        <span />
        <span />
        <span />
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
        <a
          href="/contact"
          className={`ui-link ${location === "/contact" ? "active" : ""}`}
          onClick={handleNav("/contact")}
        >
          <span className="ui-num">03</span>CONTACT
        </a>
      </div>
    </nav>
  );
}
