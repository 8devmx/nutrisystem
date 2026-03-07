"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UtensilsCrossed, Eye, EyeOff, Loader2, Leaf } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login: setAuthUser } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await authApi.login(email, password)
      if (response.success) {
        setAuthUser(response.data.user, response.data.token)
        router.push("/admin")
      } else {
        setError(response.message || "Error al iniciar sesión")
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
        <div className="bg-gradient"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <UtensilsCrossed size={28} />
          </div>
          <h1 className="login-title">NutriSystem</h1>
          <p className="login-subtitle">Sistema de gestión nutricional</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <Label htmlFor="password">Contraseña</Label>
            <div className="password-wrapper">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="footer-leaf">
            <Leaf size={16} />
          </div>
          <p>Tu salud, nuestra prioridad</p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #16A34A 0%, #0D9488 50%, #0EA5E9 100%);
          opacity: 0.9;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
        }

        .bg-shape-1 {
          width: 400px;
          height: 400px;
          background: #16A34A;
          top: -100px;
          left: -100px;
          animation: float 8s ease-in-out infinite;
        }

        .bg-shape-2 {
          width: 300px;
          height: 300px;
          background: #22C55E;
          bottom: -50px;
          right: -50px;
          animation: float 6s ease-in-out infinite reverse;
        }

        .bg-shape-3 {
          width: 200px;
          height: 200px;
          background: #34D399;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 10s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.5; }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        pulse {
           }

        @keyframes0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.5; }
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          border-radius: 1.5rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          width: 72px;
          height: 72px;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #16A34A 0%, #22C55E 100%);
          color: white;
          box-shadow: 0 10px 30px -10px rgba(22, 163, 74, 0.5);
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1F2937;
          margin-bottom: 0.25rem;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #6B7280;
        }

        .login-error {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          font-size: 0.875rem;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group :global(label) {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .input-group :global(input) {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          color: #1F2937;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .input-group :global(input)::placeholder {
          color: #9CA3AF;
        }

        .input-group :global(input:focus) {
          outline: none;
          background: white;
          border-color: #16A34A;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper :global(input) {
          padding-right: 3rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9CA3AF;
          padding: 0.25rem;
          display: flex;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #6B7280;
        }

        .submit-btn {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.875rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(5, 150, 105, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          color: #9CA3AF;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .footer-leaf {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ECFDF5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10B981;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        :global(.animate-spin) {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
