/** @type {import('next').NextConfig} */
const nextConfig = {
  // En desarrollo local (sin Docker/Nginx), Next.js hace el proxy de /api → backend.
  // En Docker, Nginx intercepta /api antes de que llegue a Next.js, así que este
  // rewrite nunca se ejecuta en ese contexto. Ambos escenarios quedan cubiertos.
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090'
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
