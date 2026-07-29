'use client'
import { useState, useRef, useEffect } from 'react'

const TOOL_LABELS = {
  list_clients: 'Consultou clientes',
  list_tasks: 'Consultou tarefas',
  list_editorial_posts: 'Consultou posts',
  list_editorial_plans: 'Consultou planejamentos',
  create_task: 'Criou tarefa',
  create_editorial_post: 'Criou post',
}

const SUGGESTIONS = [
  'Quantos posts estão pendentes este mês?',
  'Liste os clientes da carteira.',
  'Crie uma tarefa: revisar criativos da semana.',
  'Quais tarefas de alta prioridade estão em aberto?',
]

export default function AssistantChat() {
  const [messages, setMessages] = useState([]) // {role, content, toolActions?}
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const content = String(text ?? input).trim()
    if (!content || loading) return
    setError('')
    setInput('')
    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao falar com o assistente.')
        setLoading(false)
        return
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: json.message || '', toolActions: json.toolActions || [] },
      ])
    } catch {
      setError('Falha de conexão com o assistente.')
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="assistant-shell">
      <header className="assistant-header">
        <span className="assistant-kicker"><i className="bx bxs-bot"></i> Assistente</span>
        <h1>Assistente IA</h1>
        <p>Converse com o Claude — ele lê seus dados (clientes, tarefas, calendário) e pode criar tarefas e posts para você.</p>
      </header>

      <div className="assistant-thread" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="assistant-empty">
            <div className="assistant-empty-icon"><i className="bx bxs-bot"></i></div>
            <p>Comece por uma pergunta ou peça uma ação:</p>
            <div className="assistant-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="assistant-suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div key={idx} className={`assistant-msg assistant-msg-${m.role}`}>
            <div className="assistant-msg-avatar">
              <i className={`bx ${m.role === 'assistant' ? 'bxs-bot' : 'bx-user'}`}></i>
            </div>
            <div className="assistant-msg-body">
              {(m.toolActions || []).length > 0 && (
                <div className="assistant-tool-chips">
                  {m.toolActions.map((a, i) => (
                    <span key={i} className={`assistant-tool-chip ${a.ok ? '' : 'error'}`}>
                      <i className={`bx ${a.name.startsWith('create') ? 'bx-plus-circle' : 'bx-search-alt'}`}></i>
                      {TOOL_LABELS[a.name] || a.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="assistant-msg-text">{m.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="assistant-msg assistant-msg-assistant">
            <div className="assistant-msg-avatar"><i className="bx bxs-bot"></i></div>
            <div className="assistant-msg-body">
              <div className="assistant-typing"><span></span><span></span><span></span></div>
            </div>
          </div>
        )}
      </div>

      {error && <div className="assistant-error"><i className="bx bx-error-circle"></i>{error}</div>}

      <div className="assistant-composer">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pergunte algo ou peça uma ação…"
          rows={1}
        />
        <button type="button" className="assistant-send" onClick={() => send()} disabled={loading || !input.trim()}>
          <i className="bx bx-send"></i>
        </button>
      </div>

      <style jsx>{`
        .assistant-shell {
          display: flex; flex-direction: column; height: 100%;
          max-width: 900px; margin: 0 auto; width: 100%;
          padding: 20px 20px 16px; box-sizing: border-box; gap: 14px;
        }
        .assistant-header { flex-shrink: 0; }
        .assistant-kicker {
          font-family: 'Inter', sans-serif; font-size: 0.66rem; text-transform: uppercase;
          letter-spacing: 0.12em; color: #26C281; font-weight: 700;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .assistant-header h1 { margin: 6px 0 4px; font-size: clamp(1.4rem,2.4vw,1.85rem); font-weight: 900; letter-spacing: -0.02em; }
        .assistant-header p { margin: 0; opacity: 0.5; font-size: 0.88rem; max-width: 60ch; }

        .assistant-thread {
          flex: 1; min-height: 0; overflow-y: auto;
          display: flex; flex-direction: column; gap: 18px;
          padding: 8px 4px; scroll-behavior: smooth;
        }

        .assistant-empty {
          margin: auto; text-align: center; display: flex; flex-direction: column;
          align-items: center; gap: 14px; color: var(--text-muted, rgba(229,226,225,0.6));
        }
        .assistant-empty-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(38,194,129,0.12); display: grid; place-items: center;
          font-size: 32px; color: #26C281;
        }
        .assistant-suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 560px; }
        .assistant-suggestion {
          padding: 8px 14px; border-radius: 999px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);
          color: var(--text-secondary, #cbd5c9); font: inherit; font-size: 0.82rem;
          transition: all 0.15s;
        }
        .assistant-suggestion:hover { border-color: rgba(38,194,129,0.4); color: #4fdf9b; background: rgba(38,194,129,0.06); }

        .assistant-msg { display: flex; gap: 12px; align-items: flex-start; }
        .assistant-msg-user { flex-direction: row-reverse; }
        .assistant-msg-avatar {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          display: grid; place-items: center; font-size: 18px;
        }
        .assistant-msg-assistant .assistant-msg-avatar { background: rgba(38,194,129,0.14); color: #26C281; }
        .assistant-msg-user .assistant-msg-avatar { background: rgba(255,255,255,0.08); color: var(--text-secondary, #cbd5c9); }
        .assistant-msg-body { max-width: 78%; display: flex; flex-direction: column; gap: 6px; }
        .assistant-msg-user .assistant-msg-body { align-items: flex-end; }
        .assistant-msg-text {
          padding: 11px 15px; border-radius: 16px; font-size: 0.92rem; line-height: 1.55;
          white-space: pre-wrap; word-break: break-word;
        }
        .assistant-msg-assistant .assistant-msg-text {
          background: rgba(28,28,28,0.55); border: 1px solid rgba(255,255,255,0.06);
          border-top-left-radius: 4px; color: var(--text-primary, #E5E2E1);
        }
        .assistant-msg-user .assistant-msg-text {
          background: #26C281; color: #04150d; font-weight: 500; border-top-right-radius: 4px;
        }

        .assistant-tool-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .assistant-tool-chip {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'Inter', sans-serif; font-size: 0.66rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.04em;
          padding: 3px 9px; border-radius: 999px;
          background: rgba(38,194,129,0.1); color: #4fdf9b; border: 1px solid rgba(38,194,129,0.25);
        }
        .assistant-tool-chip.error { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.3); }

        .assistant-typing { display: flex; gap: 4px; padding: 12px 15px; }
        .assistant-typing span {
          width: 7px; height: 7px; border-radius: 50%; background: #26C281; opacity: 0.5;
          animation: assistant-bounce 1.2s infinite ease-in-out;
        }
        .assistant-typing span:nth-child(2) { animation-delay: 0.15s; }
        .assistant-typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes assistant-bounce { 0%,60%,100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-5px); opacity: 1; } }

        .assistant-error {
          display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #f87171;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.22);
          padding: 10px 14px; border-radius: 12px; flex-shrink: 0;
        }

        .assistant-composer {
          flex-shrink: 0; display: flex; align-items: flex-end; gap: 10px;
          background: rgba(28,28,28,0.5); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 8px 8px 8px 16px;
          backdrop-filter: blur(12px);
        }
        .assistant-composer textarea {
          flex: 1; resize: none; border: none; background: transparent; outline: none;
          color: var(--text-primary, #E5E2E1); font: inherit; font-size: 0.92rem;
          line-height: 1.5; max-height: 160px; padding: 8px 0;
        }
        .assistant-send {
          width: 40px; height: 40px; border-radius: 12px; border: none; flex-shrink: 0;
          background: #26C281; color: #04150d; font-size: 20px; cursor: pointer;
          display: grid; place-items: center; transition: opacity 0.15s;
        }
        .assistant-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .assistant-send:not(:disabled):hover { opacity: 0.85; }
      `}</style>
    </div>
  )
}
