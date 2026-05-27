import Header from '../components/Header'
import Footer from '../components/Footer'
import RecuperarForm from './RecuperarForm'

export const metadata = {
  title: 'Recuperar contraseña · IMC Industriales',
  description: 'Te enviaremos un link para restablecer tu contraseña.',
}

export default function RecuperarPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-12">
        <div className="container-base">
          <RecuperarForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
