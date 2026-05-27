import { Suspense } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Iniciar sesión · IMC Industriales',
  description: 'Accede a tu cuenta del marketplace B2B industrial.',
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen py-12">
        <div className="container-base">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
