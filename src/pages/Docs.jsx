import { useParams } from 'react-router-dom'
import DocsLayout from '../components/docs/DocsLayout.jsx'
import Markdown from '../components/docs/Markdown.jsx'

import gettingStarted from '../../docs/getting-started.md?raw'
import commands from '../../docs/commands.md?raw'
import tools from '../../docs/tools.md?raw'
import safety from '../../docs/safety.md?raw'
import configuration from '../../docs/configuration.md?raw'

const SOURCES = {
  'getting-started': gettingStarted,
  commands,
  tools,
  safety,
  configuration,
}

export default function Docs() {
  const { section = 'getting-started' } = useParams()
  const source = SOURCES[section] || SOURCES['getting-started']

  return (
    <DocsLayout>
      <Markdown source={source} />
    </DocsLayout>
  )
}
