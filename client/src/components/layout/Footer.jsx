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
          <li><Link to="/auth/login">Login</Link></li>
          <li><Link to="/auth/signup">Sign Up</Link></li>
          <li><Link to="/creator">Creator Program</Link></li>
        </ul>

        {/* Right */}
        <div style={{ textAlign: 'right' }}>
          <div className="footer-copy">© 2025 AniCart. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 8 }}>
            <a href="#" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', color: 'var(--color-text-3)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--color-accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--color-text-3)'}
            >Privacy</a>
            <a href="#" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', color: 'var(--color-text-3)', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'var(--color-accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--color-text-3)'}
            >Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
