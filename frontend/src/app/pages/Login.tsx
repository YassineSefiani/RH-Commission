import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';
import logo from '../assets/logo-on-black.png';
import { useUser, AVAILABLE_USERS } from '../context/UserContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Email ou mot de passe incorrect');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  return (
    <div className="abc-login-shell">
      {/* Left decorative panel */}
      <aside className="abc-login-aside">
        <div className="abc-login-aside-top">
          <div className="abc-login-brand">
            <div className="abc-logo-wrap">
              <img src={logo} alt="ABC DIS" />
            </div>
            <div className="abc-brand-text">
              <span className="abc-brand-name" style={{ color: '#fff' }}>ABC DIS</span>
              <span className="abc-brand-tagline" style={{ color: 'rgba(255,255,255,0.55)' }}>Gestion RH</span>
            </div>
          </div>
        </div>

        <div className="abc-login-aside-mid">
          <p className="abc-login-eyebrow">Suite RH commerciale</p>
          <h1 className="abc-login-headline">
            Pilotez vos<br />commissions<br />avec précision.
          </h1>

          <div className="abc-login-stat-pills">
            <div className="abc-login-stat">
              <span className="abc-mono abc-login-stat-num">2.4M MAD</span>
              <span className="abc-login-stat-lbl">ventes générées</span>
            </div>
            <div className="abc-login-stat">
              <span className="abc-mono abc-login-stat-num">182k MAD</span>
              <span className="abc-login-stat-lbl">commissions versées</span>
            </div>
            <div className="abc-login-stat">
              <span className="abc-mono abc-login-stat-num">24</span>
              <span className="abc-login-stat-lbl">commerciaux actifs</span>
            </div>
          </div>
        </div>

        <div className="abc-login-aside-bot">
          <span className="abc-login-foot">© 2026 ABC DIS · Casablanca, MA</span>
        </div>
      </aside>

      {/* Right form panel */}
      <section className="abc-login-form-wrap">
        <div className="abc-login-form-inner">
          <div className="abc-login-form-head">
            <h2 className="abc-login-title">Connexion</h2>
            <p className="abc-sub">Accédez à votre espace de gestion des commissions</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="abc-login-error">{error}</div>
            )}

            <div className="abc-login-form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@abcdis.com"
                required
              />
            </div>

            <div className="abc-login-form-field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="abc-login-cta" disabled={isLoading}>
              <LogIn size={16} />
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="abc-login-quicklogin">
            <p className="abc-login-quicklogin-label">Connexion rapide</p>
            <div className="abc-login-quicklogin-btns">
              {AVAILABLE_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  className="abc-login-quickbtn"
                  onClick={() => handleQuickLogin(u.email, u.password)}
                >
                  {u.superRole}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
