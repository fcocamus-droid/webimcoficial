import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="bg-navy-600 text-blue-100">
      <div className="container-base py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Logo size="md" variant="mono-white" />
            <p className="text-sm text-blue-200 mt-4 leading-relaxed">
              El marketplace B2B industrial de Chile. Conectamos fabricantes e importadores con compradores empresariales.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Marketplace</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categorias" className="hover:text-amber-400">Categorías</Link></li>
              <li><Link href="/proveedores" className="hover:text-amber-400">Proveedores</Link></li>
              <li><Link href="/productos" className="hover:text-amber-400">Productos</Link></li>
              <li><Link href="/destacados" className="hover:text-amber-400">Ofertas destacadas</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Cuenta</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/registro?tipo=fabricante" className="hover:text-amber-400">Soy Fabricante</Link></li>
              <li><Link href="/registro?tipo=comprador" className="hover:text-amber-400">Soy Comprador</Link></li>
              <li><Link href="/login" className="hover:text-amber-400">Iniciar sesión</Link></li>
              <li><Link href="/precios" className="hover:text-amber-400">Planes y precios</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/como-funciona" className="hover:text-amber-400">Cómo funciona</Link></li>
              <li><Link href="/contacto" className="hover:text-amber-400">Contacto</Link></li>
              <li><Link href="/terminos" className="hover:text-amber-400">Términos</Link></li>
              <li><Link href="/privacidad" className="hover:text-amber-400">Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-blue-300">
          <p>© {new Date().getFullYear()} IMC Industriales · Marketplace B2B Chile</p>
          <p>Santiago, Chile · contacto@imcindustriales.cl</p>
        </div>
      </div>
    </footer>
  )
}
