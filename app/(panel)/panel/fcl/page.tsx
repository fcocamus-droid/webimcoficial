import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import GuiasTable from '../../_components/GuiasTable'
import PageHeader from '../../_components/PageHeader'
import { loadGuias } from '../_lib/loadGuias'

export const dynamic = 'force-dynamic'

export default async function FclPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/fcl')

  const rows = await loadGuias(session.user.id, ['FCL_20', 'FCL_40'])

  return (
    <>
      <PageHeader
        title="Marítimos FCL"
        breadcrumb={[{ label: 'Marítimos FCL' }, { label: 'Listado' }]}
      />
      <GuiasTable rows={rows} />
    </>
  )
}
