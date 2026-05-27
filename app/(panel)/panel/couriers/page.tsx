import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import GuiasTable from '../../_components/GuiasTable'
import PageHeader from '../../_components/PageHeader'
import { loadGuias } from '../_lib/loadGuias'

export const dynamic = 'force-dynamic'

export default async function CouriersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/couriers')

  const rows = await loadGuias(session.user.id, ['AIR'])  // air couriers

  return (
    <>
      <PageHeader
        title="Couriers"
        breadcrumb={[{ label: 'Couriers' }, { label: 'Listado' }]}
      />
      <GuiasTable rows={rows} />
    </>
  )
}
