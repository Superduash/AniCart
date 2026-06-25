import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Left */}
        <div>
          <div className="footer-logo">ANI<span>CART</span></div>
          <div className="footer-tagline">Premium Anime Wallpapers</div>
        </div>

        {/* Center links */}
        <ul className="footer-links">
          <li><Link to="/marketplace">Browse</Link></li>
          <li><Link to="/anime">Anime Series</Link></li>
          <li><Link to="/characters">Characters</Link></li>
          <li><Link to="/collections">Collections</Link></li>
          <li><Link to="/new">New Wallpapers</Link></li>
          <li><Link to="/trending">Trending</Link></li>
          <li><Link to="/creator/apply">Creator Program</Link></li>
        </ul>

        {/* Right */}
        <div style={{ textAlign: 'right' }}>
          <div className="footer-copy">© {new Date().getFullYear()} AniCart. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8 }}>
            <Link to="/privacy" className="footer-link-small">Privacy</Link>
            <Link to="/terms" className="footer-link-small">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
