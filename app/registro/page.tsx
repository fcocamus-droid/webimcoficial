import { Suspense } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import RegistroForm from './RegistroForm'

export const metadata = {
  title: 'Crear cuenta · IMC Industriales',
  description:
    'Únete al marketplace B2B industrial de Chile como fabricante/importador o como comprador empresarial.',
}

export default function RegistroPage({
  searchParams,
}: {
  searchParams: { tipo?: string }
}) {
  const tipo: 'fabricante' | 'comprador' =
    searchParams?.tipo === 'fabricante' ? 'fabricante' : 'comprador'

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-10">
        <div className="container-base">
          <Suspense>
            <RegistroForm initialTipo={tipo} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
