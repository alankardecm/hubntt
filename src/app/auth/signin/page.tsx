import { signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function SignInPage() {
  const session = await auth()
  if (session) redirect("/")

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">

      {/* Brilhos de fundo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#8DC63F]/6 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#8DC63F]/4 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Card principal */}
        <div className="rounded-[36px] border border-gray-200/80 bg-white shadow-[0_24px_80px_rgba(64,64,64,0.10)] overflow-hidden">

          {/* Topo verde */}
          <div className="relative bg-[#8DC63F] px-10 pt-10 pb-14">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/5" />
              <div className="absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-white/5" />
            </div>

            {/* Logo */}
            <div className="relative flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm">
                <div className="h-4 w-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white">Netturbo</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/70">Hub Operacional</p>
              </div>
            </div>

            <div className="relative mt-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/70">{greeting}</p>
              <h1 className="mt-1 text-3xl font-[900] tracking-[-0.04em] text-white leading-tight">
                Acesse o Hub<br />da Netturbo.
              </h1>
            </div>
          </div>

          {/* Corpo */}
          <div className="px-10 py-8 -mt-6">

            {/* Card de entrada sobreposto */}
            <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-[0_8px_32px_rgba(64,64,64,0.08)] -mt-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 mb-5">
                Autenticação corporativa
              </p>

              <form
                action={async () => {
                  "use server"
                  await signIn("microsoft-entra-id", { redirectTo: "/" })
                }}
              >
                <button
                  type="submit"
                  className="group flex w-full items-center gap-4 rounded-2xl bg-[#8DC63F] px-5 py-4 text-white shadow-[0_8px_24px_-8px_rgba(141,198,63,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7ab030] hover:shadow-[0_12px_28px_-8px_rgba(141,198,63,0.6)] active:translate-y-0"
                >
                  {/* Ícone Microsoft */}
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25">
                    <svg viewBox="0 0 21 21" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 0h10v10H0z" fill="#F25022"/>
                      <path d="M11 0h10v10H11z" fill="#7FBA00"/>
                      <path d="M0 11h10v10H0z" fill="#00A4EF"/>
                      <path d="M11 11h10v10H11z" fill="#FFB900"/>
                    </svg>
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block text-[12px] font-black uppercase tracking-[0.15em]">
                      Entrar com Microsoft
                    </span>
                    <span className="block text-[10px] font-semibold text-white/70 mt-0.5 tracking-wide">
                      Conta corporativa Netturbo
                    </span>
                  </span>
                  <svg className="h-4 w-4 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Rodapé */}
            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300">
              Acesso restrito a colaboradores Netturbo
            </p>
          </div>
        </div>

        {/* Versão */}
        <p className="mt-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-gray-300">
          Hub v2.0 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
