import { CallbackClient } from './CallbackClient'

export function generateStaticParams() {
  return [
    { provider: 'github' },
    { provider: 'gitlab' }
  ]
}

export default async function GenericCallback({ params }: { params: Promise<{ provider: string }> }) {
  const resolvedParams = await params;
  return <CallbackClient provider={resolvedParams.provider} />
}