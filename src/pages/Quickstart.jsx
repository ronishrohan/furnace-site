import { PaperSurface } from './Features.jsx'

const codeBlock = 'bg-[rgba(28,27,26,0.06)] border border-[rgba(28,27,26,0.1)] px-5 py-[18px] overflow-x-auto'

export default function Quickstart() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-[30px] py-[120px]">
      <div className={`${PaperSurface} w-[min(1000px,92vw)] p-[78px] pb-[72px] font-mono text-[15px] leading-[1.5]`}>
        <p className="font-bold uppercase tracking-[0.12em] text-[12px] text-[rgba(28,27,26,0.5)] mb-7">
          First run
        </p>
        <div className={`${codeBlock} mb-5`}>
          <code className="block font-mono text-[14px] leading-[1.9] text-[#1c1b1a] whitespace-pre">npm install -g cook-furnace</code>
          <code className="block font-mono text-[14px] leading-[1.9] text-[#1c1b1a] whitespace-pre">furnace</code>
        </div>
        <p className="mt-3.5 text-[14px] text-[rgba(28,27,26,0.6)] leading-[1.6]">
          Interactive mode starts by default. Use <code className="font-mono text-[13px]">/login</code> to configure your provider, then type prompts and review tool approvals.
        </p>
        <div className={`${codeBlock} mt-5`}>
          <code className="block font-mono text-[14px] leading-[1.9] text-[#1c1b1a] whitespace-pre"># Or pass a prompt directly</code>
          <code className="block font-mono text-[14px] leading-[1.9] text-[#1c1b1a] whitespace-pre">furnace -p "Summarize this repository"</code>
        </div>
        <p className="mt-4 text-[14px] text-[rgba(28,27,26,0.6)] leading-[1.6]">
          Requires Node 22+. Supports any OpenRouter-compatible model. Session state is stored locally — no cloud required.
        </p>
      </div>
    </section>
  )
}
