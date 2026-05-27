import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import GuiasTable from '../../_components/GuiasTable'
import PageHeader from '../../_components/PageHeader'
import { loadGuias } from '../_lib/loadGuias'

export const dynamic = 'force-dynamic'

export default async function CargaDirectaPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/panel/carga-directa')

  const rows = await loadGuias(session.user.id, ['FCL_40HC'])  // direct/consolidated cargo

  return (
    <>
      <PageHeader
        title="Carga Directa"
        breadcrumb={[{ label: 'Carga Directa' }, { label: 'Listado' }]}
      />
      <GuiasTable rows={rows} />
    </>
  )
}
