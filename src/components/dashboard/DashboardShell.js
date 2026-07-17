'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import SettingsPage from '@/app/settings/page'
import ClientAccessesTab from '@/components/dashboard/ClientAccessesTab'
import QuickAddAccessModal from '@/components/dashboard/QuickAddAccessModal'
import EditorialCalendar from '@/components/dashboard/EditorialCalendar'
import PACCalendar from '@/components/dashboard/PACCalendar'
import ReportsTab from '@/components/dashboard/ReportsTab'
import ManualReportTab from '@/components/dashboard/ManualReportTab'
import LeadsDashboard from '@/components/dashboard/LeadsDashboard'
import TasksTab from '@/components/dashboard/TasksTab'
import ActionPlanManager from '@/components/dashboard/ActionPlanManager'
import ActionSpaceSettings from '@/components/dashboard/ActionSpaceSettings'
import NotificationBell from '@/components/dashboard/NotificationBell'
import RolesTab from '@/components/dashboard/RolesTab'
import CustomSelect from '@/components/dashboard/CustomSelect'
import { DashboardContext } from '@/components/dashboard/DashboardContext'
import './dashboard-shell.css'
import PlanilhaLeadsTab from '@/components/dashboard/tabs/PlanilhaLeadsTab'
import SaldosTab from '@/components/dashboard/tabs/SaldosTab'
import AnunciosTab from '@/components/dashboard/tabs/AnunciosTab'
import CampanhasTab from '@/components/dashboard/tabs/CampanhasTab'
import FunilPerformanceTab from '@/components/dashboard/tabs/FunilPerformanceTab'
import ProdutosTab from '@/components/dashboard/tabs/ProdutosTab'
import OnboardingTab from '@/components/dashboard/tabs/OnboardingTab'
import ComunicacaoTab from '@/components/dashboard/tabs/ComunicacaoTab'
import ComercialProcessoTab from '@/components/dashboard/tabs/ComercialProcessoTab'
import OffboardingTab from '@/components/dashboard/tabs/OffboardingTab'
import RotinasTab from '@/components/dashboard/tabs/RotinasTab'
import UsuariosTab from '@/components/dashboard/tabs/UsuariosTab'
import SemanalTab from '@/components/dashboard/tabs/SemanalTab'
import ClientesTab from '@/components/dashboard/tabs/ClientesTab'
import ApresentacaoTab from '@/components/dashboard/tabs/ApresentacaoTab'
import { useUser } from '@/lib/contexts/UserContext'
import { createClient } from '@/lib/supabase/client'
import {
  createClientRecord,
  createClientCustomColumnRecord,
  createClientImplementationPhaseRecord,
  createClientCustomTabRecord,
  createClientTabOverrideRecord,
  createClientGroupRecord,
  createDashboardTemplate,
  createOperationCardRecord,
  createOperationCommentRecord,
  createOperationSettingsRecord,
  createOperationSubtaskRecord,
  createProductRecord,
  createTeamMemberAllocationRecord,
  createTeamMemberOkrRecord,
  createTeamMemberPdiItemRecord,
  createTeamMemberProfileRecord,
  DEFAULT_INTEGRATIONS,
  DEFAULT_CLIENT_IMPLEMENTATION_PHASES,
  DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS,
  DEFAULT_PREFERENCES,
  loadDashboardPreferences,
  saveDashboardPreferences,
} from '@/lib/dashboard-storage'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { normalizeAiSettings } from '@/lib/ai-config'
import { LEGACY_THEME_PRESETS } from '@/lib/saas/theme-presets'
import {
  buildMetaSummaryFromCampaigns,
  campaignMatchesMetaResultFilters,
  extractMetaCampaignMetrics,
  getAvailableMetaResultFilters,
  normalizeMetaResultFilters,
  resolveMetaPrimaryResultKey,
} from '@/lib/meta-metrics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

const THEMES = Object.fromEntries(
  LEGACY_THEME_PRESETS.map((preset) => [
    preset.key,
    {
      main: preset.primaryColor,
      glow: `${preset.primaryColor}2e`,
      surface: `${preset.primaryColor}1a`,
    },
  ])
)

const DEFAULT_WORKSPACE_BRANDING = {
  appName: 'Assessoria LP',
  appSubtitle: 'Performance Hub',
  companyName: 'Assessoria LP',
  logoUrl: '',
  mode: 'light',
  primaryColor: '#26C281',
  accentColor: '#4FDF9B',
  backgroundColor: '#070908',
  panelColor: '#121817',
  textColor: '#F4F7F5',
  onboardingCompleted: true,
}

const THEME_LABELS = Object.fromEntries(LEGACY_THEME_PRESETS.map((preset) => [preset.key, preset.label]))

const AI_INSIGHT_TYPE_LABELS = {
  opportunity: 'Oportunidade',
  alert: 'Alerta',
  anomaly: 'Anomalia',
  win: 'Destaque',
  insight: 'Insight',
}

const AI_CAMPAIGN_STATUS_LABELS = {
  positive: 'Positivo',
  attention: 'Atenção',
  urgent: 'Urgência',
}

const CLIENT_STATUS_OPTIONS = ['Ativo', 'Onboarding', 'Pausado', 'Risco', 'Churn']
const CLIENT_SALES_MODEL_OPTIONS = [
  { value: 'INSIDE_SALES', label: 'Inside Sales' },
  { value: 'ECOM', label: 'Ecom' },
  { value: 'PDV', label: 'PDV' },
]
const IMPLEMENTATION_PHASE_BY_SALES_MODEL = {
  INSIDE_SALES: 'Implementação (Inside Sales)',
  ECOM: 'Implementação (Ecom)',
  PDV: 'Implementação (PDV)',
}

function getDefaultClientImplementationPhases() {
  return DEFAULT_CLIENT_IMPLEMENTATION_PHASES.map((phase) => createClientImplementationPhaseRecord(phase))
}
const OPERATION_VIEW_OPTIONS = [
  { value: 'kanban', label: 'Kanban' },
  { value: 'table', label: 'Tabela' },
  { value: 'tickets', label: 'Tickets' },
]
const OPERATION_PERIOD_OPTIONS = [
  { value: 'all', label: 'Todo o período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '15d', label: 'Últimos 15 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
]
const OPERATION_PRIORITY_OPTIONS = [
  { value: 'sem_prioridade', label: 'Sem prioridade' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
]
const OPERATION_PRIORITY_LABELS = Object.fromEntries(OPERATION_PRIORITY_OPTIONS.map((item) => [item.value, item.label]))
const OPERATION_ACTIVITY_ICON_BY_TYPE = {
  update: 'bx-edit-alt',
  status: 'bx-loader-circle',
  lane: 'bx-columns',
  assignee: 'bx-user-check',
  priority: 'bx-flag',
  date: 'bx-calendar',
  tags: 'bx-purchase-tag-alt',
  task_type: 'bx-category-alt',
  subtask: 'bx-subdirectory-left',
  timer: 'bx-timer',
  custom_field: 'bx-list-plus',
  comment: 'bx-message-rounded-detail',
}
const OPERATION_LANES = [
  { key: 'setup', label: 'Setup de implementação' },
  { key: 'inside_sales', label: 'Implementação (Inside Sales)' },
  { key: 'ecom', label: 'Implementação (Ecom)' },
  { key: 'pdv', label: 'Implementação (PDV)' },
  { key: 'ongoing', label: 'Ongoing' },
]
const OPERATION_STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'concluido', label: 'Concluído' },
]
const CLIENT_OKR_CADENCE_OPTIONS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'quadrimestral', label: 'Quadrimestral' },
  { value: 'anual', label: 'Anual' },
  { value: 'ciclo', label: 'Ciclo' },
]
const FWO_IMPLEMENTATION_CHECKLISTS = {
  INSIDE_SALES: [
    'Configuração do CRM',
    'Treinamento da equipe de Inside Sales',
    'Fluxo de comunicação e processos',
    'Acompanhamento de métricas',
  ],
  ECOM: [
    'Integração com a plataforma de e-commerce',
    'Configuração de tracking',
    'Teste de checkout e simulações de compra',
    'Desempenho do site',
  ],
  PDV: [
    'Integração do PDV com ERP/CRM',
    'Tracking no PDV',
    'Simulações de atendimento ao cliente',
    'Sistema de gift card (se aplicável)',
    'Acesso restrito a relatórios de faturamento',
    'Conversões offline implementadas',
  ],
}


function normalizeMetaAdAccountIdForCompare(value) {
  return String(value || '').trim().replace(/^act_/i, '')
}


const WEEKLY_HEALTH_OPTIONS = [
  {
    key: 'integration',
    label: 'Integração',
    score: 0,
    color: '#8b5cf6',
    softColor: '#ede9fe',
    criteria: 'Cliente em fase de integração, configuração ou validação inicial das conexões.',
  },
  {
    key: 'critical',
    label: 'Crítico',
    score: 1,
    color: '#ef4444',
    softColor: '#fee2e2',
    criteria: 'Resultado negativo há 3+ semanas, baixa satisfação ou falta de atividade recorrente.',
  },
  {
    key: 'attention',
    label: 'Atenção',
    score: 2,
    color: '#f59e0b',
    softColor: '#ffedd5',
    criteria: 'Resultado abaixo do esperado por até 3 semanas, com cliente ainda engajado.',
  },
  {
    key: 'healthy',
    label: 'Saudável',
    score: 3,
    color: '#22c55e',
    softColor: '#dcfce7',
    criteria: 'Meta atingida, feedbacks claros, sem riscos ou inconsistências no acompanhamento.',
  },
  {
    key: 'with_result',
    label: 'Com resultado',
    score: 4,
    color: '#1d8fff',
    softColor: '#dbeafe',
    criteria: 'Resultado acima da meta, cliente satisfeito e engajado com expansão.',
  },
  {
    key: 'churn',
    label: 'Churn',
    score: 5,
    color: '#64748b',
    softColor: '#e2e8f0',
    criteria: 'Cliente encerrado, perdido ou sem continuidade ativa na operação.',
  },
]

const WEEKLY_HEALTH_BY_KEY = Object.fromEntries(WEEKLY_HEALTH_OPTIONS.map((item) => [item.key, item]))
const CLIENT_HEALTH_SORT_RANK = {
  integration: 0,
  critical: 1,
  attention: 2,
  healthy: 3,
  with_result: 4,
  churn: 5,
  empty: 6,
}

const WEEKLY_PERIOD_OPTIONS = [
  { value: 'filled', label: 'Preenchido' },
  { value: 'current_week', label: 'Semana atual' },
  { value: 'previous_week', label: 'Semana passada' },
  { value: 'custom', label: 'Personalizada' },
  { value: 'month', label: 'Mês' },
]

const ALL_FILLED_WEEK_PERIODS = 'all_filled_periods'

function getMondayDateInputValue(value = new Date()) {
  const source = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`)
  if (Number.isNaN(source.getTime())) return getMondayDateInputValue(new Date())
  const day = source.getDay()
  const diff = day === 0 ? -6 : 1 - day
  source.setDate(source.getDate() + diff)
  return `${source.getFullYear()}-${String(source.getMonth() + 1).padStart(2, '0')}-${String(source.getDate()).padStart(2, '0')}`
}

function getWeekEndDateInputValue(weekStart) {
  const [year, month, day] = String(weekStart || getMondayDateInputValue()).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 6)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatWeekRangeLabel(weekStart, weekEnd) {
  const start = formatShortDate(weekStart)
  const end = formatShortDate(weekEnd || getWeekEndDateInputValue(weekStart))
  return `${start} até ${end}`
}


function getCurrentMonthInputValue() {
  return getTodayDateInputValue().slice(0, 7)
}

function getWeeklyPeriodWindow(preset, customSince, customUntil, selectedMonth, selectedFilledWeekStart) {
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const currentWeekStartValue = getMondayDateInputValue(todayStart)
  const currentWeekStart = parseLocalDateInput(currentWeekStartValue) || todayStart
  const currentWeekEnd = parseLocalDateInput(getWeekEndDateInputValue(currentWeekStartValue)) || todayStart

  if (preset === 'filled') {
    if (selectedFilledWeekStart === ALL_FILLED_WEEK_PERIODS) {
      return { start: null, end: null, label: 'Todos os períodos preenchidos', filledWeekStart: ALL_FILLED_WEEK_PERIODS }
    }
    const start = parseLocalDateInput(selectedFilledWeekStart)
    if (!start) return { start: null, end: null, label: 'Nenhuma semana preenchida', filledWeekStart: '' }
    const weekStart = formatLocalDateInput(start)
    const end = parseLocalDateInput(getWeekEndDateInputValue(weekStart)) || start
    return { start, end, label: formatWeekRangeLabel(weekStart, formatLocalDateInput(end)), filledWeekStart: weekStart }
  }

  if (preset === 'custom') {
    const start = parseLocalDateInput(customSince)
    const end = parseLocalDateInput(customUntil)
    if (!start || !end) return { start: currentWeekStart, end: currentWeekEnd, label: formatWeekRangeLabel(currentWeekStartValue) }
    return { start, end, label: `${formatShortDate(customSince)} até ${formatShortDate(customUntil)}` }
  }

  if (preset === 'previous_week') {
    const start = shiftLocalDays(currentWeekStart, -7)
    const end = shiftLocalDays(currentWeekEnd, -7)
    return { start, end, label: `${formatShortDate(formatLocalDateInput(start))} até ${formatShortDate(formatLocalDateInput(end))}` }
  }

  if (preset === 'month') {
    const [selectedYear, selectedMonthNumber] = String(selectedMonth || getCurrentMonthInputValue()).split('-').map(Number)
    if (!selectedYear || !selectedMonthNumber) {
      const start = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
      const end = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0)
      return { start, end, label: formatMonthBucketLabel(getCurrentMonthInputValue()), monthKey: getCurrentMonthInputValue() }
    }
    const start = new Date(selectedYear, selectedMonthNumber - 1, 1)
    const end = new Date(selectedYear, selectedMonthNumber, 0)
    const monthKey = `${selectedYear}-${String(selectedMonthNumber).padStart(2, '0')}`
    return { start, end, label: formatMonthBucketLabel(monthKey), monthKey }
  }

  return { start: currentWeekStart, end: currentWeekEnd, label: formatWeekRangeLabel(currentWeekStartValue) }
}

function isWeeklyRecordInsideWindow(record, windowRange) {
  if (!windowRange?.start || !windowRange?.end) return true
  const recordStart = parseLocalDateInput(record.weekStart)
  const recordEnd = parseLocalDateInput(record.weekEnd || getWeekEndDateInputValue(record.weekStart)) || recordStart
  if (!recordStart) return false
  return recordStart <= windowRange.end && recordEnd >= windowRange.start
}

function normalizeWeeklyNumber(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function normalizeWeeklyInteger(value) {
  return Math.max(0, Math.round(normalizeWeeklyNumber(value)))
}

function getWeeklyHealthAverageLabel(score) {
  if (!score) return 'Sem dados'
  const nearest = WEEKLY_HEALTH_OPTIONS.reduce((best, option) => (
    Math.abs(option.score - score) < Math.abs(best.score - score) ? option : best
  ), WEEKLY_HEALTH_OPTIONS[0])
  return nearest.label
}

function getWeeklyHealthColor(status) {
  return WEEKLY_HEALTH_BY_KEY[status]?.color || '#94a3b8'
}

async function fetchJsonWithTimeout(resource, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(resource, {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    return { response, data }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('A integração demorou demais para responder. Tente novamente em instantes.')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

const CLIENT_FLAG_OPTIONS = [
  { value: 'ok', label: 'Ok' },
  { value: 'attention', label: 'Atenção' },
  { value: 'risk', label: 'Risco' },
  { value: 'na', label: 'N/A' },
]

const CLIENT_BINARY_OPTIONS = ['Sim', 'Não']

const CLIENT_HEALTH_FLAG_FIELDS = [
  { name: 'deliverablesFlag', label: 'Entregáveis' },
  { name: 'financialFlag', label: 'Financeiro' },
  { name: 'roiFlag', label: 'ROI' },
  { name: 'healthScoreFlag', label: 'Health score manual' },
  { name: 'crmUsageFlag', label: 'CRM em uso corretamente?' },
  { name: 'csAttendanceFlag', label: 'CS atendimento' },
  { name: 'csatFlag', label: 'CSAT >= 4?' },
  { name: 'clientParticipationFlag', label: 'Cliente participou > 90%?' },
  { name: 'adAccountsFlag', label: 'Contas de anúncio ativas?' },
  { name: 'npsFlag', label: 'NPS >= 7?' },
  { name: 'stakeholderFlag', label: 'Stakeholder pagador consciente?' },
]

const DERIVED_CLIENT_FLAG_KEYS = new Set(CLIENT_HEALTH_FLAG_FIELDS.map((field) => field.name))

const CLIENT_LINK_FIELDS = [
  { name: 'contractUrl', label: 'Contrato', placeholder: 'https://...' },
  { name: 'dashboardUrl', label: 'Dashboard', placeholder: 'https://...' },
  { name: 'driveUrl', label: 'Drive', placeholder: 'https://...' },
  { name: 'eapUrl', label: 'EAP', placeholder: 'https://...' },
  { name: 'brandManualUrl', label: 'Manual de marca', placeholder: 'https://...' },
  { name: 'moodboardUrl', label: 'Moodboard', placeholder: 'https://...' },
  { name: 'salesNarrativeUrl', label: 'Narrativa de vendas', placeholder: 'https://...' },
  { name: 'drawflowUrl', label: 'Draw Flow', placeholder: 'https://...' },
]

const CLIENT_OWNER_FIELDS = [
  { name: 'projectManager', label: 'Gestor de projetos', placeholder: 'Nome do responsável' },
  { name: 'trafficManager', label: 'Gestor de tráfego', placeholder: 'Nome do responsável' },
  { name: 'designer', label: 'Designer', placeholder: 'Nome do responsável' },
  { name: 'csOwner', label: 'CS / Atendimento', placeholder: 'Nome do responsável' },
  { name: 'copyOwner', label: 'Copy', placeholder: 'Nome do responsável' },
]

const CLIENT_REGISTRY_VIEWS = [
  {
    key: 'geral',
    label: 'Geral',
    columns: ['name', 'status', 'product', 'fee', 'mediaInvestment', 'startDate', 'step', 'ltv'],
  },
  {
    key: 'flags',
    label: 'Flags',
    columns: ['name', 'healthScore', 'deliverablesFlag', 'trafficQuality', 'designQuality', 'copyQuality', 'csQuality', 'healthScoreFlag', 'roiAboveOne', 'csatAboveFour', 'npsAboveSeven', 'stakeholderAware', 'adAccountsHealthy', 'crmUsageProperly', 'clientParticipationAbove90', 'financialFlag', 'roiFlag'],
  },
  {
    key: 'quality',
    label: 'Quality Check',
    columns: ['name', 'crmUsageFlag', 'csAttendanceFlag', 'csatFlag', 'clientParticipationFlag', 'adAccountsFlag', 'npsFlag', 'stakeholderFlag'],
  },
  {
    key: 'dados',
    label: 'Dados',
    columns: ['name', 'projectManager', 'trafficManager', 'designer', 'organicDemands', 'trafficDemands', 'totalDemands'],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    columns: ['name', 'monthlyRevenue', 'contributionMarginPercent', 'profitMarginPercent', 'mmf', 'roiMarketing'],
  },
  {
    key: 'branding',
    label: 'Branding',
    columns: ['name', 'driveUrl', 'dashboardUrl', 'contractUrl', 'eapUrl', 'brandManualUrl'],
  },
  {
    key: 'mais',
    label: 'Mais 1',
    columns: ['name', 'moodboardUrl', 'salesNarrativeUrl', 'drawflowUrl', 'metaAdAccountId', 'googleAdsAccountId', 'rdStationAccountId'],
  },
]

const CLIENT_EDIT_SECTIONS = [
  { key: 'geral', label: 'Geral' },
  { key: 'flags', label: 'Flags' },
  { key: 'quality', label: 'Quality Check' },
  { key: 'dados', label: 'Dados' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'branding', label: 'Branding' },
  { key: 'mais', label: 'Mais 1' },
]

const CLIENT_DEFAULT_TABS = CLIENT_REGISTRY_VIEWS.map((view) => ({
  key: view.key,
  label: view.label,
}))

const CLIENT_CUSTOM_COLUMN_TYPE_OPTIONS = [
  { value: 'text', label: 'Texto' },
  { value: 'long_text', label: 'Area de texto' },
  { value: 'number', label: 'Numero' },
  { value: 'currency', label: 'Moeda' },
  { value: 'percent', label: 'Percentual' },
  { value: 'date', label: 'Data' },
  { value: 'link', label: 'Link' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'person', label: 'Pessoas' },
  { value: 'progress', label: 'Progresso' },
  { value: 'checkbox', label: 'Caixa de selecao' },
  { value: 'select', label: 'Dropdown' },
  { value: 'formula', label: 'Formula' },
  { value: 'flag', label: 'Flag' },
]

const CLIENT_CURRENCY_FIELDS = new Set([
  'fee',
  'mediaInvestment',
  'monthlyRevenue',
  'contributionMarginAmount',
  'profitMarginAmount',
])

const CLIENT_COMPLETENESS_EXCLUDED_FIELDS = new Set([
  'name',
  'ltv',
  'mmf',
  'roiMarketing',
  'healthScore',
  'healthScoreFlag',
])

function looksLikeJsonBlock(value) {
  const normalized = String(value || '').trim()
  return normalized.startsWith('{') || normalized.startsWith('[')
}

const EMPTY_META_BREAKDOWNS = {
  ages: [],
  states: [],
  cities: [],
  creatives: [],
  geoScope: 'city',
  errors: {
    ages: '',
    states: '',
    cities: '',
    creatives: '',
  },
}

const BRAZIL_MAP_SILHOUETTE_PATH = 'M32 18 L42 10 L58 9 L71 17 L86 14 L101 18 L116 28 L120 42 L128 54 L123 70 L112 81 L107 97 L96 108 L89 124 L77 134 L64 127 L58 114 L49 104 L38 98 L33 84 L25 72 L18 57 L14 41 L18 24 L25 18 Z'

const BRAZIL_STATE_MAP_POINTS = {
  AC: { x: 14, y: 47, name: 'Acre' },
  AL: { x: 83, y: 55, name: 'Alagoas' },
  AP: { x: 75, y: 13, name: 'Amapá' },
  AM: { x: 34, y: 24, name: 'Amazonas' },
  BA: { x: 73, y: 60, name: 'Bahia' },
  CE: { x: 80, y: 42, name: 'Ceará' },
  DF: { x: 54, y: 57, name: 'Distrito Federal' },
  ES: { x: 72, y: 69, name: 'Espírito Santo' },
  GO: { x: 50, y: 55, name: 'Goiás' },
  MA: { x: 68, y: 38, name: 'Maranhão' },
  MT: { x: 40, y: 47, name: 'Mato Grosso' },
  MS: { x: 38, y: 63, name: 'Mato Grosso do Sul' },
  MG: { x: 64, y: 65, name: 'Minas Gerais' },
  PA: { x: 60, y: 26, name: 'Pará' },
  PB: { x: 87, y: 46, name: 'Paraíba' },
  PR: { x: 56, y: 83, name: 'Paraná' },
  PE: { x: 84, y: 50, name: 'Pernambuco' },
  PI: { x: 73, y: 42, name: 'Piauí' },
  RJ: { x: 69, y: 73, name: 'Rio de Janeiro' },
  RN: { x: 88, y: 42, name: 'Rio Grande do Norte' },
  RS: { x: 54, y: 96, name: 'Rio Grande do Sul' },
  RO: { x: 23, y: 40, name: 'Rondônia' },
  RR: { x: 57, y: 7, name: 'Roraima' },
  SC: { x: 58, y: 89, name: 'Santa Catarina' },
  SP: { x: 60, y: 76, name: 'São Paulo' },
  SE: { x: 81, y: 58, name: 'Sergipe' },
  TO: { x: 53, y: 44, name: 'Tocantins' },
}

const BRAZIL_STATE_NAME_TO_UF = Object.fromEntries(
  Object.entries(BRAZIL_STATE_MAP_POINTS).map(([uf, item]) => [item.name, uf])
)

const BRAZIL_CITY_MAP_POINTS = {
  'aracaju': { x: 81, y: 58, state: 'SE' },
  'belem': { x: 60, y: 26, state: 'PA' },
  'belo horizonte': { x: 64, y: 65, state: 'MG' },
  'boa vista': { x: 57, y: 7, state: 'RR' },
  'brasilia': { x: 54, y: 57, state: 'DF' },
  'campinas': { x: 59, y: 74, state: 'SP' },
  'campo grande': { x: 38, y: 63, state: 'MS' },
  'cuiaba': { x: 40, y: 47, state: 'MT' },
  'curitiba': { x: 56, y: 83, state: 'PR' },
  'florianopolis': { x: 58, y: 89, state: 'SC' },
  'fortaleza': { x: 80, y: 42, state: 'CE' },
  'goiania': { x: 50, y: 56, state: 'GO' },
  'joao pessoa': { x: 87, y: 46, state: 'PB' },
  'maceio': { x: 83, y: 55, state: 'AL' },
  'manaus': { x: 34, y: 24, state: 'AM' },
  'natal': { x: 88, y: 42, state: 'RN' },
  'palmas': { x: 53, y: 44, state: 'TO' },
  'porto alegre': { x: 54, y: 96, state: 'RS' },
  'porto velho': { x: 23, y: 40, state: 'RO' },
  'recife': { x: 84, y: 50, state: 'PE' },
  'rio branco': { x: 14, y: 47, state: 'AC' },
  'rio de janeiro': { x: 69, y: 73, state: 'RJ' },
  'salvador': { x: 73, y: 60, state: 'BA' },
  'santos': { x: 61, y: 78, state: 'SP' },
  'sao luis': { x: 68, y: 38, state: 'MA' },
  'sao paulo': { x: 60, y: 76, state: 'SP' },
  'teresina': { x: 73, y: 42, state: 'PI' },
  'vitoria': { x: 72, y: 69, state: 'ES' },
}

function clampColorChannel(value) {
  const numericValue = Number.parseInt(value, 10)
  if (!Number.isFinite(numericValue)) return 0
  return Math.max(0, Math.min(255, numericValue))
}

function hexToRgb(hexValue) {
  const normalized = String(hexValue || '').trim().replace('#', '')
  if (!/^[\da-fA-F]{6}$/.test(normalized)) return null

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }) {
  const channels = [r, g, b].map((value) => clampColorChannel(value).toString(16).padStart(2, '0'))
  return `#${channels.join('')}`
}

function parseDashboardColor(value) {
  if (!value) return null

  if (THEMES[value]?.main) {
    return hexToRgb(THEMES[value].main)
  }

  const hexMatch = String(value).trim().match(/^#([\da-fA-F]{6})$/)
  if (hexMatch) {
    return hexToRgb(hexMatch[0])
  }

  const rgbMatch = String(value)
    .trim()
    .match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i)

  if (rgbMatch) {
    return {
      r: clampColorChannel(rgbMatch[1]),
      g: clampColorChannel(rgbMatch[2]),
      b: clampColorChannel(rgbMatch[3]),
    }
  }

  return null
}

function buildCustomTheme(colorValue) {
  const parsedColor = parseDashboardColor(colorValue) || hexToRgb(THEMES.blue.main)
  const { r, g, b } = parsedColor

  return {
    main: `rgb(${r}, ${g}, ${b})`,
    glow: `rgba(${r}, ${g}, ${b}, 0.18)`,
    surface: `rgba(${r}, ${g}, ${b}, 0.10)`,
  }
}

function resolveDashboardTheme(colorValue) {
  if (THEMES[colorValue]) return THEMES[colorValue]
  return buildCustomTheme(colorValue)
}

function getDashboardColorLabel(colorValue) {
  if (THEME_LABELS[colorValue]) return THEME_LABELS[colorValue]

  const parsedColor = parseDashboardColor(colorValue)
  return parsedColor ? rgbToHex(parsedColor).toUpperCase() : 'Azul'
}

function getNameInitials(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'CL'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function normalizeCnpjInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14)
  const parts = []
  if (digits.slice(0, 2)) parts.push(digits.slice(0, 2))
  if (digits.slice(2, 5)) parts.push(digits.slice(2, 5))
  if (digits.slice(5, 8)) parts.push(digits.slice(5, 8))

  let formatted = parts.join('.')
  if (digits.slice(8, 12)) {
    formatted += `${formatted ? '/' : ''}${digits.slice(8, 12)}`
  }
  if (digits.slice(12, 14)) {
    formatted += `${digits.slice(8, 12) ? '-' : ''}${digits.slice(12, 14)}`
  }

  return formatted
}

function createImplementationChecklistForSalesModel(salesModel, currentItems = []) {
  const templateItems = FWO_IMPLEMENTATION_CHECKLISTS[salesModel] || []
  const currentMap = new Map(
    (Array.isArray(currentItems) ? currentItems : []).map((item) => [String(item.label || '').trim(), Boolean(item.completed)])
  )

  return templateItems.map((label, index) => ({
    id: globalThis.crypto?.randomUUID?.() || `implementation-item-${salesModel}-${index + 1}-${Date.now()}`,
    label,
    completed: currentMap.get(label) || false,
  }))
}

function resolveOperationLaneFromSalesModel(salesModel) {
  if (salesModel === 'INSIDE_SALES') return 'inside_sales'
  if (salesModel === 'ECOM') return 'ecom'
  if (salesModel === 'PDV') return 'pdv'
  return 'setup'
}

function getClientFlagMeta(value, variant = 'default') {
  const normalized = String(value || 'na').trim().toLowerCase()
  if (normalized === 'ok') {
    if (variant === 'mmf') return { label: 'MM/F Saudável', tone: 'success', score: 100 }
    if (variant === 'flag') return { label: 'Green Flag', tone: 'success', score: 100 }
    return { label: 'Ok', tone: 'success', score: 100 }
  }
  if (normalized === 'attention') {
    if (variant === 'mmf') return { label: 'MM/F Atenção', tone: 'warning', score: 55 }
    if (variant === 'flag') return { label: 'Yellow Flag', tone: 'warning', score: 55 }
    return { label: 'Atenção', tone: 'warning', score: 55 }
  }
  if (normalized === 'risk') {
    if (variant === 'mmf') return { label: 'MM/F Crítico', tone: 'danger', score: 20 }
    if (variant === 'flag') return { label: 'Red Flag', tone: 'danger', score: 20 }
    return { label: 'Risco', tone: 'danger', score: 20 }
  }
  return { label: 'N/A', tone: 'neutral', score: null }
}

function getClientFlagVariant(columnKey) {
  if (columnKey === 'financialFlag') return 'mmf'
  if (['deliverablesFlag', 'roiFlag', 'healthScoreFlag'].includes(columnKey)) return 'flag'
  return 'default'
}

function calculateClientHealthScore(client) {
  const scores = CLIENT_HEALTH_FLAG_FIELDS
    .map((field) => getClientFlagMeta(client?.[field.name]).score)
    .filter((value) => Number.isFinite(value))

  if (!scores.length) return null
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
}

function parseClientNumber(value) {
  const normalized = String(value ?? '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function formatClientCurrency(value) {
  const parsed = parseClientNumber(value)
  return parsed == null ? 'Nao informado' : formatCurrency(parsed)
}

function formatClientPercent(value) {
  const parsed = parseClientNumber(value)
  return parsed == null ? 'Nao informado' : formatPercent(parsed)
}

function normalizeCurrencyInput(value) {
  const parsed = parseClientNumber(value)
  return parsed == null ? '' : formatCurrency(parsed)
}

function hasClientFieldValue(value) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return String(value || '').trim().length > 0
}

function normalizeSelectOptionsInput(value) {
  return Array.from(new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  ))
}

function formatDerivedClientNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) return ''
  return value.toFixed(decimals).replace('.', ',')
}

function getContractLifetimeMonths(contractSignedAt) {
  if (!contractSignedAt) return null
  const signedAt = new Date(`${contractSignedAt}T00:00:00`)
  if (Number.isNaN(signedAt.getTime())) return null

  const now = new Date()
  if (signedAt.getTime() > now.getTime()) return null

  let months = (now.getFullYear() - signedAt.getFullYear()) * 12 + (now.getMonth() - signedAt.getMonth())
  if (now.getDate() >= signedAt.getDate()) {
    months += 1
  }

  return Math.max(months, 1)
}

function formatClientDate(value) {
  if (!value) return 'Nao informada'
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'Nao informada'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed)
}

function formatClientDateTime(value) {
  if (!value) return 'Agora'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Agora'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function getMonthBucketKey(value) {
  if (!value) return ''
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  return `${parsed.getFullYear()}-${month}`
}

function formatMonthBucketLabel(bucketKey) {
  if (!bucketKey) return 'Nao informado'
  const [year, month] = String(bucketKey).split('-')
  const parsed = new Date(`${year}-${month || '01'}-01T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'Nao informado'
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

function getTodayDateInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMinutesToDuration(totalMinutes) {
  const safeMinutes = Number.isFinite(Number(totalMinutes)) ? Math.max(0, Math.round(Number(totalMinutes))) : 0
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  if (!hours) return `${minutes}min`
  if (!minutes) return `${hours}h`
  return `${hours}h ${minutes}min`
}

function deriveScoreFlag(score) {
  if (!Number.isFinite(score)) return 'na'
  if (score >= 80) return 'ok'
  if (score >= 50) return 'attention'
  return 'risk'
}

function deriveCoverageFlag(values = []) {
  const total = values.length
  const present = values.filter((value) => {
    if (Array.isArray(value)) return value.length > 0
    return String(value || '').trim().length > 0
  }).length

  if (!total || present === 0) return 'na'
  if (present === total) return 'ok'
  if (present >= Math.ceil(total / 2)) return 'attention'
  return 'risk'
}

function mapClientQualityScore(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  if (normalized === 'bom') return 3
  if (normalized === 'médio' || normalized === 'medio') return 2
  return 1
}

function normalizeBinaryClientAnswer(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'sim') return 'yes'
  if (normalized === 'não' || normalized === 'nao') return 'no'
  return ''
}

function deriveBinaryFlagFromAnswer(answer, fallbackFlag = 'na') {
  if (answer === 'yes') return 'ok'
  if (answer === 'no') return 'risk'
  return fallbackFlag
}

function getDefaultClientSystemFieldOptions(columnKey) {
  if (['trafficQuality', 'designQuality', 'copyQuality', 'csQuality'].includes(columnKey)) {
    return ['Bom', 'Médio', 'Ruim']
  }

  if (['roiAboveOne', 'csatAboveFour', 'npsAboveSeven', 'stakeholderAware', 'adAccountsHealthy', 'crmUsageProperly', 'clientParticipationAbove90'].includes(columnKey)) {
    return CLIENT_BINARY_OPTIONS
  }

  return []
}

function deriveClientComputedFields(client) {
  const revenue = parseClientNumber(client?.monthlyRevenue)
  const mediaInvestment = parseClientNumber(client?.mediaInvestment)
  const fee = parseClientNumber(client?.fee)
  const contributionMarginPercent = parseClientNumber(client?.contributionMarginPercent)
  const contractLifetimeMonths = getContractLifetimeMonths(client?.contractSignedAt)
  const adAccountsCount = [
    client?.metaAdAccountId,
    client?.googleAdsAccountId,
    client?.tiktokAdsAccountId,
    client?.linkedInAdsAccountId,
  ].filter((value) => String(value || '').trim()).length
  const contributionMarginRatio = contributionMarginPercent != null ? contributionMarginPercent / 100 : null
  const roiAboveOneAnswer = normalizeBinaryClientAnswer(client?.roiAboveOne)
  const csatAboveFourAnswer = normalizeBinaryClientAnswer(client?.csatAboveFour)
  const npsAboveSevenAnswer = normalizeBinaryClientAnswer(client?.npsAboveSeven)
  const stakeholderAwareAnswer = normalizeBinaryClientAnswer(client?.stakeholderAware)
  const adAccountsHealthyAnswer = normalizeBinaryClientAnswer(client?.adAccountsHealthy)
  const crmUsageProperlyAnswer = normalizeBinaryClientAnswer(client?.crmUsageProperly)
  const clientParticipationAbove90Answer = normalizeBinaryClientAnswer(client?.clientParticipationAbove90)

  const roiMarketing = revenue != null && mediaInvestment != null && mediaInvestment > 0
    ? revenue / mediaInvestment
    : null
  const mmf = revenue != null && contributionMarginRatio != null && mediaInvestment != null && fee != null && fee > 0
    ? ((revenue * contributionMarginRatio) - mediaInvestment) / fee
    : null
  const ltv = fee != null && contractLifetimeMonths != null
    ? fee * contractLifetimeMonths
    : null

  const financialFlag = mmf == null
    ? 'na'
    : mmf < 1
      ? 'risk'
      : mmf < 1.5
        ? 'attention'
        : 'ok'

  const roiFlag = roiMarketing == null
    ? 'na'
    : roiMarketing < 0
      ? 'risk'
      : roiMarketing < 1
        ? 'attention'
        : 'ok'
  const deliverablesFlag = (() => {
    const scores = [
      mapClientQualityScore(client?.trafficQuality),
      mapClientQualityScore(client?.designQuality),
      mapClientQualityScore(client?.copyQuality),
      mapClientQualityScore(client?.csQuality),
    ].filter((value) => Number.isFinite(value))

    if (!scores.length) return 'na'

    const average = scores.reduce((sum, value) => sum + value, 0) / scores.length
    if (average < 1.8) return 'risk'
    if (average < 2.6) return 'attention'
    return 'ok'
  })()
  const crmUsageFlag = deriveCoverageFlag([
    client?.rdStationAccountId,
    client?.rdPipelineId,
    Array.isArray(client?.rdQualifiedStages) ? client.rdQualifiedStages : [],
  ])
  const csAttendanceFlag = deriveCoverageFlag([client?.csOwner])
  const csatFlag = deriveBinaryFlagFromAnswer(csatAboveFourAnswer, deriveCoverageFlag([client?.csOwner, client?.dashboardUrl]))
  const clientParticipationFlag = deriveBinaryFlagFromAnswer(clientParticipationAbove90Answer, deriveCoverageFlag([client?.dashboardUrl, client?.driveUrl, client?.contractUrl]))
  const adAccountsFlag = deriveBinaryFlagFromAnswer(adAccountsHealthyAnswer, adAccountsCount === 0 ? 'risk' : adAccountsCount >= 2 ? 'ok' : 'attention')
  const stakeholderFlag = deriveBinaryFlagFromAnswer(stakeholderAwareAnswer, deriveCoverageFlag([client?.contractUrl, client?.projectManager]))
  const npsFlag = deriveBinaryFlagFromAnswer(npsAboveSevenAnswer, deriveCoverageFlag([client?.csOwner, client?.projectManager, client?.contractUrl]))
  const roiAboveOneFlag = deriveBinaryFlagFromAnswer(
    roiAboveOneAnswer,
    roiMarketing == null ? 'na' : roiMarketing >= 1 ? 'ok' : 'risk'
  )
  const crmUsageFlagResolved = deriveBinaryFlagFromAnswer(crmUsageProperlyAnswer, crmUsageFlag)
  const healthChecks = [
    csatFlag,
    npsFlag,
    stakeholderFlag,
    adAccountsFlag,
    crmUsageFlagResolved,
    clientParticipationFlag,
  ]
  const healthInputsCount = healthChecks.filter((value) => value !== 'na').length + (roiAboveOneFlag === 'na' ? 0 : 1)
  const negativeCount = healthChecks.filter((value) => value === 'risk').length + (roiAboveOneFlag === 'risk' ? 1 : 0)
  const healthScoreFlag = healthInputsCount === 0
    ? 'na'
    : negativeCount >= 4
      ? 'risk'
      : negativeCount >= 2
        ? 'attention'
        : 'ok'

  return {
    roiMarketing: roiMarketing == null ? '' : formatDerivedClientNumber(roiMarketing, 2),
    mmf: mmf == null ? '' : formatDerivedClientNumber(mmf, 2),
    ltv: ltv == null ? '' : formatCurrency(ltv),
    financialFlag,
    roiFlag,
    deliverablesFlag,
    crmUsageFlag: crmUsageFlagResolved,
    csAttendanceFlag,
    csatFlag,
    clientParticipationFlag,
    adAccountsFlag,
    npsFlag,
    stakeholderFlag,
    roiAboveOne: roiAboveOneAnswer === 'yes' ? 'Sim' : roiAboveOneAnswer === 'no' ? 'Não' : '',
    csatAboveFour: csatAboveFourAnswer === 'yes' ? 'Sim' : csatAboveFourAnswer === 'no' ? 'Não' : '',
    npsAboveSeven: npsAboveSevenAnswer === 'yes' ? 'Sim' : npsAboveSevenAnswer === 'no' ? 'Não' : '',
    stakeholderAware: stakeholderAwareAnswer === 'yes' ? 'Sim' : stakeholderAwareAnswer === 'no' ? 'Não' : '',
    adAccountsHealthy: adAccountsHealthyAnswer === 'yes' ? 'Sim' : adAccountsHealthyAnswer === 'no' ? 'Não' : '',
    crmUsageProperly: crmUsageProperlyAnswer === 'yes' ? 'Sim' : crmUsageProperlyAnswer === 'no' ? 'Não' : '',
    clientParticipationAbove90: clientParticipationAbove90Answer === 'yes' ? 'Sim' : clientParticipationAbove90Answer === 'no' ? 'Não' : '',
    healthScoreFlag,
  }
}

function normalizeIntegrationList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)))
  }

  return Array.from(new Set(
    String(value || '')
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  ))
}

function countClientConnectedSources(client) {
  return [
    client?.metaAdAccountId,
    client?.googleAdsAccountId,
    client?.tiktokAdsAccountId,
    client?.linkedInAdsAccountId,
    client?.googleSheetsUrl,
    client?.rdStationAccountId,
    client?.salesforceAccountId,
    client?.agendorAccountId,
  ].filter((value) => String(value || '').trim()).length
}

function getClientRegistryColumnMeta(columnKey) {
  const sharedName = { label: 'Cliente', type: 'name' }
  const map = {
    name: sharedName,
    cnpj: { label: 'CNPJ', type: 'text' },
    segment: { label: 'Segmento', type: 'text' },
    subsegment: { label: 'Subsegmento', type: 'text' },
    tier: { label: 'Tier', type: 'text' },
    squad: { label: 'Squad', type: 'text' },
    salesModel: { label: 'Modelo de Vendas', type: 'status' },
    implementationPhase: { label: 'Etapa da Jornada', type: 'status' },
    implementationObservation: { label: 'Observações da Jornada', type: 'long_text' },
    status: { label: 'Status', type: 'status' },
    product: { label: 'Produto', type: 'text' },
    fee: { label: 'Fee', type: 'currency' },
    mediaInvestment: { label: 'Investimento em Mídia', type: 'currency' },
    contractSignedAt: { label: 'Assinatura do Contrato', type: 'date' },
    churnDate: { label: 'Data de Churn', type: 'date' },
    startDate: { label: 'Data de Entrada', type: 'date' },
    step: { label: 'STEP', type: 'text' },
    ltv: { label: 'LTV', type: 'currency' },
    healthScore: { label: 'Health', type: 'health' },
    deliverablesFlag: { label: 'Flag dos Entregáveis', type: 'flag' },
    trafficQuality: { label: 'Gestão de Tráfego', type: 'status' },
    designQuality: { label: 'Design', type: 'status' },
    copyQuality: { label: 'Copy', type: 'status' },
    csQuality: { label: 'CS Atendimento', type: 'status' },
    roiAboveOne: { label: 'ROI Acima de 1?', type: 'status' },
    csatAboveFour: { label: 'CSAT Igual ou superior a 4?', type: 'status' },
    npsAboveSeven: { label: 'NPS Igual ou superior a 7?', type: 'status' },
    stakeholderAware: { label: 'Stakeholder Pagador Consciente Dos Avanços?', type: 'status' },
    adAccountsHealthy: { label: 'Contas de Anúncio Ativa? Saldo Ok?', type: 'status' },
    crmUsageProperly: { label: 'CRM Em Uso Corretamente?', type: 'status' },
    clientParticipationAbove90: { label: 'Cliente Participou de >90% dos Check-ins?', type: 'status' },
    financialFlag: { label: 'Flag MM/F', type: 'flag' },
    roiFlag: { label: 'Flag do ROI', type: 'flag' },
    healthScoreFlag: { label: 'Flag Health Score', type: 'flag' },
    crmUsageFlag: { label: 'CRM Em Uso Corretamente?', type: 'flag' },
    csAttendanceFlag: { label: 'CS Atendimento', type: 'flag' },
    csatFlag: { label: 'CSAT >= 4?', type: 'flag' },
    clientParticipationFlag: { label: 'Cliente participou > 90%?', type: 'flag' },
    adAccountsFlag: { label: 'Contas de Anúncio Ativa?', type: 'flag' },
    npsFlag: { label: 'NPS >= 7?', type: 'flag' },
    stakeholderFlag: { label: 'Stakeholder Pagador Consciente?', type: 'flag' },
    projectManager: { label: 'Gestor de Projetos', type: 'text' },
    trafficManager: { label: 'Gestor de Tráfego', type: 'text' },
    designer: { label: 'Designer', type: 'text' },
    organicDemands: { label: 'Demandas Orgânicas', type: 'number' },
    trafficDemands: { label: 'Demandas de Tráfego', type: 'number' },
    totalDemands: { label: 'Total de Demandas', type: 'number' },
    monthlyRevenue: { label: 'Faturamento', type: 'currency' },
    contributionMarginPercent: { label: 'Margem de Contribuição (%)', type: 'percent' },
    profitMarginPercent: { label: 'Margem de Lucro (%)', type: 'percent' },
    mmf: { label: 'MM/F', type: 'currency' },
    roiMarketing: { label: 'ROI do Marketing', type: 'number' },
    driveUrl: { label: 'Drive', type: 'link' },
    dashboardUrl: { label: 'Dashboard', type: 'link' },
    contractUrl: { label: 'Contrato', type: 'link' },
    eapUrl: { label: 'EAP', type: 'link' },
    brandManualUrl: { label: 'Manual de Marca', type: 'link' },
    moodboardUrl: { label: 'Moodboard', type: 'link' },
    salesNarrativeUrl: { label: 'Narrativa de Vendas', type: 'link' },
    drawflowUrl: { label: 'Draw Flow', type: 'link' },
    metaAdAccountId: { label: 'Conta Meta', type: 'text' },
    googleAdsAccountId: { label: 'Google Ads', type: 'text' },
    rdStationAccountId: { label: 'RD Station', type: 'text' },
  }

  return map[columnKey] || { label: columnKey, type: 'text' }
}

function resolveClientRegistryColumnMeta(columnKey, systemFieldsByKey, customColumnsByKey) {
  const systemField = systemFieldsByKey?.get?.(columnKey)
  if (systemField) {
    return {
      label: systemField.label || columnKey,
      type:
        columnKey === 'name'
          ? 'name'
          : columnKey === 'status'
            ? 'status'
            : systemField.type || 'text',
    }
  }

  const customField = customColumnsByKey?.get?.(columnKey)
  if (customField) {
    return {
      label: customField.label || columnKey,
      type: customField.type || 'text',
    }
  }

  return getClientRegistryColumnMeta(columnKey)
}

function createDefaultClientSystemFields() {
  const seenKeys = new Set()

  return CLIENT_REGISTRY_VIEWS.flatMap((view) =>
    view.columns
      .filter((columnKey) => columnKey !== 'name')
      .map((columnKey) => {
        if (seenKeys.has(columnKey)) return null
        seenKeys.add(columnKey)

        const meta = getClientRegistryColumnMeta(columnKey)
        return {
          id: `system-${columnKey}`,
          key: columnKey,
          label: meta.label || columnKey,
          type: meta.type || 'text',
          options: getDefaultClientSystemFieldOptions(columnKey),
          tabKey: view.key,
          formulaExpression: '',
          settings: {},
        }
      })
      .filter(Boolean)
  )
}

const DEFAULT_CLIENT_SYSTEM_FIELDS = createDefaultClientSystemFields()

function formatClientCustomFieldValue(columnType, value) {
  if (columnType === 'currency') return formatClientCurrency(value)
  if (columnType === 'percent') return formatClientPercent(value)
  return String(value || '')
}

function evaluateFormulaExpression(expression, resolveFieldValue) {
  const normalized = String(expression || '').trim()
  if (!normalized) return null

  const replacedExpression = normalized.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, fieldKey) => {
    const resolvedValue = resolveFieldValue(fieldKey)
    const numericValue = parseClientNumber(resolvedValue)
    return Number.isFinite(numericValue) ? String(numericValue) : '0'
  })

  if (!/^[\d+\-*/().,\s]+$/.test(replacedExpression)) {
    return null
  }

  try {
    const safeExpression = replacedExpression.replace(/,/g, '.')
    const result = Function(`"use strict"; return (${safeExpression})`)()
    return Number.isFinite(result) ? result : null
  } catch (error) {
    return null
  }
}

function buildContextInsight(tone, title, description) {
  return { tone, title, description }
}

function normalizeClientStatus(client) {
  return String(client?.status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isClientActiveForDashboard(client) {
  if (client?.isArchived) return false
  const normalizedStatus = normalizeClientStatus(client)
  return client?.dashboardEnabled !== false && (!normalizedStatus || normalizedStatus === 'ativo')
}

function getClientStatusMeta(client) {
  const normalizedStatus = normalizeClientStatus(client)

  if (normalizedStatus === 'churn') {
    return {
      label: 'Churn',
      tone: 'danger',
      description: 'Cliente encerrado na carteira',
    }
  }

  if (normalizedStatus === 'risco') {
    return {
      label: 'Risco',
      tone: 'warning',
      description: 'Conta ativa com atenção operacional',
    }
  }

  if (normalizedStatus === 'pausado') {
    return {
      label: 'Pausado',
      tone: 'neutral',
      description: 'Conta temporariamente pausada',
    }
  }

  if (normalizedStatus === 'onboarding') {
    return {
      label: 'Onboarding',
      tone: 'info',
      description: 'Configuração inicial em andamento',
    }
  }

  if (normalizedStatus === 'ativo') {
    return {
      label: 'Ativo',
      tone: 'success',
      description: 'Conta ativa na operação',
    }
  }

  const healthScore = calculateClientHealthScore(client)

  if (healthScore != null && healthScore < 45) {
    return {
      label: 'Risco',
      tone: 'danger',
      description: 'Health score baixo e revisao recomendada',
    }
  }

  if (client?.metaAdAccountId) {
    return {
      label: 'Ativo',
      tone: 'success',
      description: 'Conta operacional conectada',
    }
  }

  if (client?.logoUrl) {
    return {
      label: 'Em setup',
      tone: 'info',
      description: 'Identidade pronta, integração pendente',
    }
  }

  return {
    label: 'Onboarding',
    tone: 'neutral',
    description: 'Configuração inicial em andamento',
  }
}

const METRIC_OPTIONS = {
  spend: { label: 'Investimento', type: 'currency' },
  impressions: { label: 'Impressões', type: 'number' },
  cpm: { label: 'CPM', type: 'currency' },
  reach: { label: 'Alcance', type: 'number' },
  frequency: { label: 'Frequência', type: 'decimal' },
  clicks: { label: 'Cliques no link', type: 'number' },
  landingPageViews: { label: 'Visualização de página de destino', type: 'number' },
  addToCart: { label: 'Adição ao carrinho', type: 'number' },
  initiateCheckout: { label: 'Finalização de compra', type: 'number' },
  cpc: { label: 'CPC', type: 'currency' },
  ctr: { label: 'CTR', type: 'percent' },
  totalConversions: { label: 'Conversões totais', type: 'number' },
  conversionRate: { label: 'Taxa de conversão', type: 'percent' },
  purchaseValue: { label: 'Faturamento', type: 'currency' },
  purchases: { label: 'Compras', type: 'number' },
  leads: { label: 'Leads', type: 'number' },
  messages: { label: 'Mensagens', type: 'number' },
  videoViews: { label: 'Video views', type: 'number' },
  videoViewRate: { label: '% de visualizações', type: 'percent' },
  thruplay: { label: 'Thruplay', type: 'number' },
  hookRate: { label: 'Hook', type: 'percent' },
  cpa: { label: 'CPA', type: 'currency' },
  roas: { label: 'ROAS', type: 'multiplier' },
  landingPageViews: { label: 'Visualização de página de destino', type: 'number' },
}

const DATE_PRESETS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7d', label: 'Últimos 7 dias' },
  { value: 'last_30d', label: 'Últimos 30 dias' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'maximum', label: 'Todo o histórico' },
  { value: 'custom', label: 'Período personalizado' },
]

const META_RESULT_PERIOD_OPTIONS = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Ano' },
]

const META_RANKING_SPEND_TONE = '#60a5fa'

const META_RESULT_COMPARISON_OPTIONS = {
  purchases: {
    key: 'purchases',
    title: 'Compras',
    description: 'Compare a curva de compras com o custo por compra no agrupamento que fizer mais sentido para leitura executiva.',
    resultMetricKey: 'purchases',
    costMetricKey: 'cpa',
    resultLabel: 'Compras',
    costLabel: 'Custo por compra',
    resultTone: '#10b981',
    costTone: '#f59e0b',
    icon: 'bx-cart',
  },
  leads: {
    key: 'leads',
    title: 'Cadastros',
    description: 'Veja como os cadastros evoluem junto com o custo por cadastro ao longo do tempo.',
    resultMetricKey: 'leads',
    costMetricKey: 'cpa',
    resultLabel: 'Cadastros',
    costLabel: 'Custo por cadastro',
    resultTone: '#fbbf24',
    costTone: '#38bdf8',
    icon: 'bx-user-plus',
  },
  messages: {
    key: 'messages',
    title: 'Mensagens iniciadas',
    description: 'Acompanhe o volume de mensagens iniciadas contra o custo por mensagem em cada janela de agrupamento.',
    resultMetricKey: 'messages',
    costMetricKey: 'cpa',
    resultLabel: 'Mensagens iniciadas',
    costLabel: 'Custo por mensagem iniciada',
    resultTone: '#3b82f6',
    costTone: '#a855f7',
    icon: 'bx-message-rounded-dots',
  },
  reach: {
    key: 'reach',
    title: 'Alcance',
    description: 'Leia o alcance gerado ao longo do tempo junto com o custo por alcance no agrupamento selecionado.',
    resultMetricKey: 'reachResults',
    costMetricKey: 'costPerReach',
    resultLabel: 'Alcance',
    costLabel: 'Custo por alcance',
    resultTone: '#38bdf8',
    costTone: '#22c55e',
    icon: 'bx-radar',
  },
  truplays: {
    key: 'truplays',
    title: 'TruPlays',
    description: 'Acompanhe a evolução dos TruPlays junto com o custo por TruPlay no período filtrado.',
    resultMetricKey: 'thruplays',
    costMetricKey: 'costPerTruplay',
    resultLabel: 'TruPlays',
    costLabel: 'Custo por TruPlay',
    resultTone: '#a855f7',
    costTone: '#f59e0b',
    icon: 'bx-play-circle',
  },
}

const CLIENT_INTEGRATION_GROUPS = [
  {
    title: 'Google Ads',
    icon: 'bxl-google',
    accent: '#ea4335',
    description: 'Selecione a conta Google Ads referente a este cliente.',
    fields: [
      { name: 'googleAdsAccountId', label: 'Conta Google Ads do cliente', placeholder: '123-456-7890', storage: 'client', type: 'text' },
    ],
  },
  {
    title: 'TikTok Ads',
    icon: 'bxl-tiktok',
    accent: '#ff0050',
    description: 'Selecione a conta TikTok Ads que deve compor o dashboard deste cliente.',
    fields: [
      { name: 'tiktokAdsAccountId', label: 'Conta TikTok Ads do cliente', placeholder: '987654321', storage: 'client', type: 'text' },
    ],
  },
  {
    title: 'LinkedIn Ads',
    icon: 'bxl-linkedin-square',
    accent: '#0a66c2',
    description: 'Selecione a conta LinkedIn Ads usada por este cliente.',
    fields: [
      { name: 'linkedInAdsAccountId', label: 'Conta LinkedIn Ads do cliente', placeholder: 'urn:li:sponsoredAccount:123', storage: 'client', type: 'text' },
    ],
  },
  {
    title: 'Agendor',
    icon: 'bx-briefcase-alt-2',
    accent: '#f97316',
    description: 'Deixe o Agendor separado para consultar a origem comercial correta.',
    fields: [
      { name: 'agendorToken', label: 'Chave / credencial', placeholder: 'Token do Agendor', storage: 'integrations', type: 'password' },
      { name: 'agendorAccountId', label: 'Conta / pipeline do cliente', placeholder: 'Pipeline, funil ou ID da conta', storage: 'client', type: 'text' },
    ],
  },
]

const CLIENT_DASHBOARD_INTEGRATION_OPTIONS = [
  { key: 'meta_ads', label: 'Meta Ads', description: 'Conta de mídia principal e leitura de campanhas.' },
  { key: 'google_ads', label: 'Google Ads', description: 'Contas Google Ads e dados complementares.' },
  { key: 'tiktok_ads', label: 'TikTok Ads', description: 'Operação de mídia e contas do TikTok Ads.' },
  { key: 'linkedin_ads', label: 'LinkedIn Ads', description: 'Campanhas e contas do LinkedIn Ads.' },
  { key: 'agendor', label: 'Agendor', description: 'Conta comercial e pipeline no Agendor.' },
]

const DEFAULT_CLIENT_DASHBOARD_INTEGRATION_KEYS = CLIENT_DASHBOARD_INTEGRATION_OPTIONS.map((item) => item.key)

function normalizeClientDashboardIntegrationKeys(items = []) {
  if (!Array.isArray(items)) return [...DEFAULT_CLIENT_DASHBOARD_INTEGRATION_KEYS]

  const allowedKeys = new Set(DEFAULT_CLIENT_DASHBOARD_INTEGRATION_KEYS)
  const normalized = Array.from(
    new Set(items.map((item) => String(item || '').trim()).filter((item) => allowedKeys.has(item)))
  )

  return normalized.length ? normalized : [...DEFAULT_CLIENT_DASHBOARD_INTEGRATION_KEYS]
}

function isClientDashboardIntegrationVisible(client, integrationKey) {
  if (!client || client.dashboardEnabled === false) return false
  return normalizeClientDashboardIntegrationKeys(client.dashboardVisibleIntegrationKeys).includes(integrationKey)
}

const GLOBAL_INTEGRATION_GROUPS = [
  {
    title: 'Meta Ads',
    icon: 'bxl-meta',
    accent: '#0668E1',
    description: 'Chave principal da operação para listar contas e puxar dados da Meta.',
    field: { name: 'metaAccessToken', label: 'Chave da API da Meta', placeholder: 'EAABsbCS1...' },
  },
  {
    title: 'Google Ads',
    icon: 'bxl-google',
    accent: '#ea4335',
    description: 'Credencial global da operação para futuras conexões e listagem de contas.',
    field: { name: 'googleAdsToken', label: 'Token / credencial do Google Ads', placeholder: 'Developer token ou OAuth' },
  },
  {
    title: 'TikTok Ads',
    icon: 'bxl-tiktok',
    accent: '#ff0050',
    description: 'Credencial global da operação para conectar e gerenciar contas do TikTok Ads.',
    field: { name: 'tiktokAdsToken', label: 'Token / credencial do TikTok Ads', placeholder: 'tt_...' },
  },
  {
    title: 'LinkedIn Ads',
    icon: 'bxl-linkedin-square',
    accent: '#0a66c2',
    description: 'Credencial global da operação para trabalhar com contas do LinkedIn Ads.',
    field: { name: 'linkedinAdsToken', label: 'Token OAuth 2.0 do LinkedIn Ads', placeholder: 'AQV...' },
  },
  {
    title: 'ClickUp',
    icon: 'bx-task',
    accent: '#8b5cf6',
    description: 'Token global para consultar listas, tarefas, responsáveis e status operacionais.',
    field: { name: 'clickUpToken', label: 'Token de API do ClickUp', placeholder: 'pk_...' },
  },
  {
    title: 'Monday',
    icon: 'bx-columns',
    accent: '#f59e0b',
    description: 'Token global para consultar boards, itens, status e responsáveis no Monday.',
    field: { name: 'mondayToken', label: 'Token de API do Monday', placeholder: 'Cole aqui o token do Monday' },
  },
]

const META_TEMPLATE_METRIC_OPTIONS = {
  spend: {
    label: 'Investimento',
    type: 'currency',
    icon: 'bx-wallet',
    tone: 'blue',
    description: 'Valor total investido no período filtrado.',
  },
  impressions: {
    label: 'Impressões',
    type: 'number',
    icon: 'bx-show',
    tone: 'purple',
    description: 'Total de impressões entregues no período.',
  },
  clicks: {
    label: 'Cliques no link',
    type: 'number',
    icon: 'bx-pointer',
    tone: 'cyan',
    description: 'Cliques no link dentro das campanhas filtradas.',
  },
  cpc: {
    label: 'CPC',
    type: 'currency',
    icon: 'bx-purchase-tag',
    tone: 'orange',
    description: 'Custo médio por clique.',
  },
  ctr: {
    label: 'CTR',
    type: 'percent',
    icon: 'bx-mouse',
    tone: 'pink',
    description: 'Taxa de cliques sobre impressões.',
  },
  totalConversions: {
    label: 'Conversões totais',
    type: 'number',
    icon: 'bx-line-chart',
    tone: 'gold',
    description: 'Compras, leads e mensagens somadas.',
  },
  reach: {
    label: 'Alcance',
    type: 'number',
    icon: 'bx-radar',
    tone: 'blue',
    description: 'Pessoas alcançadas no período filtrado.',
  },
  cpm: {
    label: 'CPM',
    type: 'currency',
    icon: 'bx-bar-chart-alt-2',
    tone: 'purple',
    description: 'Custo por mil impressões.',
  },
  frequency: {
    label: 'Frequência',
    type: 'decimal',
    icon: 'bx-repeat',
    tone: 'gold',
    description: 'Média de exibições por pessoa alcançada.',
  },
  conversionRate: {
    label: 'Taxa de conversão clique -> conversão',
    type: 'percent',
    icon: 'bx-git-compare',
    tone: 'emerald',
    description: 'Conversões totais divididas pelos cliques no link.',
  },
  averageTicket: {
    label: 'Ticket médio',
    type: 'currency',
    icon: 'bx-receipt',
    tone: 'orange',
    description: 'Faturamento atribuído dividido pelas compras.',
  },
  purchaseValue: {
    label: 'Faturamento',
    type: 'currency',
    icon: 'bx-money',
    tone: 'emerald',
    description: 'Valor total das compras atribuídas no período.',
  },
  videoViews: {
    label: 'Video views',
    type: 'number',
    icon: 'bx-play-circle',
    tone: 'pink',
    description: 'Total de visualizações de vídeo reconhecidas pela Meta no período.',
  },
  videoViewRate: {
    label: '% de visualizações',
    type: 'percent',
    icon: 'bx-slideshow',
    tone: 'purple',
    description: 'Percentual de impressões que viraram visualização de vídeo.',
  },
  thruplay: {
    label: 'Thruplay',
    type: 'number',
    icon: 'bx-movie-play',
    tone: 'blue',
    description: 'Quantidade de visualizações qualificadas como Thruplay.',
  },
  hookRate: {
    label: 'Hook',
    type: 'percent',
    icon: 'bx-magnet',
    tone: 'gold',
    description: 'Percentual das visualizações que avançaram pelo menos 25% do vídeo.',
  },
  purchases: {
    label: 'Compras',
    type: 'number',
    icon: 'bx-cart',
    tone: 'emerald',
    description: 'Total de compras atribuídas no período.',
  },
  costPerPurchase: {
    label: 'Custo por compra',
    type: 'currency',
    icon: 'bx-receipt',
    tone: 'gold',
    description: 'Investimento dividido pelas compras atribuídas.',
  },
  leads: {
    label: 'Leads',
    type: 'number',
    icon: 'bx-user-plus',
    tone: 'cyan',
    description: 'Cadastros gerados nas campanhas filtradas.',
  },
  costPerLead: {
    label: 'Custo por lead',
    type: 'currency',
    icon: 'bx-purchase-tag',
    tone: 'orange',
    description: 'Investimento dividido pelos leads gerados.',
  },
  messages: {
    label: 'Mensagens iniciadas',
    type: 'number',
    icon: 'bx-chat',
    tone: 'blue',
    description: 'Conversas iniciadas em canais de mensagem.',
  },
  costPerMessage: {
    label: 'Custo por mensagem',
    type: 'currency',
    icon: 'bx-message-square-dots',
    tone: 'pink',
    description: 'Investimento dividido pelas mensagens iniciadas.',
  },
  reachResults: {
    label: 'Alcance qualificado',
    type: 'number',
    icon: 'bx-radar',
    tone: 'blue',
    description: 'Pessoas alcançadas nas campanhas classificadas como alcance.',
  },
  costPerReach: {
    label: 'Custo por alcance',
    type: 'currency',
    icon: 'bx-target-lock',
    tone: 'cyan',
    description: 'Investimento das campanhas de alcance dividido pelas pessoas alcançadas.',
  },
  thruplays: {
    label: 'TruPlays',
    type: 'number',
    icon: 'bx-play-circle',
    tone: 'purple',
    description: 'Resultados de truplay nas campanhas de vídeo.',
  },
  costPerTruplay: {
    label: 'Custo por TruPlay',
    type: 'currency',
    icon: 'bx-movie-play',
    tone: 'gold',
    description: 'Investimento das campanhas de vídeo dividido pelos truplays.',
  },
  clicksWithoutConversion: {
    label: 'Cliques sem conversão',
    type: 'number',
    icon: 'bx-pointer',
    tone: 'purple',
    description: 'Cliques que não viraram compra, lead ou mensagem.',
  },
  roas: {
    label: 'ROAS consolidado',
    type: 'multiplier',
    icon: 'bx-line-chart',
    tone: 'blue',
    description: 'Retorno sobre investimento da leitura filtrada.',
  },
}

const FIXED_META_METRIC_KEYS = new Set([
  'spend',
  'impressions',
  'cpm',
  'reach',
  'frequency',
  'clicks',
  'cpc',
  'ctr',
  'totalConversions',
  'conversionRate',
  'purchaseValue',
  'purchases',
  'costPerPurchase',
  'roas',
  'leads',
  'costPerLead',
  'messages',
  'costPerMessage',
])

const FUNNEL_LIBRARY_EXCLUDED_KEYS = new Set([
  'spend',
  'cpm',
  'frequency',
  'cpc',
  'ctr',
  'conversionRate',
  'purchaseValue',
  'videoViewRate',
  'cpa',
  'roas',
])

const LEGACY_DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS = ['spend', 'totalConversions', 'cost_per_lead', 'cpa', 'roas']
const LEGACY_DEFAULT_META_CAMPAIGN_TABLE_COLUMN_SET = new Set(LEGACY_DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS)
const CLIENT_PDF_HIDDEN_META_KEYS = new Set(['purchaseValue', 'conversionRate', 'totalConversions'])

const META_CAMPAIGN_TABLE_COLUMN_OPTIONS = {
  spend: { label: 'Investimento', type: 'currency', description: 'Valor investido no período filtrado.' },
  totalConversions: { label: 'Conversões', type: 'number', description: 'Total consolidado de compras, leads e mensagens.' },
  purchases: { label: 'Compras', type: 'number', description: 'Compras atribuídas à campanha.' },
  leads: { label: 'Leads', type: 'number', description: 'Leads atribuídos à campanha.' },
  cost_per_lead: { label: 'CPL', type: 'currency', description: 'Custo por lead da campanha.' },
  messages: { label: 'Mensagens', type: 'number', description: 'Mensagens iniciadas atribuídas à campanha.' },
  cpa: { label: 'CPA', type: 'currency', description: 'Custo médio por resultado consolidado.' },
  roas: { label: 'ROAS', type: 'multiplier', description: 'Retorno sobre investimento da campanha.' },
  purchaseValue: { label: 'Faturamento', type: 'currency', description: 'Receita atribuída às compras da campanha.' },
  clicks: { label: 'Cliques', type: 'number', description: 'Cliques registrados no período.' },
  impressions: { label: 'Impressões', type: 'number', description: 'Volume de impressões da campanha.' },
  reach: { label: 'Alcance', type: 'number', description: 'Pessoas alcançadas pela campanha.' },
  ctr: { label: 'CTR', type: 'percent', description: 'Taxa de cliques sobre impressões.' },
  cpc: { label: 'CPC', type: 'currency', description: 'Custo médio por clique.' },
  cpm: { label: 'CPM', type: 'currency', description: 'Custo por mil impressões.' },
  frequency: { label: 'Frequência', type: 'decimal', description: 'Média de exibições por pessoa alcançada.' },
  conversionRate: { label: 'Taxa de conversão', type: 'percent', description: 'Conversão de cliques em resultados.' },
}

const RD_TEMPLATE_METRIC_OPTIONS = {
  opportunityCount: {
    label: 'Oportunidades',
    type: 'number',
    icon: 'bx-bulb',
    tone: 'blue',
    description: 'Leads da safra criada no período que viraram oportunidade.',
  },
  qualifiedOpportunityCount: {
    label: 'Qualificados',
    type: 'number',
    icon: 'bx-filter-alt',
    tone: 'emerald',
    description: 'Oportunidades que passaram pelas etapas qualificadas.',
  },
  wonOpportunityCount: {
    label: 'Vendas da safra criada e fechada no período',
    type: 'number',
    icon: 'bx-badge-check',
    tone: 'emerald',
    description: 'Leads criados no período e vendidos dentro do mesmo período.',
  },
  wonOpportunityRevenue: {
    label: 'Faturamento da safra criada e fechada',
    type: 'currency',
    icon: 'bx-wallet-alt',
    tone: 'orange',
    description: 'Receita da safra criada e convertida dentro do período.',
  },
  avgTicketWonByCreation: {
    label: 'Ticket médio da safra criada e fechada',
    type: 'currency',
    icon: 'bx-receipt',
    tone: 'gold',
    description: 'Ticket médio das vendas da safra criada no período.',
  },
  leadToQualifiedRate: {
    label: 'Taxa de oportunidade para qualificados',
    type: 'percent',
    icon: 'bx-transfer-alt',
    tone: 'cyan',
    description: 'Conversão da oportunidade em qualificação.',
  },
  qualifiedToWonRate: {
    label: 'Taxa de qualificados para venda',
    type: 'percent',
    icon: 'bx-badge-check',
    tone: 'emerald',
    description: 'Conversão dos qualificados em venda.',
  },
  leadToWonRate: {
    label: 'Taxa de oportunidade para venda',
    type: 'percent',
    icon: 'bx-line-chart',
    tone: 'blue',
    description: 'Conversão da safra criada em venda.',
  },
  lostOpportunityCount: {
    label: 'Negócios perdidos',
    type: 'number',
    icon: 'bx-x-circle',
    tone: 'pink',
    description: 'Oportunidades perdidas dentro da leitura da safra.',
  },
  lostOpportunityValue: {
    label: 'Valor perdido',
    type: 'currency',
    icon: 'bx-money-withdraw',
    tone: 'pink',
    description: 'Valor potencial das oportunidades perdidas na safra criada no período.',
  },
  openDeals: {
    label: 'Negociações em aberto',
    type: 'number',
    icon: 'bx-folder-open',
    tone: 'blue',
    description: 'Negociações abertas e movimentadas dentro do período selecionado.',
  },
  openPipeline: {
    label: 'Valor em negociação',
    type: 'currency',
    icon: 'bx-briefcase-alt-2',
    tone: 'orange',
    description: 'Soma do valor das negociações em aberto movimentadas no período.',
  },
  wonDeals: {
    label: 'Negociações ganhas fechadas no período',
    type: 'number',
    icon: 'bx-calendar-check',
    tone: 'emerald',
    description: 'Negociações ganhas com fechamento no período selecionado.',
  },
  wonDealsFromPreviousCohorts: {
    label: 'Negociações ganhas de safras anteriores',
    type: 'number',
    icon: 'bx-history',
    tone: 'blue',
    description: 'Negociações fechadas no período de leads criados antes do intervalo.',
  },
  wonRevenue: {
    label: 'Faturamento das negociações fechadas',
    type: 'currency',
    icon: 'bx-wallet-alt',
    tone: 'orange',
    description: 'Receita total das negociações ganhas fechadas no período.',
  },
  avgTicketWon: {
    label: 'Ticket médio das negociações fechadas',
    type: 'currency',
    icon: 'bx-receipt',
    tone: 'gold',
    description: 'Ticket médio das negociações ganhas no período.',
  },
  wonRevenueFromPreviousCohorts: {
    label: 'Faturamento de safras anteriores fechadas',
    type: 'currency',
    icon: 'bx-coin-stack',
    tone: 'orange',
    description: 'Receita das negociações de leads de safras anteriores.',
  },
  avgTicketWonPreviousCohorts: {
    label: 'Ticket médio de safras anteriores fechadas',
    type: 'currency',
    icon: 'bx-spreadsheet',
    tone: 'gold',
    description: 'Ticket médio das negociações de safras anteriores.',
  },
  rdFinalSalesCount: {
    label: 'Vendas totais do resultado final',
    type: 'number',
    icon: 'bx-trophy',
    tone: 'emerald',
    description: 'Soma de vendas da safra com vendas de safras anteriores no período.',
  },
  rdFinalRevenue: {
    label: 'Faturamento total do resultado final',
    type: 'currency',
    icon: 'bx-wallet-alt',
    tone: 'orange',
    description: 'Receita final consolidada da leitura comercial.',
  },
  rdFinalAvgTicket: {
    label: 'Ticket médio do resultado final',
    type: 'currency',
    icon: 'bx-receipt',
    tone: 'gold',
    description: 'Ticket médio do consolidado final do período.',
  },
  contacts: {
    label: 'Leads totais',
    type: 'number',
    icon: 'bx-user',
    tone: 'blue',
    description: 'Contatos totais retornados pelo RD.',
  },
  contactsInPeriod: {
    label: 'Leads criados no período',
    type: 'number',
    icon: 'bx-calendar',
    tone: 'cyan',
    description: 'Contatos que entraram na base dentro do período.',
  },
  contactsMoved: {
    label: 'Leads movimentados',
    type: 'number',
    icon: 'bx-transfer',
    tone: 'purple',
    description: 'Contatos que avançaram em alguma etapa comercial.',
  },
  qualifiedDeals: {
    label: 'Negócios qualificados',
    type: 'number',
    icon: 'bx-filter-alt',
    tone: 'emerald',
    description: 'Total de negócios que passaram pelas etapas qualificadas.',
  },
  qualifiedContacts: {
    label: 'Contatos qualificados',
    type: 'number',
    icon: 'bx-check-shield',
    tone: 'emerald',
    description: 'Contatos que chegaram em etapas qualificadas.',
  },
  closeRate: {
    label: 'Taxa de fechamento',
    type: 'percent',
    icon: 'bx-badge-check',
    tone: 'emerald',
    description: 'Percentual de negócios fechados com ganho.',
  },
  dealToWonRate: {
    label: 'Taxa de negócio para venda',
    type: 'percent',
    icon: 'bx-line-chart',
    tone: 'blue',
    description: 'Conversão de negócios em vendas.',
  },
  leadToDealRate: {
    label: 'Taxa de lead para negócio',
    type: 'percent',
    icon: 'bx-trending-up',
    tone: 'cyan',
    description: 'Percentual de leads que viraram negócio.',
  },
  sourceConversionRate: {
    label: 'Conversão por origem',
    type: 'percent',
    icon: 'bx-git-branch',
    tone: 'gold',
    description: 'Conversão média da origem filtrada.',
  },
  avgLeadToWonDays: {
    label: 'Tempo médio lead -> venda',
    type: 'duration',
    icon: 'bx-time-five',
    tone: 'orange',
    description: 'Tempo médio total entre entrada do lead e venda.',
  },
  avgDealToWonDays: {
    label: 'Tempo médio negócio -> venda',
    type: 'duration',
    icon: 'bx-timer',
    tone: 'orange',
    description: 'Tempo médio entre criação do negócio e venda.',
  },
  avgLeadToWonDaysFiltered: {
    label: 'Tempo médio lead -> venda (filtro)',
    type: 'duration',
    icon: 'bx-time',
    tone: 'pink',
    description: 'Tempo médio considerando o filtro atual.',
  },
  avgDealToWonDaysFiltered: {
    label: 'Tempo médio negócio -> venda (filtro)',
    type: 'duration',
    icon: 'bx-stopwatch',
    tone: 'pink',
    description: 'Tempo médio por venda dentro do filtro atual.',
  },
  contactsWithDeals: {
    label: 'Contatos com negócio',
    type: 'number',
    icon: 'bx-briefcase-alt',
    tone: 'blue',
    description: 'Quantidade de contatos que geraram negócios.',
  },
  contactsWithWonDeals: {
    label: 'Contatos com venda',
    type: 'number',
    icon: 'bx-trophy',
    tone: 'emerald',
    description: 'Quantidade de contatos com venda ganha.',
  },
  lostContacts: {
    label: 'Contatos perdidos',
    type: 'number',
    icon: 'bx-x-circle',
    tone: 'pink',
    description: 'Contatos marcados como perda na operação.',
  },
}

const FIXED_RD_METRIC_KEYS = new Set([
  'opportunityCount',
  'qualifiedOpportunityCount',
  'wonOpportunityCount',
  'wonOpportunityRevenue',
  'avgTicketWonByCreation',
  'leadToQualifiedRate',
  'qualifiedToWonRate',
  'leadToWonRate',
  'lostOpportunityCount',
  'lostOpportunityValue',
  'openDeals',
  'openPipeline',
  'wonDeals',
  'wonDealsFromPreviousCohorts',
  'wonRevenue',
  'avgTicketWon',
  'wonRevenueFromPreviousCohorts',
  'avgTicketWonPreviousCohorts',
  'rdFinalSalesCount',
  'rdFinalRevenue',
  'rdFinalAvgTicket',
])

const LOWER_IS_BETTER_METRIC_KEYS = new Set([
  'cpc',
  'cpm',
  'cpa',
  'costPerPurchase',
  'costPerLead',
  'costPerMessage',
  'cost_per_purchase',
  'cost_per_lead',
  'cost_per_message',
  'avgLeadToWonDays',
  'avgDealToWonDays',
  'avgLeadToWonDaysFiltered',
  'avgDealToWonDaysFiltered',
  'lostOpportunityCount',
  'lostOpportunityValue',
  'lostContacts',
])

const NEUTRAL_TREND_METRIC_KEYS = new Set([
  'spend',
  'impressions',
  'clicks',
  'reach',
  'contacts',
  'contactsInPeriod',
  'contactsMoved',
])

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
}

function formatCurrencyByCode(value, currency = 'BRL') {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  } catch {
    return formatCurrency(value)
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value || 0))
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')}%`
}

function formatDecimal(value, decimals = 1) {
  return Number(value || 0).toFixed(decimals).replace('.', ',')
}

function normalizeGeoLabel(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveBrazilStateMeta(label) {
  const normalized = normalizeGeoLabel(label)
  if (!normalized) return null

  const byUf = Object.entries(BRAZIL_STATE_MAP_POINTS).find(([uf]) => uf.toLowerCase() === normalized)
  if (byUf) {
    return {
      uf: byUf[0],
      ...byUf[1],
    }
  }

  const stateEntry = Object.entries(BRAZIL_STATE_NAME_TO_UF).find(([name]) => normalizeGeoLabel(name) === normalized)
  if (!stateEntry) return null

  const uf = stateEntry[1]
  return {
    uf,
    ...BRAZIL_STATE_MAP_POINTS[uf],
  }
}

function resolveBrazilCityMeta(item) {
  const cityKey = normalizeGeoLabel(item?.city || item?.label)
  const regionMeta = resolveBrazilStateMeta(item?.region)

  if (BRAZIL_CITY_MAP_POINTS[cityKey]) {
    return BRAZIL_CITY_MAP_POINTS[cityKey]
  }

  if (regionMeta) {
    return {
      x: regionMeta.x,
      y: regionMeta.y,
      state: regionMeta.uf,
    }
  }

  return null
}

function getMetaBreakdownConversions(item) {
  return Number(item?.custom_metrics?.totalConversions || 0)
}

function getMetaCampaignResultValue(metrics, resultMetricKey = 'totalConversions') {
  if (resultMetricKey === 'reachResults') {
    return Number(metrics?.reachResults || metrics?.reach || 0)
  }

  return Number(metrics?.[resultMetricKey] || 0)
}

function getMetaBreakdownResultValue(item, resultMetricKey = 'totalConversions') {
  if (resultMetricKey === 'reachResults') {
    return Number(item?.custom_metrics?.reachResults || item?.custom_metrics?.reach || item?.reach || 0)
  }

  return Number(item?.custom_metrics?.[resultMetricKey] || 0)
}

function getMetaBreakdownAverageCost(item, resultMetricKey = 'totalConversions') {
  const explicitCostMap = {
    totalConversions: Number(item?.custom_metrics?.cpa || 0),
    purchases: Number(item?.custom_metrics?.cost_per_purchase || 0),
    leads: Number(item?.custom_metrics?.cost_per_lead || 0),
    messages: Number(item?.custom_metrics?.cost_per_message || 0),
    reachResults: Number(item?.custom_metrics?.cost_per_reach || 0),
    thruplays: Number(item?.custom_metrics?.cost_per_thruplay || 0),
  }
  const explicitCost = explicitCostMap[resultMetricKey] || 0
  if (explicitCost > 0) return explicitCost

  const results = getMetaBreakdownResultValue(item, resultMetricKey)
  return results > 0 ? Number(item?.spend || 0) / results : 0
}

function getMetaBreakdownConversionRate(item, resultMetricKey = 'totalConversions') {
  const clicks = Number(item?.clicks || 0)
  return clicks > 0 ? (getMetaBreakdownResultValue(item, resultMetricKey) / clicks) * 100 : 0
}

function buildMetaRankingChartLabel(label) {
  const normalizedLabel = String(label || 'Sem nome').trim()
  if (normalizedLabel.length <= 20) return normalizedLabel

  const words = normalizedLabel.split(/\s+/)
  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length <= 20) {
      currentLine = nextLine
      return
    }

    if (currentLine) lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) lines.push(currentLine)
  return lines.slice(0, 2)
}

function formatMetaRankingResultLabel(resultLabel = '') {
  return String(resultLabel || 'resultados').trim().toLowerCase()
}

function formatMultiplier(value) {
  return `${Number(value || 0).toFixed(2).replace('.', ',')}x`
}

function formatGoogleAdsAccountLabel(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 10) return value || 'Conta Google Ads'
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatDurationDays(value) {
  const days = Number(value || 0)
  if (!days) return 'Sem base'
  if (days < 1) return 'Menos de 1 dia'
  return `${days.toFixed(1).replace('.', ',')} dias`
}

function formatDurationHours(value) {
  const totalSeconds = Math.max(0, Math.round(Number(value || 0)))
  if (!totalSeconds) return '0h'

  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${String(minutes).padStart(2, '0')}min`
}

function normalizePersonLookup(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatShortDate(value) {
  const date = parseLocalDateInput(value) || (value ? new Date(value) : null)
  if (!date || Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function normalizeMondayGroupKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getMondayTaskUrgency(task) {
  const explicitLabel = String(task?.priorityLabel || '').trim()
  const explicitRank = Number(task?.priorityRank || 0)

  if (explicitLabel || explicitRank > 0) {
    const safeRank = explicitRank > 0 ? explicitRank : 1
    return {
      label: explicitLabel || 'Prioridade definida',
      rank: safeRank,
      tone: safeRank >= 4 ? 'danger' : safeRank === 3 ? 'warning' : safeRank === 2 ? 'info' : 'neutral',
    }
  }

  const daysOverdue = Number(task?.daysOverdue || 0)
  if (task?.isOverdue && daysOverdue >= 30) return { label: 'Crítica', rank: 5, tone: 'danger' }
  if (task?.isBlocked && task?.isOverdue) return { label: 'Muito alta', rank: 4, tone: 'danger' }
  if (task?.isOverdue) return { label: 'Alta', rank: 4, tone: 'danger' }
  if (task?.isBlocked || task?.isDueSoon) return { label: 'Média', rank: 3, tone: 'warning' }
  return { label: 'Baixa', rank: 1, tone: 'neutral' }
}

function sortMondayTasksForDrilldown(items) {
  return [...(items || [])].sort((left, right) => {
    const leftUrgency = getMondayTaskUrgency(left)
    const rightUrgency = getMondayTaskUrgency(right)

    if (leftUrgency.rank !== rightUrgency.rank) return rightUrgency.rank - leftUrgency.rank
    if (left.isBlocked !== right.isBlocked) return Number(right.isBlocked) - Number(left.isBlocked)
    if ((left.daysOverdue || 0) !== (right.daysOverdue || 0)) return (right.daysOverdue || 0) - (left.daysOverdue || 0)
    if (left.isOverdue !== right.isOverdue) return Number(right.isOverdue) - Number(left.isOverdue)
    if (left.isDueSoon !== right.isDueSoon) return Number(right.isDueSoon) - Number(left.isDueSoon)
    if ((right.trackedSeconds || 0) !== (left.trackedSeconds || 0)) return (right.trackedSeconds || 0) - (left.trackedSeconds || 0)
    return String(left.name || '').localeCompare(String(right.name || ''), 'pt-BR')
  })
}

function buildMondayDrilldownOwnerGroups(items, ownerFilter, ownerLabel) {
  const sortedItems = sortMondayTasksForDrilldown(items)
  if (!sortedItems.length) return []

  const enrichGroup = (group) => {
    const rankedItems = sortMondayTasksForDrilldown(group.items)
    const topTask = rankedItems[0] || null

    return {
      ...group,
      items: rankedItems,
      overdueCount: rankedItems.filter((task) => task.isOverdue).length,
      blockedCount: rankedItems.filter((task) => task.isBlocked).length,
      dueSoonCount: rankedItems.filter((task) => task.isDueSoon).length,
      topUrgencyRank: topTask ? getMondayTaskUrgency(topTask).rank : 0,
      topDaysOverdue: topTask?.daysOverdue || 0,
    }
  }

  if (ownerFilter && ownerFilter !== 'all') {
    return [enrichGroup({
      key: normalizeMondayGroupKey(ownerFilter) || 'selected-owner',
      owner: ownerLabel || 'Responsável selecionado',
      items: sortedItems,
    })]
  }

  const groups = new Map()

  sortedItems.forEach((task) => {
    const owners = Array.isArray(task.owners) && task.owners.length ? task.owners : ['Sem responsável']
    owners.forEach((owner) => {
      const key = normalizeMondayGroupKey(owner) || 'sem-responsavel'
      const currentGroup = groups.get(key) || {
        key,
        owner: owner || 'Sem responsável',
        items: [],
      }
      currentGroup.items.push(task)
      groups.set(key, currentGroup)
    })
  })

  return Array.from(groups.values())
    .map(enrichGroup)
    .sort((left, right) => {
      if (left.topUrgencyRank !== right.topUrgencyRank) return right.topUrgencyRank - left.topUrgencyRank
      if (left.topDaysOverdue !== right.topDaysOverdue) return right.topDaysOverdue - left.topDaysOverdue
      if (left.overdueCount !== right.overdueCount) return right.overdueCount - left.overdueCount
      if (left.items.length !== right.items.length) return right.items.length - left.items.length
      return String(left.owner || '').localeCompare(String(right.owner || ''), 'pt-BR')
    })
}

function getDatePresetLabel(datePreset, since, until) {
  if (datePreset === 'custom' && since && until) {
    return `${formatShortDate(since)} - ${formatShortDate(until)}`
  }

  const preset = DATE_PRESETS.find((item) => item.value === datePreset)
  return preset?.label || 'Período selecionado'
}

function parseLocalDateInput(value) {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function formatLocalDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftLocalDays(date, amount) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function getRangeLengthInDays(start, end) {
  const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.max(1, Math.round((endOfDay - startOfDay) / 86400000) + 1)
}

function resolveDateWindow(datePreset, since, until, { excludeTodayForLast30d = false } = {}) {
  const today = new Date()
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (datePreset === 'custom' && since && until) {
    const start = parseLocalDateInput(since)
    const end = parseLocalDateInput(until)
    if (!start || !end) return null
    return { start, end }
  }

  switch (datePreset) {
    case 'today':
      return { start: endOfToday, end: endOfToday }
    case 'yesterday': {
      const yesterday = shiftLocalDays(endOfToday, -1)
      return { start: yesterday, end: yesterday }
    }
    case 'last_7d':
      return {
        start: shiftLocalDays(endOfToday, -7),
        end: shiftLocalDays(endOfToday, -1),
      }
    case 'last_30d':
      return {
        start: shiftLocalDays(endOfToday, -30),
        end: shiftLocalDays(endOfToday, -1),
      }
    case 'this_month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: endOfToday,
      }
    default:
      return null
  }
}

function buildPreviousWindow(currentWindow) {
  if (!currentWindow?.start || !currentWindow?.end) return null

  const totalDays = getRangeLengthInDays(currentWindow.start, currentWindow.end)
  const previousEnd = shiftLocalDays(currentWindow.start, -1)
  const previousStart = shiftLocalDays(previousEnd, -(totalDays - 1))

  return {
    start: previousStart,
    end: previousEnd,
  }
}

function getMetricTrendDirection(metricKey) {
  if (LOWER_IS_BETTER_METRIC_KEYS.has(metricKey)) return 'down'
  if (NEUTRAL_TREND_METRIC_KEYS.has(metricKey)) return 'neutral'
  return 'up'
}

function formatTrendChange(value, type) {
  const absoluteValue = Math.abs(Number(value || 0))

  if (type === 'currency') return formatCurrency(absoluteValue)
  if (type === 'percent') return `${absoluteValue.toFixed(2).replace('.', ',')} p.p.`
  if (type === 'multiplier') return `${absoluteValue.toFixed(2).replace('.', ',')}x`
  if (type === 'decimal') return absoluteValue.toFixed(2).replace('.', ',')
  if (type === 'duration') return formatDurationDays(absoluteValue)
  return formatNumber(absoluteValue)
}

function buildMetricTrend(metricKey, currentValue, previousValue, type) {
  const current = Number(currentValue || 0)
  const previous = Number(previousValue ?? 0)

  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null

  if (current === previous) {
    return {
      tone: 'neutral',
      icon: 'bx-minus',
      label: 'Sem variação vs período anterior',
    }
  }

  const direction = getMetricTrendDirection(metricKey)
  const delta = current - previous
  const movedUp = delta > 0

  if (direction === 'neutral') {
    return {
      tone: 'neutral',
      icon: movedUp ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt',
      label: `${movedUp ? 'Subiu' : 'Caiu'} ${formatTrendChange(delta, type)} vs período anterior`,
    }
  }

  const isPositive = (direction === 'up' && delta > 0) || (direction === 'down' && delta < 0)

  return {
    tone: isPositive ? 'positive' : 'negative',
    icon: movedUp ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt',
    label: `${movedUp ? 'Subiu' : 'Caiu'} ${formatTrendChange(delta, type)} - ${isPositive ? 'movimento positivo' : 'movimento negativo'}`,
  }
}

function formatMetricValue(value, metricKey) {
  const type = METRIC_OPTIONS[metricKey]?.type
  if (type === 'currency') return formatCurrency(value)
  if (type === 'percent') return formatPercent(value)
  if (type === 'multiplier') return formatMultiplier(value)
  return formatNumber(value)
}

function formatDashboardMetricValue(value, type) {
  if (type === 'currency') return formatCurrency(value)
  if (type === 'percent') return formatPercent(value)
  if (type === 'multiplier') return formatMultiplier(value)
  if (type === 'decimal') return Number(value || 0).toFixed(2).replace('.', ',')
  if (type === 'duration') return formatDurationDays(value)
  return formatNumber(value)
}

function formatChartAxis(value, metricKey) {
  const type = METRIC_OPTIONS[metricKey]?.type

  if (type === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(value || 0))
  }

  if (type === 'percent') return `${Number(value || 0).toFixed(1).replace('.', ',')}%`
  if (type === 'multiplier') return `${Number(value || 0).toFixed(1).replace('.', ',')}x`

  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0))
}

function haveSameSelection(left = [], right = []) {
  if (left.length !== right.length) return false

  const leftSet = new Set(left)
  return right.every((item) => leftSet.has(item))
}

function normalizeDashboardMetricLayouts(layouts = []) {
  if (!Array.isArray(layouts)) return []

  return layouts
    .filter((item) => typeof item?.metricKey === 'string' && item.metricKey.trim())
    .map((item, index) => ({
      id: item?.id || `dashboard-card-${item.metricKey}-${index}`,
      metricKey: item.metricKey,
      size: item?.size === 'lg' ? 'lg' : 'sm',
    }))
}

function cloneDashboardMetricLayouts(layouts = []) {
  return normalizeDashboardMetricLayouts(layouts).map((item) => ({ ...item }))
}

function haveSameDashboardMetricLayouts(left = [], right = []) {
  const normalizedLeft = normalizeDashboardMetricLayouts(left)
  const normalizedRight = normalizeDashboardMetricLayouts(right)

  if (normalizedLeft.length !== normalizedRight.length) return false

  return normalizedLeft.every((leftItem, index) => {
    const rightItem = normalizedRight[index]
    if (!rightItem) return false

    return (
      leftItem.id === rightItem.id &&
      leftItem.metricKey === rightItem.metricKey &&
      leftItem.size === rightItem.size
    )
  })
}

function normalizeMetaCampaignTableColumnKeys(columnKeys) {
  const normalized = Array.isArray(columnKeys)
    ? Array.from(new Set(columnKeys.filter((columnKey) => typeof columnKey === 'string' && META_CAMPAIGN_TABLE_COLUMN_OPTIONS[columnKey])))
    : []

  if (shouldUseDefaultMetaCampaignTableColumns(normalized)) return [...DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS]
  return normalized
}

function shouldUseDefaultMetaCampaignTableColumns(normalized) {
  if (!normalized.length) return true

  const isLegacyDefault =
    normalized.length === LEGACY_DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS.length &&
    normalized.every((columnKey, index) => columnKey === LEGACY_DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS[index])

  if (isLegacyDefault) return true

  const legacyMatchCount = normalized.filter((columnKey) => LEGACY_DEFAULT_META_CAMPAIGN_TABLE_COLUMN_SET.has(columnKey)).length
  const missingCurrentDefaultCount = DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS.filter((columnKey) => !normalized.includes(columnKey)).length
  const hasLegacyFingerprint =
    normalized.includes('totalConversions') ||
    normalized.includes('cpa') ||
    normalized.includes('roas') ||
    legacyMatchCount >= 3

  return hasLegacyFingerprint && (missingCurrentDefaultCount >= 2 || normalized.length > DEFAULT_META_CAMPAIGN_TABLE_COLUMN_KEYS.length + 2)
}

function cloneDashboardTemplates(templates = []) {
  return templates.map((template) => ({
    ...template,
    metaMetricKeys: Array.isArray(template?.metaMetricKeys) ? [...template.metaMetricKeys] : [],
    metaCampaignTableColumnKeys: normalizeMetaCampaignTableColumnKeys(template?.metaCampaignTableColumnKeys),
    rdMetricKeys: Array.isArray(template?.rdMetricKeys) ? [...template.rdMetricKeys] : [],
    sheetsMetricKeys: Array.isArray(template?.sheetsMetricKeys) ? [...template.sheetsMetricKeys] : [],
    metaMetricLayouts: cloneDashboardMetricLayouts(template?.metaMetricLayouts),
    rdMetricLayouts: cloneDashboardMetricLayouts(template?.rdMetricLayouts),
    sheetsMetricLayouts: cloneDashboardMetricLayouts(template?.sheetsMetricLayouts),
  }))
}

function haveSameDashboardTemplates(left = [], right = []) {
  if (left.length !== right.length) return false

  return left.every((leftTemplate, index) => {
    const rightTemplate = right[index]
    if (!rightTemplate) return false

    return (
      leftTemplate.id === rightTemplate.id &&
      leftTemplate.name === rightTemplate.name &&
      haveSameSelection(
        normalizeMetaCampaignTableColumnKeys(leftTemplate.metaCampaignTableColumnKeys),
        normalizeMetaCampaignTableColumnKeys(rightTemplate.metaCampaignTableColumnKeys)
      ) &&
      haveSameDashboardMetricLayouts(leftTemplate.metaMetricLayouts || [], rightTemplate.metaMetricLayouts || []) &&
      haveSameDashboardMetricLayouts(leftTemplate.rdMetricLayouts || [], rightTemplate.rdMetricLayouts || []) &&
      haveSameDashboardMetricLayouts(leftTemplate.sheetsMetricLayouts || [], rightTemplate.sheetsMetricLayouts || [])
    )
  })
}

function normalizeClientGroupClientIds(clientIds = []) {
  if (!Array.isArray(clientIds)) return []
  return Array.from(new Set(clientIds.filter((clientId) => typeof clientId === 'string' && clientId.trim())))
}

function cloneClientGroups(groups = []) {
  return groups.map((group) => ({
    ...group,
    clientIds: normalizeClientGroupClientIds(group?.clientIds),
  }))
}

function haveSameClientGroups(left = [], right = []) {
  if (left.length !== right.length) return false

  return left.every((leftGroup, index) => {
    const rightGroup = right[index]
    if (!rightGroup) return false

    return (
      leftGroup.id === rightGroup.id &&
      leftGroup.name === rightGroup.name &&
      haveSameSelection(normalizeClientGroupClientIds(leftGroup.clientIds), normalizeClientGroupClientIds(rightGroup.clientIds))
    )
  })
}

function getMetricData(metricKey, dayData) {
  switch (metricKey) {
    case 'spend':
      return parseFloat(dayData.spend || 0)
    case 'impressions':
      return parseInt(dayData.impressions || 0, 10)
    case 'reach':
      return parseInt(dayData.reach || 0, 10)
    case 'clicks':
      return parseInt(dayData.clicks || 0, 10)
    case 'landingPageViews':
      return parseInt(dayData.landingPageViews || dayData.custom_metrics?.landingPageViews || 0, 10)
    case 'addToCart':
      return parseInt(dayData.custom_metrics?.addToCart || 0, 10)
    case 'initiateCheckout':
      return parseInt(dayData.custom_metrics?.initiateCheckout || 0, 10)
    case 'cpc':
      return parseFloat(dayData.cpc || 0)
    case 'cpm':
      return parseFloat(dayData.custom_metrics?.cpm || 0)
    case 'frequency':
      return parseFloat(dayData.custom_metrics?.frequency || 0)
    case 'ctr':
      return parseFloat(dayData.ctr || 0)
    case 'totalConversions':
      return parseInt(dayData.custom_metrics?.totalConversions || 0, 10)
    case 'conversionRate':
      return parseFloat(dayData.custom_metrics?.conversionRate || 0)
    case 'purchaseValue':
      return parseFloat(dayData.custom_metrics?.purchaseValue || 0)
    case 'purchases':
      return parseInt(dayData.custom_metrics?.purchases || 0, 10)
    case 'leads':
      return parseInt(dayData.custom_metrics?.leads || 0, 10)
    case 'messages':
      return parseInt(dayData.custom_metrics?.messages || 0, 10)
    case 'videoViews':
      return parseInt(dayData.custom_metrics?.videoViews || 0, 10)
    case 'videoViewRate':
      return parseFloat(dayData.custom_metrics?.videoViewRate || 0)
    case 'thruplay':
      return parseInt(dayData.custom_metrics?.thruplay || 0, 10)
    case 'hookRate':
      return parseFloat(dayData.custom_metrics?.hookRate || 0)
    case 'cpa':
      return parseFloat(dayData.custom_metrics?.cpa || 0)
    case 'roas':
      return parseFloat(dayData.custom_metrics?.roas || 0)
    default:
      return 0
  }
}

function parseMetaSeriesDate(dateString) {
  if (!dateString) return null

  const parsed = new Date(`${dateString}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getStartOfWeek(date) {
  const base = new Date(date)
  const day = base.getDay()
  const diff = day === 0 ? -6 : 1 - day
  base.setDate(base.getDate() + diff)
  base.setHours(0, 0, 0, 0)
  return base
}

function getStartOfQuarter(date) {
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1)
}

function getMetaResultBucketMeta(date, grouping) {
  if (!date) return null

  if (grouping === 'day') {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return {
      key: start.toISOString().slice(0, 10),
      start,
      end: start,
      label: start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    }
  }

  if (grouping === 'week') {
    const start = getStartOfWeek(date)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      key: `week-${start.toISOString().slice(0, 10)}`,
      start,
      end,
      label: `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
    }
  }

  if (grouping === 'month') {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      start,
      end,
      label: start.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
    }
  }

  if (grouping === 'quarter') {
    const start = getStartOfQuarter(date)
    const end = new Date(start.getFullYear(), start.getMonth() + 3, 0)
    const quarter = Math.floor(start.getMonth() / 3) + 1
    return {
      key: `${start.getFullYear()}-Q${quarter}`,
      start,
      end,
      label: `T${quarter} ${start.getFullYear()}`,
    }
  }

  const start = new Date(date.getFullYear(), 0, 1)
  const end = new Date(date.getFullYear(), 11, 31)
  return {
    key: String(start.getFullYear()),
    start,
    end,
    label: String(start.getFullYear()),
  }
}

function buildMetaResultBucketTimeline(dateWindow, grouping) {
  if (!dateWindow?.start || !dateWindow?.end) return []

  const buckets = []
  const cursor = new Date(dateWindow.start.getFullYear(), dateWindow.start.getMonth(), dateWindow.start.getDate())
  const end = new Date(dateWindow.end.getFullYear(), dateWindow.end.getMonth(), dateWindow.end.getDate())
  const seenKeys = new Set()

  while (cursor <= end) {
    const bucketMeta = getMetaResultBucketMeta(cursor, grouping)
    if (bucketMeta && !seenKeys.has(bucketMeta.key)) {
      seenKeys.add(bucketMeta.key)
      buckets.push({
        ...bucketMeta,
        spend: 0,
        results: 0,
      })
    }

    if (grouping === 'day') {
      cursor.setDate(cursor.getDate() + 1)
    } else if (grouping === 'week') {
      cursor.setDate(cursor.getDate() + 7)
    } else if (grouping === 'month') {
      cursor.setMonth(cursor.getMonth() + 1, 1)
    } else if (grouping === 'quarter') {
      cursor.setMonth(cursor.getMonth() + 3, 1)
    } else {
      cursor.setFullYear(cursor.getFullYear() + 1, 0, 1)
    }
  }

  return buckets
}

function buildMetaResultComparisonSeries(dailyItems = [], resultMetricKey, grouping = 'week', campaignObjectiveMap = {}, dateWindow = null) {
  const buckets = new Map(
    buildMetaResultBucketTimeline(dateWindow, grouping).map((bucket) => [bucket.key, bucket])
  )

  dailyItems.forEach((dayItem) => {
    const parsedDate = parseMetaSeriesDate(dayItem.date_start)
    const bucketMeta = getMetaResultBucketMeta(parsedDate, grouping)
    if (!bucketMeta) return

    const campaignId = String(dayItem.campaign_id || '').trim()
    const metrics = dayItem.custom_metrics || extractMetaCampaignMetrics(dayItem)

    const spendValue = parseFloat(dayItem.spend || 0)
    const resultValue = resultMetricKey === 'reachResults'
      ? Number(metrics.reachResults || metrics.reach || dayItem.reach || 0)
      : Number(metrics[resultMetricKey] || 0)

    if (!campaignId && resultValue <= 0 && spendValue <= 0) return

    if (!buckets.has(bucketMeta.key)) {
      buckets.set(bucketMeta.key, {
        ...bucketMeta,
        spend: 0,
        results: 0,
      })
    }

    const bucket = buckets.get(bucketMeta.key)
    bucket.spend += spendValue
    bucket.results += resultValue
  })

  return Array.from(buckets.values())
    .sort((left, right) => left.start.getTime() - right.start.getTime())
    .map((bucket) => ({
      ...bucket,
      cost: bucket.results > 0 ? bucket.spend / bucket.results : 0,
    }))
}

function buildMetaDetailDailySeries(dailyItems = [], dateWindow = null) {
  const points = new Map(
    dailyItems
      .map((item) => {
        const parsedDate = parseMetaSeriesDate(item.date_start)
        if (!parsedDate) return null

        const metrics = item.custom_metrics || extractMetaCampaignMetrics(item)
        const resultMetricKey = item.resultMetricKey || 'totalConversions'
        const results = resultMetricKey === 'reachResults'
          ? Number(metrics.reachResults || metrics.reach || item.reach || 0)
          : Number(metrics[resultMetricKey] || 0)
        const spendValue = parseFloat(item.spend || 0)

        return [
          item.date_start,
          {
            key: item.date_start,
            date: parsedDate,
            label: parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            results,
            spend: spendValue,
            cost: results > 0 ? spendValue / results : 0,
          },
        ]
      })
      .filter(Boolean)
  )

  if (!dateWindow?.start || !dateWindow?.end) {
    return Array.from(points.values()).sort((left, right) => left.date.getTime() - right.date.getTime())
  }

  const filledSeries = []
  const cursor = new Date(dateWindow.start.getFullYear(), dateWindow.start.getMonth(), dateWindow.start.getDate())
  const end = new Date(dateWindow.end.getFullYear(), dateWindow.end.getMonth(), dateWindow.end.getDate())

  while (cursor <= end) {
    const key = formatLocalDateInput(cursor)
    const existingPoint = points.get(key)

    if (existingPoint) {
      filledSeries.push(existingPoint)
    } else {
      filledSeries.push({
        key,
        date: new Date(cursor),
        label: cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        results: 0,
        spend: 0,
        cost: 0,
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return filledSeries
}

function getSummaryMetricValue(metricKey, summary, customMetrics) {
  switch (metricKey) {
    case 'spend':
      return parseFloat(summary?.spend || 0)
    case 'impressions':
      return parseInt(summary?.impressions || 0, 10)
    case 'reach':
      return parseInt(summary?.reach || 0, 10)
    case 'clicks':
      return parseInt(summary?.clicks || 0, 10)
    case 'landingPageViews':
      return parseInt(summary?.landingPageViews || customMetrics?.landingPageViews || 0, 10)
    case 'addToCart':
      return parseInt(customMetrics?.addToCart || 0, 10)
    case 'initiateCheckout':
      return parseInt(customMetrics?.initiateCheckout || 0, 10)
    case 'cpc':
      return parseFloat(summary?.cpc || 0)
    case 'cpm':
      return parseFloat(customMetrics?.cpm || 0)
    case 'frequency':
      return parseFloat(customMetrics?.frequency || 0)
    case 'ctr':
      return parseFloat(summary?.ctr || 0)
    case 'totalConversions':
      return parseInt(customMetrics?.totalConversions || 0, 10)
    case 'conversionRate':
      return parseFloat(customMetrics?.conversionRate || 0)
    case 'purchaseValue':
      return parseFloat(customMetrics?.purchaseValue || 0)
    case 'purchases':
      return parseInt(customMetrics?.purchases || 0, 10)
    case 'leads':
      return parseInt(customMetrics?.leads || 0, 10)
    case 'messages':
      return parseInt(customMetrics?.messages || 0, 10)
    case 'videoViews':
      return parseInt(customMetrics?.videoViews || 0, 10)
    case 'videoViewRate':
      return parseFloat(customMetrics?.videoViewRate || 0)
    case 'thruplay':
      return parseInt(customMetrics?.thruplay || 0, 10)
    case 'hookRate':
      return parseFloat(customMetrics?.hookRate || 0)
    case 'cpa':
      return parseFloat(customMetrics?.cpa || 0)
    case 'roas':
      return parseFloat(customMetrics?.roas || 0)
    default:
      return 0
  }
}

function safeNumber(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

// CRM funnel metric keys → the equivalent keys present in an rdSummary/manual-CRM summary.
// (buildManualCrmSummary / the RD summary expose contactsInPeriod/qualifiedDeals/wonDeals, while
// the funnel library also offers opportunityCount/qualifiedOpportunityCount/wonOpportunityCount.)
const CRM_METRIC_ALIASES = {
  opportunityCount: ['opportunityCount', 'contactsInPeriod', 'contacts'],
  qualifiedOpportunityCount: ['qualifiedOpportunityCount', 'qualifiedDeals', 'qualifiedContacts'],
  wonOpportunityCount: ['wonOpportunityCount', 'wonDeals'],
  wonRevenue: ['wonRevenue', 'wonOpportunityRevenue'],
}

function resolveCrmSummaryValue(metricKey, crmSummary) {
  if (!crmSummary || typeof crmSummary !== 'object') return 0
  const keys = CRM_METRIC_ALIASES[metricKey] || [metricKey]
  for (const key of keys) {
    const value = safeNumber(crmSummary[key])
    if (value) return value
  }
  return 0
}

function hasManualCrmValue(manualCrmSummary, key) {
  if (!manualCrmSummary || typeof manualCrmSummary !== 'object') return false
  const value = manualCrmSummary[key]
  if (value === null || value === undefined) return false
  return String(value).trim() !== ''
}

function normalizeManualCrmInput(value) {
  const stringValue = String(value ?? '').trim()
  if (!stringValue) return null
  const numericValue = Number(stringValue.replace(',', '.'))
  return Number.isFinite(numericValue) ? numericValue : null
}

function calculateRate(partial, total) {
  const normalizedTotal = safeNumber(total)
  if (normalizedTotal <= 0) return 0
  return (safeNumber(partial) / normalizedTotal) * 100
}

function buildManualCrmSummary(manualCrmSummary, metaSummary = null) {
  const manual = manualCrmSummary && typeof manualCrmSummary === 'object' ? manualCrmSummary : {}
  const pickManualValue = (...keys) => {
    for (const key of keys) {
      if (manual[key] !== null && manual[key] !== undefined && String(manual[key]).trim() !== '') {
        return manual[key]
      }
    }
    return null
  }
  const opportunityCount = safeNumber(pickManualValue('opportunityCount', 'opportunities', 'contactsInPeriod', 'contacts'))
  const qualifiedOpportunityCount = safeNumber(pickManualValue('qualifiedOpportunityCount', 'qualifiedDeals', 'qualifiedContacts'))
  const wonOpportunityCount = safeNumber(pickManualValue('wonOpportunityCount', 'wonDeals'))
  const lostOpportunityCount = safeNumber(pickManualValue('lostOpportunityCount', 'lostDeals', 'lostContacts'))
  const wonRevenue = safeNumber(pickManualValue('wonRevenue', 'wonOpportunityRevenue'))
  const lostOpportunityValue = safeNumber(pickManualValue('lostOpportunityValue'))
  const avgTicketWon = wonOpportunityCount > 0 ? wonRevenue / wonOpportunityCount : 0
  const spend = safeNumber(metaSummary?.spend)

  return {
    // Canonical count keys the dashboard KPI cards read (same shape as the RD/Agendor summary).
    opportunityCount,
    qualifiedOpportunityCount,
    wonOpportunityCount,
    wonOpportunityRevenue: wonRevenue,
    avgTicketWonByCreation: avgTicketWon,
    leadToQualifiedRate: calculateRate(qualifiedOpportunityCount, opportunityCount),
    qualifiedToWonRate: calculateRate(wonOpportunityCount, qualifiedOpportunityCount),
    leadToWonRate: calculateRate(wonOpportunityCount, opportunityCount),
    lostOpportunityCount,
    lostOpportunityValue,
    wonDeals: wonOpportunityCount,
    wonDealsFromPreviousCohorts: 0,
    avgTicketWon,
    wonRevenueFromPreviousCohorts: 0,
    avgTicketWonPreviousCohorts: 0,
    contacts: opportunityCount,
    contactsInPeriod: opportunityCount,
    contactsMoved: qualifiedOpportunityCount,
    qualifiedDeals: qualifiedOpportunityCount,
    qualifiedContacts: qualifiedOpportunityCount,
    closeRate: calculateRate(wonOpportunityCount, wonOpportunityCount + lostOpportunityCount),
    dealToWonRate: calculateRate(wonOpportunityCount, qualifiedOpportunityCount),
    leadToDealRate: calculateRate(qualifiedOpportunityCount, opportunityCount),
    sourceConversionRate: 0,
    avgLeadToWonDays: 0,
    avgDealToWonDays: 0,
    avgLeadToWonDaysFiltered: 0,
    avgDealToWonDaysFiltered: 0,
    contactsWithDeals: qualifiedOpportunityCount,
    contactsWithWonDeals: wonOpportunityCount,
    lostContacts: lostOpportunityCount,
    wonRoas: spend > 0 ? wonRevenue / spend : 0,
    availableSources: [],
    availablePipelines: [],
    availableStages: [],
    sourcePerformance: [],
    sellerPerformance: [],
    funnel: [
      { key: 'opportunities', name: 'Oportunidades', count: opportunityCount, rate: null },
      { key: 'qualified', name: 'Qualificados', count: qualifiedOpportunityCount, rate: calculateRate(qualifiedOpportunityCount, opportunityCount) },
      { key: 'won', name: 'Vendas', count: wonOpportunityCount, rate: calculateRate(wonOpportunityCount, qualifiedOpportunityCount) },
    ],
  }
}

function mergeInitialClientRecord(currentClients, initialClientRecord) {
  if (!initialClientRecord || typeof initialClientRecord !== 'object' || !initialClientRecord.id) {
    return Array.isArray(currentClients) ? currentClients : []
  }

  const normalizedRecord = createClientRecord(initialClientRecord)
  const existingClients = Array.isArray(currentClients) ? currentClients : []
  const existingClient = existingClients.find((client) => client.id === normalizedRecord.id)

  if (!existingClient) {
    return [normalizedRecord, ...existingClients]
  }

  return existingClients.map((client) =>
    client.id === normalizedRecord.id ? createClientRecord({ ...client, ...normalizedRecord }) : client
  )
}


export default function DashboardShell({
  initialTab = 'clientes',
  initialActiveClientId = '',
  initialClientRecord = null,
  initialClientsOverride = null,
  initialAppLogoUrl = '',
  externalAppMode = '',
  externalAppAccent = '',
  externalAppBackground = '',
  externalAppPanelColor = '',
  externalAppTextColor = '',
}) {
  const REMOVED_TABS = new Set(['calendar', 'clickup', 'contexto', 'monday', 'operacao', 'assistant', 'notas'])
  const { user, profile, access, appearance, updateAppearance, loading: userLoading } = useUser()
  const supabase = createClient()
  const dashboardRef = useRef(null)
  const campaignsRef = useRef([])
  const hasOpenedDashboardEntryRef = useRef(false)
  const lastMetaStructureFetchKeyRef = useRef('')
  const lastCompletedMetaStructureFetchKeyRef = useRef('')
  const lastRdPipelinesFetchKeyRef = useRef('')
  const lastDashboardFetchKeyRef = useRef('')
  const lastCompletedDashboardFetchKeyRef = useRef('')
  const lastDashboardFetchAtRef = useRef(0)
  const lastBreakdownsFetchKeyRef = useRef('')
  const lastMetaWarmFetchKeyRef = useRef('')
  const lastGoogleSheetsFetchKeyRef = useRef('')
  const selectedQualifiedStagesRef = useRef([])
  const rdLeadSourceFiltersRef = useRef([])
  const metaFilteredCampaignIdsRef = useRef([])
  const metaFilteredAdsetIdsRef = useRef([])
  const metaFilteredAdIdsRef = useRef([])
  const hasInitialClientsOverride = Array.isArray(initialClientsOverride)

  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState(REMOVED_TABS.has(initialTab) ? 'clientes' : initialTab)
  const [teamSubTab, setTeamSubTab] = useState('usuarios') // 'usuarios' | 'funcoes'
  const [dateRange, setDateRange] = useState('last_7d')
  const [draftDateRange, setDraftDateRange] = useState('last_7d')
  const [customSince, setCustomSince] = useState('')
  const [draftCustomSince, setDraftCustomSince] = useState('')
  const [customUntil, setCustomUntil] = useState('')
  const [draftCustomUntil, setDraftCustomUntil] = useState('')
  const [mondayDateRange, setMondayDateRange] = useState('last_7d')
  const [draftMondayDateRange, setDraftMondayDateRange] = useState('last_7d')
  const [mondayCustomSince, setMondayCustomSince] = useState('')
  const [draftMondayCustomSince, setDraftMondayCustomSince] = useState('')
  const [mondayCustomUntil, setMondayCustomUntil] = useState('')
  const [draftMondayCustomUntil, setDraftMondayCustomUntil] = useState('')
  const [themeColor, setThemeColor] = useState('blue')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isHubNavOpen, setIsHubNavOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const isSidebarVisible = !isSidebarCollapsed || isSidebarHovered
  const [isHomeToolsExpanded, setIsHomeToolsExpanded] = useState(false)
  const [metric1, setMetric1] = useState('spend')
  const [metric2, setMetric2] = useState('roas')
  const [campaignSearch, setCampaignSearch] = useState('')
  const [cprBenchmarks, setCprBenchmarks] = useState({}) // { clientId: number }
  const [cprSettings, setCprSettings] = useState({ green_threshold: 15, yellow_threshold: 35 })
  const [showCprPanel, setShowCprPanel] = useState(false)
  const [draftCprBenchmarks, setDraftCprBenchmarks] = useState({})
  const [draftCprSettings, setDraftCprSettings] = useState({ green_threshold: 15, yellow_threshold: 35 })
  const [cprSaving, setCprSaving] = useState(false)
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('all')
  const [campaignSortBy, setCampaignSortBy] = useState('spend')
  const [isCampaignColumnLibraryOpen, setIsCampaignColumnLibraryOpen] = useState(false)
  const [metaResultFilters, setMetaResultFilters] = useState([])
  const [draftMetaResultFilters, setDraftMetaResultFilters] = useState([])
  const [metaCampaignFilters, setMetaCampaignFilters] = useState([])
  const [draftMetaCampaignFilters, setDraftMetaCampaignFilters] = useState([])
  const [metaAdsetFilters, setMetaAdsetFilters] = useState([])
  const [draftMetaAdsetFilters, setDraftMetaAdsetFilters] = useState([])
  const [metaAdFilters, setMetaAdFilters] = useState([])
  const [draftMetaAdFilters, setDraftMetaAdFilters] = useState([])
  const [isMetaCampaignFilterOpen, setIsMetaCampaignFilterOpen] = useState(false)
  const [isMetaAdsetFilterOpen, setIsMetaAdsetFilterOpen] = useState(false)
  const [isMetaAdFilterOpen, setIsMetaAdFilterOpen] = useState(false)
  const [weeklyRecords, setWeeklyRecords] = useState([])
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false)
  const [isSavingWeeklyRecord, setIsSavingWeeklyRecord] = useState(false)
  const [weeklyError, setWeeklyError] = useState('')
  const [weeklySuccessMessage, setWeeklySuccessMessage] = useState('')
  const [weeklyClientFilter, setWeeklyClientFilter] = useState('all')
  const [weeklyChartClientFilter, setWeeklyChartClientFilter] = useState('all')
  const [weeklyPeriodPreset, setWeeklyPeriodPreset] = useState('filled')
  const [weeklyCustomSince, setWeeklyCustomSince] = useState(() => getMondayDateInputValue())
  const [weeklyCustomUntil, setWeeklyCustomUntil] = useState(() => getWeekEndDateInputValue(getMondayDateInputValue()))
  const [weeklyMonthFilter, setWeeklyMonthFilter] = useState(() => getCurrentMonthInputValue())
  const [weeklyFilledWeekStart, setWeeklyFilledWeekStart] = useState('')
  const [weeklyTableHealthFilter, setWeeklyTableHealthFilter] = useState('all')
  const [weeklyTableSort, setWeeklyTableSort] = useState({ key: 'date', direction: 'asc' })
  const [isWeeklyDeleteMode, setIsWeeklyDeleteMode] = useState(false)
  const [selectedWeeklyRecordIds, setSelectedWeeklyRecordIds] = useState([])
  const [isDeletingWeeklyRecords, setIsDeletingWeeklyRecords] = useState(false)
  const [weeklyWeekStart, setWeeklyWeekStart] = useState(() => getMondayDateInputValue())
  const [isWeeklyEntryModalOpen, setIsWeeklyEntryModalOpen] = useState(false)
  const [isWeeklyHistoryModalOpen, setIsWeeklyHistoryModalOpen] = useState(false)
  const [isChurnListOpen, setIsChurnListOpen] = useState(false)
  // Onboarding checklist state
  const [onboardingRecords, setOnboardingRecords] = useState([])
  const [onboardingExpandedClient, setOnboardingExpandedClient] = useState(null)
  const [onboardingQuickAccess, setOnboardingQuickAccess] = useState(false)
  const [onboardingSaving, setOnboardingSaving] = useState(false)
  const [onboardingClientFilter, setOnboardingClientFilter] = useState('')
  const [onboardingView, setOnboardingView] = useState('cards')
  const [onboardingSearch, setOnboardingSearch] = useState('')
  const [onboardingStatusFilter, setOnboardingStatusFilter] = useState('all')
  const [onboardingExpandedPhases, setOnboardingExpandedPhases] = useState(new Set())
  const [offboardingRecords, setOffboardingRecords] = useState([])
  const [offboardingExpandedClient, setOffboardingExpandedClient] = useState(null)
  const [offboardingSaving, setOffboardingSaving] = useState(false)
  const [offboardingSearch, setOffboardingSearch] = useState('')
  const [offboardingStatusFilter, setOffboardingStatusFilter] = useState('all')
  const [offboardingExpandedPhases, setOffboardingExpandedPhases] = useState(new Set())
  const [onboardingManageMode, setOnboardingManageMode] = useState(false)
  const [onboardingPhaseDefs, setOnboardingPhaseDefs] = useState([])
  const [onboardingPhaseDefsLoaded, setOnboardingPhaseDefsLoaded] = useState(false)
  const [offboardingManageMode, setOffboardingManageMode] = useState(false)
  const [offboardingPhaseDefs, setOffboardingPhaseDefs] = useState([])
  const [offboardingPhaseDefsLoaded, setOffboardingPhaseDefsLoaded] = useState(false)
  const [obEditingPhase, setObEditingPhase] = useState(null)
  const [obEditingItem, setObEditingItem] = useState(null)
  const [obNewPhase, setObNewPhase] = useState(null)
  const [obNewItem, setObNewItem] = useState(null)
  const [offbEditingPhase, setOffbEditingPhase] = useState(null)
  const [offbEditingItem, setOffbEditingItem] = useState(null)
  const [offbNewPhase, setOffbNewPhase] = useState(null)
  const [offbNewItem, setOffbNewItem] = useState(null)
  const obDragRef = useRef({})
  const offbDragRef = useRef({})
  const grDragRef = useRef({})
  const [navPermissions, setNavPermissions] = useState([])
  const [myNavPermissions, setMyNavPermissions] = useState([])
  const [permSelectedUserId, setPermSelectedUserId] = useState('')
  const [weeklyForm, setWeeklyForm] = useState({
    clientId: '',
    investment: '',
    leads: '',
    sql: '',
    healthStatus: 'attention',
    actionItemsText: '',
  })
  const [isFunnelSectionOpen, setIsFunnelSectionOpen] = useState(false)
  const [isRdDiagnosticsOpen, setIsRdDiagnosticsOpen] = useState(false)
  const [isRdSourceFilterOpen, setIsRdSourceFilterOpen] = useState(false)
  // Light/dark switching was removed — the internal app is always dark. White-label tenants can
  // still force light via externalAppMode, but internal users have no toggle anymore.
  const isLightAppMode = externalAppMode === 'light'
  const [clients, setClients] = useState([])
  const [clientGroups, setClientGroups] = useState([])
  const [products, setProducts] = useState([])
  const [operationCards, setOperationCards] = useState([])
  const [operationCardsLoaded, setOperationCardsLoaded] = useState(false)
  const [operationSettings, setOperationSettings] = useState(() => createOperationSettingsRecord())
  const [clientImplementationPhases, setClientImplementationPhases] = useState([])
  const [clientSystemFields, setClientSystemFields] = useState([])
  const [clientCustomColumns, setClientCustomColumns] = useState([])
  const [clientCustomTabs, setClientCustomTabs] = useState([])
  const [clientTabOverrides, setClientTabOverrides] = useState([])
  const [activeClientId, setActiveClientId] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newClientCnpj, setNewClientCnpj] = useState('')
  const [newClientSalesModel, setNewClientSalesModel] = useState('INSIDE_SALES')
  const [newClientImplementationPhase, setNewClientImplementationPhase] = useState(IMPLEMENTATION_PHASE_BY_SALES_MODEL.INSIDE_SALES)
  const [newClientStartDate, setNewClientStartDate] = useState(getTodayDateInputValue())
  const [newClientImplementationObservation, setNewClientImplementationObservation] = useState('')
  const [newClientOperationEnabled, setNewClientOperationEnabled] = useState(true)
  const [newClientDashboardEnabled, setNewClientDashboardEnabled] = useState(true)
  const [newClientDashboardIntegrationKeys, setNewClientDashboardIntegrationKeys] = useState(DEFAULT_CLIENT_DASHBOARD_INTEGRATION_KEYS)
  const [newClientManualCrmEnabled, setNewClientManualCrmEnabled] = useState(false)
  const [newClientOperationLane, setNewClientOperationLane] = useState(resolveOperationLaneFromSalesModel('INSIDE_SALES'))
  const [newClientGroupName, setNewClientGroupName] = useState('')
  const [newClientMetaAdAccountId, setNewClientMetaAdAccountId] = useState('')
  const [newClientGoogleAdsAccountId, setNewClientGoogleAdsAccountId] = useState('')
  const [newClientLeadsSheetUrl, setNewClientLeadsSheetUrl] = useState('')
  const [selectedSheetClientId, setSelectedSheetClientId] = useState('')
  const [sheetFullscreen, setSheetFullscreen] = useState(false)
  const [sheetViewMode, setSheetViewMode] = useState('dashboard')
  const [sheetClientPickerOpen, setSheetClientPickerOpen] = useState(false)
  const [newClientDashboardColor, setNewClientDashboardColor] = useState('#10B981')
  const [newClientLogoUrl, setNewClientLogoUrl] = useState('')
  const [newClientResultManagerUserId, setNewClientResultManagerUserId] = useState('')
  const [newProductName, setNewProductName] = useState('')
  const [operationViewMode, setOperationViewMode] = useState('kanban')
  const [showActionSpaceSettings, setShowActionSpaceSettings] = useState(false)
  const [operationPeriodFilter, setOperationPeriodFilter] = useState('all')
  const [operationSearch, setOperationSearch] = useState('')
  const [operationSegmentFilter, setOperationSegmentFilter] = useState('all')
  const [operationTierFilter, setOperationTierFilter] = useState('all')
  const [operationSquadFilter, setOperationSquadFilter] = useState('all')
  const [operationResponsibleFilter, setOperationResponsibleFilter] = useState('all')
  const [isOperationCreateModalOpen, setIsOperationCreateModalOpen] = useState(false)
  const [newOperationClientId, setNewOperationClientId] = useState('')
  const [newOperationTitle, setNewOperationTitle] = useState('')
  const [newOperationContent, setNewOperationContent] = useState('')
  const [newOperationAssigneeIds, setNewOperationAssigneeIds] = useState([])
  const [newOperationTags, setNewOperationTags] = useState('')
  const [newOperationTaskType, setNewOperationTaskType] = useState('Tarefa')
  const [newOperationPriority, setNewOperationPriority] = useState('sem_prioridade')
  const [newOperationLane, setNewOperationLane] = useState('setup')
  const [newOperationStatus, setNewOperationStatus] = useState('aberto')
  const [expandedOperationCardId, setExpandedOperationCardId] = useState('')
  const [newOperationCommentByCard, setNewOperationCommentByCard] = useState({})
  const [newOperationCommentMentionsByCard, setNewOperationCommentMentionsByCard] = useState({})
  const [newOperationSubtaskByCard, setNewOperationSubtaskByCard] = useState({})
  const [openOperationAssigneePickerId, setOpenOperationAssigneePickerId] = useState('')
  const [openOperationSubtaskAssigneePickerId, setOpenOperationSubtaskAssigneePickerId] = useState('')
  const [operationDragCardId, setOperationDragCardId] = useState('')
  const [operationTimeNow, setOperationTimeNow] = useState(Date.now())
  const [newClientColumnLabel, setNewClientColumnLabel] = useState('')
  const [newClientColumnType, setNewClientColumnType] = useState('text')
  const [newClientColumnOptions, setNewClientColumnOptions] = useState('')
  const [newClientColumnTab, setNewClientColumnTab] = useState('geral')
  const [newClientColumnFormula, setNewClientColumnFormula] = useState('')
  const [newClientTabLabel, setNewClientTabLabel] = useState('')
  const [newClientOkrTitle, setNewClientOkrTitle] = useState('')
  const [newClientOkrCadence, setNewClientOkrCadence] = useState('mensal')
  const [newClientOkrCycleDays, setNewClientOkrCycleDays] = useState('')
  const [newClientNoteBody, setNewClientNoteBody] = useState('')
  const [clientRegistryView, setClientRegistryView] = useState('geral')
  const [clientRegistryDisplayMode, setClientRegistryDisplayMode] = useState('table')
  const [clientKanbanDragClientId, setClientKanbanDragClientId] = useState('')
  const [clientKanbanDropPhaseKey, setClientKanbanDropPhaseKey] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [clientStatusFilter, setClientStatusFilter] = useState('all')
  const [clientEditSection, setClientEditSection] = useState('geral')
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false)
  const [createClientStep, setCreateClientStep] = useState('identity')
  const [isCreateClientGroupModalOpen, setIsCreateClientGroupModalOpen] = useState(false)
  const [clientRegistryManagerMode, setClientRegistryManagerMode] = useState('')
  const [clientRegistryInlineEdit, setClientRegistryInlineEdit] = useState({ clientId: '', columnKey: '' })
  const [clientRegistryHover, setClientRegistryHover] = useState({ clientId: '', columnKey: '' })
  const [adAccounts, setAdAccounts] = useState([])
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState([])
  const [adAccountBalanceRows, setAdAccountBalanceRows] = useState([])
  const [adAccountBalanceUpdatedAt, setAdAccountBalanceUpdatedAt] = useState('')
  const [adAccountBalanceLoading, setAdAccountBalanceLoading] = useState(false)
  const [adAccountBalanceError, setAdAccountBalanceError] = useState('')
  const [adAccountBalanceSearch, setAdAccountBalanceSearch] = useState('')
  const [adAccountBalanceCardFilter, setAdAccountBalanceCardFilter] = useState('all')
  const [adAccountBalanceBillingFilter, setAdAccountBalanceBillingFilter] = useState('all')
  const [adAccountBalanceValueFilter, setAdAccountBalanceValueFilter] = useState('all')
  const [adAccountBalanceDebtFilter, setAdAccountBalanceDebtFilter] = useState('all')
  const [adAccountBalanceRefreshNonce, setAdAccountBalanceRefreshNonce] = useState(0)
  const [adsOverviewRows, setAdsOverviewRows] = useState([])
  const [adsOverviewUpdatedAt, setAdsOverviewUpdatedAt] = useState('')
  const [adsOverviewLoading, setAdsOverviewLoading] = useState(false)
  const [adsOverviewError, setAdsOverviewError] = useState('')
  const [adsOverviewSearch, setAdsOverviewSearch] = useState('')
  const [adsOverviewManagerFilter, setAdsOverviewManagerFilter] = useState('all')
  const [adsOverviewRefreshNonce, setAdsOverviewRefreshNonce] = useState(0)
  const [adsOverviewExpandedClientIds, setAdsOverviewExpandedClientIds] = useState([])
  const [adsOverviewPreviewItem, setAdsOverviewPreviewItem] = useState(null)
  const [adsOverviewPreview, setAdsOverviewPreview] = useState(null)
  const [adsOverviewPreviewLoading, setAdsOverviewPreviewLoading] = useState(false)
  const [adsOverviewPreviewError, setAdsOverviewPreviewError] = useState('')
  const [campaignOverviewRows, setCampaignOverviewRows] = useState([])
  const [campaignOverviewUpdatedAt, setCampaignOverviewUpdatedAt] = useState('')
  const [campaignOverviewLoading, setCampaignOverviewLoading] = useState(false)
  const [campaignOverviewError, setCampaignOverviewError] = useState('')
  const [campaignOverviewSearch, setCampaignOverviewSearch] = useState('')
  const [campaignOverviewRefreshNonce, setCampaignOverviewRefreshNonce] = useState(0)
  const [campaignOverviewExpandedClientIds, setCampaignOverviewExpandedClientIds] = useState([])
  const [campaignOverviewExpandedCampaignIds, setCampaignOverviewExpandedCampaignIds] = useState([])
  const [campaignOverviewExpandedAdsetIds, setCampaignOverviewExpandedAdsetIds] = useState([])
  const [campaignViewMode, setCampaignViewMode] = useState('compact')
  const [campaignChartOpenKeys, setCampaignChartOpenKeys] = useState({})
  const [campaignChartData, setCampaignChartData] = useState({})
  const [campaignChartMetric, setCampaignChartMetric] = useState({})
  const [insights, setInsights] = useState(null)
  const [previousInsights, setPreviousInsights] = useState(null)
  const [googleAdsSummary, setGoogleAdsSummary] = useState(null)
  const [googleAdsError, setGoogleAdsError] = useState('')
  const [dailyData, setDailyData] = useState([])
  const [dailyCampaignData, setDailyCampaignData] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [metaHierarchy, setMetaHierarchy] = useState([])
  const [breakdowns, setBreakdowns] = useState(EMPTY_META_BREAKDOWNS)
  const [metaResultDrilldown, setMetaResultDrilldown] = useState(null)
  const [metaRankingDrilldown, setMetaRankingDrilldown] = useState(null)
  const [metaSecondaryResultDrilldown, setMetaSecondaryResultDrilldown] = useState(null)
  const [metaRankingDetailDailyData, setMetaRankingDetailDailyData] = useState([])
  const [metaRankingDetailDailyLoading, setMetaRankingDetailDailyLoading] = useState(false)
  const [metaRankingDetailDailyError, setMetaRankingDetailDailyError] = useState('')
  const [metaCreativePreview, setMetaCreativePreview] = useState(null)
  const [metaCreativePreviewLoading, setMetaCreativePreviewLoading] = useState(false)
  const [metaCreativePreviewError, setMetaCreativePreviewError] = useState('')
  const [metaResultPreviewKey, setMetaResultPreviewKey] = useState('purchases')
  const [metaResultGrouping, setMetaResultGrouping] = useState('day')
  const [isRankingsLoading, setIsRankingsLoading] = useState(false)
  const [rankingsError, setRankingsError] = useState('')
  const [rdSummary, setRdSummary] = useState(null)
  const [previousRdSummary, setPreviousRdSummary] = useState(null)
  const [isManualCrmModalOpen, setIsManualCrmModalOpen] = useState(false)
  const [isSavingManualCrm, setIsSavingManualCrm] = useState(false)
  const [manualCrmForm, setManualCrmForm] = useState({
    opportunityCount: '',
    qualifiedOpportunityCount: '',
    wonOpportunityCount: '',
    lostOpportunityCount: '',
    wonRevenue: '',
  })
  const [googleSheetsSummary, setGoogleSheetsSummary] = useState(null)
  const [googleSheetsError, setGoogleSheetsError] = useState('')
  const [clickUpSummary, setClickUpSummary] = useState(null)
  const [clickUpError, setClickUpError] = useState('')
  const [mondaySummary, setMondaySummary] = useState(null)
  const [mondayError, setMondayError] = useState('')
  const [mondayOwnerFilter, setMondayOwnerFilter] = useState('all')
  const [mondayMetricDrilldown, setMondayMetricDrilldown] = useState(null)
  const [expandedMondayGroups, setExpandedMondayGroups] = useState({})
  const [rdPipelines, setRdPipelines] = useState([])
  const [rdPipelineStages, setRdPipelineStages] = useState([])
  const [agendorPipelineOptions, setAgendorPipelineOptions] = useState([])
  const [agendorStageOptions, setAgendorStageOptions] = useState([])
  const [isAgendorPipelinesLoading, setIsAgendorPipelinesLoading] = useState(false)
  const [agendorPipelinesError, setAgendorPipelinesError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMetaStructureReady, setIsMetaStructureReady] = useState(false)
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSavingReport, setIsSavingReport] = useState(false)
  const [savedReportSuccess, setSavedReportSuccess] = useState(false)
  const [isAiInsightsModalOpen, setIsAiInsightsModalOpen] = useState(false)
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false)
  const [aiInsightsError, setAiInsightsError] = useState('')
  const [aiInsightsResult, setAiInsightsResult] = useState(null)
  const [hasSyncedServerState, setHasSyncedServerState] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [dragMetricKey, setDragMetricKey] = useState('')
  const [dragSourceIndex, setDragSourceIndex] = useState(null)
  const [dashboardMetricDragState, setDashboardMetricDragState] = useState(null)
  const [rdPipelineFilter, setRdPipelineFilter] = useState('')
  const [draftRdPipelineFilter, setDraftRdPipelineFilter] = useState('')
  const [rdSellerFilter, setRdSellerFilter] = useState('all')
  const [draftRdSellerFilter, setDraftRdSellerFilter] = useState('all')
  const [rdLeadSourceFilters, setRdLeadSourceFilters] = useState([])
  const [draftRdLeadSourceFilters, setDraftRdLeadSourceFilters] = useState([])
  const [draftFunnelSteps, setDraftFunnelSteps] = useState([])
  const [draftDashboardTemplates, setDraftDashboardTemplates] = useState([])
  const [draftDashboardTemplateId, setDraftDashboardTemplateId] = useState('')
  const [layoutSaveMessage, setLayoutSaveMessage] = useState('')
  const [isSavingDashboardLayout, setIsSavingDashboardLayout] = useState(false)
  const [isMetaMetricLibraryOpen, setIsMetaMetricLibraryOpen] = useState(false)
  const [isRdMetricLibraryOpen, setIsRdMetricLibraryOpen] = useState(false)
  const [isSheetsMetricLibraryOpen, setIsSheetsMetricLibraryOpen] = useState(false)
  const [isQualifiedStagesVisible, setIsQualifiedStagesVisible] = useState(false)
  const [usersList, setUsersList] = useState([])
  const [teamProfiles, setTeamProfiles] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false)
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false)
  const [workspaceBranding, setWorkspaceBranding] = useState(DEFAULT_WORKSPACE_BRANDING)
  const [brandingForm, setBrandingForm] = useState(DEFAULT_WORKSPACE_BRANDING)
  const [isSavingBranding, setIsSavingBranding] = useState(false)
  const [brandingError, setBrandingError] = useState('')
  const [isDashboardEntryModalOpen, setIsDashboardEntryModalOpen] = useState(false)
  const [dashboardEntryClientId, setDashboardEntryClientId] = useState('')
  const [createUserError, setCreateUserError] = useState('')
  const [createdUserInvite, setCreatedUserInvite] = useState(null)
  const [editUserError, setEditUserError] = useState('')
  const [editUserClientSearch, setEditUserClientSearch] = useState('')
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'visualizador',
    aiAccessLevel: 'team',
    canEditIntegrations: false,
    clientIds: [],
    clientGroupIds: [],
  })
  const [savingUser, setSavingUser] = useState(false)
  const ADS_TABS = ['apresentacao', 'campanhas', 'anuncios', 'saldos', 'relatorios', 'relatorio-manual', 'planilha-leads', 'funil']
  const [isAdsMenuOpen, setIsAdsMenuOpen] = useState(() => ADS_TABS.includes(initialTab))
  const SOCIAL_TABS = ['editorial', 'editorial-dash', 'editorial-plans']
  const [isSocialMenuOpen, setIsSocialMenuOpen] = useState(() => SOCIAL_TABS.includes(initialTab))
  const PAC_TABS = ['pac-dash', 'pac-calendario', 'pac-tipos']
  const [isPacMenuOpen, setIsPacMenuOpen] = useState(() => PAC_TABS.includes(initialTab))
  const SUCCESS_TABS = ['clientes', 'onboarding', 'offboarding', 'acessos']
  const [isSuccessMenuOpen, setIsSuccessMenuOpen] = useState(() => SUCCESS_TABS.includes(initialTab))
  const [globalIntegrations, setGlobalIntegrations] = useState({
    ...DEFAULT_PREFERENCES.globalIntegrations,
  })
  const [metaConnection, setMetaConnection] = useState({
    connected: false,
    userId: '',
    userName: '',
    scopes: '',
    expiresAt: '',
  })
  const [googleAdsConnection, setGoogleAdsConnection] = useState({
    connected: false,
    googleEmail: '',
    googleName: '',
    scopes: '',
    expiresAt: '',
    managerCustomerId: '',
  })

  const currentTheme = useMemo(() => resolveDashboardTheme(themeColor), [themeColor])
  const effectiveWorkspaceBranding = useMemo(
    () => ({
      ...DEFAULT_WORKSPACE_BRANDING,
      ...(access?.workspaceBranding || {}),
      ...(workspaceBranding || {}),
    }),
    [access?.workspaceBranding, workspaceBranding]
  )
  const appAccentColor = externalAppAccent
    || effectiveWorkspaceBranding.accentColor
    || (appearance?.mode === 'custom' ? appearance?.accent : '#26c281')
    || currentTheme.main
  const appBackgroundTintHex = externalAppBackground
    || effectiveWorkspaceBranding.backgroundColor
    || (appearance?.mode === 'custom'
      ? appearance?.backgroundTint
      : appearance?.mode === 'light'
        ? '#f7faf8'
        : '#070908')
  const appBackgroundTintRgb = useMemo(
    () => parseDashboardColor(appBackgroundTintHex) || hexToRgb('#0d1110'),
    [appBackgroundTintHex]
  )
  const normalizedNewClientDashboardColor = useMemo(() => {
    const parsedColor = parseDashboardColor(newClientDashboardColor || appAccentColor) || parseDashboardColor(appAccentColor) || hexToRgb('#10B981')
    return rgbToHex(parsedColor).toUpperCase()
  }, [newClientDashboardColor, appAccentColor])
  const appLogoUrl = initialAppLogoUrl || effectiveWorkspaceBranding.logoUrl || globalIntegrations.appLogoUrl || ''
  const appName = effectiveWorkspaceBranding.appName || effectiveWorkspaceBranding.companyName || 'Assessoria LP'
  const appSubtitle = effectiveWorkspaceBranding.appSubtitle || 'Performance Hub'
  const role = access?.role || profile?.role || 'visualizador'
  const canManageUsers = Boolean(access?.canManageUsers)
  const canManageClients = Boolean(access?.canManageClients)
  const canEditIntegrations = Boolean(access?.canEditIntegrations)
  const canViewDashboard = access?.canViewDashboard !== false
  const viewableClientIds = useMemo(
    () => (Array.isArray(access?.viewableClientIds) ? access.viewableClientIds : []),
    [access?.viewableClientIds]
  )
  const editableClientIds = useMemo(
    () => (Array.isArray(access?.editableClientIds) ? access.editableClientIds : []),
    [access?.editableClientIds]
  )
  const editableClientIdsSet = useMemo(() => new Set(editableClientIds), [editableClientIds])
  const canAccessClientsTab = canManageClients || viewableClientIds.length > 0
  const canPersistClientChanges = canManageClients || editableClientIds.length > 0
  const canAccessTeamTab = Boolean(user) && !access?.isClientRole
  const isMaster = role === 'master'

  const canEditClientRecord = useCallback(
    (clientId) => canManageClients || editableClientIdsSet.has(clientId),
    [canManageClients, editableClientIdsSet]
  )
  const canEditActiveClient = activeClientId ? canEditClientRecord(activeClientId) : canManageClients

  useEffect(() => {
    setActiveTab(REMOVED_TABS.has(initialTab) ? 'clientes' : initialTab)
  }, [initialTab])

  useEffect(() => {
    if (REMOVED_TABS.has(activeTab)) {
      setActiveTab('clientes')
    }
  }, [activeTab])

  useEffect(() => {
    setMondayMetricDrilldown(null)
  }, [mondaySummary, mondayOwnerFilter, mondayDateRange, mondayCustomSince, mondayCustomUntil])

  useEffect(() => {
    setExpandedMondayGroups({})
  }, [mondayMetricDrilldown])

  useEffect(() => {
    setMetaRankingDrilldown(null)
  }, [breakdowns, activeClientId])

  useEffect(() => {
    setNewClientOkrTitle('')
    setNewClientOkrCadence('mensal')
    setNewClientOkrCycleDays('')
    setNewClientNoteBody('')
  }, [activeClientId])

  useEffect(() => {
    setNewClientOperationLane(resolveOperationLaneFromSalesModel(newClientSalesModel))
    const availablePhaseLabels = (
      Array.isArray(clientImplementationPhases) && clientImplementationPhases.length
        ? clientImplementationPhases
        : getDefaultClientImplementationPhases()
    ).map((phase) => String(phase?.label || '').trim()).filter(Boolean)
    const suggestedPhaseLabel = IMPLEMENTATION_PHASE_BY_SALES_MODEL[newClientSalesModel] || ''
    setNewClientImplementationPhase((current) => (
      current && availablePhaseLabels.includes(current)
        ? current
        : (availablePhaseLabels.includes(suggestedPhaseLabel) ? suggestedPhaseLabel : '')
    ))
  }, [clientImplementationPhases, newClientSalesModel])

  useEffect(() => {
    setNewClientOperationEnabled(operationSettings?.autoCreateCardForNewClient !== false)
  }, [operationSettings?.autoCreateCardForNewClient])

  useEffect(() => {
    if (activeTab !== 'home') {
      setIsHomeToolsExpanded(false)
    }
  }, [activeTab])

  useEffect(() => {
    setMetaResultDrilldown(null)
  }, [activeClientId, dateRange, customSince, customUntil, dailyData])

  useEffect(() => {
    const availableKeys = Object.keys(META_RESULT_COMPARISON_OPTIONS)
    if (availableKeys.includes(metaResultPreviewKey)) return
    setMetaResultPreviewKey('purchases')
  }, [metaResultPreviewKey])

  const activeClient = useMemo(
    () => clients.find((client) => client.id === activeClientId) || null,
    [clients, activeClientId]
  )
  const activeClientUsesManualCrm = String(activeClient?.crmProvider || '').trim().toLowerCase() === 'manual'
  const activeClientManualCrmSummary = useMemo(
    () => buildManualCrmSummary(activeClient?.manualCrmSummary || {}, insights),
    [activeClient?.manualCrmSummary, insights]
  )
  const dashboardEligibleClients = useMemo(
    () => clients.filter(isClientActiveForDashboard),
    [clients]
  )
  const weeklyWeekEnd = useMemo(() => getWeekEndDateInputValue(weeklyWeekStart), [weeklyWeekStart])
  const weeklyPeriodWindow = useMemo(
    () => getWeeklyPeriodWindow(weeklyPeriodPreset, weeklyCustomSince, weeklyCustomUntil, weeklyMonthFilter, weeklyFilledWeekStart),
    [weeklyPeriodPreset, weeklyCustomSince, weeklyCustomUntil, weeklyMonthFilter, weeklyFilledWeekStart]
  )

  useEffect(() => {
    if (!weeklySuccessMessage) return undefined
    const timerId = window.setTimeout(() => setWeeklySuccessMessage(''), 4500)
    return () => window.clearTimeout(timerId)
  }, [weeklySuccessMessage])

  useEffect(() => {
    if (!dashboardEligibleClients.length) return
    setWeeklyForm((current) => {
      if (current.clientId && dashboardEligibleClients.some((client) => client.id === current.clientId)) return current
      const fallbackClientId = activeClientId && dashboardEligibleClients.some((client) => client.id === activeClientId)
        ? activeClientId
        : dashboardEligibleClients[0]?.id || ''
      return { ...current, clientId: fallbackClientId }
    })
  }, [dashboardEligibleClients, activeClientId])

  const loadOperationCards = useCallback(async () => {
    if (!hasLoadedPreferences) return
    try {
      const res = await fetch('/api/operation/cards', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (Array.isArray(json.cards)) {
        setOperationCards(json.cards.map((c) => ({
          id: c.id,
          taskCode: c.task_code,
          taskType: c.task_type,
          clientId: c.client_id,
          title: c.title,
          content: c.content,
          lane: c.lane,
          status: c.status,
          priority: c.priority,
          assigneeIds: c.assignee_ids || [],
          tags: c.tags || [],
          subtasks: c.subtasks || [],
          comments: c.comments || [],
          customFieldValues: c.custom_field_values || {},
          startDate: c.start_date,
          dueDate: c.due_date,
          segment: c.segment,
          tier: c.tier,
          squad: c.squad,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })))
        setOperationCardsLoaded(true)
      }
    } catch (_) {}
  }, [hasLoadedPreferences])

  useEffect(() => {
    if (activeTab === 'operacao') loadOperationCards()
  }, [activeTab, loadOperationCards])

  const loadWeeklyRecords = useCallback(async () => {
    if (!hasLoadedPreferences) return
    if (activeTab !== 'semanal' && activeTab !== 'clientes' && activeTab !== 'anuncios' && activeTab !== 'campanhas') return

    setIsWeeklyLoading(true)
    setWeeklyError('')

    try {
      const params = new URLSearchParams()
      if (activeTab === 'semanal' && weeklyClientFilter !== 'all') params.set('clientId', weeklyClientFilter)
      const response = await fetch(`/api/client-weekly${params.toString() ? `?${params.toString()}` : ''}`, { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível carregar o acompanhamento semanal.')
      }

      setWeeklyRecords(Array.isArray(data.records) ? data.records : [])
    } catch (error) {
      setWeeklyRecords([])
      setWeeklyError(error.message || 'Não foi possível carregar o acompanhamento semanal.')
    } finally {
      setIsWeeklyLoading(false)
    }
  }, [activeTab, hasLoadedPreferences, weeklyClientFilter])

  useEffect(() => {
    loadWeeklyRecords()
  }, [loadWeeklyRecords])

  const loadCprBenchmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/cpr-benchmarks', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const map = {}
      for (const b of (data.benchmarks || [])) map[b.client_id] = Number(b.benchmark_cpr)
      setCprBenchmarks(map)
      if (data.settings) setCprSettings(data.settings)
    } catch {}
  }, [])

  useEffect(() => { loadCprBenchmarks() }, [loadCprBenchmarks])

  const loadOnboardingRecords = useCallback(async () => {
    if (activeTab !== 'onboarding') return
    try {
      const res = await fetch('/api/client-onboarding', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      setOnboardingRecords(Array.isArray(data.records) ? data.records : [])
    } catch { setOnboardingRecords([]) }
  }, [activeTab])

  useEffect(() => { loadOnboardingRecords() }, [loadOnboardingRecords])

  const handleToggleOnboardingTask = useCallback(async (clientId, taskId) => {
    const record = onboardingRecords.find((r) => r.client_id === clientId)
    const completed = Array.isArray(record?.completed_tasks) ? record.completed_tasks : []
    const na = Array.isArray(record?.na_tasks) ? record.na_tasks : []
    const nextCompleted = completed.includes(taskId) ? completed.filter((t) => t !== taskId) : [...completed, taskId]
    const nextNa = na.filter((t) => t !== taskId)
    setOnboardingRecords((prev) => {
      const exists = prev.find((r) => r.client_id === clientId)
      if (exists) return prev.map((r) => r.client_id === clientId ? { ...r, completed_tasks: nextCompleted, na_tasks: nextNa } : r)
      return [...prev, { client_id: clientId, completed_tasks: nextCompleted, na_tasks: nextNa, notes: '' }]
    })
    setOnboardingSaving(true)
    try {
      await fetch('/api/client-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, completedTasks: nextCompleted, naTasks: nextNa }),
      })
    } finally { setOnboardingSaving(false) }
  }, [onboardingRecords])

  const handleToggleOnboardingTaskNA = useCallback(async (clientId, taskId) => {
    const record = onboardingRecords.find((r) => r.client_id === clientId)
    const completed = Array.isArray(record?.completed_tasks) ? record.completed_tasks : []
    const na = Array.isArray(record?.na_tasks) ? record.na_tasks : []
    const nextNa = na.includes(taskId) ? na.filter((t) => t !== taskId) : [...na, taskId]
    const nextCompleted = completed.filter((t) => t !== taskId)
    setOnboardingRecords((prev) => {
      const exists = prev.find((r) => r.client_id === clientId)
      if (exists) return prev.map((r) => r.client_id === clientId ? { ...r, completed_tasks: nextCompleted, na_tasks: nextNa } : r)
      return [...prev, { client_id: clientId, completed_tasks: nextCompleted, na_tasks: nextNa, notes: '' }]
    })
    setOnboardingSaving(true)
    try {
      await fetch('/api/client-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, completedTasks: nextCompleted, naTasks: nextNa }),
      })
    } finally { setOnboardingSaving(false) }
  }, [onboardingRecords])

  const loadOffboardingRecords = useCallback(async () => {
    if (activeTab !== 'offboarding') return
    try {
      const res = await fetch('/api/client-offboarding', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      setOffboardingRecords(Array.isArray(data.records) ? data.records : [])
    } catch { setOffboardingRecords([]) }
  }, [activeTab])

  useEffect(() => { loadOffboardingRecords() }, [loadOffboardingRecords])

  const getWeekStart = useCallback((offsetWeeks = 0) => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + offsetWeeks * 7)
    return d.toISOString().slice(0, 10)
  }, [])

  const persistReorder = useCallback(async (entity, items) => {
    await Promise.all(items.map((item, i) =>
      fetch('/api/onboarding-tasks/definitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity, id: item.id, sort_order: i }) })
    ))
  }, [])

  const loadOnboardingPhaseDefs = useCallback(async (type = 'onboarding') => {
    try {
      const res = await fetch(`/api/onboarding-tasks/definitions?type=${type}`, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (type === 'onboarding') { setOnboardingPhaseDefs(Array.isArray(data.phases) ? data.phases : []); setOnboardingPhaseDefsLoaded(true) }
      else { setOffboardingPhaseDefs(Array.isArray(data.phases) ? data.phases : []); setOffboardingPhaseDefsLoaded(true) }
    } catch { if (type === 'onboarding') setOnboardingPhaseDefsLoaded(true); else setOffboardingPhaseDefsLoaded(true) }
  }, [])

  const loadNavPermissions = useCallback(async () => {
    if (!isMaster) return
    try {
      const res = await fetch('/api/nav-permissions', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      setNavPermissions(Array.isArray(data.permissions) ? data.permissions : [])
    } catch { setNavPermissions([]) }
  }, [isMaster])

  const loadMyNavPermissions = useCallback(async () => {
    if (isMaster) return
    try {
      const res = await fetch('/api/nav-permissions', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const all = Array.isArray(data.permissions) ? data.permissions : []
      setMyNavPermissions(all.filter(p => p.user_id === user?.id))
    } catch { setMyNavPermissions([]) }
  }, [isMaster, user?.id])

  useEffect(() => { if (activeTab === 'onboarding' && !onboardingPhaseDefsLoaded) loadOnboardingPhaseDefs('onboarding') }, [activeTab, onboardingPhaseDefsLoaded, loadOnboardingPhaseDefs])
  useEffect(() => { if (activeTab === 'offboarding' && !offboardingPhaseDefsLoaded) loadOnboardingPhaseDefs('offboarding') }, [activeTab, offboardingPhaseDefsLoaded, loadOnboardingPhaseDefs])
  useEffect(() => { if (activeTab === 'usuarios') loadNavPermissions() }, [activeTab, loadNavPermissions])
  useEffect(() => { if (user && !isMaster) loadMyNavPermissions() }, [user, isMaster, loadMyNavPermissions])

  const hasNavAccess = useCallback((pageKey) => {
    if (isMaster) return true
    const perm = myNavPermissions.find(p => p.page_key === pageKey)
    return perm ? perm.granted : false
  }, [isMaster, myNavPermissions])

  const toggleNavPermission = useCallback(async (userId, pageKey, granted) => {
    setNavPermissions(prev => {
      const exists = prev.find(p => p.user_id === userId && p.page_key === pageKey)
      if (exists) return prev.map(p => p.user_id === userId && p.page_key === pageKey ? { ...p, granted } : p)
      return [...prev, { user_id: userId, page_key: pageKey, granted }]
    })
    await fetch('/api/nav-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pageKey, granted }),
    })
  }, [])

  const handleToggleOffboardingTask = useCallback(async (clientId, taskId) => {
    const record = offboardingRecords.find((r) => r.client_id === clientId)
    const completed = Array.isArray(record?.completed_tasks) ? record.completed_tasks : []
    const next = completed.includes(taskId) ? completed.filter((t) => t !== taskId) : [...completed, taskId]
    setOffboardingRecords((prev) => {
      const exists = prev.find((r) => r.client_id === clientId)
      if (exists) return prev.map((r) => r.client_id === clientId ? { ...r, completed_tasks: next } : r)
      return [...prev, { client_id: clientId, completed_tasks: next, notes: '' }]
    })
    setOffboardingSaving(true)
    try {
      await fetch('/api/client-offboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, completedTasks: next }),
      })
    } finally { setOffboardingSaving(false) }
  }, [offboardingRecords])

  useEffect(() => {
    if (!weeklyForm.clientId) return
    const existingRecord = weeklyRecords.find((record) => record.clientId === weeklyForm.clientId && record.weekStart === weeklyWeekStart)

    setWeeklyForm((current) => ({
      ...current,
      investment: existingRecord ? String(existingRecord.investment || '') : '',
      leads: existingRecord ? String(existingRecord.leads || '') : '',
      sql: existingRecord ? String(existingRecord.sql || '') : '',
      healthStatus: existingRecord?.healthStatus || 'attention',
      actionItemsText: existingRecord && Array.isArray(existingRecord.actionItems) ? existingRecord.actionItems.join('\n') : '',
    }))
  }, [weeklyRecords, weeklyForm.clientId, weeklyWeekStart])

  const handleSaveWeeklyRecord = async (event) => {
    event.preventDefault()
    if (!weeklyForm.clientId) {
      setWeeklyError('Selecione um cliente para salvar a semana.')
      return
    }

    setIsSavingWeeklyRecord(true)
    setWeeklyError('')
    setWeeklySuccessMessage('')

    try {
      const response = await fetch('/api/client-weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: weeklyForm.clientId,
          weekStart: weeklyWeekStart,
          investment: normalizeWeeklyNumber(weeklyForm.investment),
          leads: normalizeWeeklyInteger(weeklyForm.leads),
          sql: normalizeWeeklyInteger(weeklyForm.sql),
          healthStatus: weeklyForm.healthStatus,
          actionItems: weeklyForm.actionItemsText.split('\n').map((item) => item.trim()).filter(Boolean),
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível salvar o acompanhamento semanal.')
      }

      await loadWeeklyRecords()
      const savedClientName = dashboardEligibleClients.find((client) => client.id === weeklyForm.clientId)?.name || 'cliente'
      setWeeklySuccessMessage(`Semana de ${savedClientName} salva com sucesso.`)
      setIsWeeklyEntryModalOpen(false)
    } catch (error) {
      setWeeklyError(error.message || 'Não foi possível salvar o acompanhamento semanal.')
    } finally {
      setIsSavingWeeklyRecord(false)
    }
  }

  const handleToggleWeeklyDeleteMode = useCallback(() => {
    setWeeklyError('')
    setWeeklySuccessMessage('')
    setIsWeeklyDeleteMode((current) => {
      if (current) setSelectedWeeklyRecordIds([])
      return !current
    })
  }, [])

  const handleDeleteSelectedWeeklyRecords = useCallback(async () => {
    if (!selectedWeeklyRecordIds.length) {
      setWeeklyError('Selecione ao menos um registro para excluir.')
      return
    }

    const confirmed = window.confirm(`Excluir ${selectedWeeklyRecordIds.length} registro(s) do histórico? Essa ação não pode ser desfeita.`)
    if (!confirmed) return

    setIsDeletingWeeklyRecords(true)
    setWeeklyError('')
    setWeeklySuccessMessage('')

    try {
      const response = await fetch('/api/client-weekly', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedWeeklyRecordIds }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível excluir os registros selecionados.')
      }

      const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : selectedWeeklyRecordIds
      setWeeklyRecords((current) => current.filter((record) => !deletedIds.includes(record.id)))
      setSelectedWeeklyRecordIds([])
      setIsWeeklyDeleteMode(false)
      setWeeklySuccessMessage(`${deletedIds.length} registro(s) excluído(s) com sucesso.`)
      await loadWeeklyRecords()
    } catch (error) {
      setWeeklyError(error.message || 'Não foi possível excluir os registros selecionados.')
    } finally {
      setIsDeletingWeeklyRecords(false)
    }
  }, [selectedWeeklyRecordIds, loadWeeklyRecords])


  useEffect(() => {
    const manual = activeClient?.manualCrmSummary || {}
    setManualCrmForm({
      opportunityCount: String(manual.opportunityCount ?? ''),
      qualifiedOpportunityCount: String(manual.qualifiedOpportunityCount ?? ''),
      wonOpportunityCount: String(manual.wonOpportunityCount ?? ''),
      lostOpportunityCount: String(manual.lostOpportunityCount ?? ''),
      wonRevenue: String(manual.wonRevenue ?? ''),
    })
  }, [activeClient?.id, activeClient?.manualCrmSummary])
  const operationEligibleClients = useMemo(
    () => clients.filter((client) => !client.isArchived && client.operationEnabled !== false),
    [clients]
  )
  useEffect(() => {
    if (activeTab !== 'apresentacao') return
    if (!dashboardEligibleClients.length) return
    if (dashboardEligibleClients.some((client) => client.id === activeClientId)) return
    setActiveClientId(dashboardEligibleClients[0].id)
  }, [activeTab, dashboardEligibleClients, activeClientId])
  useEffect(() => {
    if (!isOperationCreateModalOpen) return
    if (!newOperationClientId && operationEligibleClients.length) {
      const fallbackClientId = operationEligibleClients.some((client) => client.id === activeClientId)
        ? activeClientId
        : operationEligibleClients[0]?.id || ''
      setNewOperationClientId(fallbackClientId)
    }
  }, [isOperationCreateModalOpen, newOperationClientId, operationEligibleClients, activeClientId])
  const activeDashboardTemplates = useMemo(
    () => (Array.isArray(activeClient?.dashboardTemplates) ? activeClient.dashboardTemplates : []),
    [activeClient]
  )
  const activeDashboardTemplate = useMemo(() => {
    if (!activeDashboardTemplates.length) return null
    return (
      activeDashboardTemplates.find((template) => template.id === activeClient?.activeDashboardTemplateId) ||
      activeDashboardTemplates[0]
    )
  }, [activeDashboardTemplates, activeClient])
  const activeDraftDashboardTemplates = useMemo(
    () => (Array.isArray(draftDashboardTemplates) ? draftDashboardTemplates : []),
    [draftDashboardTemplates]
  )
  const activeDraftDashboardTemplate = useMemo(() => {
    if (!activeDraftDashboardTemplates.length) return null
    return (
      activeDraftDashboardTemplates.find((template) => template.id === draftDashboardTemplateId) ||
      activeDraftDashboardTemplates[0]
    )
  }, [activeDraftDashboardTemplates, draftDashboardTemplateId])
  const selectedManagedUser = useMemo(
    () => usersList.find((managedUser) => managedUser.id === selectedUserId) || null,
    [usersList, selectedUserId]
  )
  const currentUserTeamProfile = useMemo(
    () => teamProfiles.find((item) => item.userId === user?.id) || createTeamMemberProfileRecord({ userId: user?.id || '' }),
    [teamProfiles, user?.id]
  )
  const selectedManagedUserTeamProfile = useMemo(
    () => selectedManagedUser?.teamProfile || createTeamMemberProfileRecord({ userId: selectedManagedUser?.id || '' }),
    [selectedManagedUser]
  )
  const clientGroupsById = useMemo(
    () =>
      new Map(
        clientGroups.map((group) => [
          group.id,
          {
            ...group,
            clientIds: normalizeClientGroupClientIds(group.clientIds),
          },
        ])
    ),
    [clientGroups]
  )
  const clientIdsSet = useMemo(() => new Set(clients.map((client) => client.id)), [clients])
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients]
  )
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )
  const operationCardsByClientId = useMemo(() => {
    const nextMap = new Map()
    operationCards.forEach((card) => {
      const current = nextMap.get(card.clientId) || []
      current.push(card)
      nextMap.set(card.clientId, current)
    })
    return nextMap
  }, [operationCards])
  const effectiveClientSystemFields = useMemo(
    () => (Array.isArray(clientSystemFields) && clientSystemFields.length ? clientSystemFields : DEFAULT_CLIENT_SYSTEM_FIELDS),
    [clientSystemFields]
  )
  const clientTabOverridesByKey = useMemo(
    () => new Map((Array.isArray(clientTabOverrides) ? clientTabOverrides : []).map((tab) => [tab.key, tab.label])),
    [clientTabOverrides]
  )
  const systemFieldsByKey = useMemo(
    () => new Map(effectiveClientSystemFields.map((field) => [field.key, field])),
    [effectiveClientSystemFields]
  )
  const customColumnsByKey = useMemo(
    () => new Map(clientCustomColumns.map((column) => [column.key, column])),
    [clientCustomColumns]
  )
  const effectiveClientImplementationPhases = useMemo(
    () => (Array.isArray(clientImplementationPhases) && clientImplementationPhases.length ? clientImplementationPhases : getDefaultClientImplementationPhases()),
    [clientImplementationPhases]
  )
  const clientImplementationPhaseMap = useMemo(
    () => new Map(effectiveClientImplementationPhases.map((phase) => [phase.label, phase])),
    [effectiveClientImplementationPhases]
  )
  const getClientJourneyPhasePreview = useCallback((phase) => {
    if (!phase) return ''
    const lines = [
      phase.description ? `Resumo: ${phase.description}` : '',
      phase.objective ? `Objetivo: ${phase.objective}` : '',
      phase.slaDays ? `SLA esperado: ${phase.slaDays} dia(s)` : '',
      Array.isArray(phase.checklist) && phase.checklist.length ? `Checklist base:\n- ${phase.checklist.join('\n- ')}` : '',
    ].filter(Boolean)

    return lines.join('\n\n')
  }, [])
  const clientFieldTabOptions = useMemo(
    () => [
      ...CLIENT_DEFAULT_TABS.map((view) => ({ key: view.key, label: clientTabOverridesByKey.get(view.key) || view.label })),
      ...clientCustomTabs.map((tab) => ({ key: tab.key, label: tab.label })),
    ],
    [clientCustomTabs, clientTabOverridesByKey]
  )
  const clientFormulaReferenceOptions = useMemo(() => {
    const builtInFields = [
      { key: 'fee', label: 'Fee' },
      { key: 'mediaInvestment', label: 'Investimento em mídia' },
      { key: 'monthlyRevenue', label: 'Faturamento' },
      { key: 'step', label: 'STEP' },
      { key: 'ltv', label: 'LTV' },
      { key: 'mmf', label: 'MM/F' },
      { key: 'roiMarketing', label: 'ROI do Marketing' },
      { key: 'organicDemands', label: 'Demandas Orgânicas' },
      { key: 'trafficDemands', label: 'Demandas de Tráfego' },
      { key: 'totalDemands', label: 'Total de Demandas' },
      { key: 'contributionMarginPercent', label: 'Margem de Contribuição (%)' },
      { key: 'profitMarginPercent', label: 'Margem de Lucro (%)' },
    ]
    const customFieldOptions = clientCustomColumns
      .filter((column) => ['number', 'currency', 'percent', 'progress', 'formula'].includes(column.type))
      .map((column) => ({ key: column.key, label: column.label }))

    return [...builtInFields, ...customFieldOptions]
  }, [clientCustomColumns])
  const resolveClientFieldValue = useCallback((client, fieldKey, visitedKeys = new Set()) => {
    if (!client || !fieldKey) return ''
    if (visitedKeys.has(fieldKey)) return ''

    const customColumn = customColumnsByKey.get(fieldKey)
    if (!customColumn) {
      return client?.[fieldKey] ?? ''
    }

    if (customColumn.type === 'formula') {
      const nextVisitedKeys = new Set(visitedKeys)
      nextVisitedKeys.add(fieldKey)
      const formulaResult = evaluateFormulaExpression(
        customColumn.formulaExpression,
        (referencedFieldKey) => resolveClientFieldValue(client, referencedFieldKey, nextVisitedKeys)
      )
      return formulaResult == null ? '' : formatDerivedClientNumber(formulaResult, 2)
    }

    return client?.customFieldValues?.[fieldKey] ?? ''
  }, [customColumnsByKey])
  const allClientRegistryViews = useMemo(
    () => [
      ...CLIENT_DEFAULT_TABS.map((view) => ({
        ...view,
        label: clientTabOverridesByKey.get(view.key) || view.label,
        columns: [
          'name',
          ...effectiveClientSystemFields
            .filter((field) => field.tabKey === view.key && field.key !== 'name')
            .map((field) => field.key),
          ...clientCustomColumns
            .filter((column) => column.tabKey === view.key)
            .map((column) => column.key),
        ],
      })),
      ...clientCustomTabs
        .map((tab) => ({
          key: tab.key,
          label: tab.label,
          columns: [
            'name',
            ...Array.from(new Set([
              ...(Array.isArray(tab.columnKeys) ? tab.columnKeys : []),
              ...clientCustomColumns
                .filter((column) => column.tabKey === tab.key)
                .map((column) => column.key),
            ])).filter((columnKey) => columnKey !== 'name'),
          ],
          isCustom: true,
        }))
        .filter((tab) => Array.isArray(tab.columns) && tab.columns.length > 1)
    ],
    [clientCustomColumns, clientCustomTabs, effectiveClientSystemFields, clientTabOverridesByKey]
  )
  const allClientEditSections = useMemo(
    () => allClientRegistryViews.map((view) => ({ key: view.key, label: view.label })),
    [allClientRegistryViews]
  )
  const activeClientRegistryView = useMemo(
    () => allClientRegistryViews.find((view) => view.key === clientRegistryView) || allClientRegistryViews[0],
    [clientRegistryView, allClientRegistryViews]
  )
  const activeClientRegistryCustomTab = useMemo(
    () => clientCustomTabs.find((tab) => tab.key === clientRegistryView) || null,
    [clientCustomTabs, clientRegistryView]
  )
  const activeClientRegistryCustomColumns = useMemo(
    () => clientCustomColumns.filter((column) => column.tabKey === clientRegistryView),
    [clientCustomColumns, clientRegistryView]
  )
  const activeClientRegistrySystemColumns = useMemo(
    () => effectiveClientSystemFields.filter((field) => field.tabKey === clientRegistryView),
    [effectiveClientSystemFields, clientRegistryView]
  )
  const activeClientRegistryTabLabel = useMemo(
    () =>
      activeClientRegistryCustomTab?.label ||
      clientTabOverridesByKey.get(clientRegistryView) ||
      activeClientRegistryView?.label ||
      'Aba atual',
    [activeClientRegistryCustomTab, clientTabOverridesByKey, clientRegistryView, activeClientRegistryView]
  )
  const activeClientEditView = useMemo(
    () => allClientRegistryViews.find((view) => view.key === clientEditSection) || allClientRegistryViews[0],
    [clientEditSection, allClientRegistryViews]
  )
  const operationLanes = useMemo(
    () => (Array.isArray(operationSettings?.lanes) && operationSettings.lanes.length ? operationSettings.lanes : createOperationSettingsRecord().lanes),
    [operationSettings]
  )
  const operationStatuses = useMemo(
    () => (Array.isArray(operationSettings?.statuses) && operationSettings.statuses.length ? operationSettings.statuses : createOperationSettingsRecord().statuses),
    [operationSettings]
  )
  const operationTagOptions = useMemo(
    () => (Array.isArray(operationSettings?.tags) ? operationSettings.tags.filter(Boolean) : []),
    [operationSettings]
  )
  const operationTaskTypeOptions = useMemo(
    () => (Array.isArray(operationSettings?.taskTypes) && operationSettings.taskTypes.length ? operationSettings.taskTypes.filter(Boolean) : ['Tarefa']),
    [operationSettings]
  )
  const operationCustomFields = useMemo(
    () => (Array.isArray(operationSettings?.customFields) ? operationSettings.customFields : []),
    [operationSettings]
  )
  const operationLanesByKey = useMemo(
    () => new Map(operationLanes.map((lane) => [lane.key, lane])),
    [operationLanes]
  )
  const operationStatusesByKey = useMemo(
    () => new Map(operationStatuses.map((status) => [status.key, status])),
    [operationStatuses]
  )
  const operationAssignableUsers = useMemo(() => {
    const currentUserOption = user
      ? [{
          id: user.id,
          full_name: user?.user_metadata?.full_name || profile?.full_name || user.email || 'Usuário',
          email: user.email || '',
          role,
        }]
      : []

    const uniqueUsers = [...usersList, ...currentUserOption].reduce((accumulator, item) => {
      if (!item?.id || accumulator.some((current) => current.id === item.id)) return accumulator
      accumulator.push(item)
      return accumulator
    }, [])

    return uniqueUsers
      .filter((item) => item.role !== 'cliente')
      .sort((left, right) =>
        String(left.full_name || left.email || '').localeCompare(String(right.full_name || right.email || ''), 'pt-BR')
      )
  }, [usersList, user, profile?.full_name, role])
  const operationUsersById = useMemo(
    () => new Map(operationAssignableUsers.map((item) => [item.id, item])),
    [operationAssignableUsers]
  )
  useEffect(() => {
    setNewOperationTaskType((current) => (operationTaskTypeOptions.includes(current) ? current : operationTaskTypeOptions[0] || 'Tarefa'))
  }, [operationTaskTypeOptions])
  useEffect(() => {
    if (!isOperationCreateModalOpen) return
    const linkedClient = clientsById.get(newOperationClientId)
    setNewOperationLane(resolveOperationLaneFromSalesModel(linkedClient?.salesModel))
    setNewOperationStatus(operationStatuses[0]?.key || 'aberto')
  }, [isOperationCreateModalOpen, newOperationClientId, clientsById, operationStatuses])
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setOperationTimeNow(Date.now())
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])
  const operationSegmentOptions = useMemo(
    () => Array.from(new Set(operationEligibleClients.map((client) => String(client.segment || '').trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [operationEligibleClients]
  )
  const operationTierOptions = useMemo(
    () => Array.from(new Set(operationEligibleClients.map((client) => String(client.tier || '').trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [operationEligibleClients]
  )
  const operationSquadOptions = useMemo(
    () => Array.from(new Set(operationEligibleClients.map((client) => String(client.squad || '').trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [operationEligibleClients]
  )
  const operationResponsibleOptions = useMemo(
    () => Array.from(new Set(
      operationCards.flatMap((card) => {
        const names = Array.isArray(card.assigneeIds) && card.assigneeIds.length
          ? card.assigneeIds.map((assigneeId) => operationUsersById.get(assigneeId)?.full_name || operationUsersById.get(assigneeId)?.email || '')
          : [String(card.responsible || '').trim()]
        return names.filter(Boolean)
      })
    )).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [operationCards, operationUsersById]
  )
  const operationEditableClients = useMemo(
    () =>
      (canManageClients ? operationEligibleClients : operationEligibleClients.filter((client) => canEditClientRecord(client.id))),
    [canManageClients, operationEligibleClients, canEditClientRecord]
  )
  const clientCompletenessTrackedKeys = useMemo(
    () =>
      effectiveClientSystemFields
        .filter((field) => !CLIENT_COMPLETENESS_EXCLUDED_FIELDS.has(field.key))
        .map((field) => field.key),
    [effectiveClientSystemFields]
  )
  const getClientCompleteness = useCallback((client) => {
    if (!clientCompletenessTrackedKeys.length) return null

    const filledFields = clientCompletenessTrackedKeys.filter((fieldKey) =>
      hasClientFieldValue(client?.[fieldKey])
    ).length

    return Math.round((filledFields / clientCompletenessTrackedKeys.length) * 100)
  }, [clientCompletenessTrackedKeys])
  const getResolvedClientColumnMeta = useCallback(
    (columnKey) => resolveClientRegistryColumnMeta(columnKey, systemFieldsByKey, customColumnsByKey),
    [systemFieldsByKey, customColumnsByKey]
  )
  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase()
    return clients.filter((client) => {
      const matchesSearch = !term || [
        client.name,
        client.cnpj,
        client.product,
        productsById.get(client.productId)?.name,
        client.status,
        client.projectManager,
        client.trafficManager,
        client.designer,
      ].some((value) => String(value || '').toLowerCase().includes(term))

      const healthScore = calculateClientHealthScore(client)
      const completenessScore = getClientCompleteness(client)
      const matchesStatus = clientStatusFilter === 'all'
        ? true
        : clientStatusFilter === 'risk'
          ? healthScore != null && healthScore < 60
          : clientStatusFilter === 'incomplete'
            ? completenessScore != null && completenessScore < 60
          : String(client.status || '').toLowerCase() === clientStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [clients, clientSearch, clientStatusFilter, getClientCompleteness, productsById])
  const clientKanbanColumns = useMemo(() => {
    const orderedPhases = Array.from(
      new Set(
        [
          ...effectiveClientImplementationPhases.map((phase) => phase.label),
          ...filteredClients
            .map((client) => String(client.implementationPhase || '').trim())
            .filter(Boolean),
        ]
      )
    )

    const columns = orderedPhases.map((phaseLabel) => ({
      key: phaseLabel,
      label: phaseLabel,
      clients: filteredClients.filter((client) => String(client.implementationPhase || '').trim() === phaseLabel),
    }))

    const clientsWithoutPhase = filteredClients.filter((client) => !String(client.implementationPhase || '').trim())
    if (clientsWithoutPhase.length) {
      columns.push({
        key: 'sem_fase',
        label: 'Sem fase',
        clients: clientsWithoutPhase,
      })
    }

    return columns
  }, [effectiveClientImplementationPhases, filteredClients])
  const filteredOperationCards = useMemo(() => {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000
    const periodThresholds = {
      '7d': startOfYesterday - 6 * 24 * 60 * 60 * 1000,
      '15d': startOfYesterday - 14 * 24 * 60 * 60 * 1000,
      '30d': startOfYesterday - 29 * 24 * 60 * 60 * 1000,
      '90d': startOfYesterday - 89 * 24 * 60 * 60 * 1000,
    }
    const threshold = operationPeriodFilter === 'all' ? null : periodThresholds[operationPeriodFilter]
    const term = operationSearch.trim().toLowerCase()

    return operationCards.filter((card) => {
      const linkedClient = clientsById.get(card.clientId)
      if (!linkedClient || linkedClient.operationEnabled === false) return false
      const matchesPeriod = threshold == null
        ? true
        : new Date(card.updatedAt || card.createdAt || 0).getTime() >= threshold

      const matchesSearch = !term || [
        card.title,
        card.content,
        linkedClient?.name,
        ...(Array.isArray(card.tags) ? card.tags : []),
      ].some((value) => String(value || '').toLowerCase().includes(term))

      const matchesSegment = operationSegmentFilter === 'all'
        ? true
        : String(card.segment || linkedClient?.segment || '').trim() === operationSegmentFilter
      const matchesTier = operationTierFilter === 'all'
        ? true
        : String(card.tier || linkedClient?.tier || '').trim() === operationTierFilter
      const matchesSquad = operationSquadFilter === 'all'
        ? true
        : String(card.squad || linkedClient?.squad || '').trim() === operationSquadFilter
      const responsibleNames = Array.isArray(card.assigneeIds) && card.assigneeIds.length
        ? card.assigneeIds.map((assigneeId) => operationUsersById.get(assigneeId)?.full_name || operationUsersById.get(assigneeId)?.email || '').filter(Boolean)
        : [String(card.responsible || '').trim()].filter(Boolean)
      const matchesResponsible = operationResponsibleFilter === 'all'
        ? true
        : responsibleNames.includes(operationResponsibleFilter)

      return matchesPeriod && matchesSearch && matchesSegment && matchesTier && matchesSquad && matchesResponsible
    })
  }, [operationCards, clientsById, operationPeriodFilter, operationSearch, operationSegmentFilter, operationTierFilter, operationSquadFilter, operationResponsibleFilter, operationUsersById])
  const operationCardsByLane = useMemo(
    () =>
      operationLanes.reduce((accumulator, lane) => {
        accumulator[lane.key] = filteredOperationCards.filter((card) => card.lane === lane.key)
        return accumulator
      }, {}),
    [filteredOperationCards, operationLanes]
  )
  const expandedOperationCard = useMemo(
    () => operationCards.find((card) => card.id === expandedOperationCardId) || null,
    [operationCards, expandedOperationCardId]
  )

  useEffect(() => {
    setOpenOperationAssigneePickerId('')
    setOpenOperationSubtaskAssigneePickerId('')
  }, [expandedOperationCardId])
  const connectedClientsCount = useMemo(
    () => dashboardEligibleClients.filter((client) => Boolean(client.metaAdAccountId)).length,
    [dashboardEligibleClients]
  )
  const filteredAdAccountBalanceRows = useMemo(() => {
    const query = adAccountBalanceSearch.trim().toLowerCase()

    return adAccountBalanceRows.filter((row) => {
      const matchesSearch = !query || [row.clientName, row.accountName, row.accountId, row.cardLabel, row.billingTypeLabel]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
      const matchesBilling = adAccountBalanceBillingFilter === 'all'
        ? true
        : row.billingType === adAccountBalanceBillingFilter
      const matchesCard = adAccountBalanceCardFilter === 'all'
        ? true
        : adAccountBalanceCardFilter === 'with_card'
          ? row.hasCard
          : !row.hasCard
      const balance = Number(row.fundsAvailable)
      const matchesBalance = adAccountBalanceValueFilter === 'all'
        ? true
        : adAccountBalanceValueFilter === 'critical'
          ? Number.isFinite(balance) && balance < 100
          : adAccountBalanceValueFilter === 'attention'
            ? Number.isFinite(balance) && balance >= 100 && balance <= 200
            : adAccountBalanceValueFilter === 'healthy'
              ? Number.isFinite(balance) && balance > 200
              : true
      const pending = Number(row.pendingAmount || 0)
      const matchesDebt = adAccountBalanceDebtFilter === 'all'
        ? true
        : adAccountBalanceDebtFilter === 'with_debt'
          ? pending > 0
          : pending <= 0

      return matchesSearch && matchesBilling && matchesCard && matchesBalance && matchesDebt
    })
  }, [adAccountBalanceRows, adAccountBalanceSearch, adAccountBalanceBillingFilter, adAccountBalanceCardFilter, adAccountBalanceValueFilter, adAccountBalanceDebtFilter])
  const adAccountBalanceSummary = useMemo(() => {
    const configuredRows = adAccountBalanceRows.filter((row) => row.accountId)
    const prepaidRows = configuredRows.filter((row) => row.billingType === 'prepaid')
    const postpaidRows = configuredRows.filter((row) => row.billingType === 'postpaid')
    const critical = prepaidRows.filter((row) => Number(row.fundsAvailable) < 100).length
    const attention = prepaidRows.filter((row) => Number(row.fundsAvailable) >= 100 && Number(row.fundsAvailable) <= 200).length
    const healthy = prepaidRows.filter((row) => Number(row.fundsAvailable) > 200).length
    const withCard = configuredRows.filter((row) => row.hasCard).length
    const pendingAmount = configuredRows.reduce((sum, row) => sum + Number(row.pendingAmount || 0), 0)

    return {
      configured: configuredRows.length,
      prepaid: prepaidRows.length,
      postpaid: postpaidRows.length,
      critical,
      attention,
      healthy,
      withCard,
      pendingAmount,
    }
  }, [adAccountBalanceRows])
  const brandedClientsCount = useMemo(
    () => clients.filter((client) => Boolean(client.logoUrl)).length,
    [clients]
  )
  const averageClientHealthScore = useMemo(() => {
    const scores = clients
      .map((client) => calculateClientHealthScore(client))
      .filter((value) => Number.isFinite(value))

    if (!scores.length) return 0
    return Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
  }, [clients])
  const healthRiskClientsCount = useMemo(
    () => clients.filter((client) => {
      const score = calculateClientHealthScore(client)
      return score != null && score < 60
    }).length,
    [clients]
  )
  const averageClientCompleteness = useMemo(() => {
    const scores = clients
      .map((client) => getClientCompleteness(client))
      .filter((value) => Number.isFinite(value))

    if (!scores.length) return 0
    return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
  }, [clients, getClientCompleteness])
  const incompleteClientsCount = useMemo(
    () =>
      clients.filter((client) => {
        const score = getClientCompleteness(client)
        return score != null && score < 60
      }).length,
    [clients, getClientCompleteness]
  )
  const contextDashboardSummary = useMemo(() => {
    if (!clients.length) return null

    const currentPortfolioClients = clients.filter((client) => normalizeClientStatus(client) !== 'churn')
    const activeClients = clients.filter((client) => normalizeClientStatus(client) === 'ativo')
    const onboardingClients = clients.filter((client) => normalizeClientStatus(client) === 'onboarding')
    const pausedClients = clients.filter((client) => normalizeClientStatus(client) === 'pausado')
    const riskClients = clients.filter((client) => normalizeClientStatus(client) === 'risco')
    const churnedClients = clients.filter((client) => normalizeClientStatus(client) === 'churn')

    const sumNumbers = (list, resolver) =>
      list.reduce((sum, item) => {
        const value = resolver(item)
        return sum + (Number.isFinite(value) ? value : 0)
      }, 0)

    const getAverage = (values) => {
      const validValues = values.filter((value) => Number.isFinite(value))
      if (!validValues.length) return null
      return validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    }

    const totalFee = sumNumbers(currentPortfolioClients, (client) => parseClientNumber(client.fee))
    const totalMediaInvestment = sumNumbers(currentPortfolioClients, (client) => parseClientNumber(client.mediaInvestment))
    const averageLtv = getAverage(currentPortfolioClients.map((client) => parseClientNumber(client.ltv)))
    const averageRoi = getAverage(currentPortfolioClients.map((client) => parseClientNumber(client.roiMarketing)))
    const averageMmf = getAverage(currentPortfolioClients.map((client) => parseClientNumber(client.mmf)))
    const averageHealth = getAverage(currentPortfolioClients.map((client) => calculateClientHealthScore(client)))
    const averageFee = getAverage(currentPortfolioClients.map((client) => parseClientNumber(client.fee)))
    const retentionRate = clients.length ? ((clients.length - churnedClients.length) / clients.length) * 100 : null

    const healthRanking = currentPortfolioClients
      .map((client) => {
        const healthScore = calculateClientHealthScore(client)
        const flaggedItems = CLIENT_HEALTH_FLAG_FIELDS.map((field) => ({
          label: field.label,
          meta: getClientFlagMeta(client?.[field.name]),
        }))
        const riskFlags = flaggedItems.filter((item) => item.meta.tone === 'danger')
        const attentionFlags = flaggedItems.filter((item) => item.meta.tone === 'warning')

        return {
          client,
          healthScore,
          riskCount: riskFlags.length,
          attentionCount: attentionFlags.length,
          topFlags: [...riskFlags, ...attentionFlags].slice(0, 3),
        }
      })
      .sort((left, right) => {
        if (right.riskCount !== left.riskCount) return right.riskCount - left.riskCount
        if (right.attentionCount !== left.attentionCount) return right.attentionCount - left.attentionCount
        if ((left.healthScore ?? -1) !== (right.healthScore ?? -1)) return (left.healthScore ?? -1) - (right.healthScore ?? -1)
        return left.client.name.localeCompare(right.client.name)
      })

    const portfolioRiskCount = healthRanking.filter((item) => item.riskCount > 0 || (item.healthScore != null && item.healthScore < 60)).length

    const churnByMonth = Object.entries(
      churnedClients.reduce((accumulator, client) => {
        const bucketKey = getMonthBucketKey(client.churnDate)
        if (!bucketKey) return accumulator
        if (!accumulator[bucketKey]) {
          accumulator[bucketKey] = []
        }
        accumulator[bucketKey].push(client)
        return accumulator
      }, {})
    )
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([bucketKey, bucketClients]) => ({
        key: bucketKey,
        label: formatMonthBucketLabel(bucketKey),
        count: bucketClients.length,
        clients: bucketClients,
      }))

    const churnByCohort = Object.entries(
      churnedClients.reduce((accumulator, client) => {
        const bucketKey = getMonthBucketKey(client.contractSignedAt)
        if (!bucketKey) return accumulator
        if (!accumulator[bucketKey]) {
          accumulator[bucketKey] = []
        }
        accumulator[bucketKey].push(client)
        return accumulator
      }, {})
    )
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(([bucketKey, bucketClients]) => ({
        key: bucketKey,
        label: formatMonthBucketLabel(bucketKey),
        count: bucketClients.length,
        clients: bucketClients,
      }))

    const currentMonthKey = getMonthBucketKey(getTodayDateInputValue())
    const churnThisMonth = churnByMonth.find((item) => item.key === currentMonthKey)?.count || 0

    const flagSummary = CLIENT_HEALTH_FLAG_FIELDS
      .map((field) => {
        const riskCount = currentPortfolioClients.filter((client) => getClientFlagMeta(client?.[field.name]).tone === 'danger').length
        const attentionCount = currentPortfolioClients.filter((client) => getClientFlagMeta(client?.[field.name]).tone === 'warning').length
        const okCount = currentPortfolioClients.filter((client) => getClientFlagMeta(client?.[field.name]).tone === 'success').length

        return {
          label: field.label,
          riskCount,
          attentionCount,
          okCount,
        }
      })
      .sort((left, right) => {
        if (right.riskCount !== left.riskCount) return right.riskCount - left.riskCount
        if (right.attentionCount !== left.attentionCount) return right.attentionCount - left.attentionCount
        return left.label.localeCompare(right.label)
      })

    const insights = [
      buildContextInsight(
        churnThisMonth > 0 ? 'warning' : 'success',
        churnThisMonth > 0 ? 'Houve churn no mês' : 'Sem churn neste mês',
        churnThisMonth > 0
          ? `${formatNumber(churnThisMonth)} cliente(s) foram marcados como churn no mês atual. Vale revisar a causa e a safra de origem.`
          : 'A carteira passou o mês sem churn registrado até aqui.'
      ),
      buildContextInsight(
        portfolioRiskCount > 0 ? 'warning' : 'success',
        portfolioRiskCount > 0 ? 'Carteira com contas em atenção' : 'Carteira com risco sob controle',
        portfolioRiskCount > 0
          ? `${formatNumber(portfolioRiskCount)} cliente(s) aparecem com health score baixo ou flags críticas e pedem plano de ação.`
          : 'Nenhum cliente atual apareceu com combinação crítica de flags no recorte atual.'
      ),
      buildContextInsight(
        averageRoi != null && averageRoi >= 3 ? 'success' : averageRoi != null ? 'warning' : 'neutral',
        averageRoi != null ? 'Eficiência média da carteira' : 'ROI médio ainda incompleto',
        averageRoi != null
          ? `O ROI médio da carteira está em ${formatDecimal(averageRoi, 2)} e ajuda a comparar eficiência entre contas ativas.`
          : 'Preencha faturamento e investimento em mídia dos clientes para liberar a leitura média de ROI.'
      ),
      buildContextInsight(
        averageHealth != null && averageHealth >= 75 ? 'success' : averageHealth != null ? 'warning' : 'neutral',
        averageHealth != null ? 'Saúde operacional consolidada' : 'Health score médio ainda parcial',
        averageHealth != null
          ? `O health score médio da carteira está em ${Math.round(averageHealth)}%, refletindo o estado operacional geral da base.`
          : 'Ainda faltam flags suficientes para consolidar a leitura média de saúde da carteira.'
      ),
    ]

    return {
      portfolioClients: currentPortfolioClients,
      totalClients: clients.length,
      totalFee,
      totalMediaInvestment,
      averageLtv,
      averageRoi,
      averageMmf,
      averageHealth,
      averageFee,
      retentionRate,
      activeClientsCount: activeClients.length,
      onboardingClientsCount: onboardingClients.length,
      pausedClientsCount: pausedClients.length,
      riskClientsCount: riskClients.length,
      churnClientsCount: churnedClients.length,
      churnThisMonth,
      portfolioRiskCount,
      insights,
      churnByMonth,
      churnByCohort,
      healthRanking,
      flagSummary,
      churnedClients: churnedClients
        .slice()
        .sort((left, right) => String(right.churnDate || '').localeCompare(String(left.churnDate || ''))),
    }
  }, [clients])
  const mondayBoardsConfigured = useMemo(
    () =>
      Array.from(new Set(
        String(globalIntegrations.mondayBoardIds || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )).length,
    [globalIntegrations.mondayBoardIds]
  )
  const clickUpListsConfigured = useMemo(
    () =>
      Array.from(new Set(
        String(globalIntegrations.clickUpListIds || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )).length,
    [globalIntegrations.clickUpListIds]
  )
  const homeToolsMenuItems = useMemo(() => {
    const items = [
      { key: 'apresentacao', label: 'Pitch Deck', helper: activeClient ? activeClient.name : 'Leitura executiva', onClick: () => setActiveTab('apresentacao') },
    ]

    if (canManageClients) {
      items.splice(2, 0, { key: 'clientes', label: 'Clientes', helper: `${formatNumber(clients.length)} na base`, onClick: () => setActiveTab('clientes') })
    }

    if (canAccessTeamTab) {
      items.push({ key: 'usuarios', label: 'Time', helper: canManageUsers ? `${formatNumber(usersList.length || 0)} pessoas` : 'Seu hub interno', onClick: () => setActiveTab('usuarios') })
    }

    return items
  }, [activeClient, canManageClients, canManageUsers, canAccessTeamTab, clients.length, usersList.length])
  const activeIntegrations = activeClient?.integrations || DEFAULT_INTEGRATIONS
  const activeCrmProvider = activeClientUsesManualCrm
    ? 'manual'
    : String(activeClient?.crmProvider || '').trim().toLowerCase() === 'agendor' || String(activeIntegrations.agendorToken || '').trim()
      ? 'agendor'
      : 'rd_station'
  const activeCrmToken = activeCrmProvider === 'agendor'
    ? String(activeIntegrations.agendorToken || '').trim()
    : String(activeIntegrations.rdStationToken || '').trim()
  const selectedAgendorPipelineIds = useMemo(
    () => normalizeIntegrationList(activeClient?.agendorPipelineIds || activeClient?.agendorAccountId || activeClient?.rdPipelineId),
    [activeClient?.agendorPipelineIds, activeClient?.agendorAccountId, activeClient?.rdPipelineId]
  )
  const selectedAgendorStageNames = useMemo(
    () => normalizeIntegrationList(activeClient?.agendorQualifiedStages || activeClient?.rdQualifiedStages),
    [activeClient?.agendorQualifiedStages, activeClient?.rdQualifiedStages]
  )
  const visibleAgendorStageOptions = useMemo(
    () => agendorStageOptions.filter((stage) => !selectedAgendorPipelineIds.length || selectedAgendorPipelineIds.includes(stage.pipelineId || '')),
    [agendorStageOptions, selectedAgendorPipelineIds]
  )
  const selectedAgendorPipelineLabels = useMemo(() => {
    const savedNames = normalizeIntegrationList(activeClient?.agendorPipelineNames)
    return selectedAgendorPipelineIds.map((id, index) => {
      const option = agendorPipelineOptions.find((pipeline) => pipeline.id === id)
      return option?.label || option?.name || savedNames[index] || id
    })
  }, [activeClient?.agendorPipelineNames, agendorPipelineOptions, selectedAgendorPipelineIds])
  const activeClientVisibleIntegrations = useMemo(
    () => normalizeClientDashboardIntegrationKeys(activeClient?.dashboardVisibleIntegrationKeys),
    [activeClient?.dashboardVisibleIntegrationKeys]
  )
  const activeClientVisibleIntegrationsSet = useMemo(
    () => new Set(activeClientVisibleIntegrations),
    [activeClientVisibleIntegrations]
  )
  const isActiveClientDashboardEnabled = activeClient?.dashboardEnabled !== false
  const selectedAdAccount = activeClient?.metaAdAccountId || ''
  const selectedGoogleAdsAccount = activeClient?.googleAdsAccountId || ''
  const normalizedAiIntegrations = useMemo(
    () => normalizeAiSettings(globalIntegrations),
    [globalIntegrations]
  )
  const isAiInsightsConfigured = Boolean(
    normalizedAiIntegrations.aiAnalysisEnabled &&
    String(normalizedAiIntegrations.aiApiKey || '').trim() &&
    String(normalizedAiIntegrations.aiModel || '').trim() &&
    String(normalizedAiIntegrations.aiBaseUrl || '').trim()
  )
  const aiInsightGroups = useMemo(() => {
    const items = Array.isArray(aiInsightsResult?.structured?.insights) ? aiInsightsResult.structured.insights : []

    return [
      {
        key: 'opportunity',
        title: 'Oportunidades',
        items: items.filter((item) => String(item.type || '').trim().toLowerCase() === 'opportunity'),
      },
      {
        key: 'win',
        title: 'Destaques',
        items: items.filter((item) => String(item.type || '').trim().toLowerCase() === 'win'),
      },
      {
        key: 'alert',
        title: 'Alertas',
        items: items.filter((item) => String(item.type || '').trim().toLowerCase() === 'alert'),
      },
      {
        key: 'anomaly',
        title: 'Anomalias',
        items: items.filter((item) => String(item.type || '').trim().toLowerCase() === 'anomaly'),
      },
      {
        key: 'insight',
        title: 'Leituras gerais',
        items: items.filter((item) => !['opportunity', 'win', 'alert', 'anomaly'].includes(String(item.type || '').trim().toLowerCase())),
      },
    ].filter((group) => group.items.length > 0)
  }, [aiInsightsResult])
  const totalAiInsights = useMemo(
    () => aiInsightGroups.reduce((total, group) => total + group.items.length, 0),
    [aiInsightGroups]
  )
  const aiStructuredHeadline = !looksLikeJsonBlock(aiInsightsResult?.structured?.headline)
    ? aiInsightsResult?.structured?.headline || 'Insight gerado'
    : 'Leitura processada'
  const aiStructuredSummary = !looksLikeJsonBlock(aiInsightsResult?.structured?.summary)
    ? aiInsightsResult?.structured?.summary || ''
    : ''
  const aiHasStructuredInsights = aiInsightGroups.length > 0
  const aiHasNextActions = Array.isArray(aiInsightsResult?.structured?.nextActions) && aiInsightsResult.structured.nextActions.length > 0
  const aiCampaignAnalyses = Array.isArray(aiInsightsResult?.structured?.campaignAnalyses)
    ? aiInsightsResult.structured.campaignAnalyses
    : []
  const aiFocusSummary = useMemo(
    () => aiInsightsResult?.structured?.focusSummary || { positives: [], attention: [], urgency: [] },
    [aiInsightsResult]
  )
  const aiFocusGroups = useMemo(
    () => [
      {
        key: 'positives',
        title: 'Pontos positivos',
        tone: 'positive',
        items: Array.isArray(aiFocusSummary.positives) ? aiFocusSummary.positives : [],
      },
      {
        key: 'attention',
        title: 'Atenção',
        tone: 'attention',
        items: Array.isArray(aiFocusSummary.attention) ? aiFocusSummary.attention : [],
      },
      {
        key: 'urgency',
        title: 'Urgência',
        tone: 'urgent',
        items: Array.isArray(aiFocusSummary.urgency) ? aiFocusSummary.urgency : [],
      },
    ].filter((group) => group.items.length > 0),
    [aiFocusSummary]
  )
  const aiHasStructuredResponse = aiHasStructuredInsights || aiHasNextActions || aiCampaignAnalyses.length > 0 || aiFocusGroups.length > 0
  const aiFallbackTakeaways = useMemo(() => {
    const source = String(aiStructuredSummary || aiInsightsResult?.rawText || '').replace(/\s+/g, ' ').trim()
    if (!source) return []

    return source
      .split(/(?:\.\s+|\!\s+|\?\s+|;\s+)/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((item, index) => ({
        title: index === 0 ? 'Diagnóstico central' : `Leitura ${index + 1}`,
        text: /[.!?]$/.test(item) ? item : `${item}.`,
      }))
  }, [aiStructuredSummary, aiInsightsResult])
  const selectedQualifiedStages = useMemo(
    () => activeCrmProvider === 'agendor'
      ? normalizeIntegrationList(activeClient?.agendorQualifiedStages || activeClient?.rdQualifiedStages)
      : normalizeIntegrationList(activeClient?.rdQualifiedStages),
    [activeCrmProvider, activeClient?.agendorQualifiedStages, activeClient?.rdQualifiedStages]
  )
  const crmSourceLabel = activeClient?.crmProvider === 'agendor'
    ? 'Agendor CRM'
    : activeClient?.crmProvider === 'manual'
      ? 'CRM manual'
      : 'RD Station CRM'
  const activeClientDashboardRgb = useMemo(
    () => parseDashboardColor(activeClient?.dashboardColor || themeColor || 'blue') || hexToRgb(THEMES.blue.main),
    [activeClient?.dashboardColor, themeColor]
  )
  const activeClientDashboardAccentRgb = useMemo(
    () => parseDashboardColor(activeClient?.dashboardAccentColor || activeClient?.dashboardComplementaryColor || 'orange') || hexToRgb(THEMES.orange.main),
    [activeClient?.dashboardAccentColor, activeClient?.dashboardComplementaryColor]
  )
  const currentMetaResultWindow = useMemo(
    () => resolveDateWindow(dateRange, customSince, customUntil, { excludeTodayForLast30d: dateRange === 'last_30d' }),
    [dateRange, customSince, customUntil]
  )
  const activeClientDashboardHex = useMemo(
    () => rgbToHex(activeClientDashboardRgb),
    [activeClientDashboardRgb]
  )
  const weeklyBaseVisibleRecords = useMemo(() => {
    return weeklyRecords.filter((record) => {
      const matchesClient = weeklyClientFilter === 'all' || record.clientId === weeklyClientFilter
      return matchesClient
    })
  }, [weeklyRecords, weeklyClientFilter])

  const weeklyFilledWeekOptions = useMemo(() => {
    const weeksByStart = new Map()

    weeklyBaseVisibleRecords.forEach((record) => {
      const weekStart = String(record.weekStart || '').trim()
      if (!weekStart) return
      const current = weeksByStart.get(weekStart)
      if (!current) {
        weeksByStart.set(weekStart, {
          value: weekStart,
          weekEnd: record.weekEnd || getWeekEndDateInputValue(weekStart),
          recordsCount: 1,
        })
        return
      }
      current.recordsCount += 1
      if (!current.weekEnd && record.weekEnd) current.weekEnd = record.weekEnd
    })

    return Array.from(weeksByStart.values())
      .sort((left, right) => String(right.value).localeCompare(String(left.value)))
      .map((week) => ({
        ...week,
        label: `${formatWeekRangeLabel(week.value, week.weekEnd)} • ${formatNumber(week.recordsCount)} registro(s)`,
      }))
  }, [weeklyBaseVisibleRecords])

  useEffect(() => {
    if (!weeklyFilledWeekOptions.length) {
      if (weeklyFilledWeekStart) setWeeklyFilledWeekStart('')
      return
    }

    const hasSelectedWeek = weeklyFilledWeekStart === ALL_FILLED_WEEK_PERIODS || weeklyFilledWeekOptions.some((option) => option.value === weeklyFilledWeekStart)
    if (!hasSelectedWeek) {
      setWeeklyFilledWeekStart(weeklyFilledWeekOptions[0].value)
    }
  }, [weeklyFilledWeekOptions, weeklyFilledWeekStart])

  const latestWeeklyHealthByClientId = useMemo(() => {
    const latestByClient = new Map()

    weeklyRecords.forEach((record) => {
      if (!record?.clientId) return
      const current = latestByClient.get(record.clientId)
      const currentWeek = String(current?.weekStart || '')
      const nextWeek = String(record.weekStart || '')
      const isNewerWeek = nextWeek.localeCompare(currentWeek) > 0
      const isSameWeekNewerRecord = nextWeek === currentWeek && String(record.updatedAt || record.createdAt || record.id || '').localeCompare(String(current?.updatedAt || current?.createdAt || current?.id || '')) > 0

      if (!current || isNewerWeek || isSameWeekNewerRecord) {
        latestByClient.set(record.clientId, record)
      }
    })

    return latestByClient
  }, [weeklyRecords])

  const filteredAdsOverviewRows = useMemo(() => {
    const query = adsOverviewSearch.trim().toLowerCase()

    return adsOverviewRows
      .map((row) => {
        const client = clientsById.get(row.clientId)
        const manager = operationUsersById.get(client?.resultManagerUserId || row.resultManagerUserId || '')
        return {
          ...row,
          client: client || null,
          clientLogoUrl: client?.logoUrl || row.clientLogoUrl || '',
          resultManagerUserId: client?.resultManagerUserId || row.resultManagerUserId || '',
          resultManagerName: manager?.full_name || manager?.email || row.resultManagerName || 'Sem gestor',
        }
      })
      .filter((row) => !row.client?.isArchived)
      .filter((row) => {
        const matchesManager = adsOverviewManagerFilter === 'all'
          ? true
          : adsOverviewManagerFilter === '__none__'
            ? !row.resultManagerUserId
            : row.resultManagerUserId === adsOverviewManagerFilter
        const matchesSearch = !query || [
          row.clientName,
          row.metaAdAccountId,
          row.resultManagerName,
          ...(row.ads || []).map((ad) => ad.label),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))

        return matchesManager && matchesSearch
      })
      .sort((left, right) => {
        const getClientHealthRank = (row) => {
          const client = row.client || clientsById.get(row.clientId)
          if (String(client?.status || row.clientStatus || '').trim().toLowerCase() === 'churn') return CLIENT_HEALTH_SORT_RANK.churn
          const latestRecord = latestWeeklyHealthByClientId.get(row.clientId)
          return CLIENT_HEALTH_SORT_RANK[latestRecord?.healthStatus] ?? CLIENT_HEALTH_SORT_RANK.empty
        }
        const rankCompare = getClientHealthRank(left) - getClientHealthRank(right)
        if (rankCompare) return rankCompare
        return String(left.clientName || '').localeCompare(String(right.clientName || ''), 'pt-BR')
      })
  }, [adsOverviewRows, adsOverviewSearch, adsOverviewManagerFilter, clientsById, operationUsersById, latestWeeklyHealthByClientId])

  const visibleAdsOverviewClientIds = useMemo(
    () => new Set(filteredAdsOverviewRows.map((row) => row.clientId)),
    [filteredAdsOverviewRows]
  )
  const filteredCampaignOverviewRows = useMemo(() => {
    const query = campaignOverviewSearch.trim().toLowerCase()

    return campaignOverviewRows
      .map((row) => {
        const client = clientsById.get(row.clientId)
        const accentHex = client?.dashboardAccentColor
        const accentRgb = accentHex ? hexToRgb(accentHex) : null
        return {
          ...row,
          client: client || null,
          clientLogoUrl: client?.logoUrl || row.clientLogoUrl || '',
          clientAccentRgb: accentRgb,
        }
      })
      .filter((row) => !row.client?.isArchived)
      .filter((row) => {
        if (!query) return true
        const campaignNames = (row.campaigns || []).flatMap((campaign) => [
          campaign.name,
          ...(campaign.adsets || []).flatMap((adset) => [
            adset.name,
            ...(adset.ads || []).map((ad) => ad.name),
          ]),
        ])

        return [
          row.clientName,
          row.metaAdAccountId,
          ...campaignNames,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
      .sort((left, right) => {
        const getClientHealthRank = (row) => {
          const client = row.client || clientsById.get(row.clientId)
          if (String(client?.status || row.clientStatus || '').trim().toLowerCase() === 'churn') return CLIENT_HEALTH_SORT_RANK.churn
          const latestRecord = latestWeeklyHealthByClientId.get(row.clientId)
          return CLIENT_HEALTH_SORT_RANK[latestRecord?.healthStatus] ?? CLIENT_HEALTH_SORT_RANK.empty
        }
        const rankCompare = getClientHealthRank(left) - getClientHealthRank(right)
        if (rankCompare) return rankCompare
        return String(left.clientName || '').localeCompare(String(right.clientName || ''), 'pt-BR')
      })
  }, [campaignOverviewRows, campaignOverviewSearch, clientsById, latestWeeklyHealthByClientId])
  const handleToggleAdsOverviewClient = useCallback((clientId) => {
    setAdsOverviewExpandedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((item) => item !== clientId)
        : [...current, clientId]
    )
  }, [])
  const handleToggleCampaignOverviewClient = useCallback((clientId) => {
    setCampaignOverviewExpandedClientIds((current) =>
      current.includes(clientId)
        ? current.filter((item) => item !== clientId)
        : [...current, clientId]
    )
  }, [])
  const handleToggleCampaignOverviewCampaign = useCallback((campaignKey) => {
    setCampaignOverviewExpandedCampaignIds((current) =>
      current.includes(campaignKey)
        ? current.filter((item) => item !== campaignKey)
        : [...current, campaignKey]
    )
  }, [])
  const handleToggleCampaignOverviewAdset = useCallback((adsetKey) => {
    setCampaignOverviewExpandedAdsetIds((current) =>
      current.includes(adsetKey)
        ? current.filter((item) => item !== adsetKey)
        : [...current, adsetKey]
    )
  }, [])

  useEffect(() => {
    setAdsOverviewExpandedClientIds((current) => current.filter((clientId) => visibleAdsOverviewClientIds.has(clientId)))
  }, [visibleAdsOverviewClientIds])

  const weeklyVisibleRecords = useMemo(() => {
    if (weeklyPeriodPreset === 'filled') {
      if (!weeklyFilledWeekStart) return []
      if (weeklyFilledWeekStart === ALL_FILLED_WEEK_PERIODS) return weeklyBaseVisibleRecords
      return weeklyBaseVisibleRecords.filter((record) => String(record.weekStart || '') === weeklyFilledWeekStart)
    }

    const recordsInsideWindow = weeklyBaseVisibleRecords.filter((record) => isWeeklyRecordInsideWindow(record, weeklyPeriodWindow))
    if (weeklyPeriodPreset !== 'month') return recordsInsideWindow

    const latestMonthWeekStart = recordsInsideWindow.reduce((latest, record) => {
      const weekStart = String(record.weekStart || '')
      if (!weekStart.startsWith(weeklyPeriodWindow.monthKey || '')) return latest
      return weekStart.localeCompare(latest) > 0 ? weekStart : latest
    }, '')

    if (!latestMonthWeekStart) return []
    return recordsInsideWindow.filter((record) => String(record.weekStart || '') === latestMonthWeekStart)
  }, [weeklyBaseVisibleRecords, weeklyPeriodPreset, weeklyPeriodWindow, weeklyFilledWeekStart])

  const weeklyCurrentInvestment = normalizeWeeklyNumber(weeklyForm.investment)
  const weeklyCurrentLeads = normalizeWeeklyInteger(weeklyForm.leads)
  const weeklyCurrentSql = normalizeWeeklyInteger(weeklyForm.sql)
  const weeklyCurrentCpl = weeklyCurrentLeads > 0 ? weeklyCurrentInvestment / weeklyCurrentLeads : 0
  const weeklyCurrentCostPerSql = weeklyCurrentSql > 0 ? weeklyCurrentInvestment / weeklyCurrentSql : 0

  const weeklyPrevWeekStart = useMemo(() => {
    if (!weeklyWeekStart) return ''
    const d = new Date(weeklyWeekStart + 'T00:00:00')
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  }, [weeklyWeekStart])

  const weeklyPrevRecord = useMemo(() => {
    if (!weeklyForm.clientId || !weeklyPrevWeekStart) return null
    return weeklyRecords.find((r) => r.clientId === weeklyForm.clientId && r.weekStart === weeklyPrevWeekStart) || null
  }, [weeklyRecords, weeklyForm.clientId, weeklyPrevWeekStart])

  const weeklyHealthRiskTarget = Number.isFinite(Number(operationSettings?.healthRiskTargetPercent))
    ? Math.min(100, Math.max(0, Number(operationSettings.healthRiskTargetPercent)))
    : 20
  const summarizeWeeklyRecords = useCallback((records) => {
    const totals = records.reduce((acc, record) => {
      const health = WEEKLY_HEALTH_BY_KEY[record.healthStatus]
      acc.investment += Number(record.investment || 0)
      acc.leads += Number(record.leads || 0)
      acc.sql += Number(record.sql || 0)
      if (record.healthStatus === 'critical' || record.healthStatus === 'attention') acc.riskCount += 1
      if (health) {
        acc.healthScore += health.score
        acc.healthCount += 1
      }
      return acc
    }, { investment: 0, leads: 0, sql: 0, healthScore: 0, healthCount: 0, riskCount: 0 })

    const averageHealth = totals.healthCount ? totals.healthScore / totals.healthCount : 0
    const riskPercent = totals.healthCount ? (totals.riskCount / totals.healthCount) * 100 : 0
    return {
      ...totals,
      cpl: totals.leads > 0 ? totals.investment / totals.leads : 0,
      costPerSql: totals.sql > 0 ? totals.investment / totals.sql : 0,
      averageHealth,
      averageHealthLabel: getWeeklyHealthAverageLabel(averageHealth),
      riskPercent,
      withinRiskTarget: totals.healthCount ? riskPercent <= weeklyHealthRiskTarget : false,
    }
  }, [weeklyHealthRiskTarget])

  const weeklySummary = useMemo(() => summarizeWeeklyRecords(weeklyVisibleRecords), [summarizeWeeklyRecords, weeklyVisibleRecords])

  const weeklyChartClientRows = useMemo(() => {
    const rowsByClient = new Map()

    weeklyVisibleRecords.forEach((record) => {
      const clientId = String(record.clientId || '').trim()
      if (!clientId) return
      const current = rowsByClient.get(clientId) || {
        clientId,
        clientName: clientsById.get(clientId)?.name || 'Cliente sem nome',
        investment: 0,
        leads: 0,
        sql: 0,
        recordsCount: 0,
      }

      current.investment += Number(record.investment || 0)
      current.leads += Number(record.leads || 0)
      current.sql += Number(record.sql || 0)
      current.recordsCount += 1
      rowsByClient.set(clientId, current)
    })

    return Array.from(rowsByClient.values()).sort((left, right) => String(left.clientName).localeCompare(String(right.clientName), 'pt-BR', { sensitivity: 'base', numeric: true }))
  }, [weeklyVisibleRecords, clientsById])

  useEffect(() => {
    if (weeklyChartClientFilter === 'all') return
    const hasSelectedClient = weeklyChartClientRows.some((row) => row.clientId === weeklyChartClientFilter)
    if (!hasSelectedClient) setWeeklyChartClientFilter('all')
  }, [weeklyChartClientFilter, weeklyChartClientRows])

  const weeklyLineChartRecords = useMemo(() => {
    if (weeklyChartClientFilter === 'all') return weeklyVisibleRecords
    return weeklyVisibleRecords.filter((record) => record.clientId === weeklyChartClientFilter)
  }, [weeklyVisibleRecords, weeklyChartClientFilter])

  const weeklySelectedChartClientName = weeklyChartClientFilter === 'all'
    ? 'Carteira consolidada'
    : weeklyChartClientRows.find((row) => row.clientId === weeklyChartClientFilter)?.clientName || 'Cliente selecionado'

  const weeklyLineChartData = useMemo(() => {
    const byWeek = new Map()
    weeklyLineChartRecords.forEach((record) => {
      const current = byWeek.get(record.weekStart) || { weekStart: record.weekStart, weekEnd: record.weekEnd, investment: 0, leads: 0, sql: 0 }
      current.investment += Number(record.investment || 0)
      current.leads += Number(record.leads || 0)
      current.sql += Number(record.sql || 0)
      byWeek.set(record.weekStart, current)
    })

    const rows = Array.from(byWeek.values()).sort((left, right) => String(left.weekStart).localeCompare(String(right.weekStart)))
    return {
      labels: rows.map((row) => formatWeekRangeLabel(row.weekStart, row.weekEnd)),
      datasets: [
        {
          label: 'Investimento',
          data: rows.map((row) => row.investment),
          borderColor: activeClientDashboardHex,
          backgroundColor: activeClientDashboardHex + '22',
          tension: 0.35,
          fill: true,
          yAxisID: 'money',
        },
        {
          label: 'CPL',
          data: rows.map((row) => row.leads > 0 ? row.investment / row.leads : 0),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          borderDash: [6, 6],
          tension: 0.35,
          yAxisID: 'money',
        },
        {
          label: 'Custo SQL',
          data: rows.map((row) => row.sql > 0 ? row.investment / row.sql : 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          borderDash: [3, 6],
          tension: 0.35,
          yAxisID: 'money',
        },
        {
          label: 'Leads',
          data: rows.map((row) => row.leads),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          tension: 0.35,
          yAxisID: 'volume',
        },
        {
          label: 'SQL',
          data: rows.map((row) => row.sql),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.12)',
          tension: 0.35,
          yAxisID: 'volume',
        },
      ],
    }
  }, [weeklyLineChartRecords, activeClientDashboardHex])

  const weeklyHealthChartData = useMemo(() => {
    const records = weeklyVisibleRecords
    if (weeklyClientFilter !== 'all') {
      const rows = [...weeklyVisibleRecords].sort((left, right) => String(left.weekStart).localeCompare(String(right.weekStart)))
      return {
        labels: rows.map((row) => formatWeekRangeLabel(row.weekStart, row.weekEnd)),
        datasets: [
          {
            label: 'Saúde do cliente',
            data: rows.map((row) => WEEKLY_HEALTH_BY_KEY[row.healthStatus]?.score || 0),
            backgroundColor: rows.map((row) => getWeeklyHealthColor(row.healthStatus)),
            borderColor: rows.map((row) => getWeeklyHealthColor(row.healthStatus)),
            borderWidth: 1,
            borderRadius: 14,
          },
        ],
      }
    }

    const counts = WEEKLY_HEALTH_OPTIONS.map((option) => records.filter((record) => record.healthStatus === option.key).length)
    return {
      labels: WEEKLY_HEALTH_OPTIONS.map((option) => option.label),
      datasets: [
        {
          label: 'Clientes por saúde',
          data: counts,
          backgroundColor: WEEKLY_HEALTH_OPTIONS.map((option) => option.color),
          borderColor: WEEKLY_HEALTH_OPTIONS.map((option) => option.color),
          borderWidth: 1,
          borderRadius: 14,
        },
      ],
    }
  }, [weeklyVisibleRecords, weeklyClientFilter])

  const weeklyChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: isLightAppMode ? '#0f172a' : '#f8fafc',
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => context.dataset.yAxisID === 'money'
            ? `${context.dataset.label}: ${formatCurrency(context.parsed.y || 0)}`
            : `${context.dataset.label}: ${formatNumber(context.parsed.y || 0)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: isLightAppMode ? '#64748b' : '#94a3b8' },
        grid: { color: isLightAppMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.08)' },
      },
      money: {
        type: 'linear',
        position: 'left',
        ticks: { color: isLightAppMode ? '#64748b' : '#94a3b8', callback: (value) => formatCurrency(value) },
        grid: { color: isLightAppMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.08)' },
      },
      volume: {
        type: 'linear',
        position: 'right',
        ticks: { color: isLightAppMode ? '#64748b' : '#94a3b8', precision: 0 },
        grid: { drawOnChartArea: false },
      },
    },
  }), [isLightAppMode])

  const weeklyBarOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => weeklyClientFilter === 'all'
            ? `${context.label}: ${formatNumber(context.parsed.y || 0)} cliente(s)`
            : `${context.label}: ${getWeeklyHealthAverageLabel(context.parsed.y || 0)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: isLightAppMode ? '#64748b' : '#94a3b8' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: weeklyClientFilter === 'all' ? undefined : 4,
        ticks: { color: isLightAppMode ? '#64748b' : '#94a3b8', precision: 0 },
        grid: { color: isLightAppMode ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.08)' },
      },
    },
  }), [isLightAppMode, weeklyClientFilter])

  const weeklyLatestRecords = useMemo(() => {
    return [...weeklyVisibleRecords].sort((left, right) => {
      const dateCompare = String(right.weekStart).localeCompare(String(left.weekStart))
      if (dateCompare) return dateCompare
      const leftClient = clientsById.get(left.clientId)?.name || ''
      const rightClient = clientsById.get(right.clientId)?.name || ''
      return leftClient.localeCompare(rightClient)
    })
  }, [weeklyVisibleRecords, clientsById])

  useEffect(() => {
    if (!selectedWeeklyRecordIds.length) return
    const visibleIds = new Set(weeklyLatestRecords.map((record) => record.id))
    setSelectedWeeklyRecordIds((current) => current.filter((id) => visibleIds.has(id)))
  }, [weeklyLatestRecords, selectedWeeklyRecordIds.length])

  const weeklyTableRecords = useMemo(() => {
    const getSortValue = (record) => {
      const clientName = clientsById.get(record.clientId)?.name || 'Cliente removido'
      const health = WEEKLY_HEALTH_BY_KEY[record.healthStatus] || WEEKLY_HEALTH_BY_KEY.attention

      switch (weeklyTableSort.key) {
        case 'date':
          return String(record.weekStart || '')
        case 'client':
          return clientName
        case 'health':
          return health.score ?? 0
        case 'investment':
          return Number(record.investment || 0)
        case 'leads':
          return Number(record.leads || 0)
        case 'cpl':
          return Number(record.leads || 0) > 0 ? Number(record.cpl || 0) : null
        case 'sql':
          return Number(record.sql || 0)
        case 'costPerSql':
          return Number(record.sql || 0) > 0 ? Number(record.costPerSql || 0) : null
        case 'actionPlan':
          return (record.actionItems || []).length ? record.actionItems.join(' | ') : 'Sem plano de ação'
        default:
          return ''
      }
    }

    const compareValues = (leftValue, rightValue) => {
      const leftMissing = leftValue == null || leftValue === ''
      const rightMissing = rightValue == null || rightValue === ''
      if (leftMissing && rightMissing) return 0
      if (leftMissing) return 1
      if (rightMissing) return -1

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return leftValue - rightValue
      }

      return String(leftValue).localeCompare(String(rightValue), 'pt-BR', { sensitivity: 'base', numeric: true })
    }

    return weeklyLatestRecords.filter((record) => {
      const matchesHealth = weeklyTableHealthFilter === 'all' || record.healthStatus === weeklyTableHealthFilter
      return matchesHealth
    }).sort((left, right) => {
      const direction = weeklyTableSort.direction === 'asc' ? 1 : -1
      const primaryCompare = compareValues(getSortValue(left), getSortValue(right)) * direction
      if (primaryCompare) return primaryCompare

      const dateCompare = String(right.weekStart || '').localeCompare(String(left.weekStart || ''))
      if (dateCompare) return dateCompare

      const leftClient = clientsById.get(left.clientId)?.name || ''
      const rightClient = clientsById.get(right.clientId)?.name || ''
      return leftClient.localeCompare(rightClient, 'pt-BR', { sensitivity: 'base', numeric: true })
    })
  }, [weeklyLatestRecords, weeklyTableHealthFilter, weeklyTableSort, clientsById])

  const weeklyTableColumns = useMemo(() => ([
    { key: 'date', label: 'Data', icon: 'bx-calendar' },
    { key: 'client', label: 'Cliente', icon: 'bx-buildings' },
    { key: 'health', label: 'Saúde', icon: 'bx-heart' },
    { key: 'investment', label: 'Investimento', icon: 'bx-wallet' },
    { key: 'leads', label: 'Leads', icon: 'bx-user-plus' },
    { key: 'cpl', label: 'CPL', icon: 'bx-purchase-tag-alt' },
    { key: 'sql', label: 'SQL', icon: 'bx-filter-alt' },
    { key: 'costPerSql', label: 'Custo SQL', icon: 'bx-credit-card' },
    { key: 'actionPlan', label: 'Plano de ação', icon: 'bx-list-check' },
  ]), [])

  const handleWeeklyTableSort = useCallback((key) => {
    setWeeklyTableSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const weeklyHistoryCards = useMemo(() => {
    const byWeek = new Map()
    weeklyLatestRecords.forEach((record) => {
      const key = record.weekStart || record.id
      const current = byWeek.get(key) || {
        weekStart: record.weekStart,
        weekEnd: record.weekEnd,
        investment: 0,
        leads: 0,
        sql: 0,
        records: [],
        clientIds: new Set(),
      }
      current.investment += Number(record.investment || 0)
      current.leads += Number(record.leads || 0)
      current.sql += Number(record.sql || 0)
      current.records.push(record)
      if (record.clientId) current.clientIds.add(record.clientId)
      byWeek.set(key, current)
    })

    const currentWeekStart = parseLocalDateInput(getMondayDateInputValue())
    return Array.from(byWeek.values()).map((group) => {
      const weekStartDate = parseLocalDateInput(group.weekStart)
      const weeksAgo = currentWeekStart && weekStartDate
        ? Math.max(0, Math.round((currentWeekStart.getTime() - weekStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
        : null
      return {
        ...group,
        id: group.weekStart || `week-${group.records.map((record) => record.id).join('-')}`,
        recordIds: group.records.map((record) => record.id),
        clientsCount: group.clientIds.size,
        cpl: group.leads > 0 ? group.investment / group.leads : 0,
        costPerSql: group.sql > 0 ? group.investment / group.sql : 0,
        relativeLabel: weeksAgo === null
          ? 'Semana registrada'
          : weeksAgo === 0
            ? 'Semana atual'
            : weeksAgo === 1
              ? 'Semana anterior'
              : `Há ${weeksAgo} semanas`,
      }
    }).sort((left, right) => String(right.weekStart).localeCompare(String(left.weekStart)))
  }, [weeklyLatestRecords])

  const weeklyPortfolioStats = useMemo(() => {
    const uniqueClientIds = new Set()
    const activeBaseClientsCount = clients.filter((client) => String(client?.status || '').trim().toLowerCase() !== 'churn').length
    const healthCounts = {
      integration: 0,
      critical: 0,
      attention: 0,
      healthy: 0,
      with_result: 0,
      churn: 0,
    }

    weeklyVisibleRecords.forEach((record) => {
      if (record.clientId) uniqueClientIds.add(record.clientId)
      if (healthCounts[record.healthStatus] != null) healthCounts[record.healthStatus] += 1
    })

    // Churn rate: unique clients with churn status in filtered period / total unique clients in filtered period
    const churnClientIds = new Set()
    const allPeriodClientIds = new Set()
    weeklyVisibleRecords.forEach((record) => {
      if (record.clientId) allPeriodClientIds.add(record.clientId)
      if (record.healthStatus === 'churn' && record.clientId) churnClientIds.add(record.clientId)
    })
    const churnedThisMonthCount = churnClientIds.size
    const totalPeriodClients = allPeriodClientIds.size || activeBaseClientsCount
    const monthlyChurnRate = totalPeriodClients > 0
      ? (churnedThisMonthCount / totalPeriodClients) * 100
      : null

    return {
      recordsCount: weeklyVisibleRecords.length,
      monitoredClients: uniqueClientIds.size,
      activeBaseClientsCount,
      healthCounts,
      criticalCount: healthCounts.critical,
      attentionCount: healthCounts.attention,
      healthyCount: healthCounts.healthy,
      withResultCount: healthCounts.with_result,
      integrationCount: healthCounts.integration,
      churnCount: healthCounts.churn,
      churnedThisMonthCount,
      churnClientIdsList: Array.from(churnClientIds),
      activeAtStartOfMonth: totalPeriodClients,
      monthlyChurnRate,
      latestWeekLabel: weeklyHistoryCards[0]
        ? formatWeekRangeLabel(weeklyHistoryCards[0].weekStart, weeklyHistoryCards[0].weekEnd)
        : 'Sem semanas registradas',
    }
  }, [clients, weeklyVisibleRecords, weeklyHistoryCards])

  const handleToggleWeeklyHistoryCardSelection = useCallback((recordIds) => {
    setSelectedWeeklyRecordIds((current) => {
      const ids = recordIds.filter(Boolean)
      const allSelected = ids.length > 0 && ids.every((id) => current.includes(id))
      if (allSelected) return current.filter((id) => !ids.includes(id))
      return Array.from(new Set([...current, ...ids]))
    })
  }, [])

  const weeklyTableExportRows = useMemo(() => {
    return weeklyTableRecords.map((record) => {
      const client = clientsById.get(record.clientId)
      const health = WEEKLY_HEALTH_BY_KEY[record.healthStatus] || WEEKLY_HEALTH_BY_KEY.attention
      return {
        Data: formatWeekRangeLabel(record.weekStart, record.weekEnd),
        Cliente: client?.name || 'Cliente removido',
        Saúde: health.label,
        Investimento: formatCurrency(record.investment || 0),
        Leads: formatNumber(record.leads || 0),
        CPL: record.leads > 0 ? formatCurrency(record.cpl || 0) : '-',
        SQL: formatNumber(record.sql || 0),
        'Custo SQL': record.sql > 0 ? formatCurrency(record.costPerSql || 0) : '-',
        'Plano de ação': (record.actionItems || []).length ? record.actionItems.join(' | ') : 'Sem plano de ação',
      }
    })
  }, [weeklyTableRecords, clientsById])

  const weeklyTableExportFileName = useMemo(() => {
    const clientName = weeklyClientFilter === 'all'
      ? 'todos-clientes'
      : clientsById.get(weeklyClientFilter)?.name || 'cliente'
    const periodName = weeklyPeriodWindow.label || 'periodo'
    const normalize = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'exportacao'
    return `controle-operacao-${normalize(clientName)}-${normalize(periodName)}`
  }, [weeklyClientFilter, clientsById, weeklyPeriodWindow.label])

  const handleExportWeeklyTable = useCallback(async (format) => {
    if (!weeklyTableExportRows.length) {
      window.alert('Nenhum registro encontrado para exportar com os filtros atuais.')
      return
    }

    const columns = ['Data', 'Cliente', 'Saúde', 'Investimento', 'Leads', 'CPL', 'SQL', 'Custo SQL', 'Plano de ação']

    if (format === 'csv') {
      const escapeCsvCell = (value) => {
        const text = String(value ?? '')
        const escaped = text.replace(/"/g, '""')
        return /[";\n\r]/.test(escaped) ? `"${escaped}"` : escaped
      }
      const csv = '\ufeff' + [
        columns.join(';'),
        ...weeklyTableExportRows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(';')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${weeklyTableExportFileName}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      return
    }

    try {
      const jsPdfModule = await import('jspdf')
      const JsPDF = jsPdfModule.default || jsPdfModule.jsPDF
      const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 32
      const accent = activeClientDashboardHex || '#10b981'
      const tableColumns = [
        { key: 'Data', label: 'Data', width: 86 },
        { key: 'Cliente', label: 'Cliente', width: 110 },
        { key: 'Saúde', label: 'Saúde', width: 82 },
        { key: 'Investimento', label: 'Investimento', width: 82 },
        { key: 'Leads', label: 'Leads', width: 46 },
        { key: 'CPL', label: 'CPL', width: 66 },
        { key: 'SQL', label: 'SQL', width: 42 },
        { key: 'Custo SQL', label: 'Custo SQL', width: 72 },
        { key: 'Plano de ação', label: 'Plano de ação', width: 190 },
      ]
      const rowHeight = 42
      let cursorY = 52

      const drawTitle = () => {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(18)
        pdf.setTextColor('#0f172a')
        pdf.text('Tabela de acompanhamento', margin, cursorY)
        cursorY += 22
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(10)
        pdf.setTextColor('#64748b')
        pdf.text(`Controle da Operação • ${weeklyPeriodWindow.label || 'Período selecionado'}`, margin, cursorY)
        cursorY += 28
      }

      const drawHeader = () => {
        let x = margin
        pdf.setFillColor(accent)
        pdf.roundedRect(margin, cursorY, pageWidth - margin * 2, 28, 8, 8, 'F')
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor('#ffffff')
        tableColumns.forEach((column) => {
          pdf.text(column.label.toUpperCase(), x + 6, cursorY + 18)
          x += column.width
        })
        cursorY += 30
      }

      drawTitle()
      drawHeader()

      weeklyTableExportRows.forEach((row, rowIndex) => {
        if (cursorY + rowHeight > pageHeight - margin) {
          pdf.addPage('a4', 'landscape')
          cursorY = 44
          drawHeader()
        }

        let x = margin
        pdf.setFillColor(rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff')
        pdf.roundedRect(margin, cursorY, pageWidth - margin * 2, rowHeight, 6, 6, 'F')
        pdf.setDrawColor('#e2e8f0')
        pdf.line(margin, cursorY + rowHeight, pageWidth - margin, cursorY + rowHeight)
        tableColumns.forEach((column) => {
          const value = String(row[column.key] ?? '-')
          const lines = pdf.splitTextToSize(value, column.width - 12).slice(0, column.key === 'Plano de ação' ? 2 : 1)
          pdf.setFont('helvetica', column.key === 'Cliente' ? 'bold' : 'normal')
          pdf.setFontSize(8.5)
          pdf.setTextColor(column.key === 'Saúde' ? accent : '#0f172a')
          pdf.text(lines, x + 6, cursorY + 15)
          x += column.width
        })
        cursorY += rowHeight
      })

      pdf.save(`${weeklyTableExportFileName}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar tabela semanal em PDF', error)
      window.alert('Não consegui gerar o PDF agora. Tente exportar como CSV ou recarregar a página.')
    }
  }, [weeklyTableExportRows, weeklyTableExportFileName, weeklyPeriodWindow.label, activeClientDashboardHex])

  const selectedQualifiedStagesKey = useMemo(
    () => JSON.stringify([...selectedQualifiedStages].sort()),
    [selectedQualifiedStages]
  )
  const hasMetaManualToken = Boolean(String(globalIntegrations.metaAccessToken || '').trim())
  const hasMetaOauthConnection = Boolean(metaConnection.connected)
  const shouldUseServerMetaConnection = hasInitialClientsOverride
  const shouldUseMetaOauth =
    shouldUseServerMetaConnection ||
    (hasMetaOauthConnection && (globalIntegrations.metaConnectionMode === 'oauth' || !hasMetaManualToken))
  const metaRequestHeaders = useMemo(() => {
    if (shouldUseMetaOauth || !hasMetaManualToken) return {}

    return {
      'x-meta-access-token': globalIntegrations.metaAccessToken,
    }
  }, [shouldUseMetaOauth, hasMetaManualToken, globalIntegrations.metaAccessToken])

  const CAMPAIGN_CHART_METRICS = [
    { key: 'spend', label: 'Investimento', format: 'currency' },
    { key: 'results', label: 'Resultados', format: 'number' },
    { key: 'clicks', label: 'Cliques', format: 'number' },
    { key: 'impressions', label: 'Impressões', format: 'number' },
    { key: 'ctr', label: 'CTR', format: 'percent' },
  ]

  const handleToggleCampaignChart = useCallback(async (campaignKey, entityId) => {
    setCampaignChartOpenKeys((prev) => {
      const isOpen = !!prev[campaignKey]
      if (isOpen) {
        const next = { ...prev }
        delete next[campaignKey]
        return next
      }
      return { ...prev, [campaignKey]: true }
    })

    setCampaignChartData((current) => {
      if (current[campaignKey] !== undefined) return current

      const params = new URLSearchParams({ entityId })
      if (dateRange === 'custom' && customSince && customUntil) {
        params.set('since', customSince)
        params.set('until', customUntil)
      } else {
        params.set('date_preset', dateRange || 'last_30d')
      }

      fetch(`/api/meta/campaign-daily?${params}`, { headers: metaRequestHeaders })
        .then((res) => res.json())
        .then((json) => setCampaignChartData((prev) => ({ ...prev, [campaignKey]: json.data || [] })))
        .catch(() => setCampaignChartData((prev) => ({ ...prev, [campaignKey]: [] })))

      return { ...current, [campaignKey]: null }
    })
  }, [metaRequestHeaders, dateRange, customSince, customUntil])

  const renderCampaignChart = (campaignKey, themeColor) => {
    const data = campaignChartData[campaignKey]

    if (data === null || data === undefined) {
      return <div className="campaign-chart-loading"><span>Carregando dados...</span></div>
    }
    if (!data.length) {
      return <div className="campaign-chart-loading"><span>Sem dados para o período selecionado.</span></div>
    }

    const color = themeColor || '#26C281'
    const colorResults = 'rgba(255,255,255,0.45)'

    const labels = data.map((d) => {
      const dt = new Date(d.date_start || d.date)
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    })

    const costPerResult = data.map((d) => {
      const spend = parseFloat(d.spend || 0)
      const results = parseFloat(d.results || 0)
      return results > 0 ? parseFloat((spend / results).toFixed(2)) : 0
    })

    const results = data.map((d) => parseFloat(d.results || 0))

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Custo/resultado',
          data: costPerResult,
          borderColor: color,
          backgroundColor: `${color}22`,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [],
          yAxisID: 'yCost',
        },
        {
          label: 'Resultados',
          data: results,
          borderColor: colorResults,
          backgroundColor: 'rgba(255,255,255,0.06)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderDash: [6, 4],
          yAxisID: 'yResults',
        },
      ],
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: 'rgba(255,255,255,0.55)',
            font: { size: 11 },
            boxWidth: 24,
            usePointStyle: true,
            pointStyle: 'line',
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y
              if (ctx.datasetIndex === 0) return `Custo/resultado: R$ ${v.toFixed(2)}`
              return `Resultados: ${Math.round(v)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
        },
        yCost: {
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: color,
            font: { size: 11 },
            callback: (v) => `R$${v}`,
          },
        },
        yResults: {
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            color: colorResults,
            font: { size: 11 },
            callback: (v) => Math.round(v),
          },
        },
      },
    }

    return (
      <div className="campaign-chart-body">
        <div className="campaign-chart-canvas-wrap">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    )
  }

  const metaCredentialSignature = useMemo(
    () =>
      JSON.stringify({
        mode: shouldUseServerMetaConnection ? 'server' : shouldUseMetaOauth ? 'oauth' : 'manual',
        manualToken: !shouldUseServerMetaConnection && hasMetaManualToken ? globalIntegrations.metaAccessToken : '',
        connectionUserId: metaConnection.userId || '',
        connectionExpiresAt: metaConnection.expiresAt || '',
      }),
    [
      shouldUseServerMetaConnection,
      shouldUseMetaOauth,
      hasMetaManualToken,
      globalIntegrations.metaAccessToken,
      metaConnection.userId,
      metaConnection.expiresAt,
    ]
  )
  const hasMetaConfigured = Boolean(
    isActiveClientDashboardEnabled &&
    activeClientVisibleIntegrationsSet.has('meta_ads') &&
    selectedAdAccount
  )
  const hasGoogleAdsConfigured = Boolean(
    isActiveClientDashboardEnabled &&
    activeClientVisibleIntegrationsSet.has('google_ads') &&
    selectedGoogleAdsAccount
  )
  const hasRdConfigured = Boolean(
    isActiveClientDashboardEnabled &&
    (activeClientVisibleIntegrationsSet.has('rd_station') || activeClientVisibleIntegrationsSet.has('agendor') || activeCrmProvider === 'agendor' || activeClientUsesManualCrm) &&
    (activeCrmToken || activeClientUsesManualCrm)
  )
  const hasSheetsConfigured = false
  const hasClickUpConfigured = Boolean(
    String(globalIntegrations.clickUpToken || '').trim() && String(globalIntegrations.clickUpListIds || '').trim()
  )
  const hasMondayConfigured = Boolean(
    String(globalIntegrations.mondayToken || '').trim() && String(globalIntegrations.mondayBoardIds || '').trim()
  )
  const hasAnyPresentationData =
    isActiveClientDashboardEnabled && (hasMetaConfigured || hasGoogleAdsConfigured || hasRdConfigured || hasSheetsConfigured)
  const rdPipelineOptions = useMemo(
    () => (rdPipelines.length ? rdPipelines : rdSummary?.availablePipelines || []),
    [rdPipelines, rdSummary]
  )
  const selectedRdPipeline = useMemo(
    () => rdPipelineOptions.find((pipeline) => pipeline.id === rdPipelineFilter) || null,
    [rdPipelineOptions, rdPipelineFilter]
  )
  const draftSelectedRdPipeline = useMemo(
    () => rdPipelineOptions.find((pipeline) => pipeline.id === draftRdPipelineFilter) || null,
    [rdPipelineOptions, draftRdPipelineFilter]
  )
  const availableRdStages = useMemo(
    () => (rdPipelineStages.length ? rdPipelineStages : rdSummary?.availableStages || []),
    [rdPipelineStages, rdSummary]
  )
  const activeDashboardTemplateId = activeDashboardTemplate?.id || activeDashboardTemplates[0]?.id || ''
  const activeDraftDashboardTemplateId = activeDraftDashboardTemplate?.id || activeDraftDashboardTemplates[0]?.id || ''
  const draftMetaDashboardMetricLayouts = useMemo(
    () => normalizeDashboardMetricLayouts(activeDraftDashboardTemplate?.metaMetricLayouts),
    [activeDraftDashboardTemplate]
  )
  const draftMetaCampaignTableColumnKeys = useMemo(
    () => normalizeMetaCampaignTableColumnKeys(activeDraftDashboardTemplate?.metaCampaignTableColumnKeys),
    [activeDraftDashboardTemplate]
  )
  const draftRdDashboardMetricLayouts = useMemo(
    () => normalizeDashboardMetricLayouts(activeDraftDashboardTemplate?.rdMetricLayouts),
    [activeDraftDashboardTemplate]
  )
  const draftSheetsDashboardMetricLayouts = useMemo(
    () => normalizeDashboardMetricLayouts(activeDraftDashboardTemplate?.sheetsMetricLayouts),
    [activeDraftDashboardTemplate]
  )
  const activeFunnelSteps = useMemo(
    () => activeClient?.funnelSteps || [],
    [activeClient]
  )
  const activeDraftFunnelSteps = useMemo(
    () => (Array.isArray(draftFunnelSteps) ? draftFunnelSteps : []),
    [draftFunnelSteps]
  )
  const availableMetaResultFilters = useMemo(
    () => getAvailableMetaResultFilters(campaigns),
    [campaigns]
  )
  const availableMetaCampaignOptions = useMemo(() => {
    const campaignsWithSpendMap = new Map(
      campaigns
        .filter((campaign) => campaign?.id && Number(campaign.spend || 0) > 0)
        .map((campaign) => [
          campaign.id,
          {
            id: campaign.id,
            name: campaign.name || 'Campanha sem nome',
          },
        ])
    )
    const hierarchyCampaignMap = new Map()

    metaHierarchy.forEach((item) => {
      if (!item?.campaignId || !campaignsWithSpendMap.has(item.campaignId)) return
      if (!hierarchyCampaignMap.has(item.campaignId)) {
        hierarchyCampaignMap.set(item.campaignId, {
          id: item.campaignId,
          name: item.campaignName || 'Campanha sem nome',
        })
      }
    })

    const hierarchyOptions = Array.from(hierarchyCampaignMap.values())

    if (hierarchyOptions.length > 0) {
      return hierarchyOptions.sort((campaignA, campaignB) =>
        campaignA.name.localeCompare(campaignB.name, 'pt-BR')
      )
    }

    return Array.from(campaignsWithSpendMap.values())
      .sort((campaignA, campaignB) => campaignA.name.localeCompare(campaignB.name, 'pt-BR'))
  }, [campaigns, metaHierarchy])
  const activeRdLeadSources = useMemo(() => {
    const sources = rdSummary?.availableSources || []
    if (!sources.length) return []
    if (!rdLeadSourceFilters.length) return sources
    const normalizedFilters = rdLeadSourceFilters.filter((source) => sources.includes(source))
    return normalizedFilters.length > 0 ? normalizedFilters : sources
  }, [rdSummary, rdLeadSourceFilters])
  const rdLeadSourceFiltersKey = useMemo(
    () => JSON.stringify([...rdLeadSourceFilters].sort()),
    [rdLeadSourceFilters]
  )
  const activeDraftRdLeadSources = useMemo(() => {
    const sources = rdSummary?.availableSources || []
    if (!sources.length) return []
    if (!draftRdLeadSourceFilters.length) return sources
    const normalizedFilters = draftRdLeadSourceFilters.filter((source) => sources.includes(source))
    return normalizedFilters.length > 0 ? normalizedFilters : sources
  }, [rdSummary, draftRdLeadSourceFilters])
  const normalizedMetaResultFilters = useMemo(
    () => normalizeMetaResultFilters(metaResultFilters, availableMetaResultFilters.map((item) => item.key)),
    [metaResultFilters, availableMetaResultFilters]
  )
  const normalizedDraftMetaResultFilters = useMemo(
    () => normalizeMetaResultFilters(draftMetaResultFilters, availableMetaResultFilters.map((item) => item.key)),
    [draftMetaResultFilters, availableMetaResultFilters]
  )
  const activeMetaCampaignIds = useMemo(() => {
    const availableIds = availableMetaCampaignOptions.map((campaign) => campaign.id)

    if (!availableIds.length) return []
    if (!metaCampaignFilters.length) return availableIds

    const normalizedSelection = metaCampaignFilters.filter((campaignId) => availableIds.includes(campaignId))
    return normalizedSelection.length > 0 ? normalizedSelection : availableIds
  }, [metaCampaignFilters, availableMetaCampaignOptions])
  const activeDraftMetaCampaignIds = useMemo(() => {
    const availableIds = availableMetaCampaignOptions.map((campaign) => campaign.id)

    if (!availableIds.length) return []
    if (!draftMetaCampaignFilters.length) return availableIds

    const normalizedSelection = draftMetaCampaignFilters.filter((campaignId) => availableIds.includes(campaignId))
    return normalizedSelection.length > 0 ? normalizedSelection : availableIds
  }, [draftMetaCampaignFilters, availableMetaCampaignOptions])
  const metaFilteredCampaignIds = useMemo(
    () =>
      campaigns
        .filter((campaign) => campaignMatchesMetaResultFilters(campaign, normalizedMetaResultFilters, availableMetaResultFilters.map((item) => item.key)))
        .filter((campaign) => activeMetaCampaignIds.length === 0 || activeMetaCampaignIds.includes(campaign.id))
        .map((campaign) => campaign.id)
        .filter(Boolean),
    [campaigns, normalizedMetaResultFilters, availableMetaResultFilters, activeMetaCampaignIds]
  )
  const metaFilteredCampaignIdsKey = useMemo(
    () => JSON.stringify(metaFilteredCampaignIds),
    [metaFilteredCampaignIds]
  )
  const draftMetaFilteredCampaignIds = useMemo(
    () =>
      campaigns
        .filter((campaign) => campaignMatchesMetaResultFilters(campaign, normalizedDraftMetaResultFilters, availableMetaResultFilters.map((item) => item.key)))
        .filter((campaign) => activeDraftMetaCampaignIds.length === 0 || activeDraftMetaCampaignIds.includes(campaign.id))
        .map((campaign) => campaign.id)
        .filter(Boolean),
    [campaigns, normalizedDraftMetaResultFilters, availableMetaResultFilters, activeDraftMetaCampaignIds]
  )
  const draftMetaResultMatchedCampaignIds = useMemo(
    () =>
      campaigns
        .filter((campaign) => campaignMatchesMetaResultFilters(campaign, normalizedDraftMetaResultFilters, availableMetaResultFilters.map((item) => item.key)))
        .map((campaign) => campaign.id)
        .filter((campaignId) => availableMetaCampaignOptions.some((campaign) => campaign.id === campaignId)),
    [campaigns, normalizedDraftMetaResultFilters, availableMetaResultFilters, availableMetaCampaignOptions]
  )
  const availableMetaAdsetOptions = useMemo(() => {
    const adsetMap = new Map()

    metaHierarchy
      .filter((item) => metaFilteredCampaignIds.length === 0 || metaFilteredCampaignIds.includes(item.campaignId))
      .forEach((item) => {
        if (!item.adsetId) return
        if (!adsetMap.has(item.adsetId)) {
          adsetMap.set(item.adsetId, {
            id: item.adsetId,
            name: item.adsetName || 'Conjunto sem nome',
          })
        }
      })

    return Array.from(adsetMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [metaHierarchy, metaFilteredCampaignIds])
  const draftAvailableMetaAdsetOptions = useMemo(() => {
    const adsetMap = new Map()

    metaHierarchy
      .filter((item) => draftMetaFilteredCampaignIds.length === 0 || draftMetaFilteredCampaignIds.includes(item.campaignId))
      .forEach((item) => {
        if (!item.adsetId) return
        if (!adsetMap.has(item.adsetId)) {
          adsetMap.set(item.adsetId, {
            id: item.adsetId,
            name: item.adsetName || 'Conjunto sem nome',
          })
        }
      })

    return Array.from(adsetMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [metaHierarchy, draftMetaFilteredCampaignIds])
  const activeMetaAdsetIds = useMemo(() => {
    const availableIds = availableMetaAdsetOptions.map((adset) => adset.id)

    if (!availableIds.length) return []
    if (!metaAdsetFilters.length) return availableIds

    const normalizedSelection = metaAdsetFilters.filter((adsetId) => availableIds.includes(adsetId))
    return normalizedSelection.length > 0 ? normalizedSelection : availableIds
  }, [metaAdsetFilters, availableMetaAdsetOptions])
  const activeDraftMetaAdsetIds = useMemo(() => {
    const availableIds = draftAvailableMetaAdsetOptions.map((adset) => adset.id)

    if (!availableIds.length) return []
    if (!draftMetaAdsetFilters.length) return availableIds

    const normalizedSelection = draftMetaAdsetFilters.filter((adsetId) => availableIds.includes(adsetId))
    return normalizedSelection.length > 0 ? normalizedSelection : availableIds
  }, [draftMetaAdsetFilters, draftAvailableMetaAdsetOptions])
  const availableMetaAdOptions = useMemo(() => {
    const adMap = new Map()

    metaHierarchy
      .filter((item) => metaFilteredCampaignIds.length === 0 || metaFilteredCampaignIds.includes(item.campaignId))
      .filter((item) => activeMetaAdsetIds.length === 0 || activeMetaAdsetIds.includes(item.adsetId))
      .forEach((item) => {
        if (!item.adId) return
        if (!adMap.has(item.adId)) {
          adMap.set(item.adId, {
            id: item.adId,
            name: item.adName || 'Anúncio sem nome',
          })
        }
      })

    return Array.from(adMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [metaHierarchy, metaFilteredCampaignIds, activeMetaAdsetIds])
  const draftAvailableMetaAdOptions = useMemo(() => {
    const adMap = new Map()

    metaHierarchy
      .filter((item) => draftMetaFilteredCampaignIds.length === 0 || draftMetaFilteredCampaignIds.includes(item.campaignId))
      .filter((item) => activeDraftMetaAdsetIds.length === 0 || activeDraftMetaAdsetIds.includes(item.adsetId))
      .forEach((item) => {
        if (!item.adId) return
        if (!adMap.has(item.adId)) {
          adMap.set(item.adId, {
            id: item.adId,
            name: item.adName || 'Anúncio sem nome',
          })
        }
      })

    return Array.from(adMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [metaHierarchy, draftMetaFilteredCampaignIds, activeDraftMetaAdsetIds])
  const activeMetaAdIds = useMemo(() => {
    const availableIds = availableMetaAdOptions.map((ad) => ad.id)

    if (!availableIds.length) return []
    if (!metaAdFilters.length) return availableIds

    const normalizedSelection = metaAdFilters.filter((adId) => availableIds.includes(adId))
    return normalizedSelection.length > 0 ? normalizedSelection : availableIds
  }, [metaAdFilters, availableMetaAdOptions])
  const activeDraftMetaAdIds = useMemo(() => {
    const availableIds = draftAvailableMetaAdOptions.map((ad) => ad.id)

    if (!availableIds.length) return []
    if (!draftMetaAdFilters.length) return availableIds

    const normalizedSelection = draftMetaAdFilters.filter((adId) => availableIds.includes(adId))
    return normalizedSelection.length > 0 ? normalizedSelection : availableIds
  }, [draftMetaAdFilters, draftAvailableMetaAdOptions])
  const metaCampaignFilterSummary = useMemo(() => {
    const totalCampaigns = availableMetaCampaignOptions.length
    const selectedCount = activeDraftMetaCampaignIds.length

    if (!totalCampaigns) return 'Nenhuma campanha disponível'
    if (selectedCount === totalCampaigns) return 'Todas as campanhas'
    if (selectedCount === 1) {
      return availableMetaCampaignOptions.find((campaign) => campaign.id === activeDraftMetaCampaignIds[0])?.name || '1 campanha selecionada'
    }

    return `${selectedCount} campanhas selecionadas`
  }, [availableMetaCampaignOptions, activeDraftMetaCampaignIds])
  const metaAdsetFilterSummary = useMemo(() => {
    const totalAdsets = draftAvailableMetaAdsetOptions.length
    const selectedCount = activeDraftMetaAdsetIds.length

    if (!totalAdsets) return 'Nenhum conjunto disponível'
    if (selectedCount === totalAdsets) return 'Todos os conjuntos'
    if (selectedCount === 1) {
      return draftAvailableMetaAdsetOptions.find((adset) => adset.id === activeDraftMetaAdsetIds[0])?.name || '1 conjunto selecionado'
    }

    return `${selectedCount} conjuntos selecionados`
  }, [draftAvailableMetaAdsetOptions, activeDraftMetaAdsetIds])
  const metaAdFilterSummary = useMemo(() => {
    const totalAds = draftAvailableMetaAdOptions.length
    const selectedCount = activeDraftMetaAdIds.length

    if (!totalAds) return 'Nenhum anúncio disponível'
    if (selectedCount === totalAds) return 'Todos os anúncios'
    if (selectedCount === 1) {
      return draftAvailableMetaAdOptions.find((ad) => ad.id === activeDraftMetaAdIds[0])?.name || '1 anúncio selecionado'
    }

    return `${selectedCount} anúncios selecionados`
  }, [draftAvailableMetaAdOptions, activeDraftMetaAdIds])
  const rdLeadSourceFilterSummary = useMemo(() => {
    const totalSources = rdSummary?.availableSources?.length || 0
    const selectedCount = activeDraftRdLeadSources.length

    if (!totalSources) return 'Nenhuma origem disponível'
    if (selectedCount === totalSources) return 'Todas as origens'
    if (selectedCount === 1) return activeDraftRdLeadSources[0] || '1 origem selecionada'

    return `${selectedCount} origens selecionadas`
  }, [rdSummary, activeDraftRdLeadSources])
  const rdPipelineFilterSummary = useMemo(() => {
    const totalPipelines = rdPipelineOptions.length

    if (!totalPipelines) return 'Nenhum funil disponível'
    if (!draftRdPipelineFilter) return 'Todos os funis'
    return draftSelectedRdPipeline?.name || 'Funil selecionado'
  }, [rdPipelineOptions, draftRdPipelineFilter, draftSelectedRdPipeline])
  const rdAppliedPipelineSummary = useMemo(() => {
    const totalPipelines = rdPipelineOptions.length

    if (!totalPipelines) return 'Nenhum funil disponível'
    if (!rdPipelineFilter) return 'Todos os funis'
    return selectedRdPipeline?.name || 'Funil selecionado'
  }, [rdPipelineOptions, rdPipelineFilter, selectedRdPipeline])
  const hasPendingDashboardFilters = useMemo(() => {
    const hasDateRangeChanges = draftDateRange !== dateRange
    const hasCustomDateChanges =
      (draftDateRange === 'custom' || dateRange === 'custom') &&
      (draftCustomSince !== customSince || draftCustomUntil !== customUntil)
    const hasResultChanges = !haveSameSelection(normalizedDraftMetaResultFilters, normalizedMetaResultFilters)
    const hasCampaignChanges = !haveSameSelection(activeDraftMetaCampaignIds, activeMetaCampaignIds)
    const hasAdsetChanges = !haveSameSelection(activeDraftMetaAdsetIds, activeMetaAdsetIds)
    const hasAdChanges = !haveSameSelection(activeDraftMetaAdIds, activeMetaAdIds)
    const hasPipelineChanges = draftRdPipelineFilter !== rdPipelineFilter
    const hasSellerChanges = draftRdSellerFilter !== rdSellerFilter
    const hasLeadSourceChanges = !haveSameSelection(activeDraftRdLeadSources, activeRdLeadSources)
    const hasFunnelChanges = !haveSameSelection(activeDraftFunnelSteps, activeFunnelSteps)

    return (
      hasDateRangeChanges ||
      hasCustomDateChanges ||
      hasResultChanges ||
      hasCampaignChanges ||
      hasAdsetChanges ||
      hasAdChanges ||
      hasPipelineChanges ||
      hasSellerChanges ||
      hasLeadSourceChanges ||
      hasFunnelChanges
    )
  }, [
    draftDateRange,
    dateRange,
    draftCustomSince,
    customSince,
    draftCustomUntil,
    customUntil,
    normalizedDraftMetaResultFilters,
    normalizedMetaResultFilters,
    activeDraftMetaCampaignIds,
    activeMetaCampaignIds,
    activeDraftMetaAdsetIds,
    activeMetaAdsetIds,
    activeDraftMetaAdIds,
    activeMetaAdIds,
    draftRdPipelineFilter,
    rdPipelineFilter,
    draftRdSellerFilter,
    rdSellerFilter,
    activeDraftRdLeadSources,
    activeRdLeadSources,
    activeDraftFunnelSteps,
    activeFunnelSteps,
  ])
  const hasPendingMondayFilters = useMemo(() => {
    const hasDateRangeChanges = draftMondayDateRange !== mondayDateRange
    const hasCustomDateChanges =
      (draftMondayDateRange === 'custom' || mondayDateRange === 'custom') &&
      (draftMondayCustomSince !== mondayCustomSince || draftMondayCustomUntil !== mondayCustomUntil)

    return hasDateRangeChanges || hasCustomDateChanges
  }, [
    draftMondayDateRange,
    mondayDateRange,
    draftMondayCustomSince,
    mondayCustomSince,
    draftMondayCustomUntil,
    mondayCustomUntil,
  ])
  const isApplyDashboardFiltersDisabled =
    !hasPendingDashboardFilters || (draftDateRange === 'custom' && (!draftCustomSince || !draftCustomUntil))
  const isApplyMondayFiltersDisabled =
    !hasPendingMondayFilters || (draftMondayDateRange === 'custom' && (!draftMondayCustomSince || !draftMondayCustomUntil))
  const roleLabels = {
    master: 'Master',
    operador: 'Operador',
    cliente: 'Cliente',
    visualizador: 'Visualizador',
  }
  const aiAccessLabels = {
    master: 'IA Master',
    team: 'IA liberada',
    none: 'IA bloqueada',
  }

  useEffect(() => {
    const preferences = loadDashboardPreferences()
    const initialClients = hasInitialClientsOverride
      ? initialClientsOverride
      : preferences.clients?.length
        ? preferences.clients
        : [createClientRecord({ name: 'Cliente demo' })]
    const mergedInitialClients = mergeInitialClientRecord(initialClients, initialClientRecord)
    const resolvedInitialActiveClientId = initialActiveClientId || (hasInitialClientsOverride ? '' : preferences.activeClientId) || initialClients[0]?.id || ''

    setThemeColor(preferences.themeColor)
    setMetric1(preferences.metric1)
    setMetric2(preferences.metric2)
    setGlobalIntegrations(
      {
        ...DEFAULT_PREFERENCES.globalIntegrations,
        ...(preferences.globalIntegrations || {}),
        ...normalizeAiSettings(preferences.globalIntegrations || {}),
      }
    )
    setClients(mergedInitialClients)
    setClientGroups(Array.isArray(preferences.clientGroups) ? cloneClientGroups(preferences.clientGroups) : [])
    setProducts(Array.isArray(preferences.products) ? preferences.products : [])
    setOperationCards(Array.isArray(preferences.operationCards) ? preferences.operationCards : [])
    setOperationSettings(createOperationSettingsRecord(preferences.operationSettings))
    setClientImplementationPhases(
      Array.isArray(preferences.clientImplementationPhases) && preferences.clientImplementationPhases.length
        ? preferences.clientImplementationPhases
        : getDefaultClientImplementationPhases()
    )
    setClientSystemFields(
      Array.isArray(preferences.clientSystemFields) && preferences.clientSystemFields.length
        ? preferences.clientSystemFields
        : DEFAULT_CLIENT_SYSTEM_FIELDS
    )
    setClientCustomColumns(Array.isArray(preferences.clientCustomColumns) ? preferences.clientCustomColumns : [])
    setClientCustomTabs(Array.isArray(preferences.clientCustomTabs) ? preferences.clientCustomTabs : [])
    setClientTabOverrides(Array.isArray(preferences.clientTabOverrides) ? preferences.clientTabOverrides : [])
    setTeamProfiles(Array.isArray(preferences.teamProfiles) ? preferences.teamProfiles : [])
    setActiveClientId(resolvedInitialActiveClientId)
    setHasLoadedPreferences(true)
  }, [initialActiveClientId, initialClientRecord, initialClientsOverride, hasInitialClientsOverride])

  useEffect(() => {
    if (!hasLoadedPreferences || userLoading) return

    let cancelled = false

    const loadAdConnections = async () => {
      try {
        const [metaResult, googleAdsResult] = await Promise.all([
          fetch('/api/meta/connection', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json().catch(() => null) })),
          fetch('/api/google-ads/connection', { cache: 'no-store' }).then(async (response) => ({ response, data: await response.json().catch(() => null) })),
        ])

        if (cancelled) return

        if (metaResult.response.ok) {
          setMetaConnection(
            metaResult.data?.connection || {
              connected: false,
              userId: '',
              userName: '',
              scopes: '',
              expiresAt: '',
            }
          )
        }

        if (googleAdsResult.response.ok) {
          setGoogleAdsConnection(
            googleAdsResult.data?.connection || {
              connected: false,
              googleEmail: '',
              googleName: '',
              scopes: '',
              expiresAt: '',
              managerCustomerId: '',
            }
          )
        }
      } catch (error) {
        if (cancelled) return
        console.error('Erro ao carregar conexões de mídia:', error)
        setMetaConnection({
          connected: false,
          userId: '',
          userName: '',
          scopes: '',
          expiresAt: '',
        })
        setGoogleAdsConnection({
          connected: false,
          googleEmail: '',
          googleName: '',
          scopes: '',
          expiresAt: '',
          managerCustomerId: '',
        })
      }
    }

    loadAdConnections()

    return () => {
      cancelled = true
    }
  }, [hasLoadedPreferences, userLoading])

  useEffect(() => {
    if (!activeClient?.dashboardColor) return
    setThemeColor(activeClient.dashboardColor)
  }, [activeClient])

  useEffect(() => {
    if (!products.length) return
    setClients((currentClients) =>
      currentClients.map((client) => {
        if (!client.productId) return client
        const linkedProduct = productsById.get(client.productId)
        if (!linkedProduct || client.product === linkedProduct.name) return client
        return {
          ...client,
          product: linkedProduct.name,
        }
      })
    )
  }, [products, productsById])

  useEffect(() => {
    setClients((currentClients) => {
      let hasChanges = false

      const nextClients = currentClients.map((client) => {
        const computed = deriveClientComputedFields(client)
        const nextClient = {
          ...client,
          ...computed,
        }

        const changed = Object.entries(computed).some(([key, value]) => nextClient[key] !== client[key])
        if (changed) {
          hasChanges = true
          return nextClient
        }

        return client
      })

      return hasChanges ? nextClients : currentClients
    })
  }, [clients])

  useEffect(() => {
    campaignsRef.current = campaigns
  }, [campaigns])

  useEffect(() => {
    selectedQualifiedStagesRef.current = selectedQualifiedStages
  }, [selectedQualifiedStages])

  const selectedAgendorPipelineFilter = useMemo(
    () => selectedAgendorPipelineIds.join(','),
    [selectedAgendorPipelineIds]
  )

  useEffect(() => {
    if (activeClientUsesManualCrm) {
      setRdPipelineFilter('')
      setDraftRdPipelineFilter('')
      setRdSellerFilter('all')
      setDraftRdSellerFilter('all')
      return
    }

    const nextPipelineId = activeCrmProvider === 'agendor'
      ? selectedAgendorPipelineFilter
      : activeClient?.rdPipelineId || ''
    setRdPipelineFilter(nextPipelineId)
    setDraftRdPipelineFilter(nextPipelineId)
  }, [activeClientId, activeCrmProvider, activeClient?.rdPipelineId, selectedAgendorPipelineFilter, activeClientUsesManualCrm])

  useEffect(() => {
    rdLeadSourceFiltersRef.current = rdLeadSourceFilters
  }, [rdLeadSourceFilters])

  useEffect(() => {
    setDraftDateRange(dateRange)
    setDraftCustomSince(customSince)
    setDraftCustomUntil(customUntil)
    setDraftMetaResultFilters(metaResultFilters)
    setDraftMetaCampaignFilters(metaCampaignFilters)
    setDraftMetaAdsetFilters(metaAdsetFilters)
    setDraftMetaAdFilters(metaAdFilters)
    setDraftRdPipelineFilter(rdPipelineFilter)
    setDraftRdSellerFilter(rdSellerFilter)
    setDraftRdLeadSourceFilters(rdLeadSourceFilters)
    setDraftFunnelSteps(activeFunnelSteps)
    setDraftDashboardTemplates(cloneDashboardTemplates(activeDashboardTemplates))
    setDraftDashboardTemplateId(activeDashboardTemplateId)
  }, [
    dateRange,
    customSince,
    customUntil,
    metaResultFilters,
    metaCampaignFilters,
    metaAdsetFilters,
    metaAdFilters,
    rdPipelineFilter,
    rdSellerFilter,
    rdLeadSourceFilters,
    activeFunnelSteps,
    activeDashboardTemplates,
    activeDashboardTemplateId,
    activeClientId,
    selectedAdAccount,
  ])

  useEffect(() => {
    const availableCampaignIds = availableMetaCampaignOptions.map((campaign) => campaign.id)
    if (!availableCampaignIds.length) return

    const matchedCampaignIds = draftMetaResultMatchedCampaignIds.filter((campaignId) => availableCampaignIds.includes(campaignId))
    const nextCampaignSelection =
      matchedCampaignIds.length === availableCampaignIds.length ? [] : matchedCampaignIds

    setDraftMetaCampaignFilters((current) =>
      haveSameSelection(current, nextCampaignSelection) ? current : nextCampaignSelection
    )
    setDraftMetaAdsetFilters((current) => (current.length ? [] : current))
    setDraftMetaAdFilters((current) => (current.length ? [] : current))
  }, [normalizedDraftMetaResultFilters, availableMetaCampaignOptions, draftMetaResultMatchedCampaignIds])

  useEffect(() => {
    setDraftMondayDateRange(mondayDateRange)
    setDraftMondayCustomSince(mondayCustomSince)
    setDraftMondayCustomUntil(mondayCustomUntil)
  }, [mondayDateRange, mondayCustomSince, mondayCustomUntil])

  useEffect(() => {
    setIsMetaMetricLibraryOpen(false)
    setIsRdMetricLibraryOpen(false)
    setIsSheetsMetricLibraryOpen(false)
    setIsCampaignColumnLibraryOpen(false)
  }, [activeClientId, activeDashboardTemplate?.id])

  useEffect(() => {
    if (activeTab !== 'apresentacao') {
      hasOpenedDashboardEntryRef.current = false
      setIsDashboardEntryModalOpen(false)
      return
    }

    if (hasInitialClientsOverride) {
      setIsDashboardEntryModalOpen(false)
      return
    }

    if (dashboardEligibleClients.length <= 1) {
      setIsDashboardEntryModalOpen(false)
      return
    }

    if (hasOpenedDashboardEntryRef.current) {
      return
    }

    hasOpenedDashboardEntryRef.current = true
    setDashboardEntryClientId(
      dashboardEligibleClients.some((client) => client.id === activeClientId)
        ? activeClientId
        : dashboardEligibleClients[0]?.id || ''
    )
    setIsDashboardEntryModalOpen(true)
  }, [activeTab, activeClientId, dashboardEligibleClients, hasInitialClientsOverride])

  useEffect(() => {
    if ((activeTab === 'clientes' || activeTab === 'operacao') && !canAccessClientsTab) {
      setActiveTab('clientes')
    }

    if (['operacao', 'clickup', 'calendar'].includes(activeTab)) {
      setActiveTab('clientes')
    }

    if (activeTab === 'produtos' && !canManageClients) {
      setActiveTab('clientes')
    }

    if (activeTab === 'usuarios' && !canAccessTeamTab) {
      setActiveTab('clientes')
    }

    if (activeTab === 'integracoes') {
      setActiveTab('clientes')
    }
  }, [activeTab, canAccessClientsTab, canManageClients, canAccessTeamTab])

  useEffect(() => {
    const sellers = rdSummary?.sellers || []

    if (!sellers.length) {
      setRdSellerFilter('all')
      setDraftRdSellerFilter('all')
      return
    }

    if (rdSellerFilter !== 'all' && !sellers.some((seller) => seller.id === rdSellerFilter)) {
      setRdSellerFilter('all')
    }
    if (draftRdSellerFilter !== 'all' && !sellers.some((seller) => seller.id === draftRdSellerFilter)) {
      setDraftRdSellerFilter('all')
    }
  }, [rdSummary, rdSellerFilter, draftRdSellerFilter])

  useEffect(() => {
    if (activeTab !== 'clientes' && activeTab !== 'apresentacao') {
      lastRdPipelinesFetchKeyRef.current = ''
      return
    }

    if (!activeClientId || activeClientUsesManualCrm || !activeCrmToken) {
      lastRdPipelinesFetchKeyRef.current = ''
      setRdPipelines([])
      setRdPipelineStages([])
      return
    }

    let cancelled = false

    const loadRdPipelines = async () => {
      try {
        const selectedPipelineId = activeCrmProvider === 'agendor' ? selectedAgendorPipelineFilter : activeClient?.rdPipelineId || ''
        const fetchKey = JSON.stringify({
          activeClientId,
          rdToken: activeCrmToken,
          selectedPipelineId,
        })

        if (lastRdPipelinesFetchKeyRef.current === fetchKey) {
          return
        }

        lastRdPipelinesFetchKeyRef.current = fetchKey

        const params = new URLSearchParams()
        if (selectedPipelineId) {
          params.set('pipeline_id', selectedPipelineId)
        }

        const { response, data } = await fetchJsonWithTimeout(`/api/rd/pipelines${params.toString() ? `?${params.toString()}` : ''}`, {
          headers: {
            'x-rd-station-token': activeCrmToken,
            'x-crm-provider': activeCrmProvider === 'manual' ? 'rd_station' : activeCrmProvider,
          },
        })

        if (!response.ok) {
          throw new Error(data.error || `Não foi possível carregar os funis do ${crmSourceLabel}.`)
        }

        if (cancelled) return

        setRdPipelines(Array.isArray(data?.pipelines) ? data.pipelines : [])
        setRdPipelineStages(Array.isArray(data?.stages) ? data.stages : [])
      } catch (error) {
        if (cancelled) return
        setRdPipelines([])
        setRdPipelineStages([])
        setErrorMessage(error.message || `Não foi possível carregar os funis do ${crmSourceLabel}.`)
      }
    }

    loadRdPipelines()

    return () => {
      cancelled = true
    }
  }, [activeTab, activeClientId, activeClient?.rdPipelineId, selectedAgendorPipelineFilter, activeCrmToken, activeCrmProvider, activeClientUsesManualCrm])

  useEffect(() => {
    if (!hasLoadedPreferences || userLoading || !user || hasSyncedServerState || hasInitialClientsOverride) return

    const syncFromServer = async () => {
      try {
        const response = await fetch('/api/dashboard/state', { cache: 'no-store' })
        if (!response.ok) {
          setHasSyncedServerState(true)
          return
        }

        const state = await response.json()

        setThemeColor(state.themeColor || 'blue')
        setMetric1(state.metric1 || 'spend')
        setMetric2(state.metric2 || 'roas')
        if (state.workspaceBranding) {
          const nextBranding = {
            ...DEFAULT_WORKSPACE_BRANDING,
            ...state.workspaceBranding,
          }
          setWorkspaceBranding(nextBranding)
          setBrandingForm(nextBranding)
          if (canManageUsers && !nextBranding.onboardingCompleted) {
            setIsBrandingModalOpen(true)
          }
        }
        setGlobalIntegrations((current) => {
          const nextIntegrations = {
            ...current,
            ...(state.globalIntegrations || {}),
          }

          return {
            ...nextIntegrations,
            ...normalizeAiSettings(nextIntegrations),
          }
        })
        const mergedServerClients = mergeInitialClientRecord(Array.isArray(state.clients) ? state.clients : [], initialClientRecord)
        setClients(mergedServerClients)
        setClientGroups(Array.isArray(state.clientGroups) ? cloneClientGroups(state.clientGroups) : [])
        setProducts(Array.isArray(state.products) ? state.products : [])
        setOperationCards(Array.isArray(state.operationCards) ? state.operationCards : [])
        setOperationSettings(createOperationSettingsRecord(state.operationSettings))
        setClientImplementationPhases(
          Array.isArray(state.clientImplementationPhases) && state.clientImplementationPhases.length
            ? state.clientImplementationPhases
            : getDefaultClientImplementationPhases()
        )
        setClientSystemFields(
          Array.isArray(state.clientSystemFields) && state.clientSystemFields.length
            ? state.clientSystemFields
            : DEFAULT_CLIENT_SYSTEM_FIELDS
        )
        setClientCustomColumns(Array.isArray(state.clientCustomColumns) ? state.clientCustomColumns : [])
        setClientCustomTabs(Array.isArray(state.clientCustomTabs) ? state.clientCustomTabs : [])
        setClientTabOverrides(Array.isArray(state.clientTabOverrides) ? state.clientTabOverrides : [])
        setTeamProfiles(Array.isArray(state.teamProfiles) ? state.teamProfiles : [])
        lastDashboardFetchKeyRef.current = ''
        lastCompletedDashboardFetchKeyRef.current = ''
        lastDashboardFetchAtRef.current = 0
        setActiveClientId(initialActiveClientId || initialClientRecord?.id || state.activeClientId || mergedServerClients[0]?.id || '')
      } catch (error) {
        console.error('Erro ao sincronizar estado do servidor:', error)
      } finally {
        setHasSyncedServerState(true)
      }
    }

    syncFromServer()
  }, [hasLoadedPreferences, userLoading, user, hasSyncedServerState, initialActiveClientId, initialClientRecord, hasInitialClientsOverride, canManageUsers])

  useEffect(() => {
    if (!hasLoadedPreferences) return

    const state = {
      themeColor,
      metric1,
      metric2,
      activeClientId,
      globalIntegrations,
      clients,
      clientGroups,
      products,
      operationCards: [], // persisted to DB via /api/operation/cards
      operationSettings,
      clientImplementationPhases: effectiveClientImplementationPhases,
      clientSystemFields: effectiveClientSystemFields,
      clientCustomColumns,
      clientCustomTabs,
      clientTabOverrides,
      teamProfiles,
    }

    if (hasInitialClientsOverride) return

    saveDashboardPreferences(state)

    if (userLoading || !user || !canPersistClientChanges || !hasSyncedServerState) return

    const timeoutId = window.setTimeout(() => {
      fetch('/api/dashboard/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      }).catch((error) => {
        console.error('Erro ao salvar estado no servidor:', error)
      })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [hasLoadedPreferences, themeColor, metric1, metric2, activeClientId, globalIntegrations, clients, clientGroups, products, operationCards, operationSettings, effectiveClientImplementationPhases, effectiveClientSystemFields, clientCustomColumns, clientCustomTabs, clientTabOverrides, teamProfiles, userLoading, user, canPersistClientChanges, hasSyncedServerState, hasInitialClientsOverride])

  useEffect(() => {
    ChartJS.defaults.color = '#94a3b8'
    ChartJS.defaults.font.family = "'Inter', sans-serif"
  }, [])

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      window.location.href = '/login'
    }
  }, [user, userLoading])

  const updateActiveClient = (updater) => {
    setClients((currentClients) =>
      currentClients.map((client) => {
        if (client.id !== activeClientId) return client
        return updater(client)
      })
    )
  }

  const updateDraftDashboardTemplate = (updater) => {
    if (!activeDraftDashboardTemplateId) return

    setDraftDashboardTemplates((currentTemplates) =>
      currentTemplates.map((template) =>
        template.id === activeDraftDashboardTemplateId ? updater(template) : template
      )
    )
  }

  const handleDashboardTemplateChange = (templateId) => {
    if (!templateId) return

    setDraftDashboardTemplateId(templateId)
    setIsMetaMetricLibraryOpen(false)
    setIsRdMetricLibraryOpen(false)
  }

  const closeCreateClientModal = useCallback(() => {
    setIsCreateClientModalOpen(false)
    setCreateClientStep('identity')
    setNewClientManualCrmEnabled(false)
    setNewClientLogoUrl('')
    setNewClientResultManagerUserId('')
  }, [])

  const openCreateClientModal = useCallback(() => {
    setCreateClientStep('identity')
    setNewClientDashboardColor(appAccentColor)
    setNewClientLogoUrl('')
    setNewClientManualCrmEnabled(false)
    setNewClientResultManagerUserId('')
    setIsCreateClientModalOpen(true)
    window.setTimeout(() => {
      document.querySelector('.modal-create-client input')?.focus()
    }, 120)
  }, [appAccentColor])

  const closeClientRegistryInlineEdit = useCallback(() => {
    setClientRegistryInlineEdit({ clientId: '', columnKey: '' })
  }, [])

  const openClientRegistryInlineEdit = useCallback((clientId, columnKey) => {
    setClientRegistryInlineEdit({ clientId, columnKey })
  }, [])

  const persistDashboardLayout = async (nextClient) => {
    if (!hasInitialClientsOverride || !nextClient?.id) return

    const response = await fetch('/api/saas/dashboard-layout', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: nextClient.id,
        dashboardTemplates: nextClient.dashboardTemplates,
        activeDashboardTemplateId: nextClient.activeDashboardTemplateId,
        funnelSteps: nextClient.funnelSteps,
        dashboardButtonColor: nextClient.dashboardColor,
        dashboardAccentColor: nextClient.dashboardAccentColor,
        logoUrl: nextClient.logoUrl || '',
        dashboardTheme: {
          buttonColor: nextClient.dashboardColor,
          accentColor: nextClient.dashboardAccentColor,
        },
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data?.error || 'Não foi possível salvar este layout.')
    }
  }

  const saveDashboardLayout = async ({ templates, templateId, message }) => {
    if (!activeClient) return

    const normalizedTemplates = cloneDashboardTemplates(templates)
    const normalizedTemplateId = templateId || normalizedTemplates[0]?.id || activeClient.activeDashboardTemplateId || ''
    const nextClient = {
      ...activeClient,
      funnelSteps: activeDraftFunnelSteps,
      dashboardTemplates: normalizedTemplates,
      activeDashboardTemplateId: normalizedTemplateId,
    }

    setIsSavingDashboardLayout(true)
    setLayoutSaveMessage('')

    try {
      setClients((currentClients) => currentClients.map((client) => (client.id === nextClient.id ? nextClient : client)))
      await persistDashboardLayout(nextClient)
      setLayoutSaveMessage(message)
    } catch (error) {
      setLayoutSaveMessage(error instanceof Error ? error.message : 'Não foi possível salvar este layout.')
    } finally {
      setIsSavingDashboardLayout(false)
    }
  }

  const handleSaveDashboardLayout = () => {
    if (!activeDraftDashboardTemplate) return

    saveDashboardLayout({
      templates: activeDraftDashboardTemplates,
      templateId: draftDashboardTemplateId || activeDraftDashboardTemplateId,
      message: 'Layout salvo.',
    })
  }

  const handleSaveDashboardTemplate = () => {
    if (!activeDraftDashboardTemplate) return

    const suggestedName =
      activeDraftDashboardTemplates.length <= 1
        ? 'Modelo 2'
        : `Modelo ${activeDraftDashboardTemplates.length + 1}`
    const templateName = window.prompt('Nome do modelo', suggestedName)
    const trimmedName = templateName?.trim()

    if (!trimmedName) return

    const newTemplate = createDashboardTemplate({
      name: trimmedName,
      metaCampaignTableColumnKeys: [...draftMetaCampaignTableColumnKeys],
      metaMetricLayouts: cloneDashboardMetricLayouts(draftMetaDashboardMetricLayouts),
      rdMetricLayouts: cloneDashboardMetricLayouts(draftRdDashboardMetricLayouts),
      sheetsMetricLayouts: cloneDashboardMetricLayouts(draftSheetsDashboardMetricLayouts),
    })

    const nextTemplates = [...activeDraftDashboardTemplates, newTemplate]
    setDraftDashboardTemplates(nextTemplates)
    setDraftDashboardTemplateId(newTemplate.id)
    setIsMetaMetricLibraryOpen(false)
    setIsRdMetricLibraryOpen(false)
    setIsSheetsMetricLibraryOpen(false)
    saveDashboardLayout({
      templates: nextTemplates,
      templateId: newTemplate.id,
      message: 'Nova versão de layout salva.',
    })
  }

  const handleAddMetaDashboardMetric = (metricKey) => {
    updateDraftDashboardTemplate((template) => ({
      ...template,
      metaMetricLayouts: [
        ...normalizeDashboardMetricLayouts(template.metaMetricLayouts),
        {
          id: globalThis.crypto?.randomUUID?.() || `dashboard-card-${metricKey}-${Date.now()}`,
          metricKey,
          size: 'sm',
        },
      ],
    }))
  }

  const handleToggleMetaCampaignTableColumn = (columnKey) => {
    if (!META_CAMPAIGN_TABLE_COLUMN_OPTIONS[columnKey]) return

    updateDraftDashboardTemplate((template) => {
      const currentColumns = normalizeMetaCampaignTableColumnKeys(template.metaCampaignTableColumnKeys)
      const nextColumns = currentColumns.includes(columnKey)
        ? currentColumns.filter((item) => item !== columnKey)
        : [...currentColumns, columnKey]

      return {
        ...template,
        metaCampaignTableColumnKeys: normalizeMetaCampaignTableColumnKeys(nextColumns),
      }
    })
  }

  const handleRemoveMetaDashboardMetric = (layoutId) => {
    updateDraftDashboardTemplate((template) => ({
      ...template,
      metaMetricLayouts: normalizeDashboardMetricLayouts(template.metaMetricLayouts).filter((item) => item.id !== layoutId),
    }))
  }

  const handleAddRdDashboardMetric = (metricKey) => {
    updateDraftDashboardTemplate((template) => ({
      ...template,
      rdMetricLayouts: [
        ...normalizeDashboardMetricLayouts(template.rdMetricLayouts),
        {
          id: globalThis.crypto?.randomUUID?.() || `dashboard-card-${metricKey}-${Date.now()}`,
          metricKey,
          size: 'sm',
        },
      ],
    }))
  }

  const handleRemoveRdDashboardMetric = (layoutId) => {
    updateDraftDashboardTemplate((template) => ({
      ...template,
      rdMetricLayouts: normalizeDashboardMetricLayouts(template.rdMetricLayouts).filter((item) => item.id !== layoutId),
    }))
  }

  const handleAddSheetsDashboardMetric = (metricKey) => {
    updateDraftDashboardTemplate((template) => ({
      ...template,
      sheetsMetricLayouts: [
        ...normalizeDashboardMetricLayouts(template.sheetsMetricLayouts),
        {
          id: globalThis.crypto?.randomUUID?.() || `dashboard-card-${metricKey}-${Date.now()}`,
          metricKey,
          size: 'sm',
        },
      ],
    }))
  }

  const handleRemoveSheetsDashboardMetric = (layoutId) => {
    updateDraftDashboardTemplate((template) => ({
      ...template,
      sheetsMetricLayouts: normalizeDashboardMetricLayouts(template.sheetsMetricLayouts).filter((item) => item.id !== layoutId),
    }))
  }

  const handleDashboardMetricSizeToggle = (source, layoutId) => {
    const fieldName =
      source === 'meta'
        ? 'metaMetricLayouts'
        : source === 'rd'
          ? 'rdMetricLayouts'
          : 'sheetsMetricLayouts'

    updateDraftDashboardTemplate((template) => ({
      ...template,
      [fieldName]: normalizeDashboardMetricLayouts(template[fieldName]).map((item) =>
        item.id === layoutId
          ? {
              ...item,
              size: item.size === 'lg' ? 'sm' : 'lg',
            }
          : item
      ),
    }))
  }

  const handleDashboardMetricDragStart = (source, layoutId) => {
    setDashboardMetricDragState({ source, layoutId })
  }

  const handleDashboardMetricDrop = (source, targetLayoutId) => {
    if (!dashboardMetricDragState || dashboardMetricDragState.source !== source) return
    if (dashboardMetricDragState.layoutId === targetLayoutId) return

    const fieldName =
      source === 'meta'
        ? 'metaMetricLayouts'
        : source === 'rd'
          ? 'rdMetricLayouts'
          : 'sheetsMetricLayouts'

    updateDraftDashboardTemplate((template) => {
      const currentLayouts = normalizeDashboardMetricLayouts(template[fieldName])
      const sourceIndex = currentLayouts.findIndex((item) => item.id === dashboardMetricDragState.layoutId)
      const targetIndex = currentLayouts.findIndex((item) => item.id === targetLayoutId)

      if (sourceIndex === -1 || targetIndex === -1) return template

      const nextLayouts = [...currentLayouts]
      const [movedItem] = nextLayouts.splice(sourceIndex, 1)
      nextLayouts.splice(targetIndex, 0, movedItem)

      return {
        ...template,
        [fieldName]: nextLayouts,
      }
    })

    setDashboardMetricDragState(null)
  }

  const handleDashboardMetricDragEnd = () => {
    setDashboardMetricDragState(null)
  }

  const handleToggleNewClientDashboardIntegration = (integrationKey) => {
    setNewClientDashboardIntegrationKeys((current) => {
      const normalizedCurrent = normalizeClientDashboardIntegrationKeys(current)
      if (normalizedCurrent.includes(integrationKey)) {
        const nextKeys = normalizedCurrent.filter((item) => item !== integrationKey)
        return nextKeys.length ? nextKeys : normalizedCurrent
      }

      return [...normalizedCurrent, integrationKey]
    })
  }

  const handleToggleManualCrmForActiveClient = async (enabled) => {
    if (!canEditActiveClient || !activeClient?.id) return

    const hasAgendorConfigured = String(activeClient?.integrations?.agendorToken || '').trim() || normalizeIntegrationList(activeClient.agendorPipelineIds || activeClient.agendorAccountId || activeClient.rdPipelineId).length > 0
    const nextCrmProvider = enabled ? 'manual' : (hasAgendorConfigured ? 'agendor' : '')
    const nextCrmMode = enabled ? 'manual' : nextCrmProvider
    const manualCrmSummary = activeClient.manualCrmSummary || {}
    const nextClients = clients.map((client) => {
      if (client.id !== activeClient.id) return client

      const dashboardVisibleIntegrationKeys = enabled
        ? ensureAgendorDashboardVisibility(client)
        : normalizeClientDashboardIntegrationKeys(client.dashboardVisibleIntegrationKeys)

      return createClientRecord({
        ...client,
        crmProvider: nextCrmProvider,
        crmMode: nextCrmMode,
        manualCrmSummary,
        dashboardVisibleIntegrationKeys,
      })
    })
    setClients(nextClients)

    const updatedActiveClient = nextClients.find((client) => client.id === activeClient.id) || {
      ...activeClient,
      crmProvider: nextCrmProvider,
      crmMode: nextCrmMode,
      manualCrmSummary,
      dashboardVisibleIntegrationKeys: enabled
        ? ensureAgendorDashboardVisibility(activeClient)
        : normalizeClientDashboardIntegrationKeys(activeClient.dashboardVisibleIntegrationKeys),
    }

    setIsSavingIntegrations(true)
    try {
      const response = await fetch(`/api/saas/clients/${activeClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmProvider: nextCrmProvider,
          crmMode: nextCrmMode,
          manualCrmSummary,
          dashboardVisibleIntegrationKeys: updatedActiveClient.dashboardVisibleIntegrationKeys,
          business_data: {
            crmProvider: nextCrmProvider,
            crmMode: nextCrmMode,
            manualCrmSummary,
          },
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || data?.detail || 'Não foi possível salvar o modo de CRM deste cliente.')
      }

      await persistWorkspaceState({ clients: nextClients, activeClientId })
      if (enabled) {
        setRdSummary(buildManualCrmSummary(manualCrmSummary, insights))
        setPreviousRdSummary(null)
      }
    } catch (error) {
      alert(error?.message || 'Não foi possível salvar o modo de CRM deste cliente.')
    } finally {
      setIsSavingIntegrations(false)
    }
  }

  const handleToggleActiveClientDashboardIntegration = (integrationKey) => {
    if (!canEditActiveClient) return

    updateActiveClient((client) => {
      const normalizedCurrent = normalizeClientDashboardIntegrationKeys(client.dashboardVisibleIntegrationKeys)
      const nextKeys = normalizedCurrent.includes(integrationKey)
        ? normalizedCurrent.filter((item) => item !== integrationKey)
        : [...normalizedCurrent, integrationKey]

      return {
        ...client,
        dashboardVisibleIntegrationKeys: nextKeys.length ? nextKeys : normalizedCurrent,
      }
    })
  }

  const handleCreateClient = async (event) => {
    event.preventDefault()
    if (!isMaster) return
    const trimmedName = newClientName.trim()
    if (!trimmedName) return

    const normalizedDashboardIntegrationKeys = normalizeClientDashboardIntegrationKeys(
      newClientManualCrmEnabled
        ? [...new Set([...newClientDashboardIntegrationKeys, 'agendor'])]
        : newClientDashboardIntegrationKeys
    )
    const newClient = createClientRecord({
      name: trimmedName,
      cnpj: normalizeCnpjInput(newClientCnpj),
      logoUrl: newClientLogoUrl,
      metaAdAccountId: newClientMetaAdAccountId,
      googleAdsAccountId: newClientGoogleAdsAccountId,
      leadsSheetUrl: newClientLeadsSheetUrl.trim(),
      resultManagerUserId: newClientResultManagerUserId,
      dashboardColor: normalizedNewClientDashboardColor,
      operationEnabled: false,
      dashboardEnabled: true,
      crmProvider: newClientManualCrmEnabled ? 'manual' : '',
      manualCrmSummary: newClientManualCrmEnabled ? {} : undefined,
      dashboardVisibleIntegrationKeys: normalizedDashboardIntegrationKeys,
      salesModel: '',
      implementationPhase: '',
      implementationObservation: '',
      implementationChecklist: [],
      startDate: '',
      status: 'Ativo',
    })
    const nextClients = [...clients, newClient]

    setClients(nextClients)
    setActiveClientId(newClient.id)
    setActiveTab('clientes')
    setNewClientName('')
    setNewClientCnpj('')
    setNewClientMetaAdAccountId('')
    setNewClientGoogleAdsAccountId('')
    setNewClientDashboardColor(appAccentColor)
    setNewClientLogoUrl('')
    setNewClientResultManagerUserId('')
    setNewClientManualCrmEnabled(false)
    setNewClientOperationEnabled(false)
    setNewClientDashboardEnabled(true)
    setNewClientDashboardIntegrationKeys(['meta_ads', 'agendor'])
    setCreateClientStep('identity')
    setClientEditSection('geral')
    setIsCreateClientModalOpen(false)
    setIsEditClientModalOpen(false)

    try {
      await persistWorkspaceState({ clients: nextClients, activeClientId: newClient.id })
    } catch (error) {
      alert(error.message || 'Cliente criado na tela, mas não foi possível salvar no Supabase agora.')
    }

    // Auto-create password space for the new client (best-effort)
    fetch('/api/clients/password-spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: newClient.id }),
    }).catch(() => {})
  }

  const handleRemoveClient = async (clientId) => {
    if (!isMaster) return
    const nextClients = clients.filter((client) => client.id !== clientId)
    const nextActiveClientId = clientId === activeClientId ? nextClients[0]?.id || '' : activeClientId
    const nextClientGroups = clientGroups.map((group) => ({
      ...group,
      clientIds: group.clientIds.filter((currentClientId) => currentClientId !== clientId),
    }))

    setClients(nextClients)
    setClientGroups(nextClientGroups)

    if (clientId === activeClientId) {
      setActiveClientId(nextActiveClientId)
    }

    try {
      await persistWorkspaceState({ clients: nextClients, clientGroups: nextClientGroups, activeClientId: nextActiveClientId })
    } catch (error) {
      alert(error.message || 'Cliente removido na tela, mas não foi possível atualizar o Supabase agora.')
    }
  }

  const handleArchiveClient = async (clientId, archive) => {
    if (!canEditClientRecord(clientId)) return
    setClients((current) => current.map((c) => c.id === clientId ? { ...c, isArchived: archive } : c))
    try {
      await fetch(`/api/clients/${clientId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: archive }),
      })
    } catch (err) {
      console.error('Erro ao arquivar cliente', err)
    }
  }

  const handleCreateClientGroup = (event) => {
    event.preventDefault()
    if (!isMaster) return

    const trimmedName = newClientGroupName.trim()
    if (!trimmedName) return

    setClientGroups((currentGroups) => [...currentGroups, createClientGroupRecord({ name: trimmedName })])
    setNewClientGroupName('')
    setIsCreateClientGroupModalOpen(false)
  }

  const handleCreateProduct = (event) => {
    event.preventDefault()
    if (!isMaster) return
    const trimmedName = newProductName.trim()
    if (!trimmedName) return

    setProducts((currentProducts) => [...currentProducts, createProductRecord({ name: trimmedName })])
    setNewProductName('')
  }

  const buildOperationSubtasksFromLane = useCallback((laneKey, fallbackStatus) => {
    const defaultStatus = fallbackStatus || operationStatuses[0]?.key || 'aberto'
    return (operationLanesByKey.get(laneKey)?.defaultSubtasks || []).map((title) =>
      createOperationSubtaskRecord({ title, status: defaultStatus })
    )
  }, [operationLanesByKey, operationStatuses])

  const handleCreateOperationCard = async (event) => {
    event.preventDefault()
    if (!canPersistClientChanges) return
    if (!newOperationClientId || !newOperationTitle.trim()) return

    const linkedClient = clientsById.get(newOperationClientId)
    const now = new Date().toISOString()
    const lane = operationLanesByKey.get(newOperationLane)
      ? newOperationLane
      : resolveOperationLaneFromSalesModel(linkedClient?.salesModel)
    const status = operationStatusesByKey.get(newOperationStatus)
      ? newOperationStatus
      : operationStatuses[0]?.key || 'aberto'

    try {
      const res = await fetch('/api/operation/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: newOperationClientId,
          title: newOperationTitle.trim(),
          content: newOperationContent.trim() || null,
          task_type: newOperationTaskType,
          lane,
          status,
          priority: newOperationPriority,
          assignee_ids: newOperationAssigneeIds,
          tags: normalizeSelectOptionsInput(newOperationTags),
          segment: linkedClient?.segment || '',
          tier: linkedClient?.tier || '',
          squad: linkedClient?.squad || '',
        }),
      })
      const json = await res.json()
      if (json.card) {
        const c = json.card
        const nextCard = {
          id: c.id,
          taskCode: c.task_code,
          taskType: c.task_type,
          clientId: c.client_id,
          title: c.title,
          content: c.content,
          lane: c.lane,
          status: c.status,
          priority: c.priority,
          assigneeIds: c.assignee_ids || [],
          tags: c.tags || [],
          subtasks: buildOperationSubtasksFromLane(lane, status),
          comments: [],
          customFieldValues: {},
          segment: c.segment,
          tier: c.tier,
          squad: c.squad,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }
        setOperationCards((current) => [nextCard, ...current])
        setExpandedOperationCardId(nextCard.id)
      }
    } catch (_) {}

    setIsOperationCreateModalOpen(false)
    setNewOperationClientId('')
    setNewOperationTitle('')
    setNewOperationContent('')
    setNewOperationAssigneeIds([])
    setNewOperationTags('')
    setNewOperationTaskType(operationTaskTypeOptions[0] || 'Tarefa')
    setNewOperationPriority('sem_prioridade')
    setNewOperationLane('setup')
    setNewOperationStatus(operationStatuses[0]?.key || 'aberto')
  }

  const handleOperationCardFieldChange = (cardId, fieldName, value) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return
    if (JSON.stringify(currentCard[fieldName]) === JSON.stringify(value)) return

    const activity = buildOperationCardFieldActivityMessage(currentCard, fieldName, value)

    // Map frontend field names to DB column names
    const dbFieldMap = {
      lane: 'lane', status: 'status', priority: 'priority', title: 'title',
      content: 'content', taskType: 'task_type', assigneeIds: 'assignee_ids',
      tags: 'tags', subtasks: 'subtasks', comments: 'comments',
      dueDate: 'due_date', startDate: 'start_date', segment: 'segment',
      tier: 'tier', squad: 'squad', isArchived: 'is_archived',
    }
    const dbField = dbFieldMap[fieldName]
    if (dbField) {
      fetch('/api/operation/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cardId, [dbField]: value }),
      }).catch(() => {})
    }

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              [fieldName]: value,
              comments: activity ? appendOperationActivityComment(card.comments, activity.body, activity.type) : card.comments,
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const handleMoveOperationCard = (cardId, lane) => {
    handleOperationCardFieldChange(cardId, 'lane', lane)
  }

  const handleToggleOperationCardExpansion = (cardId) => {
    setExpandedOperationCardId(cardId || '')
  }

  const handleToggleOperationCardAssignee = (cardId, userId) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return

    const nextAssigneeIds = currentCard.assigneeIds.includes(userId)
      ? currentCard.assigneeIds.filter((item) => item !== userId)
      : [...currentCard.assigneeIds, userId]
    const responsible = nextAssigneeIds
      .map((assigneeId) => operationUsersById.get(assigneeId)?.full_name || operationUsersById.get(assigneeId)?.email || '')
      .filter(Boolean)
      .join(', ')
    const previousResponsible = (currentCard.assigneeIds || []).map((assigneeId) => getOperationAssigneeLabel(assigneeId)).filter(Boolean)
    const nextResponsible = nextAssigneeIds.map((assigneeId) => getOperationAssigneeLabel(assigneeId)).filter(Boolean)
    const activityMessage = JSON.stringify(previousResponsible) === JSON.stringify(nextResponsible)
      ? ''
      : nextResponsible.length
        ? `atualizou os responsáveis para ${nextResponsible.join(', ')}.`
        : 'removeu todos os responsáveis do card.'

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              assigneeIds: nextAssigneeIds,
              responsible,
              comments: activityMessage ? appendOperationActivityComment(card.comments, activityMessage) : card.comments,
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const handleAddOperationComment = (cardId) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return

    const body = String(newOperationCommentByCard[cardId] || '').trim()
    if (!body) return

    const mentionUserIds = Array.isArray(newOperationCommentMentionsByCard[cardId])
      ? newOperationCommentMentionsByCard[cardId].filter(Boolean)
      : []

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              comments: [
                ...(card.comments || []),
                createOperationCommentRecord({
                  body,
                  authorId: user?.id || '',
                  authorName: profile?.full_name || user?.email || 'Equipe',
                  kind: 'comment',
                  mentionUserIds,
                }),
              ],
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
    setNewOperationCommentByCard((current) => ({ ...current, [cardId]: '' }))
    setNewOperationCommentMentionsByCard((current) => ({ ...current, [cardId]: [] }))
  }

  const toggleOperationCommentMentionUser = (cardId, userId) => {
    if (!userId) return

    setNewOperationCommentMentionsByCard((current) => {
      const currentIds = Array.isArray(current[cardId]) ? current[cardId] : []
      const nextIds = currentIds.includes(userId)
        ? currentIds.filter((item) => item !== userId)
        : [...currentIds, userId]

      return {
        ...current,
        [cardId]: nextIds,
      }
    })
  }

  const handleAddOperationSubtask = (cardId) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return

    const draftTitle = String(newOperationSubtaskByCard[cardId] || '').trim()
    if (!draftTitle) return

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              subtasks: [
                ...(card.subtasks || []),
                createOperationSubtaskRecord({
                  title: draftTitle,
                  status: card.status || operationStatuses[0]?.key || 'aberto',
                }),
              ],
              comments: appendOperationActivityComment(card.comments, `adicionou a subtarefa "${draftTitle}".`),
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
    setNewOperationSubtaskByCard((current) => ({ ...current, [cardId]: '' }))
  }

  const handleOperationSubtaskFieldChange = (cardId, subtaskId, fieldName, value) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return

    const currentSubtask = (currentCard.subtasks || []).find((subtask) => subtask.id === subtaskId)
    const activityMessage = (() => {
      if (!currentSubtask) return ''
      if (fieldName === 'completed' && Boolean(currentSubtask.completed) !== Boolean(value)) {
        return Boolean(value)
          ? `concluiu a subtarefa "${currentSubtask.title || 'Subtarefa'}".`
          : `reabriu a subtarefa "${currentSubtask.title || 'Subtarefa'}".`
      }
      if (fieldName === 'status' && String(currentSubtask.status || '') !== String(value || '')) {
        const previousLabel = operationStatusesByKey.get(currentSubtask.status)?.label || currentSubtask.status
        const nextLabel = operationStatusesByKey.get(value)?.label || value
        return `alterou o status da subtarefa "${currentSubtask.title || 'Subtarefa'}" de ${previousLabel} para ${nextLabel}.`
      }
      return ''
    })()

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              subtasks: (card.subtasks || []).map((subtask) =>
                subtask.id === subtaskId
                  ? {
                      ...subtask,
                      [fieldName]: value,
                      completed: fieldName === 'completed' ? Boolean(value) : subtask.completed,
                      updatedAt: new Date().toISOString(),
                    }
                  : subtask
              ),
              comments: activityMessage ? appendOperationActivityComment(card.comments, activityMessage) : card.comments,
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const handleToggleOperationSubtaskAssignee = (cardId, subtaskId, userId) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              subtasks: (card.subtasks || []).map((subtask) =>
                subtask.id === subtaskId
                  ? {
                      ...subtask,
                      assigneeIds: subtask.assigneeIds.includes(userId)
                        ? subtask.assigneeIds.filter((item) => item !== userId)
                        : [...subtask.assigneeIds, userId],
                      updatedAt: new Date().toISOString(),
                    }
                  : subtask
              ),
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const handleRemoveOperationSubtask = (cardId, subtaskId) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return

    const removedSubtask = (currentCard.subtasks || []).find((subtask) => subtask.id === subtaskId)

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              subtasks: (card.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
              comments: removedSubtask ? appendOperationActivityComment(card.comments, `removeu a subtarefa "${removedSubtask.title || 'Subtarefa'}".`, 'subtask') : card.comments,
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const getOperationAssigneeLabel = (userId) => {
    const managedUser = operationUsersById.get(userId)
    return managedUser?.full_name || managedUser?.email || 'Usuário'
  }

  const getOperationAssigneeInitials = (userId) => {
    const label = getOperationAssigneeLabel(userId).trim()
    if (!label) return 'U'

    const parts = label.split(/\s+/).filter(Boolean)
    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || label.slice(0, 2).toUpperCase()
  }

  const getOperationActorName = () => profile?.full_name || user?.email || 'Equipe'

  const appendOperationActivityComment = (comments, body, activityType = 'update') => {
    if (!String(body || '').trim()) return comments || []

    return [
      ...(comments || []),
      createOperationCommentRecord({
        body,
        authorId: user?.id || '',
        authorName: getOperationActorName(),
        kind: 'activity',
        activityType,
      }),
    ]
  }

  const buildOperationCardFieldActivityMessage = (card, fieldName, value) => {
    if (fieldName === 'status') {
      const previousLabel = operationStatusesByKey.get(card.status)?.label || card.status
      const nextLabel = operationStatusesByKey.get(value)?.label || value
      return previousLabel === nextLabel ? null : { body: `alterou o status de ${previousLabel} para ${nextLabel}.`, type: 'status' }
    }

    if (fieldName === 'lane') {
      const previousLabel = operationLanesByKey.get(card.lane)?.label || card.lane
      const nextLabel = operationLanesByKey.get(value)?.label || value
      return previousLabel === nextLabel ? null : { body: `moveu o card de ${previousLabel} para ${nextLabel}.`, type: 'lane' }
    }

    if (fieldName === 'priority') {
      const previousLabel = OPERATION_PRIORITY_LABELS[card.priority || 'sem_prioridade'] || 'Sem prioridade'
      const nextLabel = OPERATION_PRIORITY_LABELS[value || 'sem_prioridade'] || 'Sem prioridade'
      return previousLabel === nextLabel ? null : { body: `alterou a prioridade de ${previousLabel} para ${nextLabel}.`, type: 'priority' }
    }

    if (fieldName === 'taskType') {
      const previousLabel = card.taskType || 'Tarefa'
      const nextLabel = value || 'Tarefa'
      return previousLabel === nextLabel ? null : { body: `alterou o tipo de tarefa de ${previousLabel} para ${nextLabel}.`, type: 'task_type' }
    }

    if (fieldName === 'startDate' || fieldName === 'dueDate') {
      const fieldLabel = fieldName === 'startDate' ? 'data de início' : 'data de entrega'
      const previousLabel = card[fieldName] ? formatClientDate(card[fieldName]) : 'não definida'
      const nextLabel = value ? formatClientDate(value) : 'não definida'
      return previousLabel === nextLabel ? null : { body: `alterou a ${fieldLabel} de ${previousLabel} para ${nextLabel}.`, type: 'date' }
    }

    if (fieldName === 'tags') {
      const previousTags = Array.isArray(card.tags) ? card.tags : []
      const nextTags = Array.isArray(value) ? value : []
      if (JSON.stringify(previousTags) === JSON.stringify(nextTags)) return null
      return {
        body: nextTags.length
          ? `atualizou as tags do card para ${nextTags.join(', ')}.`
          : 'removeu todas as tags do card.',
        type: 'tags',
      }
    }

    return null
  }

  const handleToggleOperationCardTag = (cardId, tagLabel) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId) || !tagLabel) return

    const nextTags = (currentCard.tags || []).includes(tagLabel)
      ? (currentCard.tags || []).filter((tag) => tag !== tagLabel)
      : [...(currentCard.tags || []), tagLabel]

    handleOperationCardFieldChange(cardId, 'tags', nextTags)
  }

  const handleToggleNewOperationTag = (tagLabel) => {
    if (!tagLabel) return

    setNewOperationTags((current) => {
      const currentTags = normalizeSelectOptionsInput(current)
      const nextTags = currentTags.includes(tagLabel)
        ? currentTags.filter((tag) => tag !== tagLabel)
        : [...currentTags, tagLabel]

      return nextTags.join(', ')
    })
  }

  const getOperationTrackedMinutes = (card) => {
    const baseMinutes = Number.isFinite(Number(card?.timeTrackedMinutes)) ? Math.max(0, Number(card.timeTrackedMinutes)) : 0
    if (!card?.timeTrackerStartedAt) return baseMinutes

    const startedAt = new Date(card.timeTrackerStartedAt).getTime()
    if (Number.isNaN(startedAt)) return baseMinutes

    return baseMinutes + Math.max(0, Math.floor((operationTimeNow - startedAt) / 60000))
  }

  const handleToggleOperationTimeTracker = (cardId) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId)) return

    const now = new Date()
    const startedAt = currentCard.timeTrackerStartedAt ? new Date(currentCard.timeTrackerStartedAt).getTime() : Number.NaN

    if (currentCard.timeTrackerStartedAt && !Number.isNaN(startedAt)) {
      const additionalMinutes = Math.max(0, Math.floor((now.getTime() - startedAt) / 60000))
      setOperationCards((current) =>
        current.map((card) =>
          card.id === cardId
            ? {
                ...card,
                timeTrackedMinutes: (card.timeTrackedMinutes || 0) + additionalMinutes,
                timeTrackerStartedAt: '',
                comments: appendOperationActivityComment(card.comments, `pausou o rastreio de tempo em ${formatMinutesToDuration((card.timeTrackedMinutes || 0) + additionalMinutes)}.`, 'timer'),
                updatedAt: new Date().toISOString(),
              }
            : card
        )
      )
      return
    }

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              timeTrackerStartedAt: now.toISOString(),
              comments: appendOperationActivityComment(card.comments, 'iniciou o rastreio de tempo.', 'timer'),
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const handleOperationCustomFieldValueChange = (cardId, fieldKey, value) => {
    const currentCard = operationCards.find((card) => card.id === cardId)
    if (!currentCard || !canEditClientRecord(currentCard.clientId) || !fieldKey) return
    const previousValue = String(currentCard.customFieldValues?.[fieldKey] || '')
    const nextValue = String(value || '')
    if (previousValue === nextValue) return
    const fieldLabel = operationCustomFields.find((field) => field.key === fieldKey)?.label || fieldKey

    setOperationCards((current) =>
      current.map((card) =>
        card.id === cardId
          ? {
              ...card,
              customFieldValues: {
                ...(card.customFieldValues || {}),
                [fieldKey]: nextValue,
              },
              comments: appendOperationActivityComment(
                card.comments,
                `atualizou o campo "${fieldLabel}" de ${previousValue || 'vazio'} para ${nextValue || 'vazio'}.`,
                'custom_field'
              ),
              updatedAt: new Date().toISOString(),
            }
          : card
      )
    )
  }

  const handleOperationCardDragStart = (cardId) => {
    setOperationDragCardId(cardId)
  }

  const handleOperationCardDrop = (laneKey) => {
    if (!operationDragCardId) return
    handleMoveOperationCard(operationDragCardId, laneKey)
    setOperationDragCardId('')
  }

  const handleCreateClientCustomColumn = (event) => {
    event.preventDefault()
    if (!canManageClients) return
    const trimmedLabel = newClientColumnLabel.trim()
    if (!trimmedLabel) return

    const newColumn = createClientCustomColumnRecord({
      label: trimmedLabel,
      type: newClientColumnType,
      options: newClientColumnType === 'select' ? normalizeSelectOptionsInput(newClientColumnOptions) : [],
      tabKey: newClientColumnTab,
      formulaExpression: newClientColumnType === 'formula' ? newClientColumnFormula : '',
    })

    setClientCustomColumns((current) => [...current, newColumn])
    setNewClientColumnLabel('')
    setNewClientColumnType('text')
    setNewClientColumnOptions('')
    setNewClientColumnTab(clientRegistryView || 'geral')
    setNewClientColumnFormula('')
    setClientRegistryManagerMode('edit_tab')
  }

  const handleCreateClientCustomTab = (event) => {
    event.preventDefault()
    if (!canManageClients) return
    const trimmedLabel = newClientTabLabel.trim()
    if (!trimmedLabel) return

    const nextTab = createClientCustomTabRecord({ label: trimmedLabel })
    setClientCustomTabs((current) => [
      ...current,
      nextTab,
    ])
    setClientRegistryView(nextTab.key)
    setNewClientTabLabel('')
    setClientRegistryManagerMode('edit_tab')
  }

  const handleProductFieldChange = (productId, fieldName, value) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              [fieldName]: value,
            }
          : product
      )
    )
  }

  const handleRemoveProduct = (productId) => {
    if (!isMaster) return
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId))
    setClients((currentClients) =>
      currentClients.map((client) =>
        client.productId === productId
          ? {
              ...client,
              productId: '',
              product: '',
            }
          : client
      )
    )
  }

  const handleClientCustomColumnFieldChange = (columnId, fieldName, value) => {
    if (!canManageClients) return
    setClientCustomColumns((current) =>
      current.map((column) =>
        column.id === columnId
          ? createClientCustomColumnRecord({
              ...column,
              [fieldName]: fieldName === 'options' ? normalizeSelectOptionsInput(value) : value,
              options:
                fieldName === 'type' && value !== 'select'
                  ? []
                  : fieldName === 'options'
                    ? normalizeSelectOptionsInput(value)
                    : column.options,
              formulaExpression:
                fieldName === 'type' && value !== 'formula'
                  ? ''
                  : fieldName === 'formulaExpression'
                    ? String(value || '')
                    : column.formulaExpression,
              key: column.key,
            })
          : column
      )
    )
  }

  const handleClientSystemFieldChange = (fieldKey, fieldName, value) => {
    if (!canManageClients) return
    setClientSystemFields((current) => {
      const baseFields = Array.isArray(current) && current.length ? current : DEFAULT_CLIENT_SYSTEM_FIELDS
      return baseFields.map((field) =>
        field.key === fieldKey
          ? createClientCustomColumnRecord({
              ...field,
              [fieldName]: value,
              key: field.key,
            })
          : field
      )
    })
  }

  const handleRemoveClientCustomColumn = (columnKey) => {
    if (!canManageClients) return
    setClientCustomColumns((current) => current.filter((column) => column.key !== columnKey))
    setClientCustomTabs((current) =>
      current.map((tab) => ({
        ...tab,
        columnKeys: (tab.columnKeys || []).filter((currentKey) => currentKey !== columnKey),
      }))
    )
    setClients((current) =>
      current.map((client) => {
        const nextCustomFieldValues = { ...(client.customFieldValues || {}) }
        delete nextCustomFieldValues[columnKey]
        return {
          ...client,
          customFieldValues: nextCustomFieldValues,
        }
      })
    )
  }

  const handleClientCustomTabFieldChange = (tabId, fieldName, value) => {
    if (!canManageClients) return
    setClientCustomTabs((current) =>
      current.map((tab) =>
        tab.id === tabId
          ? createClientCustomTabRecord({
              ...tab,
              [fieldName]: value,
              key: tab.key,
            })
          : tab
      )
    )
  }

  const handleClientTabOverrideChange = (tabKey, nextLabel) => {
    if (!canManageClients) return
    const trimmedLabel = String(nextLabel || '').trim()

    setClientTabOverrides((current) => {
      const otherTabs = current.filter((tab) => tab.key !== tabKey)
      if (!trimmedLabel) return otherTabs
      return [...otherTabs, createClientTabOverrideRecord({ key: tabKey, label: trimmedLabel })]
    })
  }

  const openClientRegistryManager = (mode) => {
    if (!canManageClients) return
    if (mode === 'new_column') {
      setNewClientColumnTab(clientRegistryView || 'geral')
    }
    setClientRegistryManagerMode((current) => (current === mode ? '' : mode))
  }

  const handleClientCustomTabColumnToggle = (tabId, columnKey) => {
    if (!canManageClients) return
    setClientCustomTabs((current) =>
      current.map((tab) => {
        if (tab.id !== tabId) return tab
        const currentKeys = Array.isArray(tab.columnKeys) ? tab.columnKeys : []
        return {
          ...tab,
          columnKeys: currentKeys.includes(columnKey)
            ? currentKeys.filter((currentKey) => currentKey !== columnKey)
            : [...currentKeys, columnKey],
        }
      })
    )
  }

  const handleRemoveClientCustomTab = (tabId) => {
    if (!canManageClients) return
    setClientCustomTabs((current) => current.filter((tab) => tab.id !== tabId))
  }

  const handleClientGroupFieldChange = (groupId, fieldName, value) => {
    setClientGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              [fieldName]: value,
            }
          : group
      )
    )
  }

  const handleClientGroupClientToggle = (groupId, clientId) => {
    setClientGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) return group

        const currentClientIds = normalizeClientGroupClientIds(group.clientIds)
        const nextClientIds = currentClientIds.includes(clientId)
          ? currentClientIds.filter((currentClientId) => currentClientId !== clientId)
          : [...currentClientIds, clientId]

        return {
          ...group,
          clientIds: nextClientIds,
        }
      })
    )
  }

  const handleRemoveClientGroup = (groupId) => {
    if (!isMaster) return
    setClientGroups((currentGroups) => currentGroups.filter((group) => group.id !== groupId))
    setUsersList((currentUsers) =>
      currentUsers.map((managedUser) => ({
        ...managedUser,
        clientGroupAccess: (managedUser.clientGroupAccess || []).filter((groupAccess) => groupAccess.group_id !== groupId),
      }))
    )
  }

  const mergeUsersWithTeamProfiles = useCallback((incomingUsers, profileRows = teamProfiles) => (
    Array.isArray(incomingUsers)
      ? incomingUsers.map((managedUser) => ({
          ...managedUser,
          teamProfile:
            profileRows.find((item) => item.userId === managedUser.id) ||
            createTeamMemberProfileRecord({ userId: managedUser.id }),
        }))
      : []
  ), [teamProfiles])

  const loadUsers = useCallback(async () => {
    if (!canPersistClientChanges && role !== 'gestor_resultado') return

    try {
      setUsersLoading(true)
      const response = await fetch('/api/users', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível carregar os usuários.')
      }

      setUsersList(mergeUsersWithTeamProfiles(data))
      setSelectedUserId((current) => current || data[0]?.id || '')
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      alert(error.message || 'Não foi possível carregar os usuários.')
    } finally {
      setUsersLoading(false)
    }
  }, [canPersistClientChanges, mergeUsersWithTeamProfiles])

  useEffect(() => {
    if (!usersList.length) return
    setUsersList((current) => mergeUsersWithTeamProfiles(current))
  }, [teamProfiles, mergeUsersWithTeamProfiles, usersList.length])

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase()
    if (!term) return usersList

    return usersList.filter((managedUser) =>
      [managedUser.full_name, managedUser.email, managedUser.teamProfile?.positionTitle, managedUser.teamProfile?.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    )
  }, [usersList, userSearch])
  const mondayOwnerRankingByLookup = useMemo(
    () => new Map((mondaySummary?.ownerRanking || []).map((item) => [normalizePersonLookup(item.label), item])),
    [mondaySummary]
  )
  const mondayTasksByOwnerLookup = useMemo(() => {
    const nextMap = new Map()

    ;(mondaySummary?.taskCatalog || []).forEach((task) => {
      ;(task.owners || []).forEach((owner) => {
        const key = normalizePersonLookup(owner)
        if (!key) return
        const current = nextMap.get(key) || []
        current.push(task)
        nextMap.set(key, current)
      })
    })

    return nextMap
  }, [mondaySummary])
  const teamMemberOperationalRows = useMemo(
    () => usersList.map((managedUser) => {
      const lookupKey = normalizePersonLookup(managedUser.full_name || managedUser.email)
      const mondayOwnerSummary = mondayOwnerRankingByLookup.get(lookupKey) || null
      const mondayTasks = mondayTasksByOwnerLookup.get(lookupKey) || []
      const plannedHours = (managedUser.teamProfile?.allocations || []).reduce((sum, item) => sum + Number(item.weeklyHours || 0), 0)
      const capacityHours = Number(managedUser.teamProfile?.weeklyCapacityHours || 0)

      return {
        ...managedUser,
        mondayOwnerSummary,
        mondayTasks,
        plannedHours,
        capacityHours,
        trackedHours: Number((mondayOwnerSummary?.trackedSeconds || 0) / 3600),
      }
    }),
    [usersList, mondayOwnerRankingByLookup, mondayTasksByOwnerLookup]
  )
  const selectedManagedUserOperationalSummary = useMemo(
    () => teamMemberOperationalRows.find((item) => item.id === selectedManagedUser?.id) || null,
    [teamMemberOperationalRows, selectedManagedUser]
  )
  const currentUserOperationalSummary = useMemo(
    () => teamMemberOperationalRows.find((item) => item.id === user?.id) || null,
    [teamMemberOperationalRows, user?.id]
  )
  const metaFilteredAdsetIds = useMemo(
    () =>
      availableMetaAdsetOptions
        .filter((adset) => activeMetaAdsetIds.length === 0 || activeMetaAdsetIds.includes(adset.id))
        .map((adset) => adset.id),
    [availableMetaAdsetOptions, activeMetaAdsetIds]
  )
  const metaFilteredAdsetIdsKey = useMemo(
    () => JSON.stringify(metaFilteredAdsetIds),
    [metaFilteredAdsetIds]
  )
  const metaFilteredAdIds = useMemo(
    () =>
      availableMetaAdOptions
        .filter((ad) => activeMetaAdIds.length === 0 || activeMetaAdIds.includes(ad.id))
        .map((ad) => ad.id),
    [availableMetaAdOptions, activeMetaAdIds]
  )
  const metaFilteredAdIdsKey = useMemo(
    () => JSON.stringify(metaFilteredAdIds),
    [metaFilteredAdIds]
  )
  const hasActiveMetaCampaignNarrowing = useMemo(() => {
    const availableIds = availableMetaCampaignOptions.map((campaign) => campaign.id)
    if (!availableIds.length) return false
    return metaFilteredCampaignIds.length !== availableIds.length
  }, [availableMetaCampaignOptions, metaFilteredCampaignIds])
  const hasActiveMetaAdsetNarrowing = useMemo(() => {
    const availableIds = availableMetaAdsetOptions.map((adset) => adset.id)
    if (!availableIds.length) return false
    return metaFilteredAdsetIds.length !== availableIds.length
  }, [availableMetaAdsetOptions, metaFilteredAdsetIds])
  const hasActiveMetaAdNarrowing = useMemo(() => {
    const availableIds = availableMetaAdOptions.map((ad) => ad.id)
    if (!availableIds.length) return false
    return metaFilteredAdIds.length !== availableIds.length
  }, [availableMetaAdOptions, metaFilteredAdIds])

  useEffect(() => {
    metaFilteredCampaignIdsRef.current = metaFilteredCampaignIds
  }, [metaFilteredCampaignIds])

  useEffect(() => {
    metaFilteredAdsetIdsRef.current = metaFilteredAdsetIds
  }, [metaFilteredAdsetIds])

  useEffect(() => {
    metaFilteredAdIdsRef.current = metaFilteredAdIds
  }, [metaFilteredAdIds])

  useEffect(() => {
    lastDashboardFetchKeyRef.current = ''
    lastCompletedDashboardFetchKeyRef.current = ''
    lastMetaStructureFetchKeyRef.current = ''
    lastCompletedMetaStructureFetchKeyRef.current = ''
    lastBreakdownsFetchKeyRef.current = ''
    setInsights(null)
    setPreviousInsights(null)
    setGoogleAdsSummary(null)
    setGoogleAdsError('')
    setDailyData([])
    setDailyCampaignData([])
    setCampaigns([])
    setMetaHierarchy([])
    setBreakdowns(EMPTY_META_BREAKDOWNS)
    setMetaRankingDrilldown(null)
    setMetaRankingDetailDailyData([])
    setRankingsError('')
  }, [activeClientId, selectedAdAccount, selectedGoogleAdsAccount])

  const handleUserClientToggle = (clientId) => {
    setUserForm((current) => ({
      ...current,
      clientIds: current.clientIds.includes(clientId)
        ? current.clientIds.filter((id) => id !== clientId)
        : [...current.clientIds, clientId],
    }))
  }

  const handleUserClientGroupToggle = (groupId) => {
    setUserForm((current) => ({
      ...current,
      clientGroupIds: current.clientGroupIds.includes(groupId)
        ? current.clientGroupIds.filter((id) => id !== groupId)
        : [...current.clientGroupIds, groupId],
    }))
  }

  const getManagedUserAccessibleClientCount = useCallback((managedUser) => {
    if (!managedUser) return 0
    if (managedUser.role === 'master') return clients.length

    const accessibleClientIds = new Set(
      (managedUser.clientAccess || [])
        .filter((item) => item.can_view)
        .map((item) => item.client_id)
        .filter((clientId) => clientIdsSet.has(clientId))
    )

    ;(managedUser.clientGroupAccess || [])
      .filter((item) => item.can_view)
      .forEach((groupAccess) => {
        const group = clientGroupsById.get(groupAccess.group_id)
        ;(group?.clientIds || []).forEach((clientId) => {
          if (clientIdsSet.has(clientId)) {
            accessibleClientIds.add(clientId)
          }
        })
      })

    return accessibleClientIds.size
  }, [clients.length, clientGroupsById, clientIdsSet])

  const handleMetaResultFilterToggle = (filterKey) => {
    setDraftMetaResultFilters((current) => {
      const availableKeys = availableMetaResultFilters.map((item) => item.key)
      const normalizedCurrent = normalizeMetaResultFilters(current, availableKeys)

      if (normalizedCurrent.includes(filterKey)) {
        const nextFilters = normalizedCurrent.filter((item) => item !== filterKey)
        return nextFilters.length > 0 ? nextFilters : normalizedCurrent
      }

      return [...normalizedCurrent, filterKey]
    })
  }

  const handleMetaCampaignFilterToggle = (campaignId) => {
    setDraftMetaCampaignFilters((current) => {
      const availableIds = availableMetaCampaignOptions.map((campaign) => campaign.id)
      if (!availableIds.length) return current

      const normalizedCurrent = current.length > 0
        ? current.filter((currentId) => availableIds.includes(currentId))
        : availableIds
      const isAllSelected = normalizedCurrent.length === availableIds.length

      if (isAllSelected) {
        return [campaignId]
      }

      if (normalizedCurrent.includes(campaignId)) {
        const nextFilters = normalizedCurrent.filter((currentId) => currentId !== campaignId)
        return nextFilters.length > 0 ? nextFilters : []
      }

      const nextFilters = [...normalizedCurrent, campaignId]
      return nextFilters.length === availableIds.length ? [] : nextFilters
    })
    setDraftMetaAdsetFilters([])
    setDraftMetaAdFilters([])
  }

  const handleApplyDashboardFilters = () => {
    if (activeTab === 'monday') {
      setMondayDateRange(draftMondayDateRange)
      setMondayCustomSince(draftMondayCustomSince)
      setMondayCustomUntil(draftMondayCustomUntil)
      return
    }

    if (activeTab === 'anuncios' || activeTab === 'campanhas' || activeTab === 'funil') {
      setDateRange(draftDateRange)
      setCustomSince(draftCustomSince)
      setCustomUntil(draftCustomUntil)
      return
    }

    const availableResultKeys = availableMetaResultFilters.map((item) => item.key)
    const availableCampaignIds = availableMetaCampaignOptions.map((campaign) => campaign.id)
    const availableAdsetIds = draftAvailableMetaAdsetOptions.map((adset) => adset.id)
    const availableAdIds = draftAvailableMetaAdOptions.map((ad) => ad.id)
    const availableLeadSources = rdSummary?.availableSources || []

    const normalizedResultSelection = draftMetaResultFilters.length > 0
      ? draftMetaResultFilters.filter((filterKey) => availableResultKeys.includes(filterKey))
      : []
    const normalizedCampaignSelection = draftMetaCampaignFilters.length > 0
      ? draftMetaCampaignFilters.filter((campaignId) => availableCampaignIds.includes(campaignId))
      : []
    const normalizedAdsetSelection = draftMetaAdsetFilters.length > 0
      ? draftMetaAdsetFilters.filter((adsetId) => availableAdsetIds.includes(adsetId))
      : []
    const normalizedAdSelection = draftMetaAdFilters.length > 0
      ? draftMetaAdFilters.filter((adId) => availableAdIds.includes(adId))
      : []
    const normalizedLeadSourceSelection = draftRdLeadSourceFilters.length > 0
      ? draftRdLeadSourceFilters.filter((source) => availableLeadSources.includes(source))
      : []

    setDateRange(draftDateRange)
    setCustomSince(draftCustomSince)
    setCustomUntil(draftCustomUntil)
    setMetaResultFilters(
      normalizedResultSelection.length === availableResultKeys.length ? [] : normalizedResultSelection
    )
    setMetaCampaignFilters(
      normalizedCampaignSelection.length === availableCampaignIds.length ? [] : normalizedCampaignSelection
    )
    setMetaAdsetFilters(
      normalizedAdsetSelection.length === availableAdsetIds.length ? [] : normalizedAdsetSelection
    )
    setMetaAdFilters(
      normalizedAdSelection.length === availableAdIds.length ? [] : normalizedAdSelection
    )
    setRdPipelineFilter(draftRdPipelineFilter)
    setRdSellerFilter(draftRdSellerFilter)
    setRdLeadSourceFilters(
      normalizedLeadSourceSelection.length === availableLeadSources.length ? [] : normalizedLeadSourceSelection
    )
    updateActiveClient((client) => ({
      ...client,
      rdPipelineId: draftRdPipelineFilter,
      funnelSteps: activeDraftFunnelSteps,
      dashboardTemplates: cloneDashboardTemplates(activeDraftDashboardTemplates),
      activeDashboardTemplateId:
        draftDashboardTemplateId ||
        activeDraftDashboardTemplates[0]?.id ||
        client.activeDashboardTemplateId,
    }))
  }

  const handleMetaAdsetFilterToggle = (adsetId) => {
    setDraftMetaAdsetFilters((current) => {
      const availableIds = draftAvailableMetaAdsetOptions.map((adset) => adset.id)
      if (!availableIds.length) return current

      const normalizedCurrent = current.length > 0
        ? current.filter((currentId) => availableIds.includes(currentId))
        : availableIds

      if (normalizedCurrent.includes(adsetId)) {
        const nextFilters = normalizedCurrent.filter((currentId) => currentId !== adsetId)
        return nextFilters.length > 0 ? nextFilters : normalizedCurrent
      }

      const nextFilters = [...normalizedCurrent, adsetId]
      return nextFilters.length === availableIds.length ? [] : nextFilters
    })
  }

  const handleMetaAdFilterToggle = (adId) => {
    setDraftMetaAdFilters((current) => {
      const availableIds = draftAvailableMetaAdOptions.map((ad) => ad.id)
      if (!availableIds.length) return current

      const normalizedCurrent = current.length > 0
        ? current.filter((currentId) => availableIds.includes(currentId))
        : availableIds

      if (normalizedCurrent.includes(adId)) {
        const nextFilters = normalizedCurrent.filter((currentId) => currentId !== adId)
        return nextFilters.length > 0 ? nextFilters : normalizedCurrent
      }

      const nextFilters = [...normalizedCurrent, adId]
      return nextFilters.length === availableIds.length ? [] : nextFilters
    })
  }

  const handleRdLeadSourceToggle = (sourceLabel) => {
    setDraftRdLeadSourceFilters((current) => {
      const availableSources = rdSummary?.availableSources || []
      const currentSelection = current.length > 0 ? current.filter((source) => availableSources.includes(source)) : availableSources

      if (currentSelection.includes(sourceLabel)) {
        const nextSelection = currentSelection.filter((item) => item !== sourceLabel)
        if (nextSelection.length === 0) return currentSelection
        return nextSelection.length === availableSources.length ? [] : nextSelection
      }

      const nextSelection = [...currentSelection, sourceLabel]
      return nextSelection.length === availableSources.length ? [] : nextSelection
    })
  }

  const isMetaRateLimitMessage = (message = '') =>
    /rate limit|request limit|too many calls|too many requests/i.test(message)

  const persistWorkspaceState = async (overrides = {}) => {
    const state = {
      themeColor,
      metric1,
      metric2,
      activeClientId,
      globalIntegrations,
      clients,
      clientGroups,
      products,
      operationCards,
      operationSettings,
      clientCustomColumns,
      clientCustomTabs,
      teamProfiles,
      ...overrides,
    }

    const response = await fetch('/api/dashboard/state', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(data?.error || 'Não foi possível salvar o workspace no Supabase antes de liberar o usuário.')
    }

    return data
  }

  const handleSaveWorkspaceBranding = async (event) => {
    event?.preventDefault?.()

    try {
      setBrandingError('')
      setIsSavingBranding(true)

      const response = await fetch('/api/workspace/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branding: {
            ...brandingForm,
            onboardingCompleted: true,
          },
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível salvar a identidade visual.')
      }

      const nextBranding = {
        ...DEFAULT_WORKSPACE_BRANDING,
        ...(data?.branding || brandingForm),
        onboardingCompleted: true,
      }
      setWorkspaceBranding(nextBranding)
      setBrandingForm(nextBranding)
      setIsBrandingModalOpen(false)
    } catch (error) {
      setBrandingError(error.message || 'Não foi possível salvar a identidade visual.')
    } finally {
      setIsSavingBranding(false)
    }
  }

  const handleCreateUser = async (event) => {
    event.preventDefault()

    try {
      setCreateUserError('')
      setSavingUser(true)
      if ((userForm.clientGroupIds || []).length > 0) {
        await persistWorkspaceState()
      }
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível criar o usuário.')
      }

      setCreatedUserInvite(data.invite || null)

      setUserForm({
        fullName: '',
        email: '',
        password: '',
        role: 'visualizador',
        aiAccessLevel: 'team',
        canEditIntegrations: false,
        clientIds: [],
        clientGroupIds: [],
      })
      await loadUsers()
    } catch (error) {
      setCreateUserError(error.message || 'Não foi possível criar o usuário.')
    } finally {
      setSavingUser(false)
    }
  }

  const handleUpdateUser = async (managedUser) => {
    try {
      setEditUserError('')
      if ((managedUser.clientGroupAccess || []).length > 0) {
        await persistWorkspaceState()
      }
      const response = await fetch(`/api/users/${managedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: managedUser.full_name || '',
          role: managedUser.role,
          aiAccessLevel: managedUser.ai_access_level || (managedUser.role === 'master' ? 'master' : 'team'),
          canEditIntegrations: managedUser.role === 'master' || Boolean(managedUser.can_edit_integrations),
          clientIds: (managedUser.clientAccess || []).map((item) => item.client_id),
          clientGroupIds: [],
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível atualizar o usuário.')
      }

      setIsEditUserModalOpen(false)
      await loadUsers()
    } catch (error) {
      setEditUserError(error.message || 'Não foi possível atualizar o usuário.')
    }
  }

  const handleManagedUserChange = (userId, updater) => {
    setUsersList((current) =>
      current.map((item) => (item.id === userId ? updater(item) : item))
    )
  }

  const handleTeamProfileChange = (userId, updater) => {
    let nextProfile = null

    setTeamProfiles((current) => {
      const currentProfile = current.find((item) => item.userId === userId) || createTeamMemberProfileRecord({ userId })
      const resolvedProfileInput = typeof updater === 'function' ? updater(currentProfile) : updater
      nextProfile = createTeamMemberProfileRecord({
        ...currentProfile,
        ...resolvedProfileInput,
        userId,
      })

      const remainingProfiles = current.filter((item) => item.userId !== userId)
      return [...remainingProfiles, nextProfile]
    })

    setUsersList((current) =>
      current.map((item) => (
        item.id === userId
          ? {
              ...item,
              teamProfile: nextProfile || item.teamProfile || createTeamMemberProfileRecord({ userId }),
            }
          : item
      ))
    )
  }

  const handleTeamProfileArrayChange = (userId, fieldName, updater) => {
    handleTeamProfileChange(userId, (current) => ({
      ...current,
      [fieldName]: updater(Array.isArray(current[fieldName]) ? current[fieldName] : []),
    }))
  }

  const handleAddTeamMemberOkr = (userId) => {
    handleTeamProfileArrayChange(userId, 'okrs', (currentItems) => [
      ...currentItems,
      createTeamMemberOkrRecord({ title: 'Novo OKR', status: 'nao_iniciado' }),
    ])
  }

  const handleUpdateTeamMemberOkr = (userId, okrId, fieldName, value) => {
    handleTeamProfileArrayChange(userId, 'okrs', (currentItems) =>
      currentItems.map((item) => (item.id === okrId ? { ...item, [fieldName]: value } : item))
    )
  }

  const handleRemoveTeamMemberOkr = (userId, okrId) => {
    handleTeamProfileArrayChange(userId, 'okrs', (currentItems) =>
      currentItems.filter((item) => item.id !== okrId)
    )
  }

  const handleAddTeamMemberPdiItem = (userId) => {
    handleTeamProfileArrayChange(userId, 'pdiItems', (currentItems) => [
      ...currentItems,
      createTeamMemberPdiItemRecord({ title: 'Nova frente de desenvolvimento', status: 'planejado' }),
    ])
  }

  const handleUpdateTeamMemberPdiItem = (userId, itemId, fieldName, value) => {
    handleTeamProfileArrayChange(userId, 'pdiItems', (currentItems) =>
      currentItems.map((item) => (item.id === itemId ? { ...item, [fieldName]: value } : item))
    )
  }

  const handleRemoveTeamMemberPdiItem = (userId, itemId) => {
    handleTeamProfileArrayChange(userId, 'pdiItems', (currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    )
  }

  const handleAddTeamMemberAllocation = (userId) => {
    handleTeamProfileArrayChange(userId, 'allocations', (currentItems) => [
      ...currentItems,
      createTeamMemberAllocationRecord({}),
    ])
  }

  const handleUpdateTeamMemberAllocation = (userId, allocationId, fieldName, value) => {
    handleTeamProfileArrayChange(userId, 'allocations', (currentItems) =>
      currentItems.map((item) => (item.id === allocationId ? { ...item, [fieldName]: value } : item))
    )
  }

  const handleRemoveTeamMemberAllocation = (userId, allocationId) => {
    handleTeamProfileArrayChange(userId, 'allocations', (currentItems) =>
      currentItems.filter((item) => item.id !== allocationId)
    )
  }

  const handleDeleteUser = async (managedUserId) => {
    try {
      const response = await fetch(`/api/users/${managedUserId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível excluir o usuário.')
      }

      setIsEditUserModalOpen(false)
      setSelectedUserId('')
      setTeamProfiles((current) => current.filter((item) => item.userId !== managedUserId))
      await loadUsers()
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o usuário.')
    }
  }

  useEffect(() => {
    if (!(canManageUsers || canPersistClientChanges || role === 'gestor_resultado') || !['usuarios', 'operacao', 'clientes'].includes(activeTab)) return
    loadUsers()
  }, [canManageUsers, canPersistClientChanges, activeTab, loadUsers])

  useEffect(() => {
    if (!usersList.length) {
      setSelectedUserId('')
      return
    }

    if (selectedUserId && usersList.some((managedUser) => managedUser.id === selectedUserId)) {
      return
    }

    setSelectedUserId(usersList[0].id)
  }, [usersList, selectedUserId])

  useEffect(() => {
    if (!isCreateUserModalOpen) {
      setCreateUserError('')
    }
  }, [isCreateUserModalOpen])

  useEffect(() => {
    if (!isEditUserModalOpen) {
      setEditUserError('')
    }
  }, [isEditUserModalOpen])

  const applyClientFieldUpdate = useCallback((client, fieldName, value) => {
    const normalizedValue = CLIENT_CURRENCY_FIELDS.has(fieldName)
      ? normalizeCurrencyInput(value)
      : fieldName === 'cnpj'
        ? normalizeCnpjInput(value)
      : value

    const nextClient = {
      ...client,
      [fieldName]: normalizedValue,
    }

    if (fieldName === 'status' && normalizedValue === 'Churn' && !nextClient.churnDate) {
      nextClient.churnDate = getTodayDateInputValue()
    }

    if (fieldName === 'churnDate' && normalizedValue && nextClient.status !== 'Churn') {
      nextClient.status = 'Churn'
    }

    if (fieldName === 'salesModel') {
      const suggestedPhaseLabel = IMPLEMENTATION_PHASE_BY_SALES_MODEL[normalizedValue] || ''
      const hasSuggestedPhase = clientImplementationPhaseMap.has(suggestedPhaseLabel)
      nextClient.implementationPhase = hasSuggestedPhase ? suggestedPhaseLabel : nextClient.implementationPhase || ''
      nextClient.implementationChecklist = createImplementationChecklistForSalesModel(
        normalizedValue,
        nextClient.implementationChecklist
      )
    }

    return nextClient
  }, [clientImplementationPhaseMap])

  const handleClientFieldChange = (fieldName, value) => {
    if (fieldName === 'ltv' || fieldName === 'mmf' || fieldName === 'roiMarketing') {
      return
    }
    if (!canEditActiveClient) return

    updateActiveClient((client) => ({
      ...applyClientFieldUpdate(client, fieldName, value),
    }))
  }

  const handleClientProductChange = (clientId, productId) => {
    if (!canEditClientRecord(clientId)) return
    const selectedProduct = productsById.get(productId)
    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              productId,
              product: selectedProduct?.name || '',
            }
          : client
      )
    )
  }

  const handleActiveClientProductChange = (productId) => {
    if (!canEditActiveClient) return
    const selectedProduct = productsById.get(productId)
    updateActiveClient((client) => ({
      ...client,
      productId,
      product: selectedProduct?.name || '',
    }))
  }

  const handleClientInlineFieldChange = (clientId, fieldName, value) => {
    if (fieldName === 'ltv' || fieldName === 'mmf' || fieldName === 'roiMarketing') {
      return
    }
    if (!canEditClientRecord(clientId)) return

    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === clientId
          ? applyClientFieldUpdate(client, fieldName, value)
          : client
      )
    )
  }

  const handleClientKanbanDragStart = (clientId) => {
    if (!canEditClientRecord(clientId)) return
    setClientKanbanDragClientId(clientId)
  }

  const handleClientKanbanDragEnd = () => {
    setClientKanbanDragClientId('')
    setClientKanbanDropPhaseKey('')
  }

  const handleClientKanbanDrop = (phaseKey) => {
    if (!clientKanbanDragClientId) return
    handleClientInlineFieldChange(clientKanbanDragClientId, 'implementationPhase', phaseKey === 'sem_fase' ? '' : phaseKey)
    setClientKanbanDragClientId('')
    setClientKanbanDropPhaseKey('')
  }

  const handleClientInlineCustomFieldChange = (clientId, fieldKey, value) => {
    const column = customColumnsByKey.get(fieldKey)
    if (column?.type === 'formula') return
    if (!canEditClientRecord(clientId)) return

    const normalizedValue = column?.type === 'currency'
      ? normalizeCurrencyInput(value)
      : value

    setClients((currentClients) =>
      currentClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              customFieldValues: {
                ...(client.customFieldValues || {}),
                [fieldKey]: normalizedValue,
              },
            }
          : client
      )
    )
  }

  const handleAddClientOkr = () => {
    if (!canEditActiveClient) return

    const trimmedTitle = newClientOkrTitle.trim()
    if (!trimmedTitle) return

    updateActiveClient((client) => ({
      ...client,
      okrs: [
        ...(Array.isArray(client.okrs) ? client.okrs : []),
        {
          id: globalThis.crypto?.randomUUID?.() || `okr-${Date.now()}`,
          title: trimmedTitle,
          cadence: newClientOkrCadence,
          cycleDays: newClientOkrCadence === 'ciclo' ? String(newClientOkrCycleDays || '').trim() : '',
          completed: false,
        },
      ],
    }))

    setNewClientOkrTitle('')
    setNewClientOkrCadence('mensal')
    setNewClientOkrCycleDays('')
  }

  const handleClientOkrToggle = (okrId) => {
    if (!canEditActiveClient) return

    updateActiveClient((client) => ({
      ...client,
      okrs: (Array.isArray(client.okrs) ? client.okrs : []).map((okr) =>
        okr.id === okrId
          ? {
              ...okr,
              completed: !okr.completed,
            }
          : okr
      ),
    }))
  }

  const handleClientOkrFieldChange = (okrId, fieldName, value) => {
    if (!canEditActiveClient) return

    updateActiveClient((client) => ({
      ...client,
      okrs: (Array.isArray(client.okrs) ? client.okrs : []).map((okr) =>
        okr.id === okrId
          ? {
              ...okr,
              [fieldName]: value,
              cycleDays:
                fieldName === 'cadence' && value !== 'ciclo'
                  ? ''
                  : fieldName === 'cycleDays'
                    ? String(value || '').replace(/\D/g, '').slice(0, 3)
                    : okr.cycleDays,
            }
          : okr
      ),
    }))
  }

  const handleRemoveClientOkr = (okrId) => {
    if (!canEditActiveClient) return

    updateActiveClient((client) => ({
      ...client,
      okrs: (Array.isArray(client.okrs) ? client.okrs : []).filter((okr) => okr.id !== okrId),
    }))
  }

  const handleAddClientNote = () => {
    if (!canEditActiveClient) return

    const trimmedBody = newClientNoteBody.trim()
    if (!trimmedBody) return

    updateActiveClient((client) => ({
      ...client,
      notes: [
        {
          id: globalThis.crypto?.randomUUID?.() || `note-${Date.now()}`,
          body: trimmedBody,
          authorName: profile?.full_name || user?.email || 'Equipe',
          authorId: user?.id || '',
          createdAt: new Date().toISOString(),
        },
        ...(Array.isArray(client.notes) ? client.notes : []),
      ],
    }))

    setNewClientNoteBody('')
  }

  const handleImplementationChecklistToggle = (itemId) => {
    if (!canEditActiveClient) return

    updateActiveClient((client) => ({
      ...client,
      implementationChecklist: (Array.isArray(client.implementationChecklist) ? client.implementationChecklist : []).map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
            }
          : item
      ),
    }))
  }

  const renderClientRegistryField = (client, columnKey, mode = 'inline') => {
    const meta = getResolvedClientColumnMeta(columnKey)
    const isEditorMode = mode === 'editor'
    const isEditable = isEditorMode ? canEditActiveClient : canEditClientRecord(client.id)
    const isReadOnlyCalculatedField = ['ltv', 'mmf', 'roiMarketing', 'healthScore'].includes(columnKey)
    const value = client?.[columnKey]
    const customColumn = customColumnsByKey.get(columnKey)
    const isInlineEditing =
      !isEditorMode &&
      clientRegistryInlineEdit.clientId === client.id &&
      clientRegistryInlineEdit.columnKey === columnKey
    const isInlineHovered =
      !isEditorMode &&
      clientRegistryHover.clientId === client.id &&
      clientRegistryHover.columnKey === columnKey
    const handleInlineKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeClientRegistryInlineEdit()
      }
      if (event.key === 'Enter' && event.currentTarget.tagName !== 'TEXTAREA') {
        closeClientRegistryInlineEdit()
      }
    }
    const canInlineEditCell = Boolean(
      !isEditorMode &&
      isEditable &&
      !isReadOnlyCalculatedField &&
      columnKey !== 'implementationPhase' &&
      meta.type !== 'health' &&
      !(customColumn?.type === 'formula') &&
      !(meta.type === 'flag' && DERIVED_CLIENT_FLAG_KEYS.has(columnKey))
    )
    const renderInlineEditAction = () => (
      canInlineEditCell && isInlineHovered ? (
        <button
          type="button"
          className="client-registry-edit-trigger"
          onClick={(event) => {
            event.stopPropagation()
            openClientRegistryInlineEdit(client.id, columnKey)
          }}
          aria-label={`Editar ${meta.label}`}
        >
          <i className="bx bx-pencil"></i>
        </button>
      ) : null
    )

    const renderInlineTextCell = (content, tone = 'default') => (
      <div
        key={columnKey}
        className={`client-registry-cell client-registry-cell-readonly ${tone !== 'default' ? `client-registry-cell-${tone}` : ''}`}
        onMouseEnter={() => setClientRegistryHover({ clientId: client.id, columnKey })}
        onMouseLeave={() => setClientRegistryHover((current) => (
          current.clientId === client.id && current.columnKey === columnKey ? { clientId: '', columnKey: '' } : current
        ))}
      >
        {renderInlineEditAction()}
        {content}
      </div>
    )

    const renderInlineEmptyCell = (label = 'Nao informado') => renderInlineTextCell(
      <span className="client-registry-placeholder">{label}</span>,
      'muted'
    )

    const renderInlineValueForCustomField = (resolvedValue) => {
      if (customColumn.type === 'flag') {
        const derivedMeta = getClientFlagMeta(resolvedValue)
        return renderInlineTextCell(
          <span className={`client-status-badge client-status-${derivedMeta.tone}`}>{derivedMeta.label}</span>
        )
      }

      if (customColumn.type === 'checkbox') {
        const isChecked = String(resolvedValue || '').toLowerCase() === 'true'
        return renderInlineTextCell(
          <span className={`client-status-badge client-status-${isChecked ? 'success' : 'neutral'}`}>
            {isChecked ? 'Marcado' : 'Livre'}
          </span>
        )
      }

      if (customColumn.type === 'date') {
        return resolvedValue
          ? renderInlineTextCell(<strong>{formatClientDate(resolvedValue)}</strong>)
          : renderInlineEmptyCell('Sem data')
      }

      if (customColumn.type === 'currency') {
        return renderInlineTextCell(
          <strong>{formatClientCurrency(resolvedValue)}</strong>,
          parseClientNumber(resolvedValue) == null ? 'muted' : 'accent'
        )
      }

      if (customColumn.type === 'percent') {
        return renderInlineTextCell(
          <strong>{formatClientPercent(resolvedValue)}</strong>,
          parseClientNumber(resolvedValue) == null ? 'muted' : 'accent'
        )
      }

      if (customColumn.type === 'progress' || customColumn.type === 'number' || customColumn.type === 'formula') {
        const parsed = parseClientNumber(resolvedValue)
        return parsed == null
          ? renderInlineEmptyCell()
          : renderInlineTextCell(<strong>{formatNumber(parsed)}</strong>, 'accent')
      }

      if (customColumn.type === 'link') {
        return resolvedValue
          ? renderInlineTextCell(
            <a href={resolvedValue} target="_blank" rel="noreferrer" className="client-registry-link">
              Abrir link
            </a>,
            'accent'
          )
          : renderInlineEmptyCell('Sem link')
      }

      if (customColumn.type === 'email') {
        return resolvedValue
          ? renderInlineTextCell(
            <a href={`mailto:${resolvedValue}`} className="client-registry-link">
              {resolvedValue}
            </a>
          )
          : renderInlineEmptyCell('Sem e-mail')
      }

      if (customColumn.type === 'phone') {
        return resolvedValue
          ? renderInlineTextCell(
            <a href={`tel:${resolvedValue}`} className="client-registry-link">
              {resolvedValue}
            </a>
          )
          : renderInlineEmptyCell('Sem telefone')
      }

      if (customColumn.type === 'long_text') {
        return resolvedValue
          ? renderInlineTextCell(
            <span className="client-registry-multiline">{resolvedValue}</span>
          )
          : renderInlineEmptyCell()
      }

      return resolvedValue
        ? renderInlineTextCell(<span>{resolvedValue}</span>)
        : renderInlineEmptyCell()
    }

    if (meta.type === 'name' && isEditorMode) {
      return (
        <div key={columnKey} className="input-group">
          <label>{meta.label}</label>
          <input
            type="text"
            value={client?.name || ''}
            disabled={!isEditable}
            onChange={(event) => handleClientFieldChange('name', event.target.value)}
            placeholder="Nome do cliente"
          />
        </div>
      )
    }

    if (isInlineEditing) {
      if (columnKey === 'product') {
        return (
          <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
            <select
              autoFocus
              value={client?.productId || ''}
              onBlur={closeClientRegistryInlineEdit}
              onChange={(event) => {
                handleClientProductChange(client.id, event.target.value)
                closeClientRegistryInlineEdit()
              }}
            >
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
        )
      }

      if (meta.type === 'status') {
        if (columnKey === 'salesModel') {
          return (
            <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
              <select
                autoFocus
                value={value || 'INSIDE_SALES'}
                onBlur={closeClientRegistryInlineEdit}
                onChange={(event) => {
                  handleClientInlineFieldChange(client.id, columnKey, event.target.value)
                  closeClientRegistryInlineEdit()
                }}
              >
                {CLIENT_SALES_MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )
        }

        return (
          <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
            <select
              autoFocus
              value={value || 'Ativo'}
              onBlur={closeClientRegistryInlineEdit}
              onChange={(event) => {
                handleClientInlineFieldChange(client.id, columnKey, event.target.value)
                closeClientRegistryInlineEdit()
              }}
            >
              {CLIENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )
      }

      if (customColumn) {
        if (customColumn.type === 'flag') {
          return (
            <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
              <select
                autoFocus
                value={client?.customFieldValues?.[columnKey] || 'na'}
                onBlur={closeClientRegistryInlineEdit}
                onChange={(event) => {
                  handleClientInlineCustomFieldChange(client.id, columnKey, event.target.value)
                  closeClientRegistryInlineEdit()
                }}
              >
                {CLIENT_FLAG_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )
        }

        if (customColumn.type === 'select') {
          return (
            <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
              <select
                autoFocus
                value={client?.customFieldValues?.[columnKey] || ''}
                onBlur={closeClientRegistryInlineEdit}
                onChange={(event) => {
                  handleClientInlineCustomFieldChange(client.id, columnKey, event.target.value)
                  closeClientRegistryInlineEdit()
                }}
              >
                <option value="">Selecione</option>
                {(customColumn.options || []).map((option) => (
                  <option key={`${columnKey}-${option}`} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )
        }

        if (customColumn.type === 'checkbox') {
          return (
            <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
              <label className="client-checkbox-inline">
                <input
                  autoFocus
                  type="checkbox"
                  checked={String(client?.customFieldValues?.[columnKey] || '').toLowerCase() === 'true'}
                  onBlur={closeClientRegistryInlineEdit}
                  onChange={(event) => {
                    handleClientInlineCustomFieldChange(client.id, columnKey, event.target.checked ? 'true' : 'false')
                    closeClientRegistryInlineEdit()
                  }}
                />
                <span>Atualizar</span>
              </label>
            </div>
          )
        }

        const customFieldValue = resolveClientFieldValue(client, columnKey)
        if (customColumn.type === 'long_text') {
          return (
            <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
              <textarea
                autoFocus
                value={customFieldValue || ''}
                onBlur={closeClientRegistryInlineEdit}
                onKeyDown={handleInlineKeyDown}
                onChange={(event) => handleClientInlineCustomFieldChange(client.id, columnKey, event.target.value)}
                rows={3}
              />
            </div>
          )
        }

        return (
          <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
            <input
              autoFocus
              type={
                customColumn.type === 'date'
                  ? 'date'
                  : customColumn.type === 'email'
                    ? 'email'
                    : customColumn.type === 'phone'
                      ? 'tel'
                      : customColumn.type === 'link'
                        ? 'url'
                        : 'text'
              }
              value={customFieldValue || ''}
              onBlur={closeClientRegistryInlineEdit}
              onKeyDown={handleInlineKeyDown}
              onChange={(event) => handleClientInlineCustomFieldChange(client.id, columnKey, event.target.value)}
            />
          </div>
        )
      }

      if (meta.type === 'flag') {
        return (
          <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
            <select
              autoFocus
              value={value || 'na'}
              onBlur={closeClientRegistryInlineEdit}
              onChange={(event) => {
                handleClientInlineFieldChange(client.id, columnKey, event.target.value)
                closeClientRegistryInlineEdit()
              }}
            >
              {CLIENT_FLAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )
      }

      if (meta.type === 'date') {
        return (
          <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
            <input
              autoFocus
              type="date"
              value={value || ''}
              onBlur={closeClientRegistryInlineEdit}
              onKeyDown={handleInlineKeyDown}
              onChange={(event) => handleClientInlineFieldChange(client.id, columnKey, event.target.value)}
            />
          </div>
        )
      }

      if (meta.type === 'long_text') {
        return (
          <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
            <textarea
              autoFocus
              value={value || ''}
              onBlur={closeClientRegistryInlineEdit}
              onKeyDown={handleInlineKeyDown}
              onChange={(event) => handleClientInlineFieldChange(client.id, columnKey, event.target.value)}
              rows={3}
            />
          </div>
        )
      }

      return (
        <div key={columnKey} className="client-registry-cell client-registry-cell-editing">
          <input
            autoFocus
            type={meta.type === 'link' ? 'url' : 'text'}
            value={value || ''}
            onBlur={closeClientRegistryInlineEdit}
            onKeyDown={handleInlineKeyDown}
            onChange={(event) => handleClientInlineFieldChange(client.id, columnKey, event.target.value)}
          />
        </div>
      )
    }

    if (meta.type === 'status') {
      if (columnKey === 'salesModel') {
        if (!isEditorMode) {
          const salesModelLabels = {
            INSIDE_SALES: 'Inside Sales',
            ECOM: 'Ecom',
            PDV: 'PDV',
          }
          return renderInlineTextCell(
            <span className="client-status-badge client-status-info">
              {salesModelLabels[value] || value || 'Nao definido'}
            </span>
          )
        }

        return (
          <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
            {isEditorMode && <label>{meta.label}</label>}
            <select
              value={value || 'INSIDE_SALES'}
              disabled={!isEditable}
              onChange={(event) =>
                isEditorMode
                  ? handleClientFieldChange(columnKey, event.target.value)
                  : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
              }
            >
              {CLIENT_SALES_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )
      }

      if (columnKey === 'implementationPhase') {
        if (!isEditorMode) {
          const phaseMeta = clientImplementationPhaseMap.get(String(value || '').trim())
          const phasePreview = getClientJourneyPhasePreview(phaseMeta)
          return value
            ? renderInlineTextCell(
              <span
                className="client-phase-pill"
                data-phase-preview={phasePreview}
                title={phaseMeta?.description || String(value || '')}
              >
                {value}
              </span>
            )
            : renderInlineEmptyCell('Nao iniciado')
        }

        return (
          <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
            {isEditorMode && <label>{meta.label}</label>}
            <select
              value={value || ''}
              disabled={!isEditable}
              onChange={(event) =>
                isEditorMode
                  ? handleClientFieldChange(columnKey, event.target.value)
                  : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
              }
            >
              <option value="">Selecione uma fase</option>
              {effectiveClientImplementationPhases.map((phase) => (
                <option key={phase.id} value={phase.label}>{phase.label}</option>
              ))}
            </select>
          </div>
        )
      }

      if (!isEditorMode) {
        const statusMeta = getClientStatusMeta(client)
        return renderInlineTextCell(
          <span className={`client-status-badge client-status-${statusMeta.tone}`}>{statusMeta.label}</span>
        )
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          <select
            value={value || 'Ativo'}
            disabled={!isEditable}
            onChange={(event) =>
              isEditorMode
                ? handleClientFieldChange(columnKey, event.target.value)
                : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
            }
          >
            {CLIENT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )
    }

    if (columnKey === 'product') {
      if (!isEditorMode) {
        const productName = productsById.get(client?.productId)?.name || client?.product || ''
        return productName
          ? renderInlineTextCell(<span>{productName}</span>)
          : renderInlineEmptyCell('Sem produto')
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          <select
            value={client?.productId || ''}
            disabled={!isEditable}
            onChange={(event) =>
              isEditorMode
                ? handleActiveClientProductChange(event.target.value)
                : handleClientProductChange(client.id, event.target.value)
            }
          >
            <option value="">Selecione um produto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
      )
    }

    if (customColumn) {
      const customFieldValue = resolveClientFieldValue(client, columnKey)

      if (!isEditorMode) {
        return renderInlineValueForCustomField(customFieldValue)
      }

      if (customColumn.type === 'flag') {
        return (
          <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
            {isEditorMode && <label>{meta.label}</label>}
            <select
              value={client?.customFieldValues?.[columnKey] || 'na'}
              disabled={!isEditable}
              onChange={(event) => handleClientInlineCustomFieldChange(client.id, columnKey, event.target.value)}
            >
              {CLIENT_FLAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )
      }

      if (customColumn.type === 'select') {
        return (
          <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
            {isEditorMode && <label>{meta.label}</label>}
            <select
              value={client?.customFieldValues?.[columnKey] || ''}
              disabled={!isEditable}
              onChange={(event) => handleClientInlineCustomFieldChange(client.id, columnKey, event.target.value)}
            >
              <option value="">Selecione</option>
              {(customColumn.options || []).map((option) => (
                <option key={`${columnKey}-${option}`} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )
      }

      if (customColumn.type === 'checkbox') {
        return (
          <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
            {isEditorMode && <label>{meta.label}</label>}
            <label className="client-checkbox-inline">
              <input
                type="checkbox"
                checked={String(client?.customFieldValues?.[columnKey] || '').toLowerCase() === 'true'}
                disabled={!isEditable}
                onChange={(event) => handleClientInlineCustomFieldChange(client.id, columnKey, event.target.checked ? 'true' : 'false')}
              />
              <span>{String(client?.customFieldValues?.[columnKey] || '').toLowerCase() === 'true' ? 'Marcado' : 'Livre'}</span>
            </label>
          </div>
        )
      }

      if (customColumn.type === 'formula') {
        return (
          <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
            {isEditorMode && <label>{meta.label}</label>}
            <input type="text" value={customFieldValue || ''} readOnly placeholder="Calculado por fórmula" />
          </div>
        )
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          <input
            type={
              customColumn.type === 'date'
                ? 'date'
                : customColumn.type === 'email'
                  ? 'email'
                  : customColumn.type === 'phone'
                    ? 'tel'
                    : customColumn.type === 'link'
                      ? 'url'
                      : 'text'
            }
            value={customFieldValue || ''}
            disabled={!isEditable}
            onChange={(event) => handleClientInlineCustomFieldChange(client.id, columnKey, event.target.value)}
            placeholder={customColumn.label}
          />
        </div>
      )
    }

    if (meta.type === 'flag') {
      if (DERIVED_CLIENT_FLAG_KEYS.has(columnKey)) {
        const derivedMeta = getClientFlagMeta(value, getClientFlagVariant(columnKey))
        return (
          <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
            {isEditorMode && <label>{meta.label}</label>}
            <span className={`client-status-badge client-status-${derivedMeta.tone}`}>{derivedMeta.label}</span>
          </div>
        )
      }

      if (!isEditorMode) {
        const flagMeta = getClientFlagMeta(value, getClientFlagVariant(columnKey))
        return renderInlineTextCell(
          <span className={`client-status-badge client-status-${flagMeta.tone}`}>{flagMeta.label}</span>
        )
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          <select
            value={value || 'na'}
            disabled={!isEditable}
            onChange={(event) =>
              isEditorMode
                ? handleClientFieldChange(columnKey, event.target.value)
                : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
            }
          >
            {CLIENT_FLAG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )
    }

    if (meta.type === 'health') {
      const healthScore = calculateClientHealthScore(client)
      if (!isEditorMode) {
        const tone = healthScore == null ? 'neutral' : healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warning' : 'danger'
        return renderInlineTextCell(
          <>
            <strong>{healthScore == null ? '--' : `${healthScore}%`}</strong>
            <small>{healthScore == null ? 'Sem leitura' : 'Baseado nas flags'}</small>
            <span className={`client-status-badge client-status-${tone}`}>
              {healthScore == null ? 'N/A' : healthScore >= 80 ? 'Saudavel' : healthScore >= 50 ? 'Atencao' : 'Risco'}
            </span>
          </>
        )
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          <div className="client-health-inline">
            <strong>{healthScore == null ? '--' : `${healthScore}%`}</strong>
            <small>Calculado pelas flags</small>
          </div>
        </div>
      )
    }

    if (meta.type === 'date') {
      if (!isEditorMode) {
        return value
          ? renderInlineTextCell(<strong>{formatClientDate(value)}</strong>)
          : renderInlineEmptyCell('Sem data')
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          <input
            type="date"
            value={value || ''}
            readOnly={isReadOnlyCalculatedField}
            disabled={!isEditable}
            onChange={(event) =>
              isEditorMode
                ? handleClientFieldChange(columnKey, event.target.value)
                : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
            }
          />
        </div>
      )
    }

    if (meta.type === 'link') {
      if (!isEditorMode) {
        return value
          ? renderInlineTextCell(
            <a href={value} target="_blank" rel="noreferrer" className="client-registry-link">
              Abrir link
            </a>,
            'accent'
          )
          : renderInlineEmptyCell('Sem link')
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          <input
            type="text"
            value={value || ''}
            disabled={!isEditable}
            onChange={(event) =>
              isEditorMode
                ? handleClientFieldChange(columnKey, event.target.value)
                : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
            }
            placeholder="https://..."
          />
        </div>
      )
    }

    if (meta.type === 'long_text') {
      if (!isEditorMode) {
        return value
          ? renderInlineTextCell(<span className="client-registry-multiline">{value}</span>)
          : renderInlineEmptyCell()
      }

      return (
        <div key={columnKey} className={isEditorMode ? 'input-group client-long-text-field' : 'client-registry-cell'}>
          {isEditorMode && <label>{meta.label}</label>}
          {isEditorMode ? (
            <textarea
              value={value || ''}
              disabled={!isEditable}
              onChange={(event) =>
                isEditorMode
                  ? handleClientFieldChange(columnKey, event.target.value)
                  : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
              }
              placeholder={meta.label}
              rows={4}
            />
          ) : (
            <input
              type="text"
              value={value || ''}
              disabled={!isEditable}
              onChange={(event) => handleClientInlineFieldChange(client.id, columnKey, event.target.value)}
              placeholder={meta.label}
            />
          )}
        </div>
      )
    }

    if (!isEditorMode) {
      if (meta.type === 'currency') {
        return renderInlineTextCell(
          <strong>{formatClientCurrency(resolveClientFieldValue(client, columnKey))}</strong>,
          parseClientNumber(resolveClientFieldValue(client, columnKey)) == null ? 'muted' : 'accent'
        )
      }

      if (meta.type === 'percent') {
        return renderInlineTextCell(
          <strong>{formatClientPercent(resolveClientFieldValue(client, columnKey))}</strong>,
          parseClientNumber(resolveClientFieldValue(client, columnKey)) == null ? 'muted' : 'accent'
        )
      }

      if (meta.type === 'number') {
        const resolvedValue = resolveClientFieldValue(client, columnKey)
        const parsedValue = parseClientNumber(resolvedValue)
        if (columnKey === 'roiMarketing' && parsedValue != null) {
          return renderInlineTextCell(<strong>{formatMultiplier(parsedValue)}</strong>, 'accent')
        }
        return parsedValue == null
          ? renderInlineEmptyCell()
          : renderInlineTextCell(<strong>{formatNumber(parsedValue)}</strong>, 'accent')
      }

      const resolvedValue = resolveClientFieldValue(client, columnKey)
      return resolvedValue
        ? renderInlineTextCell(<span>{resolvedValue}</span>)
        : renderInlineEmptyCell()
    }

    return (
      <div key={columnKey} className={isEditorMode ? 'input-group' : 'client-registry-cell'}>
        {isEditorMode && <label>{meta.label}</label>}
        <input
          type="text"
          value={value || ''}
          readOnly={isReadOnlyCalculatedField}
          disabled={!isEditable && !isReadOnlyCalculatedField}
          onChange={(event) =>
            isEditorMode
              ? handleClientFieldChange(columnKey, event.target.value)
              : handleClientInlineFieldChange(client.id, columnKey, event.target.value)
          }
          placeholder={meta.label}
        />
      </div>
    )
  }

  const handleConfirmDashboardEntry = () => {
    if (!dashboardEntryClientId) return
    setActiveClientId(dashboardEntryClientId)
    setIsDashboardEntryModalOpen(false)
  }

  const handleClientDashboardRgbChange = (fieldName, sourceRgb, channel, value) => {
    const nextRgb = {
      ...sourceRgb,
      [channel]: clampColorChannel(value),
    }
    const nextColor = `rgb(${nextRgb.r}, ${nextRgb.g}, ${nextRgb.b})`

    handleClientFieldChange(fieldName, nextColor)
    if (fieldName === 'dashboardColor') {
      setThemeColor(nextColor)
    }
  }

  const handleClientDashboardHexChange = (fieldName, value) => {
    const parsedColor = hexToRgb(value)
    if (!parsedColor) return

    const nextColor = `rgb(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b})`
    handleClientFieldChange(fieldName, nextColor)
    if (fieldName === 'dashboardColor') {
      setThemeColor(nextColor)
    }
  }

  const handleGlobalIntegrationChange = (fieldName, value) => {
    setGlobalIntegrations((current) => ({
      ...current,
      [fieldName]: value,
    }))
  }

  const handleQualifiedStageToggle = (stageName) => {
    if (!canEditActiveClient) return
    updateActiveClient((client) => {
      const currentStages = Array.isArray(client.rdQualifiedStages) ? client.rdQualifiedStages : []
      const nextStages = currentStages.includes(stageName)
        ? currentStages.filter((stage) => stage !== stageName)
        : [...currentStages, stageName]

      return {
        ...client,
        rdQualifiedStages: nextStages,
      }
    })
  }

  const ensureAgendorDashboardVisibility = (client) => {
    const nextKeys = normalizeClientDashboardIntegrationKeys(client.dashboardVisibleIntegrationKeys)
    return nextKeys.includes('agendor') ? nextKeys : [...nextKeys, 'agendor']
  }

  const handleLoadAgendorPipelines = async () => {
    if (!canEditActiveClient) return
    const token = String(activeIntegrations.agendorToken || '').trim()
    if (!token) {
      setAgendorPipelinesError('Cole o token do Agendor antes de ler os pipelines.')
      return
    }

    setIsAgendorPipelinesLoading(true)
    setAgendorPipelinesError('')

    try {
      const response = await fetch('/api/saas/agendor/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível ler os pipelines do Agendor.')
      }

      setAgendorPipelineOptions(Array.isArray(data?.pipelines) ? data.pipelines : [])
      setAgendorStageOptions(Array.isArray(data?.stages) ? data.stages : [])
      updateActiveClient((client) => ({
        ...client,
        crmProvider: 'agendor',
        dashboardVisibleIntegrationKeys: ensureAgendorDashboardVisibility(client),
        integrations: {
          ...(client.integrations || {}),
          agendorToken: token,
        },
      }))
    } catch (error) {
      setAgendorPipelineOptions([])
      setAgendorStageOptions([])
      setAgendorPipelinesError(error.message || 'Não foi possível ler os pipelines do Agendor.')
    } finally {
      setIsAgendorPipelinesLoading(false)
    }
  }

  const handleAgendorPipelineToggle = (pipelineId) => {
    if (!canEditActiveClient) return

    updateActiveClient((client) => {
      const currentIds = normalizeIntegrationList(client.agendorPipelineIds || client.agendorAccountId || client.rdPipelineId)
      const nextIds = currentIds.includes(pipelineId)
        ? currentIds.filter((id) => id !== pipelineId)
        : [...currentIds, pipelineId]
      const nextNames = nextIds.map((id) => {
        const option = agendorPipelineOptions.find((pipeline) => pipeline.id === id)
        return option?.label || option?.name || id
      })
      const nextQualifiedStages = normalizeIntegrationList(client.agendorQualifiedStages || client.rdQualifiedStages).filter((stageName) => {
        const stageOption = agendorStageOptions.find((stage) => stage.name === stageName || stage.label === stageName || stage.id === stageName)
        return !stageOption?.pipelineId || nextIds.includes(stageOption.pipelineId)
      })

      return {
        ...client,
        crmProvider: 'agendor',
        agendorAccountId: nextIds.join(', '),
        agendorPipelineIds: nextIds,
        agendorPipelineNames: nextNames,
        rdPipelineId: nextIds.join(','),
        rdQualifiedStages: nextQualifiedStages,
        agendorQualifiedStages: nextQualifiedStages,
        dashboardVisibleIntegrationKeys: ensureAgendorDashboardVisibility(client),
      }
    })
  }

  const handleAgendorQualifiedStageToggle = (stage) => {
    if (!canEditActiveClient) return
    const stageName = String(stage?.name || stage?.label || stage || '').trim()
    if (!stageName) return

    updateActiveClient((client) => {
      const currentStages = normalizeIntegrationList(client.agendorQualifiedStages || client.rdQualifiedStages)
      const nextStages = currentStages.includes(stageName)
        ? currentStages.filter((item) => item !== stageName)
        : [...currentStages, stageName]

      return {
        ...client,
        crmProvider: 'agendor',
        rdQualifiedStages: nextStages,
        agendorQualifiedStages: nextStages,
        dashboardVisibleIntegrationKeys: ensureAgendorDashboardVisibility(client),
      }
    })
  }

  const handleIntegrationChange = (fieldName, value, storage) => {
    if (!canEditActiveClient) return
    if (storage === 'client') {
      handleClientFieldChange(fieldName, value)
      return
    }

    updateActiveClient((client) => ({
      ...client,
      integrations: {
        ...client.integrations,
        [fieldName]: value,
      },
      ...(fieldName === 'agendorToken'
        ? {
            crmProvider: 'agendor',
            dashboardVisibleIntegrationKeys: ensureAgendorDashboardVisibility(client),
          }
        : {}),
    }))

    if (fieldName === 'agendorToken') {
      setAgendorPipelineOptions([])
      setAgendorStageOptions([])
      setAgendorPipelinesError('')
    }
  }

  const readClientLogoFile = (file, onLoad) => {
    if (!file) return
    if (!String(file.type || '').startsWith('image/')) {
      alert('Envie uma imagem válida para a logo.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A logo precisa ter até 2MB para salvar com segurança.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => onLoad(reader.result?.toString() || '')
    reader.readAsDataURL(file)
  }

  const handleNewClientLogoUpload = (event) => {
    if (!isMaster) return
    const file = event.target.files?.[0]
    readClientLogoFile(file, (logoUrl) => setNewClientLogoUrl(logoUrl))
    event.target.value = ''
  }

  const handleClientLogoUpload = (event) => {
    if (!canEditActiveClient) return
    const file = event.target.files?.[0]
    readClientLogoFile(file, (logoUrl) => handleClientFieldChange('logoUrl', logoUrl))
    event.target.value = ''
  }

  const handleWorkspaceLogoUpload = (event) => {
    if (!canManageUsers) return
    const file = event.target.files?.[0]
    readClientLogoFile(file, (logoUrl) => setBrandingForm((current) => ({ ...current, logoUrl })))
    event.target.value = ''
  }

  const metaStructureFetchKey = useMemo(
    () =>
      JSON.stringify({
        activeClientId,
        selectedAdAccount,
        dateRange,
        customSince,
        customUntil,
        metaCredentialSignature,
      }),
    [
      activeClientId,
      selectedAdAccount,
      dateRange,
      customSince,
      customUntil,
      metaCredentialSignature,
    ]
  )

  useEffect(() => {
    if (!hasLoadedPreferences) {
      setAdAccounts([])
      return
    }

    if (activeTab !== 'clientes' && activeTab !== 'integracoes') {
      return
    }

    if (!hasMetaManualToken && !hasMetaOauthConnection) {
      setAdAccounts([])
      return
    }

    const fetchAdAccounts = async () => {
      setErrorMessage('')

      try {
        const response = await fetch('/api/meta/adaccounts', {
          headers: metaRequestHeaders,
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível listar as contas da Meta.')
        }

        setAdAccounts(data)

        if (activeClient && !activeClient.metaAdAccountId && data[0]?.id) {
          setClients((currentClients) =>
            currentClients.map((client) =>
              client.id === activeClientId
                ? { ...client, metaAdAccountId: data[0].id }
                : client
            )
          )
        }
      } catch (error) {
        setAdAccounts([])
        setErrorMessage(error.message || 'Não foi possível conectar à Meta.')
      }
    }

    fetchAdAccounts()
  }, [
    hasLoadedPreferences,
    activeClient,
    activeClientId,
    hasMetaManualToken,
    hasMetaOauthConnection,
    metaRequestHeaders,
    activeTab,
  ])

  useEffect(() => {
    if (!hasLoadedPreferences) {
      setGoogleAdsAccounts([])
      return
    }

    if (activeTab !== 'clientes' && activeTab !== 'integracoes') {
      return
    }

    if (!googleAdsConnection.connected) {
      setGoogleAdsAccounts([])
      return
    }

    let cancelled = false

    const fetchGoogleAdsAccounts = async () => {
      try {
        const response = await fetch('/api/google-ads/adaccounts', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível listar as contas do Google Ads.')
        }

        if (cancelled) return
        const accounts = Array.isArray(data?.accounts) ? data.accounts : []
        setGoogleAdsAccounts(accounts)

        if (activeClient && !activeClient.googleAdsAccountId && accounts[0]?.id) {
          setClients((currentClients) =>
            currentClients.map((client) =>
              client.id === activeClientId
                ? { ...client, googleAdsAccountId: accounts[0].id }
                : client
            )
          )
        }
      } catch (error) {
        if (cancelled) return
        setGoogleAdsAccounts([])
        setErrorMessage(error.message || 'Não foi possível conectar ao Google Ads.')
      }
    }

    fetchGoogleAdsAccounts()

    return () => {
      cancelled = true
    }
  }, [
    hasLoadedPreferences,
    activeClient,
    activeClientId,
    googleAdsConnection.connected,
    activeTab,
  ])

  useEffect(() => {
    if (!hasLoadedPreferences || activeTab !== 'saldos') return

    let cancelled = false

    const loadAdAccountBalances = async () => {
      setAdAccountBalanceLoading(true)
      setAdAccountBalanceError('')

      try {
        const response = await fetch('/api/meta/account-balances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...metaRequestHeaders,
          },
          body: JSON.stringify({
            clients: clients.filter((client) => !client.isArchived).map((client) => ({
              id: client.id,
              name: client.name,
              logoUrl: client.logoUrl,
              metaAdAccountId: client.metaAdAccountId,
              balanceAlertsEnabled: client.balanceAlertsEnabled !== false,
            })),
          }),
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível carregar os saldos das contas.')
        }

        if (cancelled) return
        setAdAccountBalanceRows(Array.isArray(data.rows) ? data.rows : [])
        setAdAccountBalanceUpdatedAt(data.updatedAt || new Date().toISOString())
      } catch (error) {
        if (cancelled) return
        setAdAccountBalanceRows([])
        setAdAccountBalanceUpdatedAt('')
        setAdAccountBalanceError(error.message || 'Não foi possível carregar os saldos das contas.')
      } finally {
        if (!cancelled) {
          setAdAccountBalanceLoading(false)
        }
      }
    }

    loadAdAccountBalances()

    return () => {
      cancelled = true
    }
  }, [hasLoadedPreferences, activeTab, clients, metaRequestHeaders, adAccountBalanceRefreshNonce])

  useEffect(() => {
    if (!hasLoadedPreferences || activeTab !== 'anuncios') return
    if (dateRange === 'custom' && (!customSince || !customUntil)) return

    let cancelled = false

    const loadAdsOverview = async () => {
      setAdsOverviewLoading(true)
      setAdsOverviewError('')

      try {
        const params = new URLSearchParams({
          date_preset: dateRange,
        })

        if (dateRange === 'custom') {
          params.set('since', customSince)
          params.set('until', customUntil)
        }

        const response = await fetch(`/api/meta/ads-overview?${params.toString()}`, {
          headers: metaRequestHeaders,
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível carregar os anúncios.')
        }

        if (cancelled) return
        setAdsOverviewRows(Array.isArray(data.rows) ? data.rows : [])
        setAdsOverviewUpdatedAt(data.updatedAt || new Date().toISOString())
      } catch (error) {
        if (cancelled) return
        setAdsOverviewRows([])
        setAdsOverviewUpdatedAt('')
        setAdsOverviewError(error.message || 'Não foi possível carregar os anúncios.')
      } finally {
        if (!cancelled) setAdsOverviewLoading(false)
      }
    }

    loadAdsOverview()

    return () => {
      cancelled = true
    }
  }, [hasLoadedPreferences, activeTab, dateRange, customSince, customUntil, metaRequestHeaders, adsOverviewRefreshNonce])

  useEffect(() => {
    if (!hasLoadedPreferences || (activeTab !== 'campanhas' && activeTab !== 'funil')) return
    if (dateRange === 'custom' && (!customSince || !customUntil)) return

    let cancelled = false

    const loadCampaignOverview = async () => {
      setCampaignOverviewLoading(true)
      setCampaignOverviewError('')

      try {
        const params = new URLSearchParams({
          date_preset: dateRange,
        })

        if (dateRange === 'custom') {
          params.set('since', customSince)
          params.set('until', customUntil)
        }

        const response = await fetch(`/api/meta/campaigns-overview?${params.toString()}`, {
          headers: metaRequestHeaders,
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível carregar as campanhas.')
        }

        if (cancelled) return
        setCampaignOverviewRows(Array.isArray(data.rows) ? data.rows : [])
        setCampaignOverviewUpdatedAt(data.updatedAt || new Date().toISOString())
      } catch (error) {
        if (cancelled) return
        setCampaignOverviewRows([])
        setCampaignOverviewUpdatedAt('')
        setCampaignOverviewError(error.message || 'Não foi possível carregar as campanhas.')
      } finally {
        if (!cancelled) setCampaignOverviewLoading(false)
      }
    }

    loadCampaignOverview()

    return () => {
      cancelled = true
    }
  }, [hasLoadedPreferences, activeTab, dateRange, customSince, customUntil, metaRequestHeaders, campaignOverviewRefreshNonce])

  useEffect(() => {
    if (activeTab !== 'apresentacao') return

    if (!activeClientId) {
      lastMetaStructureFetchKeyRef.current = ''
      lastCompletedMetaStructureFetchKeyRef.current = ''
      setIsLoading(false)
      setInsights(null)
      setDailyData([])
      setDailyCampaignData([])
      setCampaigns([])
      setMetaHierarchy([])
      setBreakdowns(EMPTY_META_BREAKDOWNS)
      setRdSummary(null)
      setIsMetaStructureReady(false)
      return
    }

    if (dateRange === 'custom' && (!customSince || !customUntil)) {
      return
    }

    let cancelled = false

    const loadMetaStructure = async () => {
      if (!hasMetaConfigured) {
        lastCompletedMetaStructureFetchKeyRef.current = ''
        setCampaigns([])
        setMetaHierarchy([])
        setIsMetaStructureReady(true)
        return
      }

      setIsMetaStructureReady(false)

      try {
        const fetchKey = metaStructureFetchKey

        if (lastMetaStructureFetchKeyRef.current === fetchKey) {
          setIsMetaStructureReady(lastCompletedMetaStructureFetchKeyRef.current === fetchKey)
          return
        }

        lastMetaStructureFetchKeyRef.current = fetchKey
        lastCompletedMetaStructureFetchKeyRef.current = ''

        const params = new URLSearchParams({
          ad_account_id: selectedAdAccount,
          date_preset: dateRange,
        })

        if (dateRange === 'custom') {
          params.set('since', customSince)
          params.set('until', customUntil)
        }

        const [campaignsResult, structureResult] = await Promise.all([
          fetchJsonWithTimeout(`/api/meta/campaigns?${params.toString()}`, { headers: metaRequestHeaders }),
          fetchJsonWithTimeout(`/api/meta/structure?${params.toString()}`, { headers: metaRequestHeaders }),
        ])
        const { response: campaignsResponse, data: campaignsData } = campaignsResult
        const { response: structureResponse, data: structureData } = structureResult

        if (!campaignsResponse.ok) {
          throw new Error(campaignsData.error || 'Não foi possível carregar as campanhas da Meta.')
        }

        if (cancelled) return
        setCampaigns(campaignsData || [])
        setMetaHierarchy(structureResponse.ok ? structureData || [] : [])

        if (!structureResponse.ok) {
          setErrorMessage(structureData?.error || 'Não foi possível carregar conjuntos e anúncios da Meta.')
        }

        lastCompletedMetaStructureFetchKeyRef.current = fetchKey
        setIsMetaStructureReady(true)
      } catch (error) {
        if (!cancelled) {
          lastCompletedMetaStructureFetchKeyRef.current = metaStructureFetchKey
          setCampaigns([])
          setMetaHierarchy([])
          setIsMetaStructureReady(true)
          setErrorMessage(error.message || 'Não foi possível carregar a estrutura da Meta.')
        }
      }
    }

    loadMetaStructure()

    return () => {
      cancelled = true
    }
  }, [
    activeTab,
    activeClientId,
    selectedAdAccount,
    dateRange,
    customSince,
    customUntil,
    hasMetaConfigured,
    metaStructureFetchKey,
    metaCredentialSignature,
    metaRequestHeaders,
  ])

  useEffect(() => {
    if (activeTab !== 'apresentacao' || !selectedAdAccount || !hasMetaConfigured) return
    if (dateRange === 'custom' && (!customSince || !customUntil)) return

    const params = new URLSearchParams({
      ad_account_id: selectedAdAccount,
      date_preset: dateRange,
    })

    if (dateRange === 'custom') {
      params.set('since', customSince)
      params.set('until', customUntil)
    }

    const warmFetchKey = params.toString()
    if (lastMetaWarmFetchKeyRef.current === warmFetchKey) return
    lastMetaWarmFetchKeyRef.current = warmFetchKey

    fetch(`/api/meta/warm?${params.toString()}`, {
      headers: metaRequestHeaders,
      keepalive: true,
    }).catch(() => {
      lastMetaWarmFetchKeyRef.current = ''
      // The visible dashboard requests remain the fallback if background warming cannot start.
    })
  }, [
    activeTab,
    selectedAdAccount,
    dateRange,
    customSince,
    customUntil,
    hasMetaConfigured,
    metaCredentialSignature,
    metaRequestHeaders,
  ])

  useEffect(() => {
    const shouldFetchPresentationData = activeTab === 'apresentacao'
    const shouldFetchClickUpData = activeTab === 'clickup'
    const shouldFetchMondayData = activeTab === 'monday'

    if (!shouldFetchPresentationData && !shouldFetchClickUpData && !shouldFetchMondayData) return

    if (shouldFetchPresentationData && !activeClientId) {
      lastDashboardFetchKeyRef.current = ''
      lastCompletedDashboardFetchKeyRef.current = ''
      lastGoogleSheetsFetchKeyRef.current = ''
      setIsLoading(false)
      setInsights(null)
      setDailyData([])
      setDailyCampaignData([])
      setGoogleAdsSummary(null)
      setGoogleAdsError('')
      setRdSummary(null)
      setGoogleSheetsSummary(null)
      setClickUpSummary(null)
      setClickUpError('')
      setMondaySummary(null)
      setMondayError('')
      return
    }

    if (
      shouldFetchPresentationData
      && !hasMetaConfigured
      && !hasGoogleAdsConfigured
      && !hasRdConfigured
      && !hasSheetsConfigured
    ) {
      lastDashboardFetchKeyRef.current = ''
      lastCompletedDashboardFetchKeyRef.current = ''
      lastGoogleSheetsFetchKeyRef.current = ''
      setIsLoading(false)
      setInsights(null)
      setDailyData([])
      setDailyCampaignData([])
      setGoogleAdsSummary(null)
      setGoogleAdsError('')
      setRdSummary(null)
      setGoogleSheetsSummary(null)
      setClickUpSummary(null)
      setClickUpError('')
      setMondaySummary(null)
      setMondayError('')
      return
    }

    if (shouldFetchPresentationData && dateRange === 'custom' && (!customSince || !customUntil)) {
      return
    }

    if (shouldFetchMondayData && mondayDateRange === 'custom' && (!mondayCustomSince || !mondayCustomUntil)) {
      return
    }

    let cancelled = false

    const fetchDashboardData = async () => {
      const fetchKey = JSON.stringify({
        activeClientId,
        selectedAdAccount,
        dateRange,
        customSince,
        customUntil,
        mondayDateRange,
        mondayCustomSince,
        mondayCustomUntil,
        hasMetaConfigured,
        hasGoogleAdsConfigured,
        selectedGoogleAdsAccount,
        hasRdConfigured,
        hasSheetsConfigured,
        rdPipelineFilter,
        rdSellerFilter,
        rdLeadSourceFiltersKey,
        selectedQualifiedStagesKey,
        metaFilteredCampaignIdsKey: hasActiveMetaCampaignNarrowing ? metaFilteredCampaignIdsKey : '',
        metaFilteredAdsetIdsKey: hasActiveMetaAdsetNarrowing ? metaFilteredAdsetIdsKey : '',
        metaFilteredAdIdsKey: hasActiveMetaAdNarrowing ? metaFilteredAdIdsKey : '',
        hasActiveMetaCampaignNarrowing,
        hasActiveMetaAdsetNarrowing,
        hasActiveMetaAdNarrowing,
        metaCredentialSignature,
        rdToken: activeCrmToken,
        googleSheetsUrl: activeClient?.googleSheetsUrl || '',
        googleSheetsHeaderRow: Number(activeClient?.googleSheetsHeaderRow || 1),
        googleSheetsStatusColumn: activeClient?.googleSheetsStatusColumn || '',
        mondayOwnerFilter,
      })

      const now = Date.now()
      if (
        lastCompletedDashboardFetchKeyRef.current === fetchKey &&
        now - lastDashboardFetchAtRef.current < 15000
      ) {
        setIsLoading(false)
        return
      }

      lastDashboardFetchKeyRef.current = fetchKey
      lastDashboardFetchAtRef.current = now
      setIsLoading(true)
      setErrorMessage('')

      try {
        let metaError = ''
        let googleAdsRequestError = ''
        let rdError = ''
        let sheetsError = ''
        let clickUpRequestError = ''
        let mondayRequestError = ''
        let resolvedMetaSummary = null
        const currentMetaFilteredCampaignIds = metaFilteredCampaignIdsRef.current
        const currentMetaFilteredAdsetIds = metaFilteredAdsetIdsRef.current
        const currentMetaFilteredAdIds = metaFilteredAdIdsRef.current
        const currentRdLeadSourceFilters = rdLeadSourceFiltersRef.current
        const currentSelectedQualifiedStages = selectedQualifiedStagesRef.current

        if (shouldFetchPresentationData && hasMetaConfigured) {
          const params = new URLSearchParams({
            ad_account_id: selectedAdAccount,
            date_preset: dateRange,
          })

          if (dateRange === 'custom') {
            params.set('since', customSince)
            params.set('until', customUntil)
          }

          const insightsParams = new URLSearchParams(params)

          if (hasActiveMetaCampaignNarrowing && currentMetaFilteredCampaignIds.length === 0) {
            insightsParams.set('campaign_ids', '__none__')
          } else if (hasActiveMetaCampaignNarrowing) {
            insightsParams.set('campaign_ids', currentMetaFilteredCampaignIds.join(','))
          }
          if (hasActiveMetaAdsetNarrowing && currentMetaFilteredAdsetIds.length > 0) {
            insightsParams.set('adset_ids', currentMetaFilteredAdsetIds.join(','))
          }
          if (hasActiveMetaAdNarrowing && currentMetaFilteredAdIds.length > 0) {
            insightsParams.set('ad_ids', currentMetaFilteredAdIds.join(','))
          }

          const currentMetaWindow = resolveDateWindow(dateRange, customSince, customUntil, {
            excludeTodayForLast30d: dateRange === 'last_30d',
          })
          const previousMetaWindow = buildPreviousWindow(currentMetaWindow)

          const previousInsightsParams = new URLSearchParams({
            ad_account_id: selectedAdAccount,
            date_preset: 'custom',
          })
          if (previousMetaWindow) {
            previousInsightsParams.set('since', formatLocalDateInput(previousMetaWindow.start))
            previousInsightsParams.set('until', formatLocalDateInput(previousMetaWindow.end))
          }
          previousInsightsParams.set('include_campaign_daily', 'false')
          if (hasActiveMetaCampaignNarrowing && currentMetaFilteredCampaignIds.length === 0) {
            previousInsightsParams.set('campaign_ids', '__none__')
          } else if (hasActiveMetaCampaignNarrowing) {
            previousInsightsParams.set('campaign_ids', currentMetaFilteredCampaignIds.join(','))
          }
          if (hasActiveMetaAdsetNarrowing && currentMetaFilteredAdsetIds.length > 0) {
            previousInsightsParams.set('adset_ids', currentMetaFilteredAdsetIds.join(','))
          }
          if (hasActiveMetaAdNarrowing && currentMetaFilteredAdIds.length > 0) {
            previousInsightsParams.set('ad_ids', currentMetaFilteredAdIds.join(','))
          }

          const insightsRequest = fetchJsonWithTimeout(
            `/api/meta/insights?${insightsParams.toString()}`,
            { headers: metaRequestHeaders }
          )
          const previousInsightsRequest = previousMetaWindow
            ? fetchJsonWithTimeout(`/api/meta/insights?${previousInsightsParams.toString()}`, { headers: metaRequestHeaders })
                .catch(() => null)
            : Promise.resolve(null)
          const insightsResult = await insightsRequest

          const insightsResponse = insightsResult.response
          const insightsData = insightsResult.data

          if (!insightsResponse.ok) {
            const nextMetaError = insightsData.error || 'Não foi possível carregar os indicadores da Meta.'
            if (!cancelled) {
              resolvedMetaSummary = buildMetaSummaryFromCampaigns(campaignsRef.current)
              setInsights(resolvedMetaSummary)
              setDailyData([])
              setDailyCampaignData([])
              setPreviousInsights(null)
            }
            metaError = isMetaRateLimitMessage(nextMetaError) ? '' : nextMetaError
          } else if (!cancelled) {
            const responseAdAccount = normalizeMetaAdAccountIdForCompare(insightsData.ad_account_id || selectedAdAccount)
            const currentAdAccount = normalizeMetaAdAccountIdForCompare(selectedAdAccount)
            if (responseAdAccount !== currentAdAccount) return

            resolvedMetaSummary = insightsData.summary || {}
            setInsights(resolvedMetaSummary)
            setDailyData(insightsData.daily || [])
            setDailyCampaignData(insightsData.daily_by_campaign || [])
          }

          if (!cancelled) {
            lastCompletedDashboardFetchKeyRef.current = fetchKey
            setIsLoading(false)
          }

          const previousInsightsResult = await previousInsightsRequest
          if (!cancelled) {
            if (previousInsightsResult) {
              const previousInsightsResponse = previousInsightsResult.response
              const previousInsightsData = previousInsightsResult.data
              setPreviousInsights(previousInsightsResponse.ok ? (previousInsightsData.summary || {}) : null)
            } else {
              setPreviousInsights(null)
            }
          }
        } else if (!cancelled) {
          resolvedMetaSummary = null
          setInsights(null)
          setPreviousInsights(null)
          setDailyData([])
          setDailyCampaignData([])
        }

        if (shouldFetchPresentationData && hasGoogleAdsConfigured) {
          try {
            const googleAdsParams = new URLSearchParams({
              customer_id: selectedGoogleAdsAccount,
              date_preset: dateRange,
            })
            if (dateRange === 'custom') {
              googleAdsParams.set('since', customSince)
              googleAdsParams.set('until', customUntil)
            }

            const googleAdsResponse = await fetch(`/api/google-ads/summary?${googleAdsParams.toString()}`, {
              cache: 'no-store',
            })
            const googleAdsData = await googleAdsResponse.json()
            if (!googleAdsResponse.ok) {
              throw new Error(googleAdsData.error || 'Não foi possível carregar os dados do Google Ads.')
            }
            if (!cancelled) {
              setGoogleAdsSummary(googleAdsData || null)
              setGoogleAdsError('')
            }
          } catch (error) {
            googleAdsRequestError = error.message || 'Não foi possível carregar os dados do Google Ads.'
            if (!cancelled) {
              setGoogleAdsSummary(null)
              setGoogleAdsError(googleAdsRequestError)
            }
          }
        } else if (!cancelled) {
          setGoogleAdsSummary(null)
          setGoogleAdsError('')
        }

        if (shouldFetchPresentationData && hasRdConfigured && activeClientUsesManualCrm) {
          if (!cancelled) {
            setRdSummary(buildManualCrmSummary(activeClient?.manualCrmSummary || {}, resolvedMetaSummary))
            setPreviousRdSummary(null)
          }
        } else if (shouldFetchPresentationData && hasRdConfigured) {
          const rdParams = new URLSearchParams()
          if (rdPipelineFilter) {
            rdParams.set('pipeline_id', rdPipelineFilter)
          }
          if (rdSellerFilter && rdSellerFilter !== 'all') {
            rdParams.set('seller_id', rdSellerFilter)
          }
          if (currentRdLeadSourceFilters.length > 0) {
            currentRdLeadSourceFilters.forEach((source) => {
              rdParams.append('lead_source', source)
            })
          }
          rdParams.set('date_preset', dateRange)
          currentSelectedQualifiedStages.forEach((stage) => {
            rdParams.append('qualified_stage', stage)
          })
          if (dateRange === 'custom') {
            rdParams.set('since', customSince)
            rdParams.set('until', customUntil)
          }

          const currentRdWindow = resolveDateWindow(dateRange, customSince, customUntil)
          const previousRdWindow = buildPreviousWindow(currentRdWindow)
          const previousRdParams = new URLSearchParams(rdParams)

          if (previousRdWindow) {
            previousRdParams.set('date_preset', 'custom')
            previousRdParams.set('since', formatLocalDateInput(previousRdWindow.start))
            previousRdParams.set('until', formatLocalDateInput(previousRdWindow.end))
          }

          const rdHeaders = {
            'x-rd-station-token': activeCrmToken,
            'x-crm-provider': activeCrmProvider === 'manual' ? 'rd_station' : activeCrmProvider,
          }

          const [rdResult, previousRdResult] = await Promise.all([
            fetchJsonWithTimeout(`/api/rd/summary${rdParams.toString() ? `?${rdParams.toString()}` : ''}`, {
              headers: rdHeaders,
            }),
            previousRdWindow
              ? fetchJsonWithTimeout(`/api/rd/summary?${previousRdParams.toString()}`, {
                  headers: rdHeaders,
                })
              : Promise.resolve(null),
          ])

          const rdResponse = rdResult.response
          const rdData = rdResult.data

          if (!rdResponse.ok) {
            rdError = rdData.error || `Não foi possível carregar os dados do ${crmSourceLabel}.`
            if (!cancelled) {
              setRdSummary(null)
              setPreviousRdSummary(null)
            }
          } else if (!cancelled) {
            setRdSummary(rdData || null)

            if (previousRdResult) {
              const previousRdResponse = previousRdResult.response
              const previousRdData = previousRdResult.data
              setPreviousRdSummary(previousRdResponse.ok ? (previousRdData || null) : null)
            } else {
              setPreviousRdSummary(null)
            }
          }
        } else if (!cancelled) {
          setRdSummary(null)
          setPreviousRdSummary(null)
        }

        if (shouldFetchPresentationData && hasSheetsConfigured) {
          const sheetsFetchKey = JSON.stringify({
            activeClientId,
            googleSheetsUrl: activeClient?.googleSheetsUrl || '',
            googleSheetsHeaderRow: Number(activeClient?.googleSheetsHeaderRow || 1),
            googleSheetsStatusColumn: String(activeClient?.googleSheetsStatusColumn || '').trim(),
          })

          if (lastGoogleSheetsFetchKeyRef.current !== sheetsFetchKey) {
            try {
              const sheetsParams = new URLSearchParams({
                url: activeClient?.googleSheetsUrl || '',
                header_row: String(Number(activeClient?.googleSheetsHeaderRow || 1)),
              })
              if (String(activeClient?.googleSheetsStatusColumn || '').trim()) {
                sheetsParams.set('status_column', activeClient.googleSheetsStatusColumn)
              }

              const sheetsResponse = await fetch(`/api/google-sheets/summary?${sheetsParams.toString()}`, {
                cache: 'no-store',
              })
              const sheetsData = await sheetsResponse.json()

              if (!sheetsResponse.ok) {
                throw new Error(sheetsData.error || 'Não foi possível carregar os dados do Google Sheets.')
              }

              if (!cancelled) {
                lastGoogleSheetsFetchKeyRef.current = sheetsFetchKey
                setGoogleSheetsSummary(sheetsData || null)
                setGoogleSheetsError('')
              }
            } catch (error) {
              sheetsError = error.message || 'Não foi possível carregar os dados do Google Sheets.'
              if (!cancelled) {
                lastGoogleSheetsFetchKeyRef.current = ''
                setGoogleSheetsSummary(null)
                setGoogleSheetsError(sheetsError)
              }
            }
          }
        } else if (!cancelled) {
          lastGoogleSheetsFetchKeyRef.current = ''
          setGoogleSheetsSummary(null)
          setGoogleSheetsError('')
        }

        if (shouldFetchClickUpData && hasClickUpConfigured) {
          try {
            const clickUpParams = new URLSearchParams({
              list_ids: String(globalIntegrations.clickUpListIds || '').trim(),
            })
            const clickUpResponse = await fetch(`/api/clickup/summary?${clickUpParams.toString()}`, {
              headers: {
                'x-clickup-token': globalIntegrations.clickUpToken,
              },
              cache: 'no-store',
            })
            const clickUpData = await clickUpResponse.json()

            if (!clickUpResponse.ok) {
              throw new Error(clickUpData.error || 'Não foi possível carregar os dados do ClickUp.')
            }

            if (!cancelled) {
              setClickUpSummary(clickUpData || null)
              setClickUpError('')
            }
          } catch (error) {
            clickUpRequestError = error.message || 'Não foi possível carregar os dados do ClickUp.'
            if (!cancelled) {
              setClickUpSummary(null)
              setClickUpError(clickUpRequestError)
            }
          }
        } else if (!cancelled) {
          setClickUpSummary(null)
          setClickUpError('')
        }

        if (shouldFetchMondayData && hasMondayConfigured) {
          try {
            const mondayParams = new URLSearchParams({
              board_ids: String(globalIntegrations.mondayBoardIds || '').trim(),
            })
            const mondayWindow = resolveDateWindow(mondayDateRange, mondayCustomSince, mondayCustomUntil)
            if (mondayWindow?.start && mondayWindow?.end) {
              mondayParams.set('since', formatLocalDateInput(mondayWindow.start))
              mondayParams.set('until', formatLocalDateInput(mondayWindow.end))
            }
            if (shouldFetchMondayData && mondayOwnerFilter !== 'all') {
              mondayParams.set('owner', mondayOwnerFilter)
            }
            const mondayResponse = await fetch(`/api/monday/summary?${mondayParams.toString()}`, {
              headers: {
                'x-monday-token': globalIntegrations.mondayToken,
              },
              cache: 'no-store',
            })
            const mondayData = await mondayResponse.json()

            if (!mondayResponse.ok) {
              throw new Error(mondayData.error || 'Não foi possível carregar os dados do Monday.')
            }

            if (!cancelled) {
              setMondaySummary(mondayData || null)
              setMondayError('')
            }
          } catch (error) {
            mondayRequestError = error.message || 'Não foi possível carregar os dados do Monday.'
            if (!cancelled) {
              setMondaySummary(null)
              setMondayError(mondayRequestError)
            }
          }
        } else if (!cancelled) {
          setMondaySummary(null)
          setMondayError('')
        }

        if (!cancelled) {
          setErrorMessage(metaError || googleAdsRequestError || rdError || sheetsError || clickUpRequestError || mondayRequestError)
        }
      } catch (error) {
        if (!cancelled) {
          lastGoogleSheetsFetchKeyRef.current = ''
          setInsights(null)
          setPreviousInsights(null)
          setDailyData([])
          setDailyCampaignData([])
          setGoogleAdsSummary(null)
          setGoogleAdsError('')
          setBreakdowns(EMPTY_META_BREAKDOWNS)
          setRdSummary(null)
          setPreviousRdSummary(null)
          setGoogleSheetsSummary(null)
          setGoogleSheetsError('')
          setClickUpSummary(null)
          setClickUpError('')
          setMondaySummary(null)
          setMondayError('')
          setErrorMessage(error.message || 'Falha ao puxar os dados da integração.')
        }
      } finally {
        if (!cancelled) {
          lastCompletedDashboardFetchKeyRef.current = fetchKey
          setIsLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      cancelled = true
    }
  }, [
    activeTab,
    activeClientId,
    selectedAdAccount,
    dateRange,
    customSince,
    customUntil,
    mondayDateRange,
    mondayCustomSince,
    mondayCustomUntil,
    hasMetaConfigured,
    hasGoogleAdsConfigured,
    selectedGoogleAdsAccount,
    hasRdConfigured,
    hasSheetsConfigured,
    hasClickUpConfigured,
    hasMondayConfigured,
    rdPipelineFilter,
    rdSellerFilter,
    rdLeadSourceFiltersKey,
    selectedQualifiedStagesKey,
    metaResultFilters,
    metaFilteredCampaignIdsKey,
    metaFilteredAdIdsKey,
    mondayOwnerFilter,
    metaFilteredAdsetIdsKey,
    hasActiveMetaCampaignNarrowing,
    hasActiveMetaAdsetNarrowing,
    hasActiveMetaAdNarrowing,
    metaCredentialSignature,
    metaRequestHeaders,
    activeCrmToken,
    activeCrmProvider,
    activeClientUsesManualCrm,
    activeClient?.manualCrmSummary,
    activeClient?.googleSheetsUrl,
    activeClient?.googleSheetsHeaderRow,
    activeClient?.googleSheetsStatusColumn,
    globalIntegrations.clickUpToken,
    globalIntegrations.clickUpListIds,
    globalIntegrations.mondayToken,
    globalIntegrations.mondayBoardIds,
  ])

  useEffect(() => {
    if (activeTab !== 'apresentacao') {
      lastBreakdownsFetchKeyRef.current = ''
      return
    }

    if (!activeClientId || !hasMetaConfigured) {
      lastBreakdownsFetchKeyRef.current = ''
      setBreakdowns(EMPTY_META_BREAKDOWNS)
      setIsRankingsLoading(false)
      setRankingsError('')
      return
    }

    if (dateRange === 'custom' && (!customSince || !customUntil)) {
      return
    }

    const requiresMetaStructureForRankings =
      hasActiveMetaCampaignNarrowing ||
      hasActiveMetaAdsetNarrowing ||
      hasActiveMetaAdNarrowing

    if (
      requiresMetaStructureForRankings &&
      (
        !isMetaStructureReady ||
        lastCompletedMetaStructureFetchKeyRef.current !== metaStructureFetchKey
      )
    ) {
      return
    }

    let cancelled = false

    const fetchRankings = async () => {
      const fetchKey = JSON.stringify({
        activeClientId,
        selectedAdAccount,
        dateRange,
        customSince,
        customUntil,
        hasMetaConfigured,
        metaFilteredCampaignIdsKey,
        metaFilteredAdsetIdsKey,
        metaFilteredAdIdsKey,
        hasActiveMetaCampaignNarrowing,
        hasActiveMetaAdsetNarrowing,
        hasActiveMetaAdNarrowing,
        isMetaStructureReady,
        metaCredentialSignature,
      })

      if (lastBreakdownsFetchKeyRef.current === fetchKey) {
        return
      }

      lastBreakdownsFetchKeyRef.current = fetchKey
      setBreakdowns(EMPTY_META_BREAKDOWNS)
      setMetaRankingDrilldown(null)
      setMetaRankingDetailDailyData([])
      setIsRankingsLoading(true)
      setRankingsError('')

      try {
        const params = new URLSearchParams({
          ad_account_id: selectedAdAccount,
          date_preset: dateRange,
        })

        if (dateRange === 'custom') {
          params.set('since', customSince)
          params.set('until', customUntil)
        }

        const currentMetaFilteredCampaignIds = metaFilteredCampaignIdsRef.current
        const currentMetaFilteredAdsetIds = metaFilteredAdsetIdsRef.current
        const currentMetaFilteredAdIds = metaFilteredAdIdsRef.current

        if (hasActiveMetaCampaignNarrowing && currentMetaFilteredCampaignIds.length === 0) {
          params.set('campaign_ids', '__none__')
        } else if (hasActiveMetaCampaignNarrowing) {
          params.set('campaign_ids', currentMetaFilteredCampaignIds.join(','))
        }
        if (hasActiveMetaAdsetNarrowing && currentMetaFilteredAdsetIds.length > 0) {
          params.set('adset_ids', currentMetaFilteredAdsetIds.join(','))
        }
        if (hasActiveMetaAdNarrowing && currentMetaFilteredAdIds.length > 0) {
          params.set('ad_ids', currentMetaFilteredAdIds.join(','))
        }

        const { response, data } = await fetchJsonWithTimeout(`/api/meta/breakdowns?${params.toString()}`, {
          headers: metaRequestHeaders,
        })

        if (!response.ok) {
          throw new Error(data.error || 'Os rankings detalhados não responderam agora.')
        }

        if (cancelled || lastBreakdownsFetchKeyRef.current !== fetchKey) return

        const responseAdAccount = normalizeMetaAdAccountIdForCompare(data?.ad_account_id || selectedAdAccount)
        const currentAdAccount = normalizeMetaAdAccountIdForCompare(selectedAdAccount)
        if (responseAdAccount !== currentAdAccount) return

        setBreakdowns(data || EMPTY_META_BREAKDOWNS)
      } catch (error) {
        if (cancelled) return
        setBreakdowns(EMPTY_META_BREAKDOWNS)
        setRankingsError(error.message || 'Os rankings detalhados não responderam agora.')
      } finally {
        if (!cancelled) {
          setIsRankingsLoading(false)
        }
      }
    }

    const fetchRankingsTimeout = window.setTimeout(fetchRankings, 180)

    return () => {
      cancelled = true
      window.clearTimeout(fetchRankingsTimeout)
    }
  }, [
    activeClientId,
    selectedAdAccount,
    dateRange,
    customSince,
    customUntil,
    hasMetaConfigured,
    metaFilteredCampaignIdsKey,
    metaFilteredAdsetIdsKey,
    metaFilteredAdIdsKey,
    hasActiveMetaCampaignNarrowing,
    hasActiveMetaAdsetNarrowing,
    hasActiveMetaAdNarrowing,
    isMetaStructureReady,
    metaCredentialSignature,
    metaStructureFetchKey,
    metaRequestHeaders,
    activeTab,
  ])

  const handleSaveIntegrations = async (event) => {
    event.preventDefault()
    setIsSavingIntegrations(true)

    try {
      await persistWorkspaceState({ clients, activeClientId })
      alert(`Cliente ${activeClient?.name || ''} salvo no Supabase.`)
    } catch (error) {
      alert(error.message || 'Não foi possível salvar este cliente no Supabase.')
    } finally {
      setIsSavingIntegrations(false)
    }
  }

  const handleSaveManualCrm = async (event) => {
    event.preventDefault()
    if (!activeClient?.id) return

    const manualCrmSummary = {
      opportunityCount: normalizeManualCrmInput(manualCrmForm.opportunityCount),
      qualifiedOpportunityCount: normalizeManualCrmInput(manualCrmForm.qualifiedOpportunityCount),
      wonOpportunityCount: normalizeManualCrmInput(manualCrmForm.wonOpportunityCount),
      lostOpportunityCount: normalizeManualCrmInput(manualCrmForm.lostOpportunityCount),
      wonRevenue: normalizeManualCrmInput(manualCrmForm.wonRevenue),
    }

    setIsSavingManualCrm(true)
    try {
      const nextClients = clients.map((client) =>
        client.id === activeClient.id
          ? createClientRecord({
              ...client,
              crmProvider: 'manual',
              crmMode: 'manual',
              manualCrmSummary,
              dashboardVisibleIntegrationKeys: ensureAgendorDashboardVisibility(client),
            })
          : client
      )

      setClients(nextClients)
      await persistWorkspaceState({ clients: nextClients, activeClientId })
      setRdSummary(buildManualCrmSummary(manualCrmSummary, insights))
      setPreviousRdSummary(null)
      setIsManualCrmModalOpen(false)

      // Best-effort sync to SaaS platform API (non-blocking for non-SaaS users)
      fetch(`/api/saas/clients/${activeClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmProvider: 'manual',
          crmMode: 'manual',
          manualCrmSummary,
          business_data: { crmProvider: 'manual', crmMode: 'manual', manualCrmSummary },
        }),
      }).catch(() => {})
    } catch (error) {
      alert(error?.message || 'Não foi possível salvar os dados manuais do CRM.')
    } finally {
      setIsSavingManualCrm(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continua o logout local mesmo se a chamada do servidor falhar.
    }

    try {
      await supabase.auth.signOut()
    } catch {
      // A sessão do Supabase pode já estar encerrada.
    }

    window.location.replace('/login')
  }

  const exportDashboardScreenshotPDF = async () => {
    if (!dashboardRef.current) {
      alert('Não encontrei o conteúdo do dashboard para exportar.')
      return
    }

    const element = dashboardRef.current
    const previousPdfMarker = element.getAttribute('data-pdf-export-root')
    const previousExportMode = document.documentElement.getAttribute('data-pdf-exporting')

    try {
      setIsExporting(true)
      element.setAttribute('data-pdf-export-root', 'true')
      document.documentElement.setAttribute('data-pdf-exporting', 'true')

      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => null)
      }

      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)))

      const [{ default: html2canvas }, jsPdfModule] = await Promise.all([import('html2canvas'), import('jspdf')])
      const JsPDF = jsPdfModule.default || jsPdfModule.jsPDF
      const rect = element.getBoundingClientRect()
      const getVisibleExportHeight = () => {
        const ignoredSelector = [
          '.sidebar',
          '.operation-stellar-topbar',
          '.header',
          '.modal-overlay',
          '.floating-save-bar',
          '.meta-filter-panel',
          '.metric-library-panel',
          '.campaign-filters',
          '.source-section-header',
          '.floating-filter-apply',
          '.metric-library-anchor',
          '.btn',
          'button',
          '[data-no-pdf]',
        ].join(',')
        let bottom = rect.bottom

        element.querySelectorAll('*').forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches(ignoredSelector) || node.closest(ignoredSelector)) return

          const style = window.getComputedStyle(node)
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) === 0) return

          const bounds = node.getBoundingClientRect()
          if (bounds.width <= 1 || bounds.height <= 1) return
          if (bounds.bottom > bottom) bottom = bounds.bottom
        })

        return Math.ceil(Math.max(rect.height, bottom - rect.top + 32))
      }
      const exportWidth = Math.ceil(Math.max(element.scrollWidth, rect.width, 1440))
      const exportHeight = Math.ceil(Math.min(Math.max(getVisibleExportHeight(), rect.height), element.scrollHeight || rect.height))
      const preferredScale = Math.min(1.35, Math.max(1, window.devicePixelRatio || 1))
      const maxCanvasPixels = 28000000
      const safeScale = Math.sqrt(maxCanvasPixels / Math.max(exportWidth * exportHeight, 1))
      const captureScale = Math.max(0.72, Math.min(preferredScale, safeScale))
      const backgroundColor = window.getComputedStyle(document.body).backgroundColor || '#ffffff'
      const protectedBlockSelector = [
        '.hero-panel',
        '.kpi-card',
        '.meta-summary-card',
        '.conversion-group-card',
        '.meta-result-preview-panel',
        '.chart-container',
        '.funnel-section',
        '.ranking-card',
        '.meta-ranking-layer-section',
        '.ranking-row',
        '.campaigns-section',
        '.data-table tr',
        '.manual-crm-card',
        '.source-section',
      ].join(',')
      const collectProtectedBlocks = () => {
        const maxCanvasY = exportHeight * captureScale
        const blocks = []

        element.querySelectorAll(protectedBlockSelector).forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          const style = window.getComputedStyle(node)
          if (style.display === 'none' || style.visibility === 'hidden') return

          const bounds = node.getBoundingClientRect()
          if (bounds.width <= 1 || bounds.height <= 1) return

          const top = Math.round((bounds.top - rect.top) * captureScale)
          const bottom = Math.round((bounds.bottom - rect.top) * captureScale)
          const height = bottom - top

          if (bottom > 40 && top < maxCanvasY - 12 && height > 24) {
            blocks.push({ top: Math.max(0, top), bottom: Math.min(maxCanvasY, bottom), height })
          }
        })

        return blocks.sort((a, b) => a.top - b.top)
      }
      const collectSafeBreakPoints = () => {
        const maxCanvasY = exportHeight * captureScale
        const points = []

        element.querySelectorAll(protectedBlockSelector).forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          const style = window.getComputedStyle(node)
          if (style.display === 'none' || style.visibility === 'hidden') return

          const bounds = node.getBoundingClientRect()
          if (bounds.width <= 1 || bounds.height <= 1) return

          const bottom = Math.round((bounds.bottom - rect.top) * captureScale)
          if (bottom > 40 && bottom < maxCanvasY - 12) points.push(bottom)
        })

        return [...new Set(points)].sort((a, b) => a - b)
      }
      const protectedBlocks = collectProtectedBlocks()
      const safeBreakPoints = collectSafeBreakPoints()

      const canvas = await html2canvas(element, {
        backgroundColor,
        scale: captureScale,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        width: exportWidth,
        height: exportHeight,
        windowWidth: exportWidth,
        windowHeight: exportHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        onclone: (clonedDocument) => {
          const clonedRoot = clonedDocument.documentElement
          const clonedExportRoot = clonedDocument.querySelector('[data-pdf-export-root="true"]')
          clonedRoot.setAttribute('data-pdf-exporting', 'true')

          const style = clonedDocument.createElement('style')
          style.textContent = `
            html,
            body,
            [data-pdf-export-root="true"],
            [data-pdf-export-root="true"] * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            html,
            body {
              overflow: visible !important;
            }

            .sidebar,
            .operation-stellar-topbar,
            .header,
            .modal-overlay,
            .floating-save-bar,
            .meta-filter-panel,
            .metric-library-panel,
            .campaign-filters,
            .source-section-header,
            .floating-filter-apply,
            .metric-library-anchor,
            .btn,
            button,
            [data-no-pdf] {
              display: none !important;
            }

            [data-pdf-export-root="true"] {
              width: ${exportWidth}px !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              transform: none !important;
            }
          `
          clonedDocument.head.appendChild(style)

          if (clonedExportRoot) {
            clonedExportRoot.querySelectorAll('button, [data-no-pdf], .btn, .floating-filter-apply, .metric-library-anchor').forEach((node) => {
              node.remove()
            })

            clonedExportRoot.querySelectorAll('.ranking-card, .meta-result-preview-panel, .chart-container, .source-section').forEach((node) => {
              const hasEmptyState = Boolean(node.querySelector('.ranking-empty, .funnel-empty, .metric-library-empty'))
              const hasDataRows = Boolean(node.querySelector('.ranking-row, .geo-ranking-row, .data-table tbody tr:not(:only-child), canvas, img'))
              const text = String(node.textContent || '').toLowerCase()
              const isExplicitNoData = /sem dados|sem histórico|sem historico|nenhum resultado|nenhuma campanha|carregando ranking|sem base suficiente/.test(text)

              if ((hasEmptyState || isExplicitNoData) && !hasDataRows) {
                node.remove()
              }
            })
          }
        },
      })

      const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 18
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2
      const renderWidth = usableWidth
      const pageCanvas = document.createElement('canvas')
      const pageContext = pageCanvas.getContext('2d')

      if (!pageContext) {
        throw new Error('Não foi possível preparar a imagem do PDF.')
      }
      const pageSliceHeight = Math.floor((usableHeight * canvas.width) / renderWidth)
      const minSliceHeight = Math.floor(pageSliceHeight * 0.58)
      const safeBreakGap = Math.max(18, Math.floor(24 * captureScale))
      const blockStartGap = Math.max(24, Math.floor(32 * captureScale))
      const findSafeSliceHeight = (currentY) => {
        const remainingHeight = canvas.height - currentY
        if (remainingHeight <= pageSliceHeight) return remainingHeight

        const targetY = currentY + pageSliceHeight
        const minY = currentY + minSliceHeight
        const maxY = targetY - safeBreakGap
        const minBlockStartY = currentY + Math.max(96, safeBreakGap * 3)
        const blockingBlock = protectedBlocks.find((block) => {
          const startsInsidePage = block.top > minBlockStartY && block.top < maxY
          const crossesPageBreak = block.bottom > maxY
          const fitsOnFreshPage = block.height < pageSliceHeight - safeBreakGap * 2
          return startsInsidePage && crossesPageBreak && fitsOnFreshPage
        })

        if (blockingBlock) {
          return Math.max(96, Math.min(pageSliceHeight, blockingBlock.top - currentY - blockStartGap))
        }

        const safePoint = [...safeBreakPoints]
          .reverse()
          .find((point) => point > minY && point < maxY)

        return Math.max(minSliceHeight, Math.min(pageSliceHeight, (safePoint || targetY) - currentY))
      }
      let sourceY = 0
      let pageIndex = 0

      pageCanvas.width = canvas.width
      pageCanvas.height = Math.min(pageSliceHeight, canvas.height)

      while (sourceY < canvas.height) {
        const sliceHeight = findSafeSliceHeight(sourceY)
        pageCanvas.height = sliceHeight
        pageContext.clearRect(0, 0, pageCanvas.width, pageCanvas.height)
        pageContext.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)

        if (pageIndex > 0) pdf.addPage()

        const sliceRenderHeight = (sliceHeight * renderWidth) / canvas.width
        pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, margin, renderWidth, Math.min(sliceRenderHeight, usableHeight))
        sourceY += sliceHeight
        pageIndex += 1
      }

      const safeClientName = String(activeClient?.name || 'dashboard')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
      pdf.save(`${safeClientName || 'dashboard'}-assessoria-lp.pdf`)
    } catch (error) {
      console.error('Erro ao preparar PDF:', error)
      alert('Não foi possível gerar o PDF agora. Se o dashboard tiver imagens externas bloqueadas, tente atualizar a página e exportar novamente.')
    } finally {
      if (previousPdfMarker === null) element.removeAttribute('data-pdf-export-root')
      else element.setAttribute('data-pdf-export-root', previousPdfMarker)
      if (previousExportMode === null) document.documentElement.removeAttribute('data-pdf-exporting')
      else document.documentElement.setAttribute('data-pdf-exporting', previousExportMode)
      setIsExporting(false)
    }
  }

  const replaceDraftFunnelSteps = (steps) => {
    setDraftFunnelSteps(steps)
  }

  const handleFunnelDragStart = (metricKey, sourceIndex = null) => {
    setDragMetricKey(metricKey)
    setDragSourceIndex(sourceIndex)
  }

  const handleFunnelDrop = (targetIndex = activeDraftFunnelSteps.length) => {
    if (!dragMetricKey) return

    const currentSteps = [...activeDraftFunnelSteps]

    if (dragSourceIndex !== null) {
      const [movedStep] = currentSteps.splice(dragSourceIndex, 1)
      const adjustedIndex = dragSourceIndex < targetIndex ? targetIndex - 1 : targetIndex
      currentSteps.splice(adjustedIndex, 0, movedStep)
      replaceDraftFunnelSteps(currentSteps)
    } else if (!currentSteps.includes(dragMetricKey)) {
      currentSteps.splice(targetIndex, 0, dragMetricKey)
      replaceDraftFunnelSteps(currentSteps)
    }

    setDragMetricKey('')
    setDragSourceIndex(null)
  }

  const handleRemoveFunnelStep = (metricKey) => {
    replaceDraftFunnelSteps(activeDraftFunnelSteps.filter((step) => step !== metricKey))
  }

  const customMetrics = useMemo(() => insights?.custom_metrics || {}, [insights])
  const previousCustomMetrics = useMemo(() => previousInsights?.custom_metrics || {}, [previousInsights])
  const filledMetaDailyData = useMemo(() => {
    if (!currentMetaResultWindow?.start || !currentMetaResultWindow?.end) return dailyData

    const points = new Map(
      (dailyData || [])
        .map((day) => {
          const parsedDate = parseMetaSeriesDate(day.date_start)
          if (!parsedDate) return null

          return [
            formatLocalDateInput(parsedDate),
            day,
          ]
        })
        .filter(Boolean)
    )

    const filledSeries = []
    const cursor = new Date(currentMetaResultWindow.start.getFullYear(), currentMetaResultWindow.start.getMonth(), currentMetaResultWindow.start.getDate())
    const end = new Date(currentMetaResultWindow.end.getFullYear(), currentMetaResultWindow.end.getMonth(), currentMetaResultWindow.end.getDate())

    while (cursor <= end) {
      const key = formatLocalDateInput(cursor)
      const existingPoint = points.get(key)

      if (existingPoint) {
        filledSeries.push(existingPoint)
      } else {
        filledSeries.push({
          date_start: key,
          date_stop: key,
          spend: '0',
          reach: '0',
          impressions: '0',
          clicks: '0',
          cpc: '0',
          ctr: '0',
          custom_metrics: {
            landingPageViews: 0,
            cpm: 0,
            frequency: 0,
            totalConversions: 0,
            conversionRate: 0,
            purchaseValue: 0,
            purchases: 0,
            leads: 0,
            messages: 0,
            videoViews: 0,
            videoViewRate: 0,
            thruplay: 0,
            hookRate: 0,
            cpa: 0,
            roas: 0,
          },
        })
      }

      cursor.setDate(cursor.getDate() + 1)
    }

    return filledSeries
  }, [currentMetaResultWindow, dailyData])

  const labels = filledMetaDailyData.map((day) => {
    const date = new Date(day.date_start)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  })

  const lineChartData = {
    labels: labels.length > 0 ? labels : ['Sem dados'],
    datasets: [
      {
        label: METRIC_OPTIONS[metric1].label,
        data: filledMetaDailyData.length > 0 ? filledMetaDailyData.map((day) => getMetricData(metric1, day)) : [0],
        borderColor: currentTheme.main,
        backgroundColor: currentTheme.glow,
        borderWidth: 3,
        pointBackgroundColor: '#0b0f19',
        pointBorderColor: currentTheme.main,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
      },
      {
        label: METRIC_OPTIONS[metric2].label,
        data: filledMetaDailyData.length > 0 ? filledMetaDailyData.map((day) => getMetricData(metric2, day)) : [0],
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: [7, 5],
        pointBackgroundColor: '#0b0f19',
        pointBorderColor: '#10b981',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        yAxisID: 'y1',
      },
    ],
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.94)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${formatMetricValue(context.parsed.y, context.dataset.yAxisID === 'y' ? metric1 : metric2)}`
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          callback(value) {
            return formatChartAxis(value, metric1)
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { display: false },
        ticks: {
          callback(value) {
            return formatChartAxis(value, metric2)
          },
        },
      },
    },
  }

  const selectedMetaCampaignTableColumns = useMemo(
    () =>
      draftMetaCampaignTableColumnKeys
        .map((columnKey) => ({
          key: columnKey,
          ...META_CAMPAIGN_TABLE_COLUMN_OPTIONS[columnKey],
        }))
        .filter((column) => column.label),
    [draftMetaCampaignTableColumnKeys]
  )

  const campaignSortOptions = useMemo(() => {
    const baseOptions = [
      { value: 'spend', label: 'Maior investimento' },
      { value: 'totalConversions', label: 'Mais conversões' },
      { value: 'roas', label: 'Maior ROAS' },
    ]

    const appendedOptions = selectedMetaCampaignTableColumns
      .filter((column) => !baseOptions.some((option) => option.value === column.key))
      .map((column) => ({
        value: column.key,
        label: column.type === 'currency' || column.type === 'multiplier' || column.type === 'percent' || column.type === 'decimal'
          ? `Maior ${column.label}`
          : `Mais ${column.label.toLowerCase()}`,
      }))

    return [...baseOptions, ...appendedOptions]
  }, [selectedMetaCampaignTableColumns])

  const campaignTableConversionResultMetricKey = META_RESULT_COMPARISON_OPTIONS[metaResultPreviewKey]?.resultMetricKey || 'totalConversions'

  const getCampaignMetricValue = useCallback((campaign, metricKey) => {
    const metrics = extractMetaCampaignMetrics(campaign)

    switch (metricKey) {
      case 'spend':
        return metrics.spend
      case 'totalConversions':
        return metrics.totalConversions
      case 'purchases':
        return metrics.purchases
      case 'leads':
        return metrics.leads
      case 'cost_per_lead':
        return metrics.cost_per_lead
      case 'messages':
        return metrics.messages
      case 'cpa':
        return metrics.cpa
      case 'roas':
        return metrics.roas
      case 'purchaseValue':
        return metrics.purchaseValue
      case 'clicks':
        return metrics.clicks
      case 'impressions':
        return metrics.impressions
      case 'reach':
        return metrics.reach
      case 'ctr':
        return metrics.ctr
      case 'cpc':
        return metrics.cpc
      case 'cpm':
        return metrics.cpm
      case 'frequency':
        return metrics.frequency
      case 'conversionRate': {
        const resultValue = getMetaCampaignResultValue(metrics, campaignTableConversionResultMetricKey)
        return metrics.clicks > 0 ? (resultValue / metrics.clicks) * 100 : 0
      }
      default:
        return 0
    }
  }, [campaignTableConversionResultMetricKey])

  const formatCampaignMetricValue = useCallback((metricKey, metricValue) => {
    const metric = META_CAMPAIGN_TABLE_COLUMN_OPTIONS[metricKey]
    if (!metric) return String(metricValue ?? '-')
    return formatDashboardMetricValue(metricValue, metric.type)
  }, [])

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.trim().toLowerCase()
    const filtered = campaigns.filter((campaign) => {
      const hasSpendInSelectedPeriod = Number(campaign?.spend || 0) > 0
      const matchesSearch = !term || campaign.name?.toLowerCase().includes(term)
      const matchesStatus = campaignStatusFilter === 'all' || campaign.status === campaignStatusFilter
      const matchesResultType = campaignMatchesMetaResultFilters(campaign, normalizedMetaResultFilters, availableMetaResultFilters.map((item) => item.key))
      const matchesCampaignFilter = activeMetaCampaignIds.length === 0 || activeMetaCampaignIds.includes(campaign.id)
      return hasSpendInSelectedPeriod && matchesSearch && matchesStatus && matchesResultType && matchesCampaignFilter
    })

    return filtered.sort((campaignA, campaignB) => {
      const valueA = getCampaignMetricValue(campaignA, campaignSortBy === 'conversions' ? 'totalConversions' : campaignSortBy)
      const valueB = getCampaignMetricValue(campaignB, campaignSortBy === 'conversions' ? 'totalConversions' : campaignSortBy)
      return valueB - valueA
    })
  }, [campaigns, campaignSearch, campaignStatusFilter, campaignSortBy, normalizedMetaResultFilters, availableMetaResultFilters, activeMetaCampaignIds, getCampaignMetricValue])

  const campaignSummary = useMemo(() => {
    if (!filteredCampaigns.length) {
      return {
        spend: parseFloat(insights?.spend || 0),
        reach: parseInt(insights?.reach || 0, 10),
        impressions: parseInt(insights?.impressions || 0, 10),
        clicks: customMetrics.clicks || parseInt(insights?.clicks || 0, 10),
        cpc: customMetrics.cpc || parseFloat(insights?.cpc || 0),
        ctr: customMetrics.ctr || parseFloat(insights?.ctr || 0),
        cpm: customMetrics.cpm || 0,
        frequency: customMetrics.frequency || 0,
        conversionRate: customMetrics.conversionRate || 0,
        averageTicket: customMetrics.averageTicket || 0,
        purchases: customMetrics.purchases || 0,
        cost_per_purchase: customMetrics.cost_per_purchase || 0,
        leads: customMetrics.leads || 0,
        cost_per_lead: customMetrics.cost_per_lead || 0,
        messages: customMetrics.messages || 0,
        cost_per_message: customMetrics.cost_per_message || 0,
        reach_results: customMetrics.reach_results || 0,
        cost_per_reach: customMetrics.cost_per_reach || 0,
        thruplays: customMetrics.thruplays || 0,
        cost_per_thruplay: customMetrics.cost_per_thruplay || 0,
        totalConversions: customMetrics.totalConversions || 0,
        roas: customMetrics.roas || 0,
        purchase_roas: customMetrics.purchase_roas || 0,
        purchaseValue: customMetrics.purchaseValue || 0,
      }
    }

    const aggregated = buildMetaSummaryFromCampaigns(filteredCampaigns)
    const aggregatedCustomMetrics = aggregated.custom_metrics || {}

    return {
      spend: parseFloat(aggregated.spend || 0),
      reach: parseInt(aggregated.reach || 0, 10),
      impressions: parseInt(aggregated.impressions || 0, 10),
      clicks: aggregatedCustomMetrics.clicks || parseInt(aggregated.clicks || 0, 10),
      cpc: aggregatedCustomMetrics.cpc || parseFloat(aggregated.cpc || 0),
      ctr: aggregatedCustomMetrics.ctr || parseFloat(aggregated.ctr || 0),
      cpm: aggregatedCustomMetrics.cpm || 0,
      frequency: aggregatedCustomMetrics.frequency || 0,
      conversionRate: aggregatedCustomMetrics.conversionRate || 0,
      averageTicket: aggregatedCustomMetrics.averageTicket || 0,
      purchases: aggregatedCustomMetrics.purchases || 0,
      cost_per_purchase: aggregatedCustomMetrics.cost_per_purchase || 0,
      leads: aggregatedCustomMetrics.leads || 0,
      cost_per_lead: aggregatedCustomMetrics.cost_per_lead || 0,
      messages: aggregatedCustomMetrics.messages || 0,
      cost_per_message: aggregatedCustomMetrics.cost_per_message || 0,
      reach_results: aggregatedCustomMetrics.reach_results || 0,
      cost_per_reach: aggregatedCustomMetrics.cost_per_reach || 0,
      thruplays: aggregatedCustomMetrics.thruplays || 0,
      cost_per_thruplay: aggregatedCustomMetrics.cost_per_thruplay || 0,
      totalConversions: aggregatedCustomMetrics.totalConversions || 0,
      roas: aggregatedCustomMetrics.roas || 0,
      purchase_roas: aggregatedCustomMetrics.purchase_roas || 0,
      purchaseValue: aggregatedCustomMetrics.purchaseValue || 0,
    }
  }, [filteredCampaigns, insights, customMetrics])

  const spend = campaignSummary.spend || 0
  const reach = campaignSummary.reach || 0
  const impressions = campaignSummary.impressions || 0
  const clicks = campaignSummary.clicks || 0
  const cpc = campaignSummary.cpc || 0
  const cpm = campaignSummary.cpm || 0
  const frequency = campaignSummary.frequency || 0
  const ctr = campaignSummary.ctr || 0
  const conversionRate = campaignSummary.conversionRate || 0
  const averageTicket = campaignSummary.averageTicket || 0
  const purchases = campaignSummary.purchases || 0
  const costPerPurchase = campaignSummary.cost_per_purchase || 0
  const leads = campaignSummary.leads || 0
  const costPerLead = campaignSummary.cost_per_lead || 0
  const messages = campaignSummary.messages || 0
  const costPerMessage = campaignSummary.cost_per_message || 0
  const reachResults = campaignSummary.reach_results || 0
  const costPerReach = campaignSummary.cost_per_reach || 0
  const thruplays = campaignSummary.thruplays || 0
  const costPerTruplay = campaignSummary.cost_per_thruplay || 0
  const totalConversions = campaignSummary.totalConversions || 0
  const roas = campaignSummary.roas || 0
  const purchaseRoas = campaignSummary.purchase_roas || 0
  const purchaseValue = campaignSummary.purchaseValue || 0
  const activeMetaRankingResultKeys = useMemo(() => {
    const availableKeys = normalizedMetaResultFilters.filter((filterKey) => META_RESULT_COMPARISON_OPTIONS[filterKey])
    return availableKeys.length ? availableKeys : ['purchases']
  }, [normalizedMetaResultFilters])
  const activeMetaRankingResultKey = activeMetaRankingResultKeys[0] || 'purchases'
  const activeMetaRankingResultConfig = META_RESULT_COMPARISON_OPTIONS[activeMetaRankingResultKey] || META_RESULT_COMPARISON_OPTIONS.purchases
  const metaSecondaryResultInsights = useMemo(() => {
    const buckets = {
      purchases: {
        campaignCount: 0,
        extras: { leads: 0, messages: 0 },
      },
      leads: {
        campaignCount: 0,
        extras: { purchases: 0, messages: 0 },
      },
      messages: {
        campaignCount: 0,
        extras: { purchases: 0, leads: 0 },
      },
    }

    filteredCampaigns.forEach((campaign) => {
      const metrics = extractMetaCampaignMetrics(campaign)
      const primaryResultKey = resolveMetaPrimaryResultKey(campaign, metrics)

      if (!buckets[primaryResultKey]) return

      buckets[primaryResultKey].campaignCount += 1

      Object.keys(buckets[primaryResultKey].extras).forEach((extraKey) => {
        buckets[primaryResultKey].extras[extraKey] += Number(metrics[extraKey] || 0)
      })
    })

    return Object.fromEntries(
      Object.entries(buckets).map(([key, value]) => {
        const items = Object.entries(value.extras)
          .filter(([, amount]) => amount > 0)
          .map(([extraKey, amount]) => ({
            key: extraKey,
            label:
              extraKey === 'purchases'
                ? 'Compras'
                : extraKey === 'leads'
                  ? 'Cadastros'
                  : 'Mensagens iniciadas',
            value: amount,
          }))

        return [key, {
          campaignCount: value.campaignCount,
          items,
          totalExtraResults: items.reduce((sum, item) => sum + item.value, 0),
        }]
      })
    )
  }, [filteredCampaigns])
  const doughnutChartData = {
    labels: ['Compras', 'Leads', 'Mensagens', 'Cliques sem conversão'],
    datasets: [
      {
        data: [purchases, leads, messages, Math.max(clicks - totalConversions, 0)],
        backgroundColor: [currentTheme.main, '#10b981', '#f59e0b', '#334155'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  }

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          padding: 18,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label(context) {
            return `${context.label}: ${formatNumber(context.parsed)}`
          },
        },
      },
    },
  }

  const availableFunnelMetrics = useMemo(
    () =>
      Object.entries(METRIC_OPTIONS).filter(
        ([key]) => !activeDraftFunnelSteps.includes(key) && !FUNNEL_LIBRARY_EXCLUDED_KEYS.has(key)
      ),
    [activeDraftFunnelSteps]
  )

  const funnelCards = useMemo(
    () =>
      activeDraftFunnelSteps.map((metricKey, index) => {
        // Meta metrics resolve from the insights summary; CRM metrics (manual CRM or RD/Agendor)
        // live in rdSummary — getSummaryMetricValue only knows Meta keys, so fall back to rdSummary.
        const resolveFunnelValue = (key) => getSummaryMetricValue(key, insights, customMetrics) || resolveCrmSummaryValue(key, rdSummary)
        const value = resolveFunnelValue(metricKey)
        const previousKey = activeDraftFunnelSteps[index - 1]
        const previousValue = previousKey ? resolveFunnelValue(previousKey) : 0

        return {
          key: metricKey,
          label: METRIC_OPTIONS[metricKey]?.label || metricKey,
          formattedValue: formatMetricValue(value, metricKey),
          conversionRate: index === 0 || previousValue <= 0 ? null : (value / previousValue) * 100,
        }
      }),
    [activeDraftFunnelSteps, insights, customMetrics, rdSummary]
  )

  const rdDiagnosticsSummary = useMemo(() => {
    if (!rdSummary?.diagnostics) return 'Aguardando leitura técnica das negociações do RD.'

    const allWonInRange = rdSummary.diagnostics.allDeals?.wonClosedInRange || 0
    const pipelineWonInRange = rdSummary.diagnostics.pipelineDeals?.wonClosedInRange || 0
    const filteredWonInRange = rdSummary.diagnostics.filteredDeals?.wonClosedInRange || 0

    if (rdSummary.diagnostics.pipelineFilterApplied && rdSummary.diagnostics.sellerFilterApplied) {
      return `${formatNumber(filteredWonInRange)} negociações no período após funil e vendedor.`
    }

    if (rdSummary.diagnostics.pipelineFilterApplied) {
      return `${formatNumber(pipelineWonInRange)} negociações ganhas no período dentro do funil selecionado.`
    }

    if (rdSummary.diagnostics.sellerFilterApplied) {
      return `${formatNumber(filteredWonInRange)} negociações no período após o filtro atual de vendedor.`
    }

    return `${formatNumber(allWonInRange)} negociações ganhas reconhecidas no período selecionado.`
  }, [rdSummary])
  const crmLeadMetaLeads = leads || 0
  const crmLeadMetaMessages = messages || 0
  const crmLeadCrmRegistrations = rdSummary?.contactsInPeriod || 0
  const crmLeadTotal = crmLeadMetaLeads + crmLeadMetaMessages + crmLeadCrmRegistrations
  const crmLeadBreakdownLabel = `Meta leads ${formatNumber(crmLeadMetaLeads)} • Meta mensagens ${formatNumber(crmLeadMetaMessages)} • CRM ${formatNumber(crmLeadCrmRegistrations)}`
  const rdFinalSalesCount = (rdSummary?.wonOpportunityCount || 0) + (rdSummary?.wonDealsFromPreviousCohorts || 0)
  const rdFinalRevenue = (rdSummary?.wonOpportunityRevenue || 0) + (rdSummary?.wonRevenueFromPreviousCohorts || 0)
  const rdFinalAvgTicket = rdFinalSalesCount > 0 ? rdFinalRevenue / rdFinalSalesCount : 0
  const rdCommercialRoas = safeNumber(insights?.spend) > 0 ? rdFinalRevenue / safeNumber(insights?.spend) : 0
  const metaGeoRankingTitle = breakdowns.geoScope === 'country'
    ? 'países'
    : breakdowns.geoScope === 'region'
      ? 'regiões'
      : 'cidades'
  const metaGeoRankingDescription = breakdowns.geoScope === 'country'
    ? 'Ranking territorial com base no resultado por país da conta Meta.'
    : breakdowns.geoScope === 'region'
      ? 'Ranking territorial com base no resultado por região da conta Meta.'
      : 'Ranking territorial com base no resultado da conta Meta do cliente.'
  const metaRankingLayers = useMemo(
    () =>
      activeMetaRankingResultKeys.map((resultKey) => {
        const resultConfig = META_RESULT_COMPARISON_OPTIONS[resultKey] || META_RESULT_COMPARISON_OPTIONS.purchases
        const resultLabel = formatMetaRankingResultLabel(resultConfig.resultLabel)

        const stateItems = (breakdowns.states || [])
          .map((item) => {
            const stateMeta = resolveBrazilStateMeta(item.label)
            if (!stateMeta) return null

            return {
              ...item,
              ...stateMeta,
              conversions: getMetaBreakdownResultValue(item, resultConfig.resultMetricKey),
              averageCost: getMetaBreakdownAverageCost(item, resultConfig.resultMetricKey),
            }
          })
          .filter(Boolean)
          .filter((item) => item.conversions > 0)
          .sort((left, right) => right.conversions - left.conversions)

        const cityItems = (breakdowns.cities || [])
          .map((item) => {
            const cityMeta = resolveBrazilCityMeta(item)
            if (!cityMeta) return null

            return {
              ...item,
              ...cityMeta,
              conversions: getMetaBreakdownResultValue(item, resultConfig.resultMetricKey),
              averageCost: getMetaBreakdownAverageCost(item, resultConfig.resultMetricKey),
            }
          })
          .filter(Boolean)
          .filter((item) => item.conversions > 0)
          .sort((left, right) => right.conversions - left.conversions)

        const creativeItems = (breakdowns.creatives || [])
          .map((item) => ({
            ...item,
            conversions: getMetaBreakdownResultValue(item, resultConfig.resultMetricKey),
            averageCost: getMetaBreakdownAverageCost(item, resultConfig.resultMetricKey),
          }))
          .filter((item) => item.conversions > 0)
          .sort((left, right) => right.conversions - left.conversions)
          .slice(0, 5)

        const ageItemsRaw = (breakdowns.ages || [])
          .map((item) => {
            const conversions = getMetaBreakdownResultValue(item, resultConfig.resultMetricKey)
            const averageCost = getMetaBreakdownAverageCost(item, resultConfig.resultMetricKey)
            const conversionRateValue = getMetaBreakdownConversionRate(item, resultConfig.resultMetricKey)

            return {
              ...item,
              conversions,
              averageCost,
              conversionRateValue,
            }
          })
          .filter((item) => item.conversions > 0)
          .sort((left, right) => right.conversions - left.conversions)
          .slice(0, 5)

        const ageMaxConversions = Math.max(...ageItemsRaw.map((item) => item.conversions || 0), 1)
        const ageItems = ageItemsRaw.map((item, index) => {
          let performanceLabel = 'Em observação'
          if (index === 0) performanceLabel = 'Melhor faixa'
          else if (item.conversionRateValue >= 10 || item.conversions >= ageMaxConversions * 0.7) performanceLabel = 'Boa resposta'

          return {
            ...item,
            intensity: Math.max(0.12, item.conversions / ageMaxConversions),
            performanceLabel,
          }
        })

        const topStateItem = stateItems[0] || null
        const topStateItems = stateItems.slice(0, 5)
        const topCityItems = cityItems.slice(0, 5)
        const maxMapConversions = Math.max(
          ...stateItems.map((item) => item.conversions || 0),
          ...topCityItems.map((item) => item.conversions || 0),
          1
        )

        return {
          resultKey,
          resultConfig,
          resultLabel,
          states: {
            key: 'states',
            title: `Top 5 por estados de ${resultLabel}`,
            description: `Estados com maior volume de ${resultLabel} no período selecionado.`,
            emptyMessage: `Sem dados por estado de ${resultLabel} para o período.`,
            resultLabel: resultConfig.resultLabel,
            costLabel: resultConfig.costLabel,
            resultMetricKey: resultConfig.resultMetricKey,
            accent: '#38bdf8',
            resultTone: '#22c55e',
            costTone: '#f59e0b',
            previewKicker: 'Estado',
            detailDescription: `Compare o estado selecionado com foco em ${resultLabel} para entender volume, eficiência e investimento.`,
            items: topStateItems,
          },
          cities: {
            key: 'cities',
            title: `Top 5 por ${metaGeoRankingTitle} de ${resultLabel}`,
            description: `${metaGeoRankingDescription} na leitura de ${resultLabel}.`,
            emptyMessage: `Sem dados geográficos de ${resultLabel} para o período.`,
            resultLabel: resultConfig.resultLabel,
            costLabel: resultConfig.costLabel,
            resultMetricKey: resultConfig.resultMetricKey,
            accent: '#38bdf8',
            resultTone: '#22c55e',
            costTone: '#f59e0b',
            previewKicker: breakdowns.geoScope === 'country'
              ? 'País'
              : breakdowns.geoScope === 'region'
                ? 'Região'
                : 'Cidade',
            detailDescription: `Compare o território selecionado com foco em ${resultLabel} para entender volume, eficiência e investimento.`,
            items: topCityItems,
          },
          creatives: {
            key: 'creatives',
            title: `Top 5 por criativos de ${resultLabel}`,
            description: `Os criativos com melhor resultado de ${resultLabel} dentro do período selecionado.`,
            emptyMessage: `Sem dados por criativo de ${resultLabel} para o período.`,
            resultLabel: resultConfig.resultLabel,
            costLabel: resultConfig.costLabel,
            resultMetricKey: resultConfig.resultMetricKey,
            accent: '#3b82f6',
            resultTone: '#10b981',
            costTone: '#fbbf24',
            previewKicker: 'Criativo',
            detailDescription: `Veja o resultado de ${resultLabel} que o criativo selecionado gerou dentro do período filtrado, com leitura de volume, custo e investimento.`,
            items: creativeItems,
          },
          ages: {
            key: 'ages',
            title: `Resultado por idade de ${resultLabel}`,
            description: `Faixas etárias com melhor performance em ${resultLabel} no período.`,
            emptyMessage: `Sem dados por idade de ${resultLabel} para o período.`,
            resultLabel: resultConfig.resultLabel,
            costLabel: resultConfig.costLabel,
            resultMetricKey: resultConfig.resultMetricKey,
            accent: '#a855f7',
            resultTone: '#38bdf8',
            costTone: '#f59e0b',
            previewKicker: 'Faixa etária',
            detailDescription: `Compare a faixa etária selecionada com foco em ${resultLabel} para identificar volume, eficiência e investimento.`,
            items: ageItems,
          },
          map: {
            stateItems,
            topStateItem,
            topStateItems,
            cityItems: topCityItems,
            maxConversions: maxMapConversions,
          },
        }
      }),
    [activeMetaRankingResultKeys, breakdowns.ages, breakdowns.cities, breakdowns.creatives, breakdowns.geoScope, breakdowns.states, metaGeoRankingDescription, metaGeoRankingTitle]
  )
  const dashboardAiInsightsPayload = useMemo(() => {
    const selectedResultLabels = availableMetaResultFilters
      .filter((item) => normalizedMetaResultFilters.includes(item.key))
      .map((item) => item.label)

    const selectedCampaignLabels = availableMetaCampaignOptions
      .filter((campaign) => activeMetaCampaignIds.includes(campaign.id))
      .map((campaign) => campaign.name)

    return {
      source: 'meta_dashboard',
      dashboardName: activeDashboardTemplate?.name || 'Dashboard principal',
      clientName: activeClient?.name || '',
      adAccountId: selectedAdAccount || '',
      period: {
        preset: DATE_PRESETS.find((preset) => preset.value === dateRange)?.label || dateRange,
        since: currentMetaResultWindow?.start ? formatLocalDateInput(currentMetaResultWindow.start) : '',
        until: currentMetaResultWindow?.end ? formatLocalDateInput(currentMetaResultWindow.end) : '',
      },
      filters: {
        resultKeys: normalizedMetaResultFilters,
        resultLabels: selectedResultLabels,
        campaignIds: activeMetaCampaignIds,
        campaignNames: selectedCampaignLabels,
        adsetIds: activeMetaAdsetIds,
        adIds: activeMetaAdIds,
      },
      summary: {
        spend,
        impressions,
        reach,
        clicks,
        cpc,
        cpm,
        ctr,
        frequency,
        totalConversions,
        conversionRate,
        purchaseValue,
        purchases,
        costPerPurchase,
        leads,
        costPerLead,
        messages,
        costPerMessage,
        reachResults,
        costPerReach,
        thruplays,
        costPerTruplay,
        roas,
        purchaseRoas,
      },
      previousSummary: {
        spend: parseFloat(previousInsights?.spend || 0),
        impressions: parseInt(previousInsights?.impressions || 0, 10),
        clicks: previousCustomMetrics.clicks || parseInt(previousInsights?.clicks || 0, 10),
        cpc: previousCustomMetrics.cpc || parseFloat(previousInsights?.cpc || 0),
        cpm: previousCustomMetrics.cpm || 0,
        ctr: previousCustomMetrics.ctr || parseFloat(previousInsights?.ctr || 0),
        frequency: previousCustomMetrics.frequency || 0,
        reach: parseInt(previousInsights?.reach || 0, 10),
        totalConversions: previousCustomMetrics.totalConversions || 0,
        conversionRate: previousCustomMetrics.conversionRate || 0,
        purchases: previousCustomMetrics.purchases || 0,
        costPerPurchase: previousCustomMetrics.cost_per_purchase || 0,
        purchaseValue: previousCustomMetrics.purchaseValue || 0,
        leads: previousCustomMetrics.leads || 0,
        costPerLead: previousCustomMetrics.cost_per_lead || 0,
        messages: previousCustomMetrics.messages || 0,
        costPerMessage: previousCustomMetrics.cost_per_message || 0,
        reachResults: previousCustomMetrics.reach_results || 0,
        costPerReach: previousCustomMetrics.cost_per_reach || 0,
        thruplays: previousCustomMetrics.thruplays || 0,
        costPerTruplay: previousCustomMetrics.cost_per_thruplay || 0,
        roas: previousCustomMetrics.roas || 0,
      },
      daily: filledMetaDailyData.map((day) => ({
        date: day.date_start,
        spend: parseFloat(day.spend || 0),
        impressions: parseInt(day.impressions || 0, 10),
        reach: parseInt(day.reach || 0, 10),
        clicks: parseInt(day.clicks || 0, 10),
        purchases: day.custom_metrics?.purchases || 0,
        leads: day.custom_metrics?.leads || 0,
        messages: day.custom_metrics?.messages || 0,
        reachResults: day.custom_metrics?.reach_results || 0,
        thruplays: day.custom_metrics?.thruplays || 0,
        purchaseValue: day.custom_metrics?.purchaseValue || 0,
        cpa: day.custom_metrics?.cpa || 0,
        roas: day.custom_metrics?.roas || 0,
      })),
      topCampaigns: filteredCampaigns.slice(0, 10).map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        objective: campaign.objective || '',
        status: campaign.status || '',
        spend: Number(campaign.spend || 0),
        purchases: campaign.custom_metrics?.purchases || 0,
        costPerPurchase: campaign.custom_metrics?.cost_per_purchase || 0,
        leads: campaign.custom_metrics?.leads || 0,
        costPerLead: campaign.custom_metrics?.cost_per_lead || 0,
        messages: campaign.custom_metrics?.messages || 0,
        costPerMessage: campaign.custom_metrics?.cost_per_message || 0,
        roas: campaign.custom_metrics?.roas || 0,
      })),
      rankingLayers: metaRankingLayers.map((layer) => ({
        resultKey: layer.resultKey,
        resultLabel: layer.resultLabel,
        creatives: layer.creatives.items.slice(0, 5).map((item) => ({
          label: item.label,
          conversions: item.conversions,
          averageCost: item.averageCost,
          spend: item.spend || 0,
        })),
        ages: layer.ages.items.slice(0, 5).map((item) => ({
          label: item.label,
          conversions: item.conversions,
          averageCost: item.averageCost,
          conversionRate: item.conversionRateValue || 0,
        })),
        states: layer.map.topStateItems.slice(0, 5).map((item) => ({
          label: item.name,
          conversions: item.conversions,
          averageCost: item.averageCost,
        })),
        cities: layer.cities.items.slice(0, 5).map((item) => ({
          label: item.label,
          conversions: item.conversions,
          averageCost: item.averageCost,
        })),
      })),
    }
  }, [
    activeDashboardTemplate,
    activeClient,
    selectedAdAccount,
    dateRange,
    currentMetaResultWindow,
    normalizedMetaResultFilters,
    availableMetaResultFilters,
    activeMetaCampaignIds,
    availableMetaCampaignOptions,
    activeMetaAdsetIds,
    activeMetaAdIds,
    spend,
    impressions,
    reach,
    clicks,
    cpc,
    cpm,
    ctr,
    frequency,
    totalConversions,
    conversionRate,
    purchaseValue,
    purchases,
    costPerPurchase,
    leads,
    costPerLead,
    messages,
    costPerMessage,
    reachResults,
    costPerReach,
    thruplays,
    costPerTruplay,
    roas,
    purchaseRoas,
    filledMetaDailyData,
    filteredCampaigns,
    metaRankingLayers,
    previousInsights,
    previousCustomMetrics,
  ])
  const aiInsightsDateLabel = `${dashboardAiInsightsPayload.period?.since || '--'} ate ${dashboardAiInsightsPayload.period?.until || '--'}`
  const aiInsightsFilterLabel = (dashboardAiInsightsPayload.filters?.resultLabels || []).join(', ') || 'Todos os resultados'
  const aiHighlights = useMemo(
    () => [
      {
        label: 'Leituras',
        value: totalAiInsights,
        tone: 'neutral',
      },
      {
        label: 'Alertas',
        value: aiInsightGroups.find((group) => group.key === 'alert')?.items.length || 0,
        tone: 'alert',
      },
      {
        label: 'Oportunidades',
        value: aiInsightGroups.find((group) => group.key === 'opportunity')?.items.length || 0,
        tone: 'opportunity',
      },
      {
        label: 'Próximos passos',
        value: Array.isArray(aiInsightsResult?.structured?.nextActions) ? aiInsightsResult.structured.nextActions.length : 0,
        tone: 'info',
      },
    ],
    [aiInsightGroups, aiInsightsResult, totalAiInsights]
  )
  const activeMetaRankingDrilldownConfig = useMemo(() => {
    if (!metaRankingDrilldown) return null
    const activeLayer = metaRankingLayers.find((layer) => layer.resultKey === metaRankingDrilldown.resultKey) || null
    if (!activeLayer) return null
    return activeLayer[metaRankingDrilldown.type] || null
  }, [metaRankingDrilldown, metaRankingLayers])
  const isCreativeRankingDrilldown = metaRankingDrilldown?.type === 'creatives'
  const activeMetaRankingDrilldownItem = metaRankingDrilldown?.item || null
  useEffect(() => {
    if (!isCreativeRankingDrilldown || !activeMetaRankingDrilldownItem?.adId || !hasMetaConfigured) {
      setMetaCreativePreview(null)
      setMetaCreativePreviewLoading(false)
      setMetaCreativePreviewError('')
      return
    }

    let cancelled = false

    const fetchCreativePreview = async () => {
      try {
        setMetaCreativePreview(null)
        setMetaCreativePreviewLoading(true)
        setMetaCreativePreviewError('')

        const params = new URLSearchParams({
          ad_id: activeMetaRankingDrilldownItem.adId,
          ad_account_id: selectedAdAccount,
        })
        const response = await fetch(`/api/meta/creative-preview?${params.toString()}`, {
          headers: metaRequestHeaders,
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar o preview real desse criativo.')
        }

        if (!cancelled) {
          setMetaCreativePreview(data)
        }
      } catch (error) {
        if (!cancelled) {
          setMetaCreativePreviewError(error.message || 'Não foi possível carregar o preview real desse criativo.')
        }
      } finally {
        if (!cancelled) {
          setMetaCreativePreviewLoading(false)
        }
      }
    }

    fetchCreativePreview()

    return () => {
      cancelled = true
    }
  }, [
    isCreativeRankingDrilldown,
    activeMetaRankingDrilldownItem?.adId,
    hasMetaConfigured,
    metaRequestHeaders,
    selectedAdAccount,
  ])

  useEffect(() => {
    if (!adsOverviewPreviewItem?.adId || !adsOverviewPreviewItem?.adAccountId || !hasMetaConfigured) {
      setAdsOverviewPreview(null)
      setAdsOverviewPreviewLoading(false)
      setAdsOverviewPreviewError('')
      return
    }

    let cancelled = false

    const fetchCreativePreview = async () => {
      try {
        setAdsOverviewPreview(null)
        setAdsOverviewPreviewLoading(true)
        setAdsOverviewPreviewError('')

        const params = new URLSearchParams({
          ad_id: adsOverviewPreviewItem.adId,
          ad_account_id: adsOverviewPreviewItem.adAccountId,
        })
        const response = await fetch(`/api/meta/creative-preview?${params.toString()}`, {
          headers: metaRequestHeaders,
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar o preview real desse criativo.')
        }

        if (!cancelled) setAdsOverviewPreview(data)
      } catch (error) {
        if (!cancelled) {
          setAdsOverviewPreviewError(error.message || 'Não foi possível carregar o preview real desse criativo.')
        }
      } finally {
        if (!cancelled) setAdsOverviewPreviewLoading(false)
      }
    }

    fetchCreativePreview()

    return () => {
      cancelled = true
    }
  }, [adsOverviewPreviewItem?.adId, adsOverviewPreviewItem?.adAccountId, hasMetaConfigured, metaRequestHeaders])

  useEffect(() => {
    if (!metaRankingDrilldown?.type || !activeMetaRankingDrilldownItem || !selectedAdAccount || !hasMetaConfigured) {
      setMetaRankingDetailDailyData([])
      setMetaRankingDetailDailyError('')
      setMetaRankingDetailDailyLoading(false)
      return
    }

    let cancelled = false

    const fetchDetailDailySeries = async () => {
      try {
        setMetaRankingDetailDailyLoading(true)
        setMetaRankingDetailDailyError('')

        let response

        if (metaRankingDrilldown.type === 'creatives' && activeMetaRankingDrilldownItem.adId) {
          const params = new URLSearchParams({
            ad_account_id: selectedAdAccount,
            date_preset: dateRange,
            ad_ids: activeMetaRankingDrilldownItem.adId,
          })

          if (dateRange === 'custom') {
            params.set('since', customSince)
            params.set('until', customUntil)
          }

          if (hasActiveMetaCampaignNarrowing && metaFilteredCampaignIds.length > 0) {
            params.set('campaign_ids', metaFilteredCampaignIds.join(','))
          }
          if (hasActiveMetaAdsetNarrowing && activeMetaAdsetIds.length > 0) {
            params.set('adset_ids', activeMetaAdsetIds.join(','))
          }

          response = await fetch(`/api/meta/insights?${params.toString()}`, { headers: metaRequestHeaders })
        } else {
          const detailScope = metaRankingDrilldown.type === 'cities'
            ? (breakdowns.geoScope === 'region' ? 'region' : breakdowns.geoScope === 'country' ? 'country' : 'city')
            : metaRankingDrilldown.type === 'ages'
              ? 'age'
              : metaRankingDrilldown.type === 'states'
                ? 'region'
                : ''

          const params = new URLSearchParams({
            ad_account_id: selectedAdAccount,
            date_preset: dateRange,
            detail_type: metaRankingDrilldown.type,
            detail_value: activeMetaRankingDrilldownItem.label,
          })

          if (detailScope) {
            params.set('detail_scope', detailScope)
          }

          if (dateRange === 'custom') {
            params.set('since', customSince)
            params.set('until', customUntil)
          }

          if (hasActiveMetaCampaignNarrowing && metaFilteredCampaignIds.length > 0) {
            params.set('campaign_ids', metaFilteredCampaignIds.join(','))
          }
          if (hasActiveMetaAdsetNarrowing && activeMetaAdsetIds.length > 0) {
            params.set('adset_ids', activeMetaAdsetIds.join(','))
          }
          if (hasActiveMetaAdNarrowing && activeMetaAdIds.length > 0) {
            params.set('ad_ids', activeMetaAdIds.join(','))
          }

          response = await fetch(`/api/meta/breakdowns?${params.toString()}`, { headers: metaRequestHeaders })
        }

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || 'Não foi possível carregar a evolução detalhada desse item.')
        }

        if (cancelled) return
        setMetaRankingDetailDailyData(metaRankingDrilldown.type === 'creatives' ? (data?.daily || []) : (data?.detail_daily || []))
      } catch (error) {
        if (cancelled) return
        setMetaRankingDetailDailyData([])
        setMetaRankingDetailDailyError(error.message || 'Não foi possível carregar a evolução detalhada desse item.')
      } finally {
        if (!cancelled) {
          setMetaRankingDetailDailyLoading(false)
        }
      }
    }

    fetchDetailDailySeries()

    return () => {
      cancelled = true
    }
  }, [
    metaRankingDrilldown,
    activeMetaRankingDrilldownItem,
    selectedAdAccount,
    hasMetaConfigured,
    dateRange,
    customSince,
    customUntil,
    hasActiveMetaCampaignNarrowing,
    hasActiveMetaAdsetNarrowing,
    hasActiveMetaAdNarrowing,
    metaFilteredCampaignIds,
    activeMetaAdsetIds,
    activeMetaAdIds,
    metaRequestHeaders,
  ])
  const metaRankingDetailDailySeries = useMemo(
    () => buildMetaDetailDailySeries(
      metaRankingDetailDailyData.map((item) => ({
        ...item,
        resultMetricKey: activeMetaRankingDrilldownConfig?.resultMetricKey || 'totalConversions',
      })),
      currentMetaResultWindow
    ),
    [activeMetaRankingDrilldownConfig?.resultMetricKey, metaRankingDetailDailyData, currentMetaResultWindow]
  )
  const metaRankingComparisonChartData = useMemo(() => {
    if (!activeMetaRankingDrilldownConfig?.items?.length || !activeMetaRankingDrilldownItem) return null

    if (!metaRankingDetailDailySeries.length) {
      return null
    }

    return {
      labels: metaRankingDetailDailySeries.map((item) => item.label),
      datasets: [
        {
          type: 'bar',
          label: activeMetaRankingDrilldownConfig.resultLabel,
          data: metaRankingDetailDailySeries.map((item) => item.results),
          backgroundColor: `${activeMetaRankingDrilldownConfig.resultTone}66`,
          borderColor: activeMetaRankingDrilldownConfig.resultTone,
          borderWidth: 1,
          borderRadius: 10,
          maxBarThickness: 36,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: isCreativeRankingDrilldown ? 'Custo por conversão' : activeMetaRankingDrilldownConfig.costLabel,
          data: metaRankingDetailDailySeries.map((item) => item.cost),
          borderColor: activeMetaRankingDrilldownConfig.costTone,
          backgroundColor: `${activeMetaRankingDrilldownConfig.costTone}22`,
          borderWidth: 3,
          borderDash: [7, 5],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#0b0f19',
          pointBorderColor: activeMetaRankingDrilldownConfig.costTone,
          pointBorderWidth: 2,
          tension: 0.34,
          yAxisID: 'y1',
        },
        {
          type: 'line',
          label: 'Investimento',
          data: metaRankingDetailDailySeries.map((item) => item.spend),
          borderColor: META_RANKING_SPEND_TONE,
          backgroundColor: `${META_RANKING_SPEND_TONE}1f`,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#0b0f19',
          pointBorderColor: META_RANKING_SPEND_TONE,
          pointBorderWidth: 2,
          tension: 0.34,
          yAxisID: 'y1',
        },
      ],
    }
  }, [activeMetaRankingDrilldownConfig, activeMetaRankingDrilldownItem, isCreativeRankingDrilldown, metaRankingDetailDailySeries, metaRankingDrilldown])
  const metaRankingComparisonChartOptions = useMemo(() => {
    if (!activeMetaRankingDrilldownConfig) return null

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${context.dataset.yAxisID === 'y'
                ? formatNumber(context.parsed.y)
                : formatCurrency(context.parsed.y)}`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8',
            font: {
              size: 11,
              weight: 600,
            },
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.12)' },
          ticks: {
            color: '#94a3b8',
            precision: 0,
            callback(value) {
              return formatNumber(value)
            },
          },
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            callback(value) {
              return formatCurrency(value)
            },
          },
        },
      },
    }
  }, [activeMetaRankingDrilldownConfig])
  const metaRankingDrilldownSummary = useMemo(() => {
    if (!activeMetaRankingDrilldownItem || !activeMetaRankingDrilldownConfig) return null

    const conversions = getMetaBreakdownResultValue(activeMetaRankingDrilldownItem, activeMetaRankingDrilldownConfig.resultMetricKey)
    const spendValue = Number(activeMetaRankingDrilldownItem.spend || 0)
    const avgCost = getMetaBreakdownAverageCost(activeMetaRankingDrilldownItem, activeMetaRankingDrilldownConfig.resultMetricKey)
    const clicksValue = Number(activeMetaRankingDrilldownItem.clicks || 0)
    const impressionsValue = Number(activeMetaRankingDrilldownItem.impressions || 0)
    const conversionRateValue = getMetaBreakdownConversionRate(activeMetaRankingDrilldownItem, activeMetaRankingDrilldownConfig.resultMetricKey)

    return {
      conversions,
      spendValue,
      avgCost,
      clicksValue,
      impressionsValue,
      conversionRateValue,
    }
  }, [activeMetaRankingDrilldownConfig, activeMetaRankingDrilldownItem])
  const metaDashboardMetricValues = useMemo(
    () => ({
      spend,
      impressions,
      clicks,
      cpc,
      ctr,
      totalConversions,
      reach,
      cpm,
      frequency,
      conversionRate,
      videoViews: customMetrics.videoViews || 0,
      videoViewRate: customMetrics.videoViewRate || 0,
      thruplay: customMetrics.thruplay || 0,
      hookRate: customMetrics.hookRate || 0,
      averageTicket,
      purchaseValue,
      purchases,
      costPerPurchase,
      leads,
      costPerLead,
      messages,
      costPerMessage,
      reachResults,
      costPerReach,
      thruplays,
      costPerTruplay,
      clicksWithoutConversion: Math.max(clicks - totalConversions, 0),
      roas,
    }),
    [spend, impressions, clicks, cpc, ctr, totalConversions, reach, cpm, frequency, conversionRate, customMetrics.videoViews, customMetrics.videoViewRate, customMetrics.thruplay, customMetrics.hookRate, averageTicket, purchaseValue, purchases, costPerPurchase, leads, costPerLead, messages, costPerMessage, reachResults, costPerReach, thruplays, costPerTruplay, roas]
  )
  const previousMetaDashboardMetricValues = useMemo(
    () => ({
      spend: parseFloat(previousInsights?.spend || 0),
      impressions: parseInt(previousInsights?.impressions || 0, 10),
      clicks: previousCustomMetrics.clicks || parseInt(previousInsights?.clicks || 0, 10),
      cpc: previousCustomMetrics.cpc || parseFloat(previousInsights?.cpc || 0),
      ctr: previousCustomMetrics.ctr || parseFloat(previousInsights?.ctr || 0),
      totalConversions: previousCustomMetrics.totalConversions || 0,
      reach: parseInt(previousInsights?.reach || 0, 10),
      cpm: previousCustomMetrics.cpm || 0,
      frequency: previousCustomMetrics.frequency || 0,
      conversionRate: previousCustomMetrics.conversionRate || 0,
      videoViews: previousCustomMetrics.videoViews || 0,
      videoViewRate: previousCustomMetrics.videoViewRate || 0,
      thruplay: previousCustomMetrics.thruplay || 0,
      hookRate: previousCustomMetrics.hookRate || 0,
      averageTicket: previousCustomMetrics.averageTicket || 0,
      purchaseValue: previousCustomMetrics.purchaseValue || 0,
      purchases: previousCustomMetrics.purchases || 0,
      costPerPurchase: previousCustomMetrics.cost_per_purchase || 0,
      leads: previousCustomMetrics.leads || 0,
      costPerLead: previousCustomMetrics.cost_per_lead || 0,
      messages: previousCustomMetrics.messages || 0,
      costPerMessage: previousCustomMetrics.cost_per_message || 0,
      reachResults: previousCustomMetrics.reach_results || 0,
      costPerReach: previousCustomMetrics.cost_per_reach || 0,
      thruplays: previousCustomMetrics.thruplays || 0,
      costPerTruplay: previousCustomMetrics.cost_per_thruplay || 0,
      clicksWithoutConversion: Math.max((previousCustomMetrics.clicks || parseInt(previousInsights?.clicks || 0, 10)) - (previousCustomMetrics.totalConversions || 0), 0),
      roas: previousCustomMetrics.roas || 0,
    }),
    [previousInsights, previousCustomMetrics]
  )
  const previousCrmLeadTotal =
    (previousMetaDashboardMetricValues.leads || 0)
    + (previousMetaDashboardMetricValues.messages || 0)
    + (previousRdSummary?.contactsInPeriod || 0)
  const metaDashboardMetricCards = useMemo(
    () =>
      draftMetaDashboardMetricLayouts
        .map((layoutItem) => {
          const metric = META_TEMPLATE_METRIC_OPTIONS[layoutItem.metricKey]
          if (!metric) return null

          return {
            id: layoutItem.id,
            key: layoutItem.metricKey,
            size: layoutItem.size,
            title: metric.label,
            description: metric.description,
            icon: metric.icon,
            tone: metric.tone,
            value: formatDashboardMetricValue(metaDashboardMetricValues[layoutItem.metricKey], metric.type),
            trend: buildMetricTrend(
              layoutItem.metricKey,
              metaDashboardMetricValues[layoutItem.metricKey],
              previousMetaDashboardMetricValues[layoutItem.metricKey],
              metric.type
            ),
          }
        })
        .filter(Boolean),
    [draftMetaDashboardMetricLayouts, metaDashboardMetricValues, previousMetaDashboardMetricValues]
  )
  const metaExtraDashboardMetricCards = useMemo(
    () => metaDashboardMetricCards.filter((card) => !FIXED_META_METRIC_KEYS.has(card.key)),
    [metaDashboardMetricCards]
  )
  const availableMetaDashboardMetricOptions = useMemo(
    () =>
      Object.entries(META_TEMPLATE_METRIC_OPTIONS).filter(
        ([metricKey]) =>
          !FIXED_META_METRIC_KEYS.has(metricKey)
          && !draftMetaDashboardMetricLayouts.some((item) => item.metricKey === metricKey)
      ),
    [draftMetaDashboardMetricLayouts]
  )
  const rdDashboardMetricValues = useMemo(
    () => ({
      opportunityCount: rdSummary?.opportunityCount || 0,
      qualifiedOpportunityCount: rdSummary?.qualifiedOpportunityCount || 0,
      wonOpportunityCount: rdSummary?.wonOpportunityCount || 0,
      wonOpportunityRevenue: rdSummary?.wonOpportunityRevenue || 0,
      avgTicketWonByCreation: rdSummary?.avgTicketWonByCreation || 0,
      leadToQualifiedRate: rdSummary?.leadToQualifiedRate || 0,
      qualifiedToWonRate: rdSummary?.qualifiedToWonRate || 0,
      leadToWonRate: rdSummary?.leadToWonRate || 0,
      lostOpportunityCount: rdSummary?.lostOpportunityCount || 0,
      lostOpportunityValue: rdSummary?.lostOpportunityValue || 0,
      openDeals: rdSummary?.openDeals || 0,
      openPipeline: rdSummary?.openPipeline || 0,
      wonDeals: rdSummary?.wonDeals || 0,
      wonDealsFromPreviousCohorts: rdSummary?.wonDealsFromPreviousCohorts || 0,
      wonRevenue: rdSummary?.wonRevenue || 0,
      avgTicketWon: rdSummary?.avgTicketWon || 0,
      wonRevenueFromPreviousCohorts: rdSummary?.wonRevenueFromPreviousCohorts || 0,
      avgTicketWonPreviousCohorts: rdSummary?.avgTicketWonPreviousCohorts || 0,
      wonRoas: rdCommercialRoas,
      rdFinalSalesCount,
      rdFinalRevenue,
      rdFinalAvgTicket,
      contacts: rdSummary?.contacts || 0,
      contactsInPeriod: rdSummary?.contactsInPeriod || 0,
      contactsMoved: rdSummary?.contactsMoved || 0,
      qualifiedDeals: rdSummary?.qualifiedDeals || 0,
      qualifiedContacts: rdSummary?.qualifiedContacts || 0,
      closeRate: rdSummary?.closeRate || 0,
      dealToWonRate: rdSummary?.dealToWonRate || 0,
      leadToDealRate: rdSummary?.leadToDealRate || 0,
      sourceConversionRate: rdSummary?.sourceConversionRate || 0,
      avgLeadToWonDays: rdSummary?.avgLeadToWonDays || 0,
      avgDealToWonDays: rdSummary?.avgDealToWonDays || 0,
      avgLeadToWonDaysFiltered: rdSummary?.avgLeadToWonDaysFiltered || 0,
      avgDealToWonDaysFiltered: rdSummary?.avgDealToWonDaysFiltered || 0,
      contactsWithDeals: rdSummary?.contactsWithDeals || 0,
      contactsWithWonDeals: rdSummary?.contactsWithWonDeals || 0,
      lostContacts: rdSummary?.lostContacts || 0,
    }),
    [rdSummary, rdFinalSalesCount, rdFinalRevenue, rdFinalAvgTicket, rdCommercialRoas]
  )
  const previousRdFinalSalesCount = (previousRdSummary?.wonOpportunityCount || 0) + (previousRdSummary?.wonDealsFromPreviousCohorts || 0)
  const previousRdFinalRevenue = (previousRdSummary?.wonOpportunityRevenue || 0) + (previousRdSummary?.wonRevenueFromPreviousCohorts || 0)
  const previousRdFinalAvgTicket = previousRdFinalSalesCount > 0 ? previousRdFinalRevenue / previousRdFinalSalesCount : 0
  const previousRdCommercialRoas = safeNumber(previousInsights?.spend) > 0 ? previousRdFinalRevenue / safeNumber(previousInsights?.spend) : 0
  const previousRdDashboardMetricValues = useMemo(
    () => ({
      opportunityCount: previousRdSummary?.opportunityCount || 0,
      qualifiedOpportunityCount: previousRdSummary?.qualifiedOpportunityCount || 0,
      wonOpportunityCount: previousRdSummary?.wonOpportunityCount || 0,
      wonOpportunityRevenue: previousRdSummary?.wonOpportunityRevenue || 0,
      avgTicketWonByCreation: previousRdSummary?.avgTicketWonByCreation || 0,
      leadToQualifiedRate: previousRdSummary?.leadToQualifiedRate || 0,
      qualifiedToWonRate: previousRdSummary?.qualifiedToWonRate || 0,
      leadToWonRate: previousRdSummary?.leadToWonRate || 0,
      lostOpportunityCount: previousRdSummary?.lostOpportunityCount || 0,
      lostOpportunityValue: previousRdSummary?.lostOpportunityValue || 0,
      openDeals: previousRdSummary?.openDeals || 0,
      openPipeline: previousRdSummary?.openPipeline || 0,
      wonDeals: previousRdSummary?.wonDeals || 0,
      wonDealsFromPreviousCohorts: previousRdSummary?.wonDealsFromPreviousCohorts || 0,
      wonRevenue: previousRdSummary?.wonRevenue || 0,
      avgTicketWon: previousRdSummary?.avgTicketWon || 0,
      wonRevenueFromPreviousCohorts: previousRdSummary?.wonRevenueFromPreviousCohorts || 0,
      avgTicketWonPreviousCohorts: previousRdSummary?.avgTicketWonPreviousCohorts || 0,
      wonRoas: previousRdCommercialRoas,
      rdFinalSalesCount: previousRdFinalSalesCount,
      rdFinalRevenue: previousRdFinalRevenue,
      rdFinalAvgTicket: previousRdFinalAvgTicket,
      contacts: previousRdSummary?.contacts || 0,
      contactsInPeriod: previousRdSummary?.contactsInPeriod || 0,
      contactsMoved: previousRdSummary?.contactsMoved || 0,
      qualifiedDeals: previousRdSummary?.qualifiedDeals || 0,
      qualifiedContacts: previousRdSummary?.qualifiedContacts || 0,
      closeRate: previousRdSummary?.closeRate || 0,
      dealToWonRate: previousRdSummary?.dealToWonRate || 0,
      leadToDealRate: previousRdSummary?.leadToDealRate || 0,
      sourceConversionRate: previousRdSummary?.sourceConversionRate || 0,
      avgLeadToWonDays: previousRdSummary?.avgLeadToWonDays || 0,
      avgDealToWonDays: previousRdSummary?.avgDealToWonDays || 0,
      avgLeadToWonDaysFiltered: previousRdSummary?.avgLeadToWonDaysFiltered || 0,
      avgDealToWonDaysFiltered: previousRdSummary?.avgDealToWonDaysFiltered || 0,
      contactsWithDeals: previousRdSummary?.contactsWithDeals || 0,
      contactsWithWonDeals: previousRdSummary?.contactsWithWonDeals || 0,
      lostContacts: previousRdSummary?.lostContacts || 0,
    }),
    [previousRdSummary, previousRdFinalSalesCount, previousRdFinalRevenue, previousRdFinalAvgTicket, previousRdCommercialRoas]
  )
  const rdDashboardMetricCards = useMemo(
    () =>
      draftRdDashboardMetricLayouts
        .map((layoutItem) => {
          const metric = RD_TEMPLATE_METRIC_OPTIONS[layoutItem.metricKey]
          if (!metric) return null

          return {
            id: layoutItem.id,
            key: layoutItem.metricKey,
            size: layoutItem.size,
            title: metric.label,
            description: metric.description,
            icon: metric.icon,
            tone: metric.tone,
            value: formatDashboardMetricValue(rdDashboardMetricValues[layoutItem.metricKey], metric.type),
            trend: buildMetricTrend(
              layoutItem.metricKey,
              rdDashboardMetricValues[layoutItem.metricKey],
              previousRdDashboardMetricValues[layoutItem.metricKey],
              metric.type
            ),
          }
        })
        .filter(Boolean),
    [draftRdDashboardMetricLayouts, rdDashboardMetricValues, previousRdDashboardMetricValues]
  )
  const rdExtraDashboardMetricCards = useMemo(
    () => rdDashboardMetricCards.filter((card) => !FIXED_RD_METRIC_KEYS.has(card.key)),
    [rdDashboardMetricCards]
  )
  const availableRdDashboardMetricOptions = useMemo(
    () =>
      Object.entries(RD_TEMPLATE_METRIC_OPTIONS).filter(
        ([metricKey]) =>
          !FIXED_RD_METRIC_KEYS.has(metricKey)
          && !draftRdDashboardMetricLayouts.some((item) => item.metricKey === metricKey)
      ),
    [draftRdDashboardMetricLayouts]
  )
  const googleSheetsMetricOptions = useMemo(
    () => {
      const baseOptions = {}

      if (googleSheetsSummary?.rowMetric) {
        baseOptions[googleSheetsSummary.rowMetric.id] = {
          label: googleSheetsSummary.rowMetric.label,
          type: googleSheetsSummary.rowMetric.type || 'number',
          icon: 'bx-table',
          tone: 'blue',
          description: 'Quantidade total de linhas válidas importadas da planilha.',
        }
      }

      ;(googleSheetsSummary?.statusSummary?.counts || []).forEach((status) => {
        baseOptions[status.id] = {
          label: status.label,
          type: 'number',
          icon: 'bx-git-branch',
          tone: 'emerald',
          description: `Quantidade de registros atualmente em ${status.label}.`,
        }
      })

      return (googleSheetsSummary?.numericColumns || []).reduce((accumulator, column) => {
        accumulator[column.id] = {
          label: column.header,
          type: column.type || 'number',
          icon: 'bx-spreadsheet',
          tone: 'emerald',
          description: `Soma consolidada da coluna ${column.header} na planilha vinculada.`,
        }
        return accumulator
      }, baseOptions)
    },
    [googleSheetsSummary]
  )
  const googleSheetsMetricValues = useMemo(
    () => {
      const baseValues = {}

      if (googleSheetsSummary?.rowMetric) {
        baseValues[googleSheetsSummary.rowMetric.id] = googleSheetsSummary.rowMetric.value || 0
      }

      ;(googleSheetsSummary?.statusSummary?.counts || []).forEach((status) => {
        baseValues[status.id] = status.count || 0
      })

      return (googleSheetsSummary?.numericColumns || []).reduce((accumulator, column) => {
        accumulator[column.id] = column.sum || 0
        return accumulator
      }, baseValues)
    },
    [googleSheetsSummary]
  )
  const googleSheetsDashboardMetricCards = useMemo(
    () =>
      draftSheetsDashboardMetricLayouts
        .map((layoutItem) => {
          const metric = googleSheetsMetricOptions[layoutItem.metricKey]
          if (!metric) return null

          return {
            id: layoutItem.id,
            key: layoutItem.metricKey,
            size: layoutItem.size,
            title: metric.label,
            description: metric.description,
            icon: metric.icon,
            tone: metric.tone,
            value: formatDashboardMetricValue(googleSheetsMetricValues[layoutItem.metricKey], metric.type),
          }
        })
        .filter(Boolean),
    [draftSheetsDashboardMetricLayouts, googleSheetsMetricOptions, googleSheetsMetricValues]
  )
  const availableGoogleSheetsMetricOptions = useMemo(
    () =>
      Object.entries(googleSheetsMetricOptions).filter(
        ([metricKey]) => !draftSheetsDashboardMetricLayouts.some((item) => item.metricKey === metricKey)
      ),
    [googleSheetsMetricOptions, draftSheetsDashboardMetricLayouts]
  )
  const defaultGoogleSheetsKpis = useMemo(
    () => {
      const defaultItems = []

      if (googleSheetsSummary?.rowMetric) {
        defaultItems.push({
          key: googleSheetsSummary.rowMetric.id,
          title: googleSheetsSummary.rowMetric.label,
          value: formatDashboardMetricValue(googleSheetsSummary.rowMetric.value || 0, googleSheetsSummary.rowMetric.type || 'number'),
          icon: 'bx-table',
          tone: 'blue',
        })
      }

      ;(googleSheetsSummary?.statusSummary?.counts || []).slice(0, 5).forEach((status) => {
        defaultItems.push({
          key: status.id,
          title: status.label,
          value: formatNumber(status.count || 0),
          icon: 'bx-git-branch',
          tone: 'emerald',
        })
      })

      if (defaultItems.length > 0) return defaultItems

      return (googleSheetsSummary?.numericColumns || []).slice(0, 4).map((column) => ({
        key: column.id,
        title: column.header,
        value: formatDashboardMetricValue(column.sum || 0, column.type || 'number'),
        icon: 'bx-spreadsheet',
        tone: 'emerald',
      }))
    },
    [googleSheetsSummary]
  )
  const clickUpKpis = [
    { key: 'totalTasks', title: 'Tarefas totais', value: formatNumber(clickUpSummary?.totalTasks || 0), icon: 'bx-task', tone: 'purple' },
    { key: 'openTasks', title: 'Em aberto', value: formatNumber(clickUpSummary?.openTasks || 0), icon: 'bx-loader-circle', tone: 'blue' },
    { key: 'inProgressTasks', title: 'Em andamento', value: formatNumber(clickUpSummary?.inProgressTasks || 0), icon: 'bx-run', tone: 'cyan' },
    { key: 'completedTasks', title: 'Concluídas', value: formatNumber(clickUpSummary?.completedTasks || 0), icon: 'bx-check-circle', tone: 'emerald' },
    { key: 'blockedTasks', title: 'Bloqueadas', value: formatNumber(clickUpSummary?.blockedTasks || 0), icon: 'bx-block', tone: 'pink' },
    { key: 'overdueTasks', title: 'Atrasadas', value: formatNumber(clickUpSummary?.overdueTasks || 0), icon: 'bx-time-five', tone: 'orange' },
  ]
  const mondayPeriodLabel = getDatePresetLabel(mondayDateRange, mondayCustomSince, mondayCustomUntil)
  const mondayOwnerOptions = mondaySummary?.availableOwners || []
  const selectedMondayOwnerLabel = mondayOwnerFilter === 'all'
    ? 'Todos os usuários'
    : (mondayOwnerOptions.find((item) => item.id === mondayOwnerFilter)?.label || mondayOwnerFilter)
  const mondayDrilldownOwnerGroups = useMemo(
    () => buildMondayDrilldownOwnerGroups(mondayMetricDrilldown?.items || [], mondayOwnerFilter, selectedMondayOwnerLabel),
    [mondayMetricDrilldown, mondayOwnerFilter, selectedMondayOwnerLabel]
  )
  const mondayKpis = [
    { key: 'totalItems', title: 'Itens no recorte', value: formatNumber(mondaySummary?.totalItems || 0), icon: 'bx-columns', tone: 'gold' },
    { key: 'activeItems', title: 'Em andamento', value: formatNumber(mondaySummary?.activeItems || 0), icon: 'bx-loader-circle', tone: 'blue' },
    { key: 'overdueItems', title: 'Atrasados', value: formatNumber(mondaySummary?.overdueItems || 0), icon: 'bx-time-five', tone: 'orange' },
    { key: 'blockedItems', title: 'Bloqueados', value: formatNumber(mondaySummary?.blockedItems || 0), icon: 'bx-block', tone: 'pink' },
    { key: 'dueSoonItems', title: 'Vencem em 7 dias', value: formatNumber(mondaySummary?.dueSoonItems || 0), icon: 'bx-alarm-exclamation', tone: 'purple' },
    { key: 'unassignedItems', title: 'Sem responsável', value: formatNumber(mondaySummary?.unassignedItems || 0), icon: 'bx-user-x', tone: 'cyan' },
  ]
  const metaMediaKpis = [
    { key: 'spend', title: 'Investimento', value: formatCurrency(spend), rawValue: spend, type: 'currency', icon: 'bx-wallet-alt', tone: 'blue' },
    { key: 'impressions', title: 'Impressões', value: formatNumber(impressions), rawValue: impressions, type: 'number', icon: 'bx-show', tone: 'purple' },
    { key: 'cpm', title: 'CPM', value: formatCurrency(cpm), rawValue: cpm, type: 'currency', icon: 'bx-bar-chart-alt-2', tone: 'purple' },
    { key: 'reach', title: 'Alcance', value: formatNumber(reach), rawValue: reach, type: 'number', icon: 'bx-radar', tone: 'blue' },
    { key: 'frequency', title: 'Frequência', value: formatDashboardMetricValue(frequency, 'decimal'), rawValue: frequency, type: 'decimal', icon: 'bx-repeat', tone: 'gold' },
    { key: 'clicks', title: 'Cliques no link', value: formatNumber(clicks), rawValue: clicks, type: 'number', icon: 'bx-pointer', tone: 'cyan' },
    { key: 'cpc', title: 'CPC', value: formatCurrency(cpc), rawValue: cpc, type: 'currency', icon: 'bx-purchase-tag', tone: 'orange' },
    { key: 'ctr', title: 'CTR', value: formatPercent(ctr), rawValue: ctr, type: 'percent', icon: 'bx-mouse', tone: 'pink' },
    { key: 'totalConversions', title: 'Conversões totais', value: formatNumber(totalConversions), rawValue: totalConversions, type: 'number', icon: 'bx-line-chart', tone: 'gold' },
    { key: 'conversionRate', title: 'Taxa de conversão clique -> conversão', value: formatPercent(conversionRate), rawValue: conversionRate, type: 'percent', icon: 'bx-git-compare', tone: 'emerald' },
    { key: 'purchaseValue', title: 'Faturamento', value: formatCurrency(purchaseValue), rawValue: purchaseValue, type: 'currency', icon: 'bx-money', tone: 'emerald' },
  ]
  const metaConversionGroups = [
    {
      key: 'purchases',
      title: 'Compras',
      description: 'Resultado de vendas atribuídas no período',
      icon: 'bx-cart',
      tone: 'emerald',
      resultValue: purchases,
      secondaryInsights: metaSecondaryResultInsights.purchases,
      stats: [
        { label: 'Compras', value: formatNumber(purchases) },
        { label: 'Custo por compra', value: formatCurrency(costPerPurchase) },
        { label: 'ROAS da compra', value: formatMultiplier(purchaseRoas) },
      ],
    },
    {
      key: 'leads',
      title: 'Cadastros',
      description: 'Conversões em leads atribuídas no período',
      icon: 'bx-user-plus',
      tone: 'gold',
      resultValue: leads,
      secondaryInsights: metaSecondaryResultInsights.leads,
      stats: [
        { label: 'Cadastros', value: formatNumber(leads) },
        { label: 'Custo por cadastro', value: formatCurrency(costPerLead) },
      ],
    },
    {
      key: 'messages',
      title: 'Mensagens iniciadas',
      description: 'Conversas iniciadas em canais de mensagem',
      icon: 'bx-message-rounded-dots',
      tone: 'blue',
      resultValue: messages,
      secondaryInsights: metaSecondaryResultInsights.messages,
      stats: [
        { label: 'Mensagens iniciadas', value: formatNumber(messages) },
        { label: 'Custo por mensagem iniciada', value: formatCurrency(costPerMessage) },
      ],
    },
    {
      key: 'reach',
      title: 'Alcance',
      description: 'Entrega das campanhas classificadas como alcance',
      icon: 'bx-radar',
      tone: 'cyan',
      resultValue: reachResults,
      stats: [
        { label: 'Pessoas alcançadas', value: formatNumber(reachResults) },
        { label: 'Custo por alcance', value: formatCurrency(costPerReach) },
      ],
    },
    {
      key: 'truplays',
      title: 'TruPlays',
      description: 'Resultados das campanhas de vídeo no período',
      icon: 'bx-play-circle',
      tone: 'purple',
      resultValue: thruplays,
      stats: [
        { label: 'TruPlays', value: formatNumber(thruplays) },
        { label: 'Custo por TruPlay', value: formatCurrency(costPerTruplay) },
      ],
    },
  ]
  const visibleMetaConversionGroups = useMemo(
    () => metaConversionGroups.filter((group) => normalizedMetaResultFilters.includes(group.key) && Number(group.resultValue || 0) > 0),
    [metaConversionGroups, normalizedMetaResultFilters]
  )
  const activeMetaComparisonGroups = visibleMetaConversionGroups
  useEffect(() => {
    const rankedOptions = activeMetaComparisonGroups
      .map((group) => ({ key: group.key, value: group.resultValue || 0 }))
      .sort((left, right) => right.value - left.value)

    if (!rankedOptions.length) return
    if (!rankedOptions.some((item) => item.key === metaResultPreviewKey)) {
      setMetaResultPreviewKey(rankedOptions[0].key)
      return
    }
    if ((rankedOptions[0]?.value || 0) <= 0) return
    if ((rankedOptions.find((item) => item.key === metaResultPreviewKey)?.value || 0) > 0) return

    setMetaResultPreviewKey(rankedOptions[0].key)
  }, [activeMetaComparisonGroups, metaResultPreviewKey])
  const activeMetaSecondaryResultGroup = metaConversionGroups.find((group) => group.key === metaSecondaryResultDrilldown) || null
  const activeMetaSecondaryResultInsights = activeMetaSecondaryResultGroup?.secondaryInsights || null
  const activeMetaResultPreviewConfig = META_RESULT_COMPARISON_OPTIONS[metaResultPreviewKey] || META_RESULT_COMPARISON_OPTIONS.purchases
  const metaCampaignObjectiveMap = useMemo(
    () => Object.fromEntries(
      campaigns.map((campaign) => [String(campaign.id || '').trim(), campaign.objective || ''])
    ),
    [campaigns]
  )
  const metaResultPreviewSeries = useMemo(
    () => {
      const filteredDaily = activeMetaCampaignIds.length > 0
        ? dailyCampaignData.filter((item) => activeMetaCampaignIds.includes(item.campaign_id))
        : dailyCampaignData
      return buildMetaResultComparisonSeries(filteredDaily, activeMetaResultPreviewConfig.resultMetricKey, metaResultGrouping, metaCampaignObjectiveMap, currentMetaResultWindow)
    },
    [activeMetaResultPreviewConfig, dailyCampaignData, metaCampaignObjectiveMap, metaResultGrouping, currentMetaResultWindow, activeMetaCampaignIds]
  )
  const metaResultPreviewChartData = useMemo(
    () => ({
      labels: metaResultPreviewSeries.length ? metaResultPreviewSeries.map((bucket) => bucket.label) : ['Sem dados'],
      datasets: [
        {
          label: activeMetaResultPreviewConfig.resultLabel,
          data: metaResultPreviewSeries.length ? metaResultPreviewSeries.map((bucket) => bucket.results) : [0],
          borderColor: activeMetaResultPreviewConfig.resultTone,
          backgroundColor: `${activeMetaResultPreviewConfig.resultTone}22`,
          borderWidth: 3,
          pointBackgroundColor: '#0b0f19',
          pointBorderColor: activeMetaResultPreviewConfig.resultTone,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.34,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: activeMetaResultPreviewConfig.costLabel,
          data: metaResultPreviewSeries.length ? metaResultPreviewSeries.map((bucket) => bucket.cost) : [0],
          borderColor: activeMetaResultPreviewConfig.costTone,
          backgroundColor: 'transparent',
          borderWidth: 3,
          borderDash: [7, 5],
          pointBackgroundColor: '#0b0f19',
          pointBorderColor: activeMetaResultPreviewConfig.costTone,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.34,
          yAxisID: 'y1',
        },
      ],
    }),
    [activeMetaResultPreviewConfig, metaResultPreviewSeries]
  )
  const metaResultPreviewChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${context.dataset.yAxisID === 'y'
                ? formatNumber(context.parsed.y)
                : formatCurrency(context.parsed.y)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', maxRotation: 0, autoSkipPadding: 16 },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#94a3b8',
            precision: 0,
            callback(value) {
              return formatChartAxis(value, activeMetaResultPreviewConfig.resultMetricKey)
            },
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            callback(value) {
              return formatCurrency(value)
            },
          },
        },
      },
    }),
    [activeMetaResultPreviewConfig]
  )
  const metaResultPreviewSummary = useMemo(() => {
    const totalResults = metaResultPreviewSeries.reduce((accumulator, bucket) => accumulator + bucket.results, 0)
    const totalSpend = metaResultPreviewSeries.reduce((accumulator, bucket) => accumulator + bucket.spend, 0)

    return {
      totalResults,
      totalSpend,
      averageCost: totalResults > 0 ? totalSpend / totalResults : 0,
      points: metaResultPreviewSeries.length,
    }
  }, [metaResultPreviewSeries])
  const activeMetaResultDrilldownConfig = metaResultDrilldown
    ? META_RESULT_COMPARISON_OPTIONS[metaResultDrilldown.key] || null
    : null
  const metaResultComparisonSeries = useMemo(
    () => (
      activeMetaResultDrilldownConfig
        ? buildMetaResultComparisonSeries(dailyCampaignData, activeMetaResultDrilldownConfig.resultMetricKey, metaResultGrouping, metaCampaignObjectiveMap, currentMetaResultWindow)
        : []
    ),
    [activeMetaResultDrilldownConfig, dailyCampaignData, metaCampaignObjectiveMap, metaResultGrouping, currentMetaResultWindow]
  )
  const metaResultComparisonChartData = useMemo(() => {
    if (!activeMetaResultDrilldownConfig) return null

    return {
      labels: metaResultComparisonSeries.length ? metaResultComparisonSeries.map((bucket) => bucket.label) : ['Sem dados'],
      datasets: [
        {
          label: activeMetaResultDrilldownConfig.resultLabel,
          data: metaResultComparisonSeries.length ? metaResultComparisonSeries.map((bucket) => bucket.results) : [0],
          borderColor: activeMetaResultDrilldownConfig.resultTone,
          backgroundColor: `${activeMetaResultDrilldownConfig.resultTone}22`,
          borderWidth: 3,
          pointBackgroundColor: '#0b0f19',
          pointBorderColor: activeMetaResultDrilldownConfig.resultTone,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.34,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: activeMetaResultDrilldownConfig.costLabel,
          data: metaResultComparisonSeries.length ? metaResultComparisonSeries.map((bucket) => bucket.cost) : [0],
          borderColor: activeMetaResultDrilldownConfig.costTone,
          backgroundColor: 'transparent',
          borderWidth: 3,
          borderDash: [7, 5],
          pointBackgroundColor: '#0b0f19',
          pointBorderColor: activeMetaResultDrilldownConfig.costTone,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.34,
          yAxisID: 'y1',
        },
      ],
    }
  }, [activeMetaResultDrilldownConfig, metaResultComparisonSeries])
  const metaResultComparisonChartOptions = useMemo(() => {
    if (!activeMetaResultDrilldownConfig) return null

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.94)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${context.dataset.yAxisID === 'y'
                ? formatNumber(context.parsed.y)
                : formatCurrency(context.parsed.y)}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', maxRotation: 0, autoSkipPadding: 16 },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#94a3b8',
            precision: 0,
            callback(value) {
              return formatChartAxis(value, activeMetaResultDrilldownConfig.resultMetricKey)
            },
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            callback(value) {
              return formatChartAxis(value, activeMetaResultDrilldownConfig.costMetricKey)
            },
          },
        },
      },
    }
  }, [activeMetaResultDrilldownConfig])
  const metaResultComparisonSummary = useMemo(() => {
    if (!activeMetaResultDrilldownConfig) return null

    const totalResults = metaResultComparisonSeries.reduce((accumulator, bucket) => accumulator + bucket.results, 0)
    const totalSpend = metaResultComparisonSeries.reduce((accumulator, bucket) => accumulator + bucket.spend, 0)
    const averageCost = totalResults > 0 ? totalSpend / totalResults : 0

    return {
      totalResults,
      totalSpend,
      averageCost,
      points: metaResultComparisonSeries.length,
    }
  }, [activeMetaResultDrilldownConfig, metaResultComparisonSeries])
  const previousCrmMetaLeadTotal = previousMetaDashboardMetricValues.leads || 0
  const metaLeadToQualifiedRate = crmLeadMetaLeads > 0 ? ((rdSummary?.qualifiedOpportunityCount || 0) / crmLeadMetaLeads) * 100 : 0
  const previousMetaLeadToQualifiedRate = previousCrmMetaLeadTotal > 0
    ? ((previousRdSummary?.qualifiedOpportunityCount || 0) / previousCrmMetaLeadTotal) * 100
    : 0
  const activeManualCrmValues = activeClient?.manualCrmSummary || {}
  const manualCrmCardClick = activeClientUsesManualCrm ? () => setIsManualCrmModalOpen(true) : undefined
  const hasManualOpportunityCount = hasManualCrmValue(activeManualCrmValues, 'opportunityCount')
  const hasManualQualifiedCount = hasManualCrmValue(activeManualCrmValues, 'qualifiedOpportunityCount')
  const hasManualWonCount = hasManualCrmValue(activeManualCrmValues, 'wonOpportunityCount')
  const hasManualWonRevenue = hasManualCrmValue(activeManualCrmValues, 'wonRevenue')
  const hasManualLostCount = hasManualCrmValue(activeManualCrmValues, 'lostOpportunityCount')
  const manualQualifiedRate = calculateRate(rdSummary?.qualifiedOpportunityCount || 0, rdSummary?.opportunityCount || 0)
  const manualSalesRate = calculateRate(rdSummary?.wonOpportunityCount || 0, rdSummary?.opportunityCount || 0)
  const manualCommercialRoas = safeNumber(insights?.spend) > 0 ? safeNumber(rdSummary?.wonOpportunityRevenue || rdSummary?.wonRevenue) / safeNumber(insights?.spend) : 0
  const displayManualKpiValue = (hasValue, formattedValue, extraCondition = true) => (hasValue && extraCondition ? formattedValue : '-')
  const rdAgendorFunnelKpis = [
    {
      key: activeClientUsesManualCrm ? "manualOpportunityCount" : "metaLeadCount",
      title: activeClientUsesManualCrm ? "Oportunidades" : "Leads Meta",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualOpportunityCount, formatNumber(rdSummary?.opportunityCount || 0)) : formatNumber(crmLeadMetaLeads),
      rawValue: activeClientUsesManualCrm ? rdSummary?.opportunityCount || 0 : crmLeadMetaLeads,
      type: "number",
      icon: "bx-user-plus",
      tone: "blue",
      detail: activeClientUsesManualCrm ? "Clique para adicionar ou editar oportunidades manuais." : "Leads gerados no Meta no período selecionado.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("metaLeadCount", crmLeadMetaLeads, previousCrmMetaLeadTotal, "number"),
      onClick: manualCrmCardClick,
    },
    {
      key: "qualifiedOpportunityCount",
      title: "Qualificados",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualQualifiedCount, formatNumber(rdSummary?.qualifiedOpportunityCount || 0)) : formatNumber(rdSummary?.qualifiedOpportunityCount || 0),
      rawValue: rdSummary?.qualifiedOpportunityCount || 0,
      type: "number",
      icon: "bx-filter-alt",
      tone: "emerald",
      detail: activeClientUsesManualCrm ? "Clique para adicionar ou editar qualificados." : "Negócios criados no período que chegaram às etapas qualificadas selecionadas.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("qualifiedOpportunityCount", rdSummary?.qualifiedOpportunityCount || 0, previousRdDashboardMetricValues.qualifiedOpportunityCount, "number"),
      onClick: manualCrmCardClick,
    },
    {
      key: "manualLeadToQualifiedRate",
      title: "Taxa de qualificação",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualOpportunityCount && hasManualQualifiedCount, formatPercent(manualQualifiedRate), safeNumber(rdSummary?.opportunityCount) > 0) : formatPercent(metaLeadToQualifiedRate),
      rawValue: activeClientUsesManualCrm ? manualQualifiedRate : metaLeadToQualifiedRate,
      type: "percent",
      icon: "bx-transfer-alt",
      tone: "cyan",
      detail: activeClientUsesManualCrm ? "Qualificados divididos pelas oportunidades." : "Qualificados Agendor divididos pelos leads gerados no Meta.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("metaLeadToQualifiedRate", metaLeadToQualifiedRate, previousMetaLeadToQualifiedRate, "percent"),
      onClick: manualCrmCardClick,
    },
    {
      key: "wonOpportunityCount",
      title: "Vendas",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualWonCount, formatNumber(rdSummary?.wonOpportunityCount || 0)) : formatNumber(rdSummary?.wonOpportunityCount || 0),
      rawValue: rdSummary?.wonOpportunityCount || 0,
      type: "number",
      icon: "bx-badge-check",
      tone: "emerald",
      detail: activeClientUsesManualCrm ? "Clique para adicionar ou editar vendas." : "Negócios criados no período que estão como vendidos.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("wonOpportunityCount", rdSummary?.wonOpportunityCount || 0, previousRdDashboardMetricValues.wonOpportunityCount, "number"),
      onClick: manualCrmCardClick,
    },
    {
      key: "wonOpportunityRevenue",
      title: "Valor vendido",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualWonRevenue, formatCurrency(rdSummary?.wonOpportunityRevenue || 0)) : formatCurrency(rdSummary?.wonOpportunityRevenue || 0),
      rawValue: rdSummary?.wonOpportunityRevenue || 0,
      type: "currency",
      icon: "bx-wallet-alt",
      tone: "orange",
      detail: activeClientUsesManualCrm ? "Clique para adicionar ou editar o faturamento vendido." : "Valor vendido dos negócios criados no período.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("wonOpportunityRevenue", rdSummary?.wonOpportunityRevenue || 0, previousRdDashboardMetricValues.wonOpportunityRevenue, "currency"),
      onClick: manualCrmCardClick,
    },
    {
      key: "manualCommercialRoas",
      title: "ROAS comercial",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualWonRevenue, formatMultiplier(manualCommercialRoas), safeNumber(insights?.spend) > 0) : formatMultiplier(rdCommercialRoas),
      rawValue: activeClientUsesManualCrm ? manualCommercialRoas : rdCommercialRoas,
      type: "multiplier",
      icon: "bx-rocket",
      tone: "blue",
      detail: "Valor vendido dividido pelo investimento Meta do período.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("wonRoas", rdCommercialRoas, previousRdCommercialRoas, "multiplier"),
      onClick: manualCrmCardClick,
    },
    {
      key: "qualifiedToWonRate",
      title: "Taxa de venda",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualOpportunityCount && hasManualWonCount, formatPercent(manualSalesRate), safeNumber(rdSummary?.opportunityCount) > 0) : formatPercent(rdSummary?.qualifiedToWonRate || 0),
      rawValue: activeClientUsesManualCrm ? manualSalesRate : rdSummary?.qualifiedToWonRate || 0,
      type: "percent",
      icon: "bx-line-chart",
      tone: "blue",
      detail: activeClientUsesManualCrm ? "Vendas divididas pelas oportunidades." : "Vendas divididas pelos leads qualificados.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("qualifiedToWonRate", rdSummary?.qualifiedToWonRate || 0, previousRdDashboardMetricValues.qualifiedToWonRate, "percent"),
      onClick: manualCrmCardClick,
    },
    {
      key: "lostOpportunityCount",
      title: "Perdidos",
      value: activeClientUsesManualCrm ? displayManualKpiValue(hasManualLostCount, formatNumber(rdSummary?.lostOpportunityCount || 0)) : formatNumber(rdSummary?.lostOpportunityCount || 0),
      rawValue: rdSummary?.lostOpportunityCount || 0,
      type: "number",
      icon: "bx-x-circle",
      tone: "pink",
      detail: activeClientUsesManualCrm ? "Campo opcional para perdas manuais." : "Negócios criados no período que foram marcados como perdidos.",
      trend: activeClientUsesManualCrm ? null : buildMetricTrend("lostOpportunityCount", rdSummary?.lostOpportunityCount || 0, previousRdDashboardMetricValues.lostOpportunityCount, "number"),
      onClick: manualCrmCardClick,
      hidden: activeClientUsesManualCrm,
    },
    {
      key: "lostOpportunityValue",
      title: "Valor perdido",
      value: formatCurrency(rdSummary?.lostOpportunityValue || 0),
      rawValue: rdSummary?.lostOpportunityValue || 0,
      type: "currency",
      icon: "bx-money-withdraw",
      tone: "pink",
      detail: "Valor potencial dos negócios perdidos criados no período.",
      trend: buildMetricTrend("lostOpportunityValue", rdSummary?.lostOpportunityValue || 0, previousRdDashboardMetricValues.lostOpportunityValue, "currency"),
      hidden: activeClientUsesManualCrm,
    },
  ]
  const metaMediaKpisWithTrend = metaMediaKpis.map((metric) => ({
    ...metric,
    trend: buildMetricTrend(metric.key, metric.rawValue, previousMetaDashboardMetricValues[metric.key], metric.type),
  }))
  const metaFixedDashboardMetricCards = useMemo(
    () =>
      metaMediaKpisWithTrend.map((metric) => ({
        id: `fixed-${metric.key}`,
        key: metric.key,
        title: metric.title,
        description: '',
        icon: metric.icon,
        tone: metric.tone,
        value: metric.value,
        trend: metric.trend,
        fixed: true,
      })),
    [metaMediaKpisWithTrend]
  )
  const metaSummaryDashboardMetricCards = useMemo(
    () => [...metaFixedDashboardMetricCards, ...metaExtraDashboardMetricCards],
    [metaExtraDashboardMetricCards, metaFixedDashboardMetricCards]
  )
  const googleAdsKpis = useMemo(() => {
    const summary = googleAdsSummary?.summary || {}
    return [
      { key: 'spend', title: 'Investimento', value: formatCurrency(summary.spend || 0), icon: 'bx-wallet-alt', tone: 'emerald' },
      { key: 'impressions', title: 'Impressões', value: formatNumber(summary.impressions || 0), icon: 'bx-show', tone: 'blue' },
      { key: 'clicks', title: 'Cliques', value: formatNumber(summary.clicks || 0), icon: 'bx-pointer', tone: 'cyan' },
      { key: 'cpc', title: 'CPC médio', value: formatCurrency(summary.cpc || 0), icon: 'bx-purchase-tag', tone: 'orange' },
      { key: 'ctr', title: 'CTR', value: formatPercent(summary.ctr || 0), icon: 'bx-mouse', tone: 'purple' },
      { key: 'conversions', title: 'Conversões', value: formatDashboardMetricValue(summary.conversions || 0, 'decimal'), icon: 'bx-target-lock', tone: 'gold' },
      { key: 'costPerConversion', title: 'Custo por conversão', value: formatCurrency(summary.costPerConversion || 0), icon: 'bx-bullseye', tone: 'pink' },
      { key: 'roas', title: 'ROAS', value: formatMultiplier(summary.roas || 0), icon: 'bx-trending-up', tone: 'emerald' },
    ]
  }, [googleAdsSummary])
  const googleAdsCampaigns = useMemo(
    () => Array.isArray(googleAdsSummary?.campaigns) ? googleAdsSummary.campaigns : [],
    [googleAdsSummary]
  )
  const dashboardExportFileName = useMemo(() => {
    const normalize = (value) => String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'dashboard'

    return `dashboard-${normalize(activeClient?.name || 'cliente')}-${normalize(getDatePresetLabel(dateRange, customSince, customUntil))}`
  }, [activeClient?.name, dateRange, customSince, customUntil])
  const dashboardExportRows = useMemo(() => {
    const rows = []
    const addRow = (section, type, name, metric, value, note = '') => {
      rows.push({
        Seção: section,
        Tipo: type,
        Nome: name,
        Métrica: metric,
        Valor: value,
        Observação: note,
      })
    }

    addRow('Contexto', 'Cliente', activeClient?.name || 'Cliente selecionado', 'Período', getDatePresetLabel(dateRange, customSince, customUntil), [
      selectedAdAccount ? `Conta Meta: ${selectedAdAccount}` : '',
      selectedGoogleAdsAccount ? `Conta Google Ads: ${selectedGoogleAdsAccount}` : '',
    ].filter(Boolean).join(' • '))
    if (normalizedMetaResultFilters.length) {
      addRow(
        'Contexto',
        'Filtro',
        'Tipos de resultado',
        'Selecionados',
        availableMetaResultFilters
          .filter((filter) => normalizedMetaResultFilters.includes(filter.key))
          .map((filter) => filter.label)
          .join(', ') || 'Todos',
        metaCampaignFilterSummary
      )
    }

    if (hasMetaConfigured) {
      metaSummaryDashboardMetricCards.forEach((metric) => {
        addRow('Meta Ads', 'Resumo', metric.title, 'Valor', metric.value, metric.trend?.label || metric.description || '')
      })

      visibleMetaConversionGroups.forEach((group) => {
        group.stats.forEach((stat) => {
          addRow('Meta Ads', group.title, group.description, stat.label, stat.value)
        })
      })

      metaRankingLayers.forEach((layer) => {
        layer.states.items.slice(0, 5).forEach((item, index) => {
          addRow('Rankings', `Estados #${index + 1}`, item.name || item.label, layer.resultLabel, formatNumber(item.conversions), `${formatCurrency(item.averageCost)} / resultado`)
        })
        layer.creatives.items.slice(0, 5).forEach((item, index) => {
          addRow('Rankings', `Criativos #${index + 1}`, item.label, layer.resultLabel, formatNumber(item.conversions), `${formatCurrency(item.averageCost)} / resultado • ${formatCurrency(item.spend || 0)} investidos`)
        })
        layer.ages.items.slice(0, 5).forEach((item, index) => {
          addRow('Rankings', `Idade #${index + 1}`, item.label, layer.resultLabel, formatNumber(item.conversions), `${formatCurrency(item.averageCost)} / resultado • ${formatPercent(item.conversionRateValue || 0)} conversão`)
        })
      })

      filteredCampaigns.forEach((campaign, index) => {
        const campaignStatus = campaign.status === 'ACTIVE' ? 'Ativa' : campaign.status === 'PAUSED' ? 'Pausada' : campaign.status || 'Sem status'
        selectedMetaCampaignTableColumns.forEach((column) => {
          const value = column.key === 'totalConversions'
            ? formatNumber(extractMetaCampaignMetrics(campaign).totalConversions)
            : formatCampaignMetricValue(column.key, getCampaignMetricValue(campaign, column.key))
          addRow('Campanhas', `#${index + 1} ${campaignStatus}`, campaign.name || 'Campanha sem nome', column.label, value)
        })
      })
    }

    if (hasGoogleAdsConfigured) {
      googleAdsKpis.forEach((metric) => {
        addRow('Google Ads', 'Resumo', metric.title, 'Valor', metric.value)
      })

      googleAdsCampaigns.forEach((campaign, index) => {
        addRow('Google Ads', `Campanha #${index + 1}`, campaign.name || 'Campanha sem nome', 'Investimento', formatCurrency(campaign.spend || 0))
        addRow('Google Ads', `Campanha #${index + 1}`, campaign.name || 'Campanha sem nome', 'Conversões', formatDashboardMetricValue(campaign.conversions || 0, 'decimal'))
        addRow('Google Ads', `Campanha #${index + 1}`, campaign.name || 'Campanha sem nome', 'Custo por conversão', formatCurrency(campaign.costPerConversion || 0))
      })
    }

    if (hasRdConfigured) {
      rdAgendorFunnelKpis.filter((metric) => !metric.hidden).forEach((metric) => {
        addRow(activeClientUsesManualCrm ? 'CRM manual' : crmSourceLabel, 'Funil comercial', metric.title, 'Valor', metric.value, metric.detail || '')
      })
    }

    if (hasSheetsConfigured) {
      defaultGoogleSheetsKpis.forEach((metric) => {
        addRow('Google Sheets', 'Planilha', metric.title, 'Valor', metric.value)
      })
    }

    return rows
  }, [
    activeClient?.name,
    activeClientUsesManualCrm,
    availableMetaResultFilters,
    crmSourceLabel,
    customSince,
    customUntil,
    dateRange,
    defaultGoogleSheetsKpis,
    filteredCampaigns,
    formatCampaignMetricValue,
    getCampaignMetricValue,
    hasMetaConfigured,
    hasGoogleAdsConfigured,
    hasRdConfigured,
    hasSheetsConfigured,
    googleAdsCampaigns,
    googleAdsKpis,
    metaCampaignFilterSummary,
    metaRankingLayers,
    metaSummaryDashboardMetricCards,
    normalizedMetaResultFilters,
    rdAgendorFunnelKpis,
    selectedAdAccount,
    selectedGoogleAdsAccount,
    selectedMetaCampaignTableColumns,
    visibleMetaConversionGroups,
  ])
  const handleExportDashboard = useCallback(async (format) => {
    if (!dashboardExportRows.length) {
      window.alert('Nenhum dado encontrado para exportar no dashboard atual.')
      return
    }

    const columns = ['Seção', 'Tipo', 'Nome', 'Métrica', 'Valor', 'Observação']
    const escapeCsvCell = (value) => {
      const text = String(value ?? '')
      const escaped = text.replace(/"/g, '""')
      return /[";\n\r]/.test(escaped) ? `"${escaped}"` : escaped
    }

    if (format === 'csv') {
      const csv = '\ufeff' + [
        columns.join(';'),
        ...dashboardExportRows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(';')),
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${dashboardExportFileName}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      return
    }

    try {
      setIsExporting(true)
      const jsPdfModule = await import('jspdf')
      const JsPDF = jsPdfModule.default || jsPdfModule.jsPDF
      const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const logoDataUrl = await fetch('/assessoria-lp-logo.png')
        .then((response) => (response.ok ? response.blob() : null))
        .then((blob) => (
          blob
            ? new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(String(reader.result || ''))
                reader.onerror = () => resolve('')
                reader.readAsDataURL(blob)
              })
            : ''
        ))
        .catch(() => '')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 32
      const brandGreen = '#26c281'
      const pageBackground = '#f8fafc'
      const panelBorder = '#dbe7df'
      const cardBorder = '#e2e8f0'
      const textMain = '#0f172a'
      const textMuted = '#64748b'
      const cardGap = 12
      const cardColumns = 3
      const cardWidth = (pageWidth - margin * 2 - cardGap * (cardColumns - 1)) / cardColumns
      const cardHeight = 76
      let cursorY = 34
      const logoGreen = '#26c281'
      const deepGreen = '#006c44'

      const hexToRgb = (hex) => {
        const sanitized = String(hex || '').replace('#', '')
        const full = sanitized.length === 3
          ? sanitized.split('').map((item) => `${item}${item}`).join('')
          : sanitized.padEnd(6, '0').slice(0, 6)
        return {
          r: parseInt(full.slice(0, 2), 16),
          g: parseInt(full.slice(2, 4), 16),
          b: parseInt(full.slice(4, 6), 16),
        }
      }

      const drawGradientRoundedRect = (x, y, width, height, radius = 8, from = logoGreen, to = deepGreen) => {
        const safeRadius = Math.max(0, Math.min(radius, height / 2, width / 2))
        const fill = hexToRgb(from)
        const stroke = hexToRgb(to)
        pdf.setFillColor(fill.r, fill.g, fill.b)
        pdf.setDrawColor(stroke.r, stroke.g, stroke.b)
        pdf.setLineWidth(0.45)
        pdf.roundedRect(x, y, width, height, safeRadius, safeRadius, 'FD')
      }

      const loadDataUrlFromSource = async (source) => {
        if (!source) return ''
        const sourceText = String(source)
        if (sourceText.startsWith('data:image/')) return sourceText
        return fetch(sourceText)
          .then((response) => (response.ok ? response.blob() : null))
          .then((blob) => (
            blob
              ? new Promise((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(String(reader.result || ''))
                  reader.onerror = () => resolve('')
                  reader.readAsDataURL(blob)
                })
              : ''
          ))
          .catch(() => '')
      }

      const isClientHiddenMetaMetric = (metric) => (
        CLIENT_PDF_HIDDEN_META_KEYS.has(metric?.key) ||
        /faturamento|taxa de convers|conversões totais|conversoes totais/i.test(String(metric?.title || metric?.label || ''))
      )

      const drawPageBase = () => {
        pdf.setFillColor(pageBackground)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
        if (logoDataUrl) {
          pdf.addImage(logoDataUrl, 'PNG', pageWidth - margin - 42, 44, 38, 36)
        }
      }

      const drawTitle = () => {
        drawPageBase()
        cursorY = 58
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(24)
        pdf.setTextColor(textMain)
        pdf.text(`Dashboard ${activeClient?.name || 'do cliente'}`, margin, cursorY)
        cursorY += 24
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(11)
        pdf.setTextColor(textMuted)
        pdf.text(`Assessoria LP • ${getDatePresetLabel(dateRange, customSince, customUntil)}`, margin, cursorY)
        cursorY += 34
      }

      const addPageIfNeeded = (neededHeight = cardHeight) => {
        if (cursorY + neededHeight <= pageHeight - margin) return
        pdf.addPage('a4', 'landscape')
        drawPageBase()
        cursorY = 56
      }

      const drawSectionTitle = (sectionTitle) => {
        addPageIfNeeded(46)
        pdf.setDrawColor(panelBorder)
        pdf.line(margin, cursorY, pageWidth - margin, cursorY)
        cursorY += 20
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.setTextColor(brandGreen)
        pdf.text(String(sectionTitle || 'Resultados').toUpperCase(), margin, cursorY)
        cursorY += 18
      }

      const drawMetricCard = (row, x, y, width) => {
        const note = String(row.Observação || '')
        const name = String(row.Nome || row.Tipo || '')
        const metric = String(row.Métrica || 'Resultado')
        const value = String(row.Valor || '-')
        const type = String(row.Tipo || '')

        pdf.setFillColor('#ffffff')
        pdf.setDrawColor(cardBorder)
        pdf.roundedRect(x, y, width, cardHeight, 10, 10, 'FD')

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor(brandGreen)
        pdf.text(pdf.splitTextToSize(metric.toUpperCase(), width - 24).slice(0, 1), x + 14, y + 18)

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(17)
        pdf.setTextColor(textMain)
        pdf.text(pdf.splitTextToSize(value, width - 24).slice(0, 1), x + 14, y + 42)

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8.5)
        pdf.setTextColor(textMuted)
        const footer = [name, type].filter(Boolean).join(' • ')
        pdf.text(pdf.splitTextToSize(footer, width - 24).slice(0, note ? 1 : 2), x + 14, y + 59)

        if (note) {
          pdf.setFontSize(7.5)
          pdf.setTextColor('#7a867d')
          pdf.text(pdf.splitTextToSize(note, width - 24).slice(0, 1), x + 14, y + 70)
        }
      }

      const drawClientSectionTitle = (sectionTitle) => {
        addPageIfNeeded(52)
        if (cursorY < 92) cursorY = 92
        drawGradientRoundedRect(margin, cursorY, pageWidth - margin * 2, 26, 8, logoGreen, deepGreen)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.setTextColor('#ffffff')
        pdf.text(String(sectionTitle || 'Resultados').toUpperCase(), margin + 14, cursorY + 17)
        cursorY += 42
      }

      const drawClientMetricCard = (title, value, note, x, y, width, height = 66) => {
        pdf.setFillColor('#ffffff')
        pdf.setDrawColor('#d7e7df')
        pdf.roundedRect(x, y, width, height, 9, 9, 'FD')

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.setTextColor(deepGreen)
        pdf.text(pdf.splitTextToSize(String(title || '').toUpperCase(), width - 22).slice(0, 1), x + 12, y + 17)

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(15)
        pdf.setTextColor(textMain)
        pdf.text(pdf.splitTextToSize(String(value || '-'), width - 22).slice(0, 1), x + 12, y + 41)

        if (note) {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7.5)
          pdf.setTextColor(textMuted)
          pdf.text(pdf.splitTextToSize(String(note), width - 22).slice(0, 1), x + 12, y + 56)
        }
      }

      const drawClientCards = (items, columnsCount = 4) => {
        const gap = 10
        const height = 68
        const width = (pageWidth - margin * 2 - gap * (columnsCount - 1)) / columnsCount
        items.forEach((item, index) => {
          const columnIndex = index % columnsCount
          if (columnIndex === 0) addPageIfNeeded(height + 12)
          drawClientMetricCard(item.title, item.value, item.note, margin + columnIndex * (width + gap), cursorY, width, height)
          if (columnIndex === columnsCount - 1 || index === items.length - 1) {
            cursorY += height + 12
          }
        })
      }

      const drawClientCrmFunnel = () => {
        const visibleCrmMetrics = rdAgendorFunnelKpis.filter((metric) => !metric.hidden)
        const findMetric = (...keys) => visibleCrmMetrics.find((metric) => keys.includes(metric.key))
        const firstStep = findMetric('metaLeadCount', 'manualOpportunityCount') || visibleCrmMetrics[0]
        const qualifiedStep = findMetric('qualifiedOpportunityCount')
        const wonStep = findMetric('wonOpportunityCount')
        const qualificationRate = findMetric('manualLeadToQualifiedRate')
        const saleRate = findMetric('qualifiedToWonRate')
        const revenueMetric = findMetric('wonOpportunityRevenue')
        const roasMetric = findMetric('manualCommercialRoas')

        const funnelSteps = [
          {
            title: activeClientUsesManualCrm ? 'Oportunidades' : 'Leads e oportunidades',
            value: firstStep?.value || '-',
            note: firstStep?.detail || 'Volume inicial do funil comercial.',
          },
          {
            title: qualifiedStep?.title || 'Qualificados',
            value: qualifiedStep?.value || '-',
            note: qualifiedStep?.detail || 'Contatos que chegaram em etapa qualificada.',
          },
          {
            title: wonStep?.title || 'Vendas',
            value: wonStep?.value || '-',
            note: wonStep?.detail || 'Negócios fechados no período.',
          },
        ]
        const ratePills = [
          {
            title: qualificationRate?.title || 'Taxa de qualificação',
            value: qualificationRate?.value || '-',
          },
          {
            title: saleRate?.title || 'Taxa de venda',
            value: saleRate?.value || '-',
          },
        ]
        const sideMetrics = [
          revenueMetric && {
            title: 'Faturamento',
            value: revenueMetric.value || '-',
            note: revenueMetric.detail || 'Valor vendido no período.',
          },
          roasMetric && {
            title: roasMetric.title || 'ROAS comercial',
            value: roasMetric.value || '-',
            note: roasMetric.detail || 'Valor vendido dividido pelo investimento.',
          },
        ].filter(Boolean)

        if (!funnelSteps.some((step) => String(step.value || '-').trim() !== '-')) return

        const blockHeight = 344
        addPageIfNeeded(blockHeight + 8)
        const blockY = cursorY
        const funnelX = margin
        const funnelWidth = pageWidth - margin * 2 - 230
        const sideX = funnelX + funnelWidth + 18
        const sideWidth = pageWidth - margin - sideX
        const centerX = funnelX + funnelWidth / 2
        const stepHeights = [54, 54, 54]
        const stepWidths = [
          Math.min(funnelWidth, 410),
          Math.min(funnelWidth - 64, 346),
          Math.min(funnelWidth - 128, 284),
        ]
        const stepYPositions = [blockY + 12, blockY + 124, blockY + 236]

        pdf.setFillColor('#f7fbf8')
        pdf.setDrawColor('#d7e7df')
        pdf.roundedRect(funnelX, blockY, funnelWidth, blockHeight, 12, 12, 'FD')

        funnelSteps.forEach((step, index) => {
          const width = stepWidths[index]
          const x = centerX - width / 2
          const y = stepYPositions[index]
          drawGradientRoundedRect(x, y, width, stepHeights[index], 9, index === 0 ? logoGreen : '#2ecc71', index === 2 ? deepGreen : '#008f5b')

          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(9)
          pdf.setTextColor('#ffffff')
          pdf.text(String(step.title || '').toUpperCase(), x + width / 2, y + 17, { align: 'center' })

          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(22)
          pdf.text(String(step.value || '-'), x + width / 2, y + 42, { align: 'center' })

          if (index < ratePills.length) {
            const rate = ratePills[index]
            const pillY = y + stepHeights[index] + 24
            const pillWidth = 158
            const pillX = centerX - pillWidth / 2
            pdf.setFillColor('#ffffff')
            pdf.setDrawColor('#9ee8bc')
            pdf.roundedRect(pillX, pillY, pillWidth, 25, 12, 12, 'FD')
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(7.2)
            pdf.setTextColor(deepGreen)
            pdf.text(String(rate.title || '').toUpperCase(), pillX + 11, pillY + 10)
            pdf.setFontSize(10.5)
            pdf.text(String(rate.value || '-'), pillX + 11, pillY + 21)

            pdf.setDrawColor('#9ee8bc')
            pdf.line(centerX, y + stepHeights[index] + 8, centerX, pillY)
            pdf.line(centerX, pillY + 25, centerX, stepYPositions[index + 1] - 8)
          }
        })

        sideMetrics.forEach((metric, index) => {
          drawClientMetricCard(metric.title, metric.value, metric.note, sideX, blockY + 18 + index * 92, sideWidth, 78)
        })

        cursorY += blockHeight + 14
      }

      const drawClientRankingColumn = (title, items, x, y, width, height, type = 'default') => {
        pdf.setFillColor('#ffffff')
        pdf.setDrawColor('#d7e7df')
        pdf.roundedRect(x, y, width, height, 10, 10, 'FD')
        drawGradientRoundedRect(x, y, width, 24, 8, logoGreen, deepGreen)

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.setTextColor('#ffffff')
        pdf.text(String(title || '').toUpperCase(), x + 12, y + 16)

        const rowHeight = (height - 30) / 5
        Array.from({ length: 5 }).forEach((_, index) => {
          const item = items[index]
          const rowY = y + 30 + index * rowHeight
          if (index > 0) {
            pdf.setDrawColor('#e3ece6')
            pdf.line(x + 12, rowY - 4, x + width - 12, rowY - 4)
          }

          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(10)
          pdf.setTextColor(deepGreen)
          pdf.text(`${index + 1}`, x + 12, rowY + 16)

          if (!item) {
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(8.5)
            pdf.setTextColor(textMuted)
            pdf.text('Sem dados', x + 34, rowY + 16)
            return
          }

          const nameX = type === 'creative' ? x + 66 : x + 34
          if (type === 'creative') {
            const imageUrl = item.exportImageDataUrl || ''
            pdf.setFillColor('#eef7f1')
            pdf.roundedRect(x + 34, rowY + 2, 24, 24, 5, 5, 'F')
            if (imageUrl) {
              try {
                const imageFormat = /image\/jpe?g/i.test(imageUrl) ? 'JPEG' : 'PNG'
                pdf.addImage(imageUrl, imageFormat, x + 34, rowY + 2, 24, 24)
              } catch (error) {
                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(5.8)
                pdf.setTextColor(textMuted)
                pdf.text('IMG', x + 40, rowY + 17)
              }
            } else {
              pdf.setFont('helvetica', 'normal')
              pdf.setFontSize(5.8)
              pdf.setTextColor(textMuted)
              pdf.text('IMG', x + 40, rowY + 17)
            }
          }

          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8.6)
          pdf.setTextColor(textMain)
          pdf.text(pdf.splitTextToSize(String(item.name || item.label || 'Sem nome'), width - (nameX - x) - 12).slice(0, 1), nameX, rowY + 11)

          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7.2)
          pdf.setTextColor(textMuted)
          const resultLine = `${formatNumber(item.conversions || 0)} resultado(s) • ${formatCurrency(item.averageCost || 0)}`
          pdf.text(pdf.splitTextToSize(resultLine, width - (nameX - x) - 12).slice(0, 1), nameX, rowY + 24)
        })
      }

      const drawClientCampaignTable = (campaignRows, campaignColumns) => {
        if (!campaignRows.length) {
          drawClientCards([{ title: 'Campanhas', value: 'Sem campanhas no período', note: 'Nenhuma linha encontrada para exportar.' }], 1)
          return
        }

        const statusWidth = 52
        const campaignWidth = 220
        const metricWidth = (pageWidth - margin * 2 - statusWidth - campaignWidth) / Math.max(campaignColumns.length, 1)
        const headerHeight = 28
        const rowHeight = 27
        const tableWidth = pageWidth - margin * 2

        const drawHeader = () => {
          addPageIfNeeded(headerHeight + rowHeight + 8)
          drawGradientRoundedRect(margin, cursorY, tableWidth, headerHeight, 8, logoGreen, deepGreen)
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(7.4)
          pdf.setTextColor('#ffffff')
          pdf.text('STATUS', margin + 8, cursorY + 18)
          pdf.text('CAMPANHA', margin + statusWidth + 8, cursorY + 18)
          campaignColumns.forEach((column, index) => {
            pdf.text(pdf.splitTextToSize(String(column.label || column.key).toUpperCase(), metricWidth - 8).slice(0, 1), margin + statusWidth + campaignWidth + index * metricWidth + 6, cursorY + 18)
          })
          cursorY += headerHeight
        }

        drawHeader()
        campaignRows.forEach((campaign, index) => {
          if (cursorY + rowHeight > pageHeight - margin) {
            pdf.addPage('a4', 'landscape')
            drawPageBase()
            cursorY = 56
            drawHeader()
          }

          const rowY = cursorY
          pdf.setFillColor(index % 2 === 0 ? '#ffffff' : '#f3f8f5')
          pdf.setDrawColor('#dfe8e2')
          pdf.rect(margin, rowY, tableWidth, rowHeight, 'FD')

          const campaignStatus = campaign.status === 'ACTIVE' ? 'Ativa' : campaign.status === 'PAUSED' ? 'Pausada' : campaign.status || 'Sem status'
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(7.4)
          pdf.setTextColor(campaign.status === 'ACTIVE' ? deepGreen : textMuted)
          pdf.text(pdf.splitTextToSize(campaignStatus, statusWidth - 10).slice(0, 1), margin + 8, rowY + 17)

          pdf.setTextColor(textMain)
          pdf.text(pdf.splitTextToSize(campaign.name || 'Campanha sem nome', campaignWidth - 12).slice(0, 1), margin + statusWidth + 8, rowY + 17)

          campaignColumns.forEach((column, columnIndex) => {
            const value = formatCampaignMetricValue(column.key, getCampaignMetricValue(campaign, column.key))
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(7.2)
            pdf.setTextColor(textMain)
            pdf.text(pdf.splitTextToSize(String(value), metricWidth - 8).slice(0, 1), margin + statusWidth + campaignWidth + columnIndex * metricWidth + 6, rowY + 17)
          })

          cursorY += rowHeight
        })
        cursorY += 12
      }

      const drawClientPdf = async () => {
        const clientMetaMetrics = metaSummaryDashboardMetricCards
          .filter((metric) => !isClientHiddenMetaMetric(metric))
          .map((metric) => ({
            title: metric.title,
            value: metric.value,
            note: metric.trend?.label || metric.description || '',
          }))
        const clientConversionMetrics = visibleMetaConversionGroups.flatMap((group) =>
          group.stats.map((stat) => ({
            title: `${group.title} · ${stat.label}`,
            value: stat.value,
            note: group.description,
          }))
        )
        const clientGoogleAdsMetrics = googleAdsKpis.map((metric) => ({
          title: metric.title,
          value: metric.value,
          note: selectedGoogleAdsAccount ? `Conta ${selectedGoogleAdsAccount}` : 'Google Ads conectado.',
        }))
        const selectedResultLabels = availableMetaResultFilters
          .filter((filter) => normalizedMetaResultFilters.includes(filter.key))
          .map((filter) => filter.label)
          .join(', ') || 'Todos'
        const activeLayer = metaRankingLayers[0] || null
        const locationItems = (activeLayer?.states?.items?.length ? activeLayer.states.items : activeLayer?.cities?.items || []).slice(0, 5)
        const ageItems = (activeLayer?.ages?.items || []).slice(0, 5)
        const creativeItems = await Promise.all(
          (activeLayer?.creatives?.items || []).slice(0, 5).map(async (item) => ({
            ...item,
            exportImageDataUrl: await loadDataUrlFromSource(item.imageUrl || item.thumbnailUrl || item.picture || item.previewImageUrl),
          }))
        )
        const campaignColumns = selectedMetaCampaignTableColumns.filter((column) => !CLIENT_PDF_HIDDEN_META_KEYS.has(column.key))

        drawPageBase()
        cursorY = 58
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(25)
        pdf.setTextColor(textMain)
        pdf.text(`Relatório do cliente`, margin, cursorY)
        cursorY += 24
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(11)
        pdf.setTextColor(textMuted)
        pdf.text(`Assessoria LP • ${activeClient?.name || 'Cliente'} • ${getDatePresetLabel(dateRange, customSince, customUntil)}`, margin, cursorY)
        cursorY += 30

        drawClientSectionTitle(`Contexto — ${getDatePresetLabel(dateRange, customSince, customUntil)}`)
        drawClientCards([
          { title: 'Cliente', value: activeClient?.name || 'Cliente selecionado', note: [
            selectedAdAccount ? `Meta ${selectedAdAccount}` : '',
            selectedGoogleAdsAccount ? `Google Ads ${selectedGoogleAdsAccount}` : '',
          ].filter(Boolean).join(' • ') || 'Contas conectadas' },
          { title: 'Período', value: getDatePresetLabel(dateRange, customSince, customUntil), note: 'Leitura usada no dashboard.' },
          { title: 'Cadastro do contexto', value: selectedResultLabels, note: metaCampaignFilterSummary || 'Resultados filtrados no dashboard.' },
        ], 3)

        if (clientMetaMetrics.length || clientConversionMetrics.length) {
          drawClientSectionTitle('Meta Ads')
          drawClientCards([...clientMetaMetrics, ...clientConversionMetrics], 4)
        }

        if (hasGoogleAdsConfigured && clientGoogleAdsMetrics.length) {
          drawClientSectionTitle('Google Ads')
          drawClientCards(clientGoogleAdsMetrics, 4)
        }

        drawClientSectionTitle('Rankings')
        addPageIfNeeded(260)
        const rankingGap = 12
        const rankingWidth = (pageWidth - margin * 2 - rankingGap * 2) / 3
        const rankingY = cursorY
        const rankingHeight = 248
        drawClientRankingColumn('Localização', locationItems, margin, rankingY, rankingWidth, rankingHeight)
        drawClientRankingColumn('Idade', ageItems, margin + rankingWidth + rankingGap, rankingY, rankingWidth, rankingHeight)
        drawClientRankingColumn('Criativos', creativeItems, margin + (rankingWidth + rankingGap) * 2, rankingY, rankingWidth, rankingHeight, 'creative')
        cursorY += rankingHeight + 18

        drawClientSectionTitle('Campanhas')
        drawClientCampaignTable(filteredCampaigns, campaignColumns)

        if (hasRdConfigured) {
          drawClientSectionTitle(activeClientUsesManualCrm ? 'CRM manual' : crmSourceLabel)
          drawClientCrmFunnel()
        }

        if (format === 'client-pdf-save') {
          return pdf.output('blob')
        }
        pdf.save(`${dashboardExportFileName}-cliente.pdf`)
      }

      if (format === 'client-pdf') {
        await drawClientPdf()
        return
      }

      if (format === 'client-pdf-save') {
        const blob = await drawClientPdf()
        return blob
      }

      const groupedRows = dashboardExportRows.reduce((accumulator, row) => {
        const section = row.Seção || 'Resultados'
        if (!accumulator.has(section)) accumulator.set(section, [])
        accumulator.get(section).push(row)
        return accumulator
      }, new Map())

      const drawRowsAsCards = (rows) => {
        rows.forEach((row, index) => {
          const columnIndex = index % cardColumns
          if (columnIndex === 0) addPageIfNeeded(cardHeight + 12)
          const x = margin + columnIndex * (cardWidth + cardGap)
          drawMetricCard(row, x, cursorY, cardWidth)
          if (columnIndex === cardColumns - 1 || index === rows.length - 1) {
            cursorY += cardHeight + 12
          }
        })
      }

      drawTitle()
      Array.from(groupedRows.entries()).forEach(([section, rows]) => {
        drawSectionTitle(section)
        drawRowsAsCards(rows)
        cursorY += 6
      })

      pdf.save(`${dashboardExportFileName}.pdf`)
    } catch (error) {
      console.error('Erro ao exportar dashboard', error)
      window.alert('Não consegui gerar o PDF agora. Tente exportar como CSV ou recarregar a página.')
    } finally {
      setIsExporting(false)
    }
  }, [
    activeClient?.name,
    activeClientUsesManualCrm,
    availableMetaResultFilters,
    crmSourceLabel,
    customSince,
    customUntil,
    dashboardExportFileName,
    dashboardExportRows,
    dateRange,
    filteredCampaigns,
    formatCampaignMetricValue,
    getCampaignMetricValue,
    hasRdConfigured,
    metaCampaignFilterSummary,
    metaRankingLayers,
    metaSummaryDashboardMetricCards,
    normalizedMetaResultFilters,
    rdAgendorFunnelKpis,
    selectedAdAccount,
    selectedMetaCampaignTableColumns,
    visibleMetaConversionGroups,
  ])
  const handleSaveReport = useCallback(async () => {
    if (!dashboardExportRows.length) {
      window.alert('Nenhum dado encontrado para exportar no dashboard atual.')
      return
    }
    setIsSavingReport(true)
    setSavedReportSuccess(false)
    try {
      const blob = await handleExportDashboard('client-pdf-save')
      if (!blob) throw new Error('Não foi possível gerar o PDF.')
      const periodLabel = getDatePresetLabel(dateRange, customSince, customUntil)
      const formData = new FormData()
      formData.append('file', blob, `${dashboardExportFileName}-cliente.pdf`)
      formData.append('clientId', activeClient?.id || '')
      formData.append('clientName', activeClient?.name || '')
      formData.append('reportType', 'client-pdf')
      formData.append('periodLabel', periodLabel)
      formData.append('periodSince', customSince || '')
      formData.append('periodUntil', customUntil || '')
      const res = await fetch('/api/reports', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar relatório.')
      setSavedReportSuccess(true)
      setTimeout(() => setSavedReportSuccess(false), 2000)
    } catch (err) {
      console.error('Erro ao salvar relatório', err)
      window.alert(`Não foi possível salvar o relatório: ${err.message}`)
    } finally {
      setIsSavingReport(false)
    }
  }, [activeClient, customSince, customUntil, dashboardExportFileName, dashboardExportRows, dateRange, handleExportDashboard])
  const userFirstName = (profile?.full_name || user?.user_metadata?.full_name || user?.email || 'por aí').split(' ')[0]
  const currentHour = new Date().getHours()
  const assistantGreeting =
    currentHour < 12
      ? `Bom dia, ${userFirstName}.`
      : currentHour < 18
        ? `Boa tarde, ${userFirstName}.`
        : `Boa noite, ${userFirstName}.`
  const assistantGreetingPrompt = 'O que vamos fazer hoje?'

  const renderDashboardMetricGrid = (cards, source) => {
    if (!cards.length) return null

    return (
      <div className="dashboard-metrics-grid">
        {cards.map((metric) => (
          <div
            key={metric.id}
            className={`kpi-card glass-panel template-metric-card dashboard-metric-card dashboard-metric-card-${metric.size}`}
          >
            <div className="kpi-header">
              <span className="kpi-title">{metric.title}</span>
              <div className="template-metric-actions">
                <div className={`icon-box ${metric.tone}`}>
                  <i className={`bx ${metric.icon}`}></i>
                </div>
                <button
                  type="button"
                  className="template-metric-remove"
                  onClick={() =>
                    source === 'meta'
                      ? handleRemoveMetaDashboardMetric(metric.id)
                      : source === 'rd'
                        ? handleRemoveRdDashboardMetric(metric.id)
                        : handleRemoveSheetsDashboardMetric(metric.id)
                  }
                  aria-label={`Remover ${metric.title}`}
                  title={`Remover ${metric.title}`}
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>
            </div>
            <div className="kpi-value">{metric.value}</div>
            <div className={`kpi-trend ${metric.trend?.tone || 'neutral'}`}>
              <i className={`bx ${metric.trend?.icon || 'bx-check-circle'}`}></i>
              <span>{metric.trend?.label || metric.description}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderFixedKpiGrid = (items, { threeColumns = false } = {}) => (
    <div className={threeColumns ? "kpi-grid compact-kpi-grid compact-kpi-grid-3" : "kpi-grid compact-kpi-grid"}>
      {items.filter((metric) => !metric.hidden).map((metric) => {
        const CardTag = metric.onClick ? 'button' : 'article'
        return (
          <CardTag
            key={metric.key}
            type={metric.onClick ? 'button' : undefined}
            className={`kpi-card glass-panel ${metric.onClick ? 'kpi-card-action' : ''}`}
            onClick={metric.onClick}
          >
            <div className="kpi-header">
              <span className="kpi-title">{metric.title}</span>
              <div className={`icon-box ${metric.tone}`}>
                <i className={`bx ${metric.icon}`}></i>
              </div>
            </div>
            <div className={`kpi-value ${metric.value === '-' ? 'kpi-empty-value' : ''}`}>{metric.value}</div>
            {metric.detail ? (
              <div className="kpi-detail-text">{metric.detail}</div>
            ) : null}
            <div className={`kpi-trend ${metric.trend?.tone || 'neutral'}`}>
              <i className={`bx ${metric.trend?.icon || (metric.onClick ? 'bx-edit-alt' : 'bx-check-circle')}`}></i>
              <span>{metric.trend?.label || (metric.onClick ? 'Clique para adicionar ou editar.' : 'Atualizado conforme a integração configurada.')}</span>
            </div>
          </CardTag>
        )
      })}
    </div>
  )

  const renderMetricLibraryGrid = (options, values, onSelectMetric, { compact = false } = {}) => {
    if (!options.length) {
      return <div className="metric-library-empty">Todas as métricas já estão visíveis neste modelo.</div>
    }

    return (
      <div className={`metric-library-grid ${compact ? 'metric-library-grid-compact' : ''}`}>
        {options.map(([metricKey, metric]) => (
          <button
            key={metricKey}
            type="button"
            className={`kpi-card glass-panel metric-library-card ${compact ? 'metric-library-card-compact' : ''}`}
            onClick={() => onSelectMetric(metricKey)}
          >
            <div className="kpi-header">
              <span className="kpi-title">{metric.label}</span>
              <div className="template-metric-actions">
                <div className={`icon-box ${metric.tone}`}>
                  <i className={`bx ${metric.icon}`}></i>
                </div>
                <span className="metric-library-add-icon" aria-hidden="true">
                  <i className="bx bx-plus"></i>
                </span>
              </div>
            </div>
            <div className="kpi-value">{formatDashboardMetricValue(values[metricKey] || 0, metric.type)}</div>
            <div className="kpi-trend neutral">
              <i className="bx bx-info-circle"></i>
              <span>{metric.description}</span>
            </div>
          </button>
        ))}
      </div>
    )
  }

  const renderMetaSummaryMetricGrid = (cards) => (
    <div className="kpi-grid compact-kpi-grid meta-summary-grid">
      {cards.map((metric) => (
        <article
          key={metric.id}
          className={`kpi-card glass-panel meta-summary-card ${metric.fixed ? 'meta-summary-card-fixed' : 'meta-summary-card-extra'}`}
        >
          <div className="kpi-header">
            <span className="kpi-title">{metric.title}</span>
            <div className="template-metric-actions">
              <div className={`icon-box ${metric.tone}`}>
                <i className={`bx ${metric.icon}`}></i>
              </div>
              {!metric.fixed ? (
                <button
                  type="button"
                  className="template-metric-remove"
                  onClick={() => handleRemoveMetaDashboardMetric(metric.id)}
                  aria-label={`Remover ${metric.title}`}
                  title={`Remover ${metric.title}`}
                >
                  <i className="bx bx-x"></i>
                </button>
              ) : null}
            </div>
          </div>
          <div className="kpi-value">{metric.value}</div>
          <div className={`kpi-trend ${metric.trend?.tone || 'neutral'}`}>
            <i className={`bx ${metric.trend?.icon || 'bx-check-circle'}`}></i>
            <span>{metric.trend?.label || 'Atualizado conforme a integração configurada.'}</span>
          </div>
        </article>
      ))}

    </div>
  )


  const weeklyModalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: isLightAppMode ? 'rgba(15, 23, 42, 0.34)' : 'rgba(4, 9, 18, 0.78)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxSizing: 'border-box',
  }

  const weeklyModalCardStyle = {
    position: 'relative',
    width: 'min(1120px, calc(100vw - 48px))',
    maxHeight: 'calc(100vh - 48px)',
    overflow: 'hidden',
    padding: 30,
    borderRadius: 32,
    background: isLightAppMode
      ? `linear-gradient(145deg, ${activeClientDashboardHex}10, rgba(255,255,255,.98) 34%), #ffffff`
      : `linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025)), radial-gradient(circle at 10% 0%, ${activeClientDashboardHex}29, transparent 38%), rgba(18,18,20,.97)`,
    border: isLightAppMode ? '1px solid rgba(15,23,42,.1)' : '1px solid rgba(255,255,255,.12)',
    boxShadow: isLightAppMode ? '0 34px 100px rgba(15,23,42,.2)' : '0 34px 100px rgba(0,0,0,.52)',
    color: isLightAppMode ? '#0f172a' : 'var(--text-primary)',
    boxSizing: 'border-box',
  }

  const weeklyModalCloseStyle = {
    position: 'absolute',
    top: 22,
    right: 22,
    width: 44,
    height: 44,
    borderRadius: 999,
    border: isLightAppMode ? '1px solid rgba(15,23,42,.12)' : '1px solid rgba(255,255,255,.12)',
    background: isLightAppMode ? 'rgba(255,255,255,.94)' : 'rgba(255,255,255,.07)',
    color: isLightAppMode ? '#0f172a' : '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    cursor: 'pointer',
    zIndex: 2,
  }

  const weeklyEntryFormStyle = {
    display: 'grid',
    gap: 24,
    maxHeight: 'calc(100vh - 108px)',
    overflowY: 'auto',
    padding: '4px 4px 2px',
    boxSizing: 'border-box',
  }

  const weeklyEntryHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'flex-start',
    padding: '0 56px 4px 0',
    margin: 0,
  }

  const weeklyFormGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 18,
  }

  const weeklyFieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 0,
    color: isLightAppMode ? '#0f172a' : 'var(--text-primary)',
  }

  const weeklyControlStyle = {
    width: '100%',
    minHeight: 56,
    border: isLightAppMode ? '1px solid rgba(15,23,42,.12)' : '1px solid rgba(148,163,184,.18)',
    borderRadius: 18,
    background: isLightAppMode ? '#ffffff' : 'rgba(6,10,18,.72)',
    color: isLightAppMode ? '#0f172a' : 'var(--text-primary)',
    padding: '0 18px',
    font: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const weeklyTextareaStyle = {
    ...weeklyControlStyle,
    minHeight: 156,
    padding: '18px',
    resize: 'vertical',
    lineHeight: 1.5,
  }

  const weeklyComputedStyle = {
    minHeight: 96,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
    border: isLightAppMode ? '1px solid rgba(15,23,42,.1)' : '1px solid rgba(148,163,184,.14)',
    borderRadius: 22,
    background: isLightAppMode ? '#ffffff' : 'rgba(255,255,255,.045)',
    color: isLightAppMode ? '#0f172a' : 'var(--text-primary)',
    padding: 18,
    boxSizing: 'border-box',
  }

  const weeklyHealthGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
  }

  const weeklyHealthOptionBaseStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minHeight: 122,
    padding: 16,
    borderRadius: 20,
    border: isLightAppMode ? '1px solid rgba(15,23,42,.1)' : '1px solid rgba(148,163,184,.15)',
    background: isLightAppMode ? '#ffffff' : 'rgba(255,255,255,.045)',
    color: isLightAppMode ? '#0f172a' : 'var(--text-primary)',
    textAlign: 'left',
    cursor: 'pointer',
    boxSizing: 'border-box',
  }

  const weeklyActionsStyle = {
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 14,
    paddingTop: 18,
    borderTop: isLightAppMode ? '1px solid rgba(15,23,42,.08)' : '1px solid rgba(148,163,184,.12)',
    background: isLightAppMode ? 'linear-gradient(180deg, transparent, rgba(255,255,255,.98) 20%)' : 'linear-gradient(180deg, transparent, rgba(18,18,20,.98) 20%)',
  }

  const weeklyFormContent = (
    <form className="weekly-entry-form" style={weeklyEntryFormStyle} onSubmit={handleSaveWeeklyRecord}>
      <div className="section-header section-header-stack" style={weeklyEntryHeaderStyle}>
        <div>
          <span className="eyebrow">Imputação</span>
          <h2>Dados da semana</h2>
          <p className="chart-subtitle">Escolha o cliente, preencha os números acompanhados com o time e registre os planos de ação da semana.</p>
        </div>
      </div>

      <div className="weekly-form-grid" style={weeklyFormGridStyle}>
        <label className="input-group" style={weeklyFieldStyle}>
          <span>Cliente</span>
          <select style={weeklyControlStyle} value={weeklyForm.clientId} onChange={(event) => setWeeklyForm((current) => ({ ...current, clientId: event.target.value }))}>
            <option value="">Selecione</option>
            {dashboardEligibleClients.map((client) => (
              <option key={'weekly-form-client-' + client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>
        <label className="input-group" style={weeklyFieldStyle}>
          <span>Semana</span>
          <input style={weeklyControlStyle} type="date" value={weeklyWeekStart} onChange={(event) => setWeeklyWeekStart(getMondayDateInputValue(event.target.value))} />
          <small style={{ color: activeClientDashboardHex, fontWeight: 800 }}>{formatWeekRangeLabel(weeklyWeekStart, weeklyWeekEnd)}</small>
        </label>
        <label className="input-group" style={weeklyFieldStyle}>
          <span>Investimento</span>
          <div className="weekly-input-row">
            <input style={weeklyControlStyle} type="number" min="0" step="0.01" value={weeklyForm.investment} onChange={(event) => setWeeklyForm((current) => ({ ...current, investment: event.target.value }))} placeholder="0,00" />
            {weeklyPrevRecord && (
              <span className="weekly-prev-value">{formatCurrency(weeklyPrevRecord.investment || 0)}</span>
            )}
          </div>
        </label>
        <label className="input-group" style={weeklyFieldStyle}>
          <span>Leads gerados</span>
          <div className="weekly-input-row">
            <input style={weeklyControlStyle} type="number" min="0" step="1" value={weeklyForm.leads} onChange={(event) => setWeeklyForm((current) => ({ ...current, leads: event.target.value }))} placeholder="0" />
            {weeklyPrevRecord && (
              <span className="weekly-prev-value">{formatNumber(weeklyPrevRecord.leads || 0)}</span>
            )}
          </div>
        </label>
        <label className="input-group" style={weeklyFieldStyle}>
          <span>SQL</span>
          <div className="weekly-input-row">
            <input style={weeklyControlStyle} type="number" min="0" step="1" value={weeklyForm.sql} onChange={(event) => setWeeklyForm((current) => ({ ...current, sql: event.target.value }))} placeholder="0" />
            {weeklyPrevRecord && (
              <span className="weekly-prev-value">{formatNumber(weeklyPrevRecord.sql || 0)}</span>
            )}
          </div>
        </label>
        <div className="weekly-computed-field" style={weeklyComputedStyle}>
          <span>CPL automático</span>
          <div className="weekly-input-row" style={{flexDirection:'column',alignItems:'flex-start',gap:2}}>
            <strong>{weeklyCurrentLeads > 0 ? formatCurrency(weeklyCurrentCpl) : '-'}</strong>
            {weeklyPrevRecord && weeklyPrevRecord.cpl > 0 && (
              <span className="weekly-prev-value">{formatCurrency(weeklyPrevRecord.cpl)}</span>
            )}
          </div>
        </div>
        <div className="weekly-computed-field" style={weeklyComputedStyle}>
          <span>Custo SQL automático</span>
          <div className="weekly-input-row" style={{flexDirection:'column',alignItems:'flex-start',gap:2}}>
            <strong>{weeklyCurrentSql > 0 ? formatCurrency(weeklyCurrentCostPerSql) : '-'}</strong>
            {weeklyPrevRecord && weeklyPrevRecord.costPerSql > 0 && (
              <span className="weekly-prev-value">{formatCurrency(weeklyPrevRecord.costPerSql)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="weekly-health-options" style={weeklyHealthGridStyle} role="group" aria-label="Saúde do cliente">
        {WEEKLY_HEALTH_OPTIONS.map((option) => {
          const isActive = weeklyForm.healthStatus === option.key
          return (
            <button
              key={'weekly-health-' + option.key}
              type="button"
              className={'weekly-health-option ' + (isActive ? 'active' : '')}
              onClick={() => setWeeklyForm((current) => ({ ...current, healthStatus: option.key }))}
              style={isActive ? { ...weeklyHealthOptionBaseStyle, borderColor: option.color, color: option.color, boxShadow: '0 0 0 1px ' + option.color + '44, 0 16px 40px ' + option.color + '18' } : weeklyHealthOptionBaseStyle}
            >
              <span style={{ width: 12, height: 12, borderRadius: 999, background: option.color }}></span>
              <strong>{option.label}</strong>
              <small>{option.criteria}</small>
            </button>
          )
        })}
      </div>

      {showActionSpaceSettings && (
        <ActionSpaceSettings
          onClose={() => setShowActionSpaceSettings(false)}
          workspaceUsers={operationAssignableUsers || []}
        />
      )}

      <div className="input-group weekly-action-input" style={{ ...weeklyFieldStyle, gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: isLightAppMode ? '#475569' : '#94a3b8' }}>
            Plano de ação integrado — tarefas criadas automaticamente na Central de Tarefas
          </span>
          {isMaster && (
            <button
              type="button"
              onClick={() => setShowActionSpaceSettings(true)}
              title="Configurações de Plano de Ação"
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600, padding: '4px 10px', cursor: 'pointer' }}
            >
              <i className="bx bx-cog" style={{ fontSize: 13 }} /> Configurações
            </button>
          )}
        </div>
        {weeklyForm.clientId ? (
          <ActionPlanManager
            clientId={weeklyForm.clientId}
            weekStart={weeklyWeekStart}
            users={operationAssignableUsers}
            isLight={isLightAppMode}
            statuses={[]}
            clients={clients || []}
          />
        ) : (
          <div style={{ color: isLightAppMode ? '#94a3b8' : '#64748b', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
            Selecione um cliente para gerenciar os planos de ação.
          </div>
        )}
      </div>

      <div className="client-create-actions weekly-entry-actions" style={weeklyActionsStyle}>
        <button type="button" className="btn btn-secondary" onClick={() => setIsWeeklyEntryModalOpen(false)}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={isSavingWeeklyRecord || !weeklyForm.clientId} style={{ background: activeClientDashboardHex, borderColor: activeClientDashboardHex }}>
          <i className="bx bx-save"></i>
          {isSavingWeeklyRecord ? 'Salvando...' : 'Salvar semana'}
        </button>
      </div>
    </form>
  )


  const renderHomeHub = () => {
    const reportsPreview = [
      {
        title: activeClient ? `Leitura executiva de ${activeClient.name}` : 'Leitura executiva da operação',
        time: 'Agora',
      },
      {
        title: mondayBoardsConfigured ? `Monday com ${formatNumber(mondayBoardsConfigured)} board(s) monitorado(s)` : 'Monday aguardando conexão',
        time: 'Operação',
      },
    ]
    const homeCards = [
      {
        key: 'assistente',
        title: 'AI Search',
        description: 'Entre no copiloto da operação para conversar sobre campanhas, clientes, gargalos e próximos passos.',
        icon: 'bx bx-bot',
        tone: 'blue',
        accent: 'blue',
        helper: activeClient ? `Fale sobre ${activeClient.name} ou use foco geral para cruzar o app inteiro.` : 'Use a IA como camada principal de leitura e direcionamento.',
        actionLabel: 'Semantic query',
        onClick: () => setActiveTab('clientes'),
      },
      {
        key: 'apresentacao',
        title: 'Pitch Deck',
        description: 'Abra a leitura executiva dos clientes com filtros, métricas e visual de resultado.',
        icon: 'bx bxs-dashboard',
        tone: 'blue',
        accent: 'blue',
        helper: activeClient ? `Cliente ativo: ${activeClient.name}` : 'Escolha um cliente para abrir a visão executiva.',
        actionLabel: 'Auto-gen',
        onClick: () => setActiveTab('apresentacao'),
      },
      {
        key: 'configuracoes',
        title: 'Synthesizer',
        description: 'Ajuste integrações, credenciais globais e preferências da plataforma.',
        icon: 'bx bx-cog',
        tone: 'cyan',
        accent: 'cyan',
        helper: 'Central de configuração e conexões.',
        actionLabel: 'Advanced BI',
        href: '/settings',
      },
    ]

    if (canManageClients) {
      homeCards.splice(3, 0, {
        key: 'clientes',
        title: 'Clients',
        description: 'Cadastre clientes, grupos e organize quem enxerga cada dashboard.',
        icon: 'bx bxs-buildings',
        tone: 'orange',
        accent: 'orange',
        helper: `${formatNumber(clients.length)} cliente(s) cadastrado(s) na base.`,
        actionLabel: 'Directory',
        onClick: () => setActiveTab('clientes'),
      })
    }

    if (canAccessTeamTab) {
      homeCards.splice(canManageClients ? 4 : 3, 0, {
        key: 'usuarios',
        title: 'Time',
        description: canManageUsers ? 'Gerencie pessoas, acessos, PDI, metas e carteira de cada colaborador.' : 'Acompanhe seu PDI, metas e clientes ligados ao seu escopo.',
        icon: 'bx bxs-user-detail',
        tone: 'pink',
        accent: 'pink',
        helper: canManageUsers ? `${formatNumber(usersList.length || 0)} pessoa(s) no workspace.` : 'Seu painel interno de evolução.',
        actionLabel: canManageUsers ? 'People ops' : 'Career hub',
        onClick: () => setActiveTab('usuarios'),
      })
    }

    return (
      <section className="source-section">
        <section className="glass-panel home-hub-hero home-hub-hero-obsidian">
          <div className="home-hub-copy">
            <span className="home-hub-kicker">Systems online</span>
            <h2>Executive Dashboard</h2>
            <p>
              Use essa Home como centro operacional do produto. A partir daqui você cruza IA, clientes, boards e integrações
              sem perder a visão executiva do que precisa acontecer agora.
            </p>
          </div>

          <div className="home-hub-metrics home-hub-metrics-obsidian">
            <div className="home-hub-metric glass-item">
              <span>Total portfolio</span>
              <strong>{formatNumber(clients.length || 0)}</strong>
              <small>{canManageClients ? 'clientes ativos na base' : 'camada de operação conectada'}</small>
            </div>
            <div className="home-hub-metric glass-item">
              <span>Active groups</span>
              <strong>{formatNumber(clientGroups.length || 0)}</strong>
              <small>Grupos operacionais em leitura</small>
            </div>
            <div className="home-hub-metric glass-item">
              <span>Operational boards</span>
              <strong>{formatNumber(mondayBoardsConfigured)}</strong>
              <small>{mondayBoardsConfigured ? 'boards ativos de operação' : 'aguardando configuração'}</small>
            </div>
          </div>
        </section>

        <section className="home-hub-section-head">
          <h3>Tools & integrations</h3>
          <button type="button" className="home-hub-manage-link" onClick={() => setActiveTab('clientes')}>
            Ir para o copiloto
          </button>
        </section>

        <section className="home-hub-grid home-hub-grid-obsidian">
          {homeCards.map((card) => {
            const cardContent = (
              <>
                <div className="home-hub-card-top">
                  <div className={`icon-box ${card.tone}`}>
                    <i className={card.icon}></i>
                  </div>
                  <span className={`home-hub-card-pill ${card.accent}`}>{card.actionLabel}</span>
                </div>
                <div className="home-hub-card-copy">
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
                <div className="home-hub-card-footer">
                  <span>{card.helper}</span>
                  <strong>
                    Entrar
                    <i className="bx bx-right-arrow-alt"></i>
                  </strong>
                </div>
              </>
            )

            if (card.href) {
              return (
                <Link key={card.key} href={card.href} className="glass-panel home-hub-card">
                  {cardContent}
                </Link>
              )
            }

            return (
              <button key={card.key} type="button" className="glass-panel home-hub-card" onClick={card.onClick}>
                {cardContent}
              </button>
            )
          })}
        </section>

        <section className="home-hub-lower-grid">
          <article className="glass-panel home-hub-analytics-card">
            <div className="home-hub-analytics-head">
              <div>
                <span className="home-hub-kicker">Synthesis performance</span>
                <h3>Leitura consolidada da operação</h3>
                <p className="home-hub-analytics-copy">
                  A camada de síntese reúne sinais do app, leitura de operação e contexto ativo para priorizar onde agir primeiro.
                </p>
              </div>
              <div className="home-hub-analytics-badges">
                <span>AI enhanced</span>
                <span>Monthly</span>
              </div>
            </div>
            <div className="home-hub-analytics-metrics">
              <div className="home-hub-analytics-metric-card">
                <span>Sinal principal</span>
                <strong>{activeClient ? activeClient.name : 'Operação geral'}</strong>
                <small>Foco atual da leitura executiva.</small>
              </div>
              <div className="home-hub-analytics-metric-card">
                <span>Camadas conectadas</span>
                <strong>{`${clients.length} clientes · ${clientGroups.length} grupos`}</strong>
                <small>Base pronta para cruzamentos e priorização.</small>
              </div>
              <div className="home-hub-analytics-metric-card">
                <span>Ferramentas vivas</span>
                <strong>{`${mondayBoardsConfigured} fonte${mondayBoardsConfigured === 1 ? '' : 's'}`}</strong>
                <small>Copiloto, dashboards e boards seguem no mesmo fluxo.</small>
              </div>
            </div>
          </article>

          <aside className="home-hub-side-stack">
            <div className="glass-panel home-hub-reports-card">
              <div className="home-hub-reports-head">
                <h3>Recent reports</h3>
                <button type="button" className="home-hub-manage-link" onClick={() => setActiveTab('clientes')}>
                  Ver tudo
                </button>
              </div>
              <div className="home-hub-reports-list">
                {reportsPreview.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="home-hub-report-item">
                    <span className={`home-hub-report-dot ${index === 1 ? 'success' : index === 2 ? 'muted' : 'primary'}`}></span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel home-hub-ai-note">
              <span className="home-hub-kicker home-hub-kicker-success">AI insight</span>
              <p>
                {activeClient
                  ? `${activeClient.name} segue como principal foco de leitura. O copiloto já consegue cruzar campanhas, operação e contexto do cliente.`
                  : 'O copiloto já consegue cruzar campanhas, operação e contexto interno para priorizar os próximos passos.'}
              </p>
            </div>
          </aside>
        </section>
      </section>
    )
  }

  const renderMondayInteractiveKpiGrid = (items) => (
    <div className="kpi-grid compact-kpi-grid">
      {items.map((metric) => {
        const hasTasks = (metric.tasks?.length || 0) > 0
        const previewTasks = hasTasks ? sortMondayTasksForDrilldown(metric.tasks).slice(0, 3) : []

        return (
          <button
            key={metric.key}
            type="button"
            className={`kpi-card glass-panel interactive-kpi-card ${hasTasks ? 'interactive-kpi-card-active' : 'interactive-kpi-card-disabled'}`}
            onClick={() => {
              if (!hasTasks) return
              setMondayMetricDrilldown({
                title: metric.drilldownTitle,
                description: metric.drilldownDescription,
                items: sortMondayTasksForDrilldown(metric.tasks),
              })
            }}
            disabled={!hasTasks}
          >
            <div className="kpi-header">
              <span className="kpi-title">{metric.title}</span>
              <div className={`icon-box ${metric.tone}`}>
                <i className={`bx ${metric.icon}`}></i>
              </div>
            </div>
            <div className="kpi-value">{metric.value}</div>
            <div className={`kpi-trend ${hasTasks ? 'info' : 'neutral'}`}>
              <i className={`bx ${hasTasks ? 'bx-search-alt-2' : 'bx-minus-circle'}`}></i>
              <span>{hasTasks ? `${formatNumber(metric.tasks.length)} tarefa(s) compõem essa métrica` : 'Sem demandas nesse recorte'}</span>
            </div>
            {hasTasks ? (
              <div className="interactive-kpi-preview">
                {previewTasks.map((task) => (
                  <span key={task.id} className="interactive-kpi-preview-item">
                    {task.name}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="interactive-kpi-action">
              <span>{hasTasks ? 'Ver tarefas dessa métrica' : 'Sem tarefas para detalhar'}</span>
              <i className={`bx ${hasTasks ? 'bx-right-arrow-alt' : 'bx-lock-alt'}`}></i>
            </div>
          </button>
        )
      })}
    </div>
  )



  if (isLoggingOut) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#05070d', color: 'white', fontFamily: 'Inter, sans-serif' }}>Saindo...</div>
  }

  if (userLoading || !hasLoadedPreferences) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'white' }}>Carregando painel...</div>
  }

  const handleHomeToolsLauncher = () => {
    setActiveTab('clientes')

    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false)
      setIsHomeToolsExpanded(true)
      return
    }

    setIsHomeToolsExpanded((current) => !current)
  }

  // Shared state exposed to extracted tab files via useDashboard(). Grown incrementally as tabs
  // are moved out of this component — see DashboardContext.js.
  const dashboardContextValue = {
    clients,
    // Shared formatters (module-level helpers surfaced for extracted tabs)
    formatNumber,
    formatCurrency,
    formatCurrencyByCode,
    formatClientDateTime,
    // Planilha de Leads tab
    selectedSheetClientId,
    setSelectedSheetClientId,
    sheetClientPickerOpen,
    setSheetClientPickerOpen,
    sheetViewMode,
    setSheetViewMode,
    sheetFullscreen,
    setSheetFullscreen,
    // Saldos (ad account balances) tab
    adAccountBalanceSummary,
    filteredAdAccountBalanceRows,
    adAccountBalanceError,
    adAccountBalanceLoading,
    adAccountBalanceRows,
    setAdAccountBalanceRows,
    adAccountBalanceSearch,
    setAdAccountBalanceSearch,
    adAccountBalanceBillingFilter,
    setAdAccountBalanceBillingFilter,
    adAccountBalanceCardFilter,
    setAdAccountBalanceCardFilter,
    adAccountBalanceValueFilter,
    setAdAccountBalanceValueFilter,
    adAccountBalanceDebtFilter,
    setAdAccountBalanceDebtFilter,
    adAccountBalanceUpdatedAt,
    setAdAccountBalanceRefreshNonce,
    // Shared module-level helpers/constants used by extracted tabs
    formatWeekRangeLabel,
    getMetaBreakdownResultValue,
    getMetaBreakdownAverageCost,
    DATE_PRESETS,
    WEEKLY_HEALTH_BY_KEY,
    // Shared dashboard period filter (dashboard/anuncios/campanhas)
    draftDateRange,
    setDraftDateRange,
    draftCustomSince,
    setDraftCustomSince,
    draftCustomUntil,
    setDraftCustomUntil,
    handleApplyDashboardFilters,
    isApplyDashboardFiltersDisabled,
    // Anúncios (top ads overview) tab
    adsOverviewError,
    adsOverviewLoading,
    adsOverviewRows,
    adsOverviewSearch,
    setAdsOverviewSearch,
    adsOverviewManagerFilter,
    setAdsOverviewManagerFilter,
    adsOverviewUpdatedAt,
    adsOverviewExpandedClientIds,
    setAdsOverviewRefreshNonce,
    setAdsOverviewPreviewItem,
    filteredAdsOverviewRows,
    handleToggleAdsOverviewClient,
    activeMetaRankingResultConfig,
    operationAssignableUsers,
    latestWeeklyHealthByClientId,
    // Campanhas tab
    isMaster,
    effectiveWorkspaceBranding,
    campaignOverviewError,
    campaignOverviewLoading,
    campaignOverviewRows,
    campaignOverviewSearch,
    setCampaignOverviewSearch,
    campaignOverviewUpdatedAt,
    setCampaignOverviewRefreshNonce,
    campaignViewMode,
    setCampaignViewMode,
    filteredCampaignOverviewRows,
    campaignOverviewExpandedClientIds,
    campaignOverviewExpandedCampaignIds,
    campaignOverviewExpandedAdsetIds,
    handleToggleCampaignOverviewClient,
    handleToggleCampaignOverviewCampaign,
    handleToggleCampaignOverviewAdset,
    campaignChartOpenKeys,
    handleToggleCampaignChart,
    renderCampaignChart,
    cprBenchmarks,
    cprSettings,
    setDraftCprBenchmarks,
    setDraftCprSettings,
    setShowCprPanel,
    // Produtos tab
    products,
    newProductName,
    setNewProductName,
    handleCreateProduct,
    handleProductFieldChange,
    handleRemoveProduct,
    CLIENT_STATUS_OPTIONS,
    // Onboarding tab
    handleToggleOnboardingTask,
    handleToggleOnboardingTaskNA,
    persistReorder,
    obDragRef,
    obEditingItem,
    setObEditingItem,
    obEditingPhase,
    setObEditingPhase,
    obNewItem,
    setObNewItem,
    obNewPhase,
    setObNewPhase,
    onboardingClientFilter,
    setOnboardingClientFilter,
    onboardingExpandedClient,
    setOnboardingExpandedClient,
    onboardingExpandedPhases,
    setOnboardingExpandedPhases,
    onboardingManageMode,
    setOnboardingManageMode,
    onboardingPhaseDefs,
    setOnboardingPhaseDefs,
    onboardingPhaseDefsLoaded,
    setOnboardingPhaseDefsLoaded,
    onboardingQuickAccess,
    setOnboardingQuickAccess,
    onboardingRecords,
    onboardingSaving,
    onboardingSearch,
    setOnboardingSearch,
    onboardingStatusFilter,
    setOnboardingStatusFilter,
    onboardingView,
    setOnboardingView,
    // Offboarding tab
    handleToggleOffboardingTask,
    offbDragRef,
    offbEditingItem,
    setOffbEditingItem,
    offbEditingPhase,
    setOffbEditingPhase,
    offbNewItem,
    setOffbNewItem,
    offbNewPhase,
    setOffbNewPhase,
    offboardingExpandedClient,
    setOffboardingExpandedClient,
    offboardingExpandedPhases,
    setOffboardingExpandedPhases,
    offboardingManageMode,
    setOffboardingManageMode,
    offboardingPhaseDefs,
    setOffboardingPhaseDefs,
    offboardingPhaseDefsLoaded,
    setOffboardingPhaseDefsLoaded,
    offboardingRecords,
    offboardingSearch,
    setOffboardingSearch,
    offboardingStatusFilter,
    setOffboardingStatusFilter,
    // Usuários (team) tab
    canAccessTeamTab,
    canEditIntegrations,
    canManageUsers,
    createUserError,
    createdUserInvite,
    setCreatedUserInvite,
    dashboardEligibleClients,
    editUserClientSearch,
    setEditUserClientSearch,
    editUserError,
    filteredUsers,
    getManagedUserAccessibleClientCount,
    handleCreateUser,
    handleDeleteUser,
    handleManagedUserChange,
    handleUpdateUser,
    handleUserClientToggle,
    isCreateUserModalOpen,
    setIsCreateUserModalOpen,
    isEditUserModalOpen,
    setIsEditUserModalOpen,
    loadUsers,
    navPermissions,
    permSelectedUserId,
    setPermSelectedUserId,
    savingUser,
    selectedManagedUser,
    setSelectedUserId,
    setTeamSubTab,
    teamSubTab,
    toggleNavPermission,
    userForm,
    setUserForm,
    userSearch,
    setUserSearch,
    usersList,
    usersLoading,
    // Semanal (weekly ops) tab
    ALL_FILLED_WEEK_PERIODS,
    WEEKLY_HEALTH_OPTIONS,
    WEEKLY_PERIOD_OPTIONS,
    activeClientDashboardHex,
    clientsById,
    getMondayDateInputValue,
    handleDeleteSelectedWeeklyRecords,
    handleExportWeeklyTable,
    handleToggleWeeklyDeleteMode,
    handleToggleWeeklyHistoryCardSelection,
    handleWeeklyTableSort,
    isChurnListOpen,
    setIsChurnListOpen,
    isDeletingWeeklyRecords,
    isLightAppMode,
    isWeeklyDeleteMode,
    isWeeklyEntryModalOpen,
    setIsWeeklyEntryModalOpen,
    isWeeklyHistoryModalOpen,
    setIsWeeklyHistoryModalOpen,
    isWeeklyLoading,
    selectedWeeklyRecordIds,
    setWeeklyChartClientFilter,
    setWeeklyClientFilter,
    setWeeklyCustomSince,
    setWeeklyCustomUntil,
    setWeeklyFilledWeekStart,
    setWeeklyMonthFilter,
    setWeeklyPeriodPreset,
    setWeeklySuccessMessage,
    setWeeklyTableHealthFilter,
    setWeeklyTableSort,
    setWeeklyWeekStart,
    weeklyBarOptions,
    weeklyChartClientFilter,
    weeklyChartClientRows,
    weeklyChartOptions,
    weeklyClientFilter,
    weeklyCustomSince,
    weeklyCustomUntil,
    weeklyFilledWeekOptions,
    weeklyFilledWeekStart,
    weeklyFormContent,
    weeklyHealthChartData,
    weeklyHealthRiskTarget,
    weeklyHistoryCards,
    weeklyLatestRecords,
    weeklyLineChartData,
    weeklyLineChartRecords,
    weeklyModalCardStyle,
    weeklyModalCloseStyle,
    weeklyModalOverlayStyle,
    weeklyMonthFilter,
    weeklyPeriodPreset,
    weeklyPeriodWindow,
    weeklyPortfolioStats,
    weeklySelectedChartClientName,
    weeklySuccessMessage,
    weeklySummary,
    weeklyTableColumns,
    weeklyTableHealthFilter,
    weeklyTableRecords,
    weeklyTableSort,
    weeklyVisibleRecords,
    // Clientes tab
    CLIENT_DASHBOARD_INTEGRATION_OPTIONS,
    CLIENT_HEALTH_SORT_RANK,
    activeClient,
    activeClientUsesManualCrm,
    activeIntegrations,
    adAccounts,
    agendorPipelineOptions,
    agendorPipelinesError,
    appAccentColor,
    canEditActiveClient,
    canEditClientRecord,
    clientSearch,
    setClientSearch,
    clientStatusFilter,
    setClientStatusFilter,
    closeCreateClientModal,
    createClientStep,
    setCreateClientStep,
    currentTheme,
    googleAdsAccounts,
    googleAdsConnection,
    handleAgendorPipelineToggle,
    handleAgendorQualifiedStageToggle,
    handleArchiveClient,
    handleClientDashboardHexChange,
    handleClientFieldChange,
    handleClientInlineFieldChange,
    handleClientLogoUpload,
    handleCreateClient,
    handleCreateClientGroup,
    handleIntegrationChange,
    handleLoadAgendorPipelines,
    handleNewClientLogoUpload,
    handleRemoveClient,
    handleSaveIntegrations,
    handleToggleManualCrmForActiveClient,
    handleToggleNewClientDashboardIntegration,
    hasMetaManualToken,
    hasMetaOauthConnection,
    isAgendorPipelinesLoading,
    isCreateClientGroupModalOpen,
    setIsCreateClientGroupModalOpen,
    isCreateClientModalOpen,
    isEditClientModalOpen,
    setIsEditClientModalOpen,
    isSavingIntegrations,
    newClientCnpj,
    setNewClientCnpj,
    newClientDashboardIntegrationKeys,
    newClientGoogleAdsAccountId,
    setNewClientGoogleAdsAccountId,
    newClientGroupName,
    setNewClientGroupName,
    newClientLeadsSheetUrl,
    setNewClientLeadsSheetUrl,
    newClientLogoUrl,
    setNewClientLogoUrl,
    newClientManualCrmEnabled,
    setNewClientManualCrmEnabled,
    newClientMetaAdAccountId,
    setNewClientMetaAdAccountId,
    newClientName,
    setNewClientName,
    newClientResultManagerUserId,
    setNewClientResultManagerUserId,
    normalizeCnpjInput,
    normalizedNewClientDashboardColor,
    setNewClientDashboardColor,
    openCreateClientModal,
    selectedAgendorPipelineIds,
    selectedAgendorPipelineLabels,
    selectedAgendorStageNames,
    setActiveClientId,
    setClientEditSection,
    visibleAgendorStageOptions,
    // Runtime deps flagged by scope scan (missing from ctx would crash tabs)
    formatClientDate,
    metaResultPreviewKey,
    metaResultGrouping,
    extractMetaCampaignMetrics,
    user,
    // Apresentação (client dashboard) tab
    META_CAMPAIGN_TABLE_COLUMN_OPTIONS,
    META_RESULT_PERIOD_OPTIONS,
    METRIC_OPTIONS,
    activeClientVisibleIntegrationsSet,
    activeDraftDashboardTemplate,
    activeDraftFunnelSteps,
    activeDraftMetaAdIds,
    activeDraftMetaAdsetIds,
    activeDraftMetaCampaignIds,
    activeDraftRdLeadSources,
    activeMetaComparisonGroups,
    activeMetaResultPreviewConfig,
    availableFunnelMetrics,
    availableGoogleSheetsMetricOptions,
    availableMetaCampaignOptions,
    availableMetaResultFilters,
    breakdowns,
    campaignSearch,
    campaignSortBy,
    campaignSortOptions,
    campaignStatusFilter,
    canViewDashboard,
    crmSourceLabel,
    dashboardEntryClientId,
    dashboardRef,
    defaultGoogleSheetsKpis,
    doughnutChartData,
    doughnutChartOptions,
    draftAvailableMetaAdOptions,
    draftAvailableMetaAdsetOptions,
    draftMetaCampaignTableColumnKeys,
    draftRdPipelineFilter,
    draftRdSellerFilter,
    errorMessage,
    filteredCampaigns,
    formatCampaignMetricValue,
    formatDashboardMetricValue,
    formatGoogleAdsAccountLabel,
    formatMultiplier,
    formatPercent,
    funnelCards,
    getCampaignMetricValue,
    googleAdsCampaigns,
    googleAdsError,
    googleAdsKpis,
    googleAdsSummary,
    googleSheetsDashboardMetricCards,
    googleSheetsError,
    googleSheetsSummary,
    handleAddSheetsDashboardMetric,
    handleConfirmDashboardEntry,
    handleFunnelDragStart,
    handleFunnelDrop,
    handleMetaAdFilterToggle,
    handleMetaAdsetFilterToggle,
    handleMetaCampaignFilterToggle,
    handleMetaResultFilterToggle,
    handleRdLeadSourceToggle,
    handleRemoveFunnelStep,
    handleSaveManualCrm,
    handleToggleMetaCampaignTableColumn,
    hasAnyPresentationData,
    hasGoogleAdsConfigured,
    hasMetaConfigured,
    hasNavAccess,
    hasPendingDashboardFilters,
    hasRdConfigured,
    hasSheetsConfigured,
    isCampaignColumnLibraryOpen,
    isDashboardEntryModalOpen,
    isFunnelSectionOpen,
    isLoading,
    isManualCrmModalOpen,
    isMetaAdFilterOpen,
    isMetaAdsetFilterOpen,
    isMetaCampaignFilterOpen,
    isRankingsLoading,
    isRdDiagnosticsOpen,
    isRdSourceFilterOpen,
    isSavingManualCrm,
    isSheetsMetricLibraryOpen,
    lineChartData,
    lineChartOptions,
    manualCrmForm,
    metaAdFilterSummary,
    metaAdsetFilterSummary,
    metaCampaignFilterSummary,
    metaRankingLayers,
    metaResultPreviewChartData,
    metaResultPreviewChartOptions,
    metaResultPreviewSeries,
    metaResultPreviewSummary,
    metaSummaryDashboardMetricCards,
    metric1,
    metric2,
    normalizedDraftMetaResultFilters,
    rankingsError,
    rdAgendorFunnelKpis,
    rdAppliedPipelineSummary,
    rdDiagnosticsSummary,
    rdLeadSourceFilterSummary,
    rdPipelineOptions,
    rdSummary,
    renderDashboardMetricGrid,
    renderFixedKpiGrid,
    renderMetaSummaryMetricGrid,
    replaceDraftFunnelSteps,
    selectedGoogleAdsAccount,
    selectedMetaCampaignTableColumns,
    setActiveTab,
    setCampaignSearch,
    setCampaignSortBy,
    setCampaignStatusFilter,
    setDashboardEntryClientId,
    setDraftRdPipelineFilter,
    setDraftRdSellerFilter,
    setIsCampaignColumnLibraryOpen,
    setIsDashboardEntryModalOpen,
    setIsFunnelSectionOpen,
    setIsManualCrmModalOpen,
    setIsMetaAdFilterOpen,
    setIsMetaAdsetFilterOpen,
    setIsMetaCampaignFilterOpen,
    setIsRdDiagnosticsOpen,
    setIsRdSourceFilterOpen,
    setIsSheetsMetricLibraryOpen,
    setManualCrmForm,
    setMetaRankingDrilldown,
    setMetaResultDrilldown,
    setMetaResultGrouping,
    setMetaResultPreviewKey,
    setMetaSecondaryResultDrilldown,
    setMetric1,
    setMetric2,
    visibleMetaConversionGroups,
  }

  return (
    <DashboardContext.Provider value={dashboardContextValue}>
    <div
      className={`dashboard-container dashboard-shell-stellar hub-shell ${isLightAppMode ? "dashboard-light-mode" : ""}`}
      data-active-tab={activeTab}
      style={{
        '--accent-blue': appAccentColor,
        '--saas-primary': appAccentColor,
        '--saas-accent': appAccentColor,
        '--button-primary': appAccentColor,
        '--button-primary-hover': `color-mix(in srgb, ${appAccentColor} 86%, #0f172a 14%)`,
        '--button-primary-shadow': `color-mix(in srgb, ${appAccentColor} 28%, transparent)`,
        '--main': appAccentColor,
        '--meta-blue': appAccentColor,
        '--theme-surface': currentTheme.surface,
        '--app-bg-color': appBackgroundTintHex,
        '--app-bg-rgb': `${appBackgroundTintRgb.r}, ${appBackgroundTintRgb.g}, ${appBackgroundTintRgb.b}`,
        '--bg-dark': externalAppBackground || undefined,
        '--bg-panel': externalAppPanelColor || effectiveWorkspaceBranding.panelColor || undefined,
        '--text-primary': externalAppTextColor || effectiveWorkspaceBranding.textColor || undefined,
        '--accent-orange': `rgb(${activeClientDashboardAccentRgb.r}, ${activeClientDashboardAccentRgb.g}, ${activeClientDashboardAccentRgb.b})`,
        '--accent': `rgb(${activeClientDashboardAccentRgb.r}, ${activeClientDashboardAccentRgb.g}, ${activeClientDashboardAccentRgb.b})`,
        '--accent-rgb': `${activeClientDashboardAccentRgb.r}, ${activeClientDashboardAccentRgb.g}, ${activeClientDashboardAccentRgb.b}`,
      }}
    >
      <aside className={`hub-side ${isHubNavOpen ? 'open' : ''}`}>
        <div className="hub-side-brand">
          {appLogoUrl ? (
            <span className="hub-side-logo hub-side-logo-img"><img src={appLogoUrl} alt="" /></span>
          ) : (
            <span className="hub-side-logo"><span className="mi">radar</span></span>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="hub-side-title">{appName}</div>
            <div className="hub-side-subtitle">{appSubtitle}</div>
          </div>
        </div>

        <nav className="hub-nav">
          {(isMaster || hasNavAccess('semanal') || hasNavAccess('settings')) && (
            <div className="hub-nav-group">
              <div className="hub-nav-group-label">Geral</div>
              {isMaster && (
                <button type="button" className={`hub-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setIsHubNavOpen(false) }}>
                  <span className="mi">home</span><span className="hub-nav-label">Home</span>
                </button>
              )}
              {(isMaster || hasNavAccess('semanal')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'semanal' ? 'active' : ''}`} onClick={() => { setActiveTab('semanal'); setIsHubNavOpen(false) }}>
                  <span className="mi">insights</span><span className="hub-nav-label">Controle da Operação</span>
                </button>
              )}
              {isMaster && (
                <button type="button" className={`hub-nav-item ${activeTab === 'rotinas' ? 'active' : ''}`} onClick={() => { setActiveTab('rotinas'); setIsHubNavOpen(false) }}>
                  <span className="mi">event_repeat</span><span className="hub-nav-label">Rotinas</span>
                </button>
              )}
              {(isMaster || hasNavAccess('tarefas')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'tarefas' ? 'active' : ''}`} onClick={() => { setActiveTab('tarefas'); setIsHubNavOpen(false) }}>
                  <span className="mi">checklist</span><span className="hub-nav-label">Tarefas</span>
                </button>
              )}
              {(isMaster || hasNavAccess('comunicacao')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'comunicacao' ? 'active' : ''}`} onClick={() => { setActiveTab('comunicacao'); setIsHubNavOpen(false) }}>
                  <span className="mi">forum</span><span className="hub-nav-label">Comunicação</span>
                </button>
              )}
              {(isMaster || hasNavAccess('settings')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setIsHubNavOpen(false) }}>
                  <span className="mi">tune</span><span className="hub-nav-label">Configurações</span>
                </button>
              )}
            </div>
          )}
          {(canAccessClientsTab || isMaster) && (isMaster || hasNavAccess('clientes') || hasNavAccess('onboarding') || hasNavAccess('offboarding') || hasNavAccess('acessos')) && (
            <div className="hub-nav-group">
              <div className="hub-nav-group-label">Sucesso do Cliente</div>
              {canAccessClientsTab && (isMaster || hasNavAccess('clientes')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => { setActiveTab('clientes'); setIsHubNavOpen(false) }}>
                  <span className="mi">groups</span><span className="hub-nav-label">Clientes</span>
                  {clients.length > 0 && <span className="hub-nav-badge">{clients.length}</span>}
                </button>
              )}
              {(isMaster || hasNavAccess('onboarding')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'onboarding' ? 'active' : ''}`} onClick={() => { setActiveTab('onboarding'); setIsHubNavOpen(false) }}>
                  <span className="mi">rocket_launch</span><span className="hub-nav-label">Onboarding</span>
                </button>
              )}
              {(isMaster || hasNavAccess('offboarding')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'offboarding' ? 'active' : ''}`} onClick={() => { setActiveTab('offboarding'); setIsHubNavOpen(false) }}>
                  <span className="mi">logout</span><span className="hub-nav-label">Offboarding</span>
                </button>
              )}
              {(isMaster || hasNavAccess('comercial')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'comercial' ? 'active' : ''}`} onClick={() => { setActiveTab('comercial'); setIsHubNavOpen(false) }}>
                  <span className="mi">handshake</span><span className="hub-nav-label">Processo Comercial</span>
                </button>
              )}
              {(isMaster || hasNavAccess('acessos')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'acessos' ? 'active' : ''}`} onClick={() => { setActiveTab('acessos'); setIsHubNavOpen(false) }}>
                  <span className="mi">database</span><span className="hub-nav-label">Dados</span>
                </button>
              )}
            </div>
          )}
          {(isMaster || hasNavAccess('apresentacao') || hasNavAccess('campanhas') || hasNavAccess('anuncios') || hasNavAccess('saldos') || hasNavAccess('relatorios') || hasNavAccess('relatorio-manual') || hasNavAccess('tarefas')) && (
            <div className="hub-nav-group">
              <div className="hub-nav-group-label">Performance</div>
              {(isMaster || hasNavAccess('apresentacao')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'apresentacao' ? 'active' : ''}`} onClick={() => { setActiveTab('apresentacao'); setIsHubNavOpen(false) }}>
                  <span className="mi">dashboard</span><span className="hub-nav-label">Dash</span>
                </button>
              )}
              {(isMaster || hasNavAccess('campanhas')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'campanhas' ? 'active' : ''}`} onClick={() => { setActiveTab('campanhas'); setIsHubNavOpen(false) }}>
                  <span className="mi">campaign</span><span className="hub-nav-label">Campanhas</span>
                </button>
              )}
              {(isMaster || hasNavAccess('anuncios')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'anuncios' ? 'active' : ''}`} onClick={() => { setActiveTab('anuncios'); setIsHubNavOpen(false) }}>
                  <span className="mi">ad_units</span><span className="hub-nav-label">Anúncios</span>
                </button>
              )}
              {(isMaster || hasNavAccess('saldos')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'saldos' ? 'active' : ''}`} onClick={() => { setActiveTab('saldos'); setIsHubNavOpen(false) }}>
                  <span className="mi">account_balance_wallet</span><span className="hub-nav-label">Saldos</span>
                </button>
              )}
              {(isMaster || hasNavAccess('relatorios')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'relatorios' ? 'active' : ''}`} onClick={() => { setActiveTab('relatorios'); setIsHubNavOpen(false) }}>
                  <span className="mi">description</span><span className="hub-nav-label">Relatórios</span>
                </button>
              )}
              {(isMaster || hasNavAccess('relatorio-manual')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'relatorio-manual' ? 'active' : ''}`} onClick={() => { setActiveTab('relatorio-manual'); setIsHubNavOpen(false) }}>
                  <span className="mi">edit_document</span><span className="hub-nav-label">Relatório Manual</span>
                </button>
              )}
              {(isMaster || hasNavAccess('planilha-leads')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'planilha-leads' ? 'active' : ''}`} onClick={() => { setActiveTab('planilha-leads'); setIsHubNavOpen(false) }}>
                  <span className="mi">table</span><span className="hub-nav-label">Planilha de Leads</span>
                </button>
              )}
              {(isMaster || hasNavAccess('funil')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'funil' ? 'active' : ''}`} onClick={() => { setActiveTab('funil'); setIsHubNavOpen(false) }}>
                  <span className="mi">filter_alt</span><span className="hub-nav-label">Funil</span>
                </button>
              )}
              {isMaster && (
                <button type="button" className={`hub-nav-item ${activeTab === 'ia-orbit' ? 'active' : ''}`} onClick={() => { setActiveTab('ia-orbit'); setIsHubNavOpen(false) }}>
                  <span className="mi">smart_toy</span><span className="hub-nav-label">IA Orbit</span>
                </button>
              )}
            </div>
          )}
          {(isMaster || hasNavAccess('editorial-dash') || hasNavAccess('editorial') || hasNavAccess('editorial-plans')) && (
            <div className="hub-nav-group">
              <div className="hub-nav-group-label">Social Media</div>
              {(isMaster || hasNavAccess('editorial-dash')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'editorial-dash' ? 'active' : ''}`} onClick={() => { setActiveTab('editorial-dash'); setIsHubNavOpen(false) }}>
                  <span className="mi">monitoring</span><span className="hub-nav-label">Painel</span>
                </button>
              )}
              {(isMaster || hasNavAccess('editorial')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'editorial' ? 'active' : ''}`} onClick={() => { setActiveTab('editorial'); setIsHubNavOpen(false) }}>
                  <span className="mi">calendar_month</span><span className="hub-nav-label">Calendário</span>
                </button>
              )}
              {(isMaster || hasNavAccess('editorial-plans')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'editorial-plans' ? 'active' : ''}`} onClick={() => { setActiveTab('editorial-plans'); setIsHubNavOpen(false) }}>
                  <span className="mi">table_chart</span><span className="hub-nav-label">Planejamentos</span>
                </button>
              )}
            </div>
          )}
          {(isMaster || hasNavAccess('pac-dash') || hasNavAccess('pac-calendario') || hasNavAccess('pac-tipos')) && (
            <div className="hub-nav-group">
              <div className="hub-nav-group-label">PAC</div>
              {(isMaster || hasNavAccess('pac-dash')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'pac-dash' ? 'active' : ''}`} onClick={() => { setActiveTab('pac-dash'); setIsHubNavOpen(false) }}>
                  <span className="mi">monitoring</span><span className="hub-nav-label">Painel</span>
                </button>
              )}
              {(isMaster || hasNavAccess('pac-calendario')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'pac-calendario' ? 'active' : ''}`} onClick={() => { setActiveTab('pac-calendario'); setIsHubNavOpen(false) }}>
                  <span className="mi">calendar_month</span><span className="hub-nav-label">Calendário</span>
                </button>
              )}
              {(isMaster || hasNavAccess('pac-tipos')) && (
                <button type="button" className={`hub-nav-item ${activeTab === 'pac-tipos' ? 'active' : ''}`} onClick={() => { setActiveTab('pac-tipos'); setIsHubNavOpen(false) }}>
                  <span className="mi">category</span><span className="hub-nav-label">Tipos</span>
                </button>
              )}
            </div>
          )}
          {(canAccessTeamTab || isMaster) && (
            <div className="hub-nav-group">
              <div className="hub-nav-group-label">Admin</div>
              {canAccessTeamTab && (
                <button type="button" className={`hub-nav-item ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => { setActiveTab('usuarios'); setIsHubNavOpen(false) }}>
                  <span className="mi">manage_accounts</span><span className="hub-nav-label">Usuários</span>
                </button>
              )}
              {isMaster && (
                <button type="button" className={`hub-nav-item ${activeTab === 'permissoes' ? 'active' : ''}`} onClick={() => { setActiveTab('permissoes'); setIsHubNavOpen(false) }}>
                  <span className="mi">shield</span><span className="hub-nav-label">Permissões</span>
                </button>
              )}
              {isMaster && (
                <button type="button" className={`hub-nav-item ${activeTab === 'centro-master' ? 'active' : ''}`} onClick={() => { setActiveTab('centro-master'); setIsHubNavOpen(false) }}>
                  <span className="mi">admin_panel_settings</span><span className="hub-nav-label">Centro Master</span>
                </button>
              )}
            </div>
          )}
        </nav>

        <div className="hub-side-foot">
          <div className="hub-side-user">
            <div className="hub-side-avatar">{String(profile?.full_name || user?.email || 'U').replace(/[^A-Za-zÀ-ÿ ]/g, '').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase() || 'U'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hub-side-username">{profile?.full_name || user?.email || 'Usuário'}</div>
              <div className="hub-side-userrole">{role || 'membro'}</div>
            </div>
          </div>
          <div className="hub-side-foot-actions">
            <NotificationBell isLight={isLightAppMode} inSidebar />
            <button type="button" className="hub-nav-item hub-logout" onClick={handleLogout} aria-label="Sair da plataforma">
              <span className="mi">logout</span><span className="hub-nav-label">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {isHubNavOpen && <div className="hub-side-overlay" onClick={() => setIsHubNavOpen(false)} />}
      <button type="button" className="hub-burger" onClick={() => setIsHubNavOpen(true)} aria-label="Abrir menu">
        <span className="mi">menu</span>
      </button>

      <main className={`main-content ${isSidebarCollapsed ? 'main-content-expanded' : ''}`}>
        <header className="header" style={{ alignItems: 'flex-start' }}>

          <div className="header-actions header-actions-wrap">
            {activeTab === 'apresentacao' && (
              <>
                <div className="date-picker glass-item">
                  <i className="bx bx-user-pin"></i>
                  <select value={activeClientId} onChange={(event) => setActiveClientId(event.target.value)}>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                {activeClient && activeDraftDashboardTemplates.length > 0 && (
                  <>
                    <div className="date-picker glass-item">
                      <i className="bx bx-layout"></i>
                      <select value={draftDashboardTemplateId || activeDraftDashboardTemplateId} onChange={(event) => handleDashboardTemplateChange(event.target.value)}>
                        {activeDraftDashboardTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {layoutSaveMessage && (
                      <span className="layout-save-message">{layoutSaveMessage}</span>
                    )}
                  </>
                )}

                {draftDateRange === 'custom' && (
                  <div className="date-picker glass-item custom-range">
                    <input type="date" value={draftCustomSince} onChange={(event) => setDraftCustomSince(event.target.value)} />
                    <span>Até</span>
                    <input type="date" value={draftCustomUntil} onChange={(event) => setDraftCustomUntil(event.target.value)} />
                  </div>
                )}

                <div className="date-picker glass-item">
                  <i className="bx bx-calendar"></i>
                  <select value={draftDateRange} onChange={(event) => {
                    const next = event.target.value
                    setDraftDateRange(next)
                    if (next !== 'custom') {
                      setDateRange(next)
                      setCustomSince('')
                      setCustomUntil('')
                    }
                  }}>
                    {DATE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {draftDateRange === 'custom' && (
                  <button
                    type="button"
                    onClick={handleApplyDashboardFilters}
                    disabled={!draftCustomSince || !draftCustomUntil}
                    className="btn btn-secondary"
                  >
                    <i className="bx bx-filter-alt"></i>
                    Aplicar período
                  </button>
                )}

                <button type="button" onClick={() => handleExportDashboard('csv')} disabled={!dashboardExportRows.length} className="btn btn-secondary">
                  <i className="bx bx-download"></i>
                  Exportar CSV
                </button>

                <button type="button" onClick={() => handleExportDashboard('client-pdf')} disabled={isExporting || !dashboardExportRows.length} className="btn btn-primary">
                  <i className={isExporting ? 'bx bx-loader-alt bx-spin' : 'bx bx-file'}></i>
                  {isExporting ? 'Gerando PDF...' : 'PDF cliente'}
                </button>

                <button type="button" onClick={() => handleExportDashboard('pdf')} disabled={isExporting || !dashboardExportRows.length} className="btn btn-secondary">
                  <i className={isExporting ? 'bx bx-loader-alt bx-spin' : 'bx bx-file-blank'}></i>
                  PDF interno
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSaveReport}
                  disabled={isSavingReport || isExporting || !dashboardExportRows.length}
                >
                  <i className={isSavingReport ? 'bx bx-loader-alt bx-spin' : savedReportSuccess ? 'bx bx-check' : 'bx bx-cloud-upload'}></i>
                  {isSavingReport ? 'Salvando...' : savedReportSuccess ? 'Salvo' : 'Salvar relatório'}
                </button>
              </>
            )}


          </div>
        </header>




        {activeTab === 'settings' && (isMaster || hasNavAccess('settings')) && (
          <section style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <SettingsPage embeddedOverride={true} onGlobalIntegrationsChange={setGlobalIntegrations} />
          </section>
        )}


        {activeTab === 'semanal' && (isMaster || hasNavAccess('semanal')) && (
          <SemanalTab />
        )}

        {activeTab === 'onboarding' && isMaster && (
          <OnboardingTab />
        )}

        {activeTab === 'comunicacao' && (isMaster || hasNavAccess('comunicacao')) && (
          <ComunicacaoTab
            clients={clients}
            workspaceUsers={usersList}
            currentUserId={user?.id}
            isMaster={isMaster}
          />
        )}

        {activeTab === 'comercial' && (isMaster || hasNavAccess('comercial')) && (
          <ComercialProcessoTab
            clients={clients}
            workspaceUsers={usersList}
            currentUserId={user?.id}
            isMaster={isMaster}
          />
        )}

        {activeTab === 'planilha-leads' && (isMaster || hasNavAccess('planilha-leads')) && (
          <PlanilhaLeadsTab />
        )}

        {activeTab === 'rotinas' && (isMaster || hasNavAccess('tarefas')) && (
          <RotinasTab
            clients={clients}
            workspaceUsers={usersList}
            isMaster={isMaster}
            currentUserId={user?.id}
          />
        )}

        {['home', 'ia-orbit', 'permissoes', 'centro-master'].includes(activeTab) && isMaster && (() => {
          const HUB_PLACEHOLDERS = {
            'home': { group: 'Geral', title: 'Home', icon: 'home' },
            'ia-orbit': { group: 'Performance', title: 'IA Orbit', icon: 'smart_toy' },
            'permissoes': { group: 'Admin', title: 'Permissões', icon: 'shield' },
            'centro-master': { group: 'Admin', title: 'Centro Master', icon: 'admin_panel_settings' },
          }
          const ph = HUB_PLACEHOLDERS[activeTab]
          return (
            <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
              <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderTop: '3px solid #26C281', borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.07),rgba(38,194,129,0.01))', padding: '26px 28px' }}>
                <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#26C281', fontWeight: 700, marginBottom: 9 }}>{ph.group}</div>
                <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.5vw,1.95rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>{ph.title}</h1>
                <p style={{ margin: '9px 0 0', color: 'rgba(229,226,225,0.62)', fontSize: '0.9rem', maxWidth: '52ch', lineHeight: 1.5 }}>Módulo {ph.title} do Performance Hub — em breve com os dados da operação.</p>
              </div>
              <div style={{ marginTop: 22, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)', padding: '56px 28px', textAlign: 'center' }}>
                <div style={{ width: 66, height: 66, borderRadius: 99, background: 'rgba(38,194,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><span className="mi" style={{ fontSize: 34, color: '#26C281' }}>{ph.icon}</span></div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 8 }}>{ph.title} · em construção</div>
                <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.9rem', margin: '0 auto 22px', maxWidth: '46ch', lineHeight: 1.55 }}>Esta tela vai reutilizar os componentes base do Performance Hub — hero, stat cards, chips e tabela densa — no mesmo sistema Kinetic Emerald.</p>
                <button type="button" onClick={() => setActiveTab('clientes')} style={{ height: 42, padding: '0 20px', borderRadius: 99, border: 'none', background: '#26C281', color: '#04150d', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="mi" style={{ fontSize: 19 }}>groups</span>Ir para Clientes</button>
              </div>
            </div>
          )
        })()}

        {activeTab === 'funil' && (isMaster || hasNavAccess('funil')) && (
          <FunilPerformanceTab
            clients={clients}
            onSaveFunnelConfig={async (clientId, patch) => {
              const nextClients = clients.map((client) =>
                client.id === clientId ? createClientRecord({ ...client, ...patch }) : client
              )
              setClients(nextClients)
              try { await persistWorkspaceState({ clients: nextClients }) } catch (e) { /* keep UI state; retry on next change */ }
            }}
            campaignOverviewRows={campaignOverviewRows}
            campaignOverviewLoading={campaignOverviewLoading}
            metaRequestHeaders={metaRequestHeaders}
            dateRange={dateRange}
            customSince={customSince}
            customUntil={customUntil}
            draftDateRange={draftDateRange}
            onPeriodChange={(value) => {
              setDraftDateRange(value)
              setDateRange(value)
            }}
            onRefreshCampaigns={() => setCampaignOverviewRefreshNonce((current) => current + 1)}
            DATE_PRESETS={DATE_PRESETS}
          />
        )}

        {activeTab === 'tarefas' && (isMaster || hasNavAccess('tarefas')) && (
          <TasksTab
            clients={clients}
            workspaceUsers={usersList}
            isMaster={isMaster}
            currentUserId={user?.id}
            mode="tarefas"
          />
        )}

        {activeTab === 'offboarding' && isMaster && (
          <OffboardingTab />
        )}

        {isBrandingModalOpen && canManageUsers && (
          <div className="modal-overlay" onClick={() => setIsBrandingModalOpen(false)}>
            <div className="modal-card glass-panel workspace-branding-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Configurar sua plataforma</h3>
                  <p>Esta marca será aplicada para o workspace, equipe e futuras telas do produto.</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setIsBrandingModalOpen(false)} aria-label="Fechar identidade visual">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <form onSubmit={handleSaveWorkspaceBranding}>
                {brandingError && <div className="form-alert">{brandingError}</div>}
                <div className="form-grid user-admin-grid">
                  <div className="input-group">
                    <label>Nome da empresa</label>
                    <input type="text" value={brandingForm.companyName || ''} onChange={(event) => setBrandingForm((current) => ({ ...current, companyName: event.target.value, appName: event.target.value }))} placeholder="Ex.: Minha Assessoria" />
                  </div>
                  <div className="input-group">
                    <label>Nome no app</label>
                    <input type="text" value={brandingForm.appName || ''} onChange={(event) => setBrandingForm((current) => ({ ...current, appName: event.target.value }))} placeholder="Nome exibido no menu" />
                  </div>
                  <div className="input-group">
                    <label>Subtítulo</label>
                    <input type="text" value={brandingForm.appSubtitle || ''} onChange={(event) => setBrandingForm((current) => ({ ...current, appSubtitle: event.target.value }))} placeholder="Ex.: Performance Hub" />
                  </div>
                  <div className="input-group">
                    <label>Logo do app</label>
                    <div className="client-logo-uploader client-logo-uploader-create workspace-logo-uploader">
                      <div className="client-logo-preview">
                        {brandingForm.logoUrl ? <img src={brandingForm.logoUrl} alt="Logo do app" /> : <i className="bx bx-image-add"></i>}
                      </div>
                      <div className="client-logo-actions">
                        <label className="btn btn-secondary client-logo-upload-button">
                          <i className="bx bx-upload" aria-hidden="true"></i>
                          <span>{brandingForm.logoUrl ? 'Trocar logo' : 'Subir logo'}</span>
                          <input type="file" accept="image/*" onChange={handleWorkspaceLogoUpload} />
                        </label>
                        {brandingForm.logoUrl && (
                          <button type="button" className="btn btn-secondary" onClick={() => setBrandingForm((current) => ({ ...current, logoUrl: '' }))}>
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                    <input type="url" value={brandingForm.logoUrl || ''} onChange={(event) => setBrandingForm((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="Ou cole uma URL da logo" />
                  </div>
                  <div className="input-group">
                    <label>Cor principal</label>
                    <input type="color" value={brandingForm.primaryColor || '#26C281'} onChange={(event) => setBrandingForm((current) => ({ ...current, primaryColor: event.target.value, accentColor: event.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Detalhes</label>
                    <input type="color" value={brandingForm.accentColor || '#26C281'} onChange={(event) => setBrandingForm((current) => ({ ...current, accentColor: event.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Fundo</label>
                    <input type="color" value={brandingForm.backgroundColor || '#070908'} onChange={(event) => setBrandingForm((current) => ({ ...current, backgroundColor: event.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Caixas</label>
                    <input type="color" value={brandingForm.panelColor || '#121817'} onChange={(event) => setBrandingForm((current) => ({ ...current, panelColor: event.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Textos</label>
                    <input type="color" value={brandingForm.textColor || '#F4F7F5'} onChange={(event) => setBrandingForm((current) => ({ ...current, textColor: event.target.value }))} />
                  </div>
                </div>
                <div className="modal-foot">
                  <span className="form-note">O e-mail master global é fbrandenburgjunior@gmail.com. Este painel configura a marca do workspace atual.</span>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsBrandingModalOpen(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isSavingBranding}>{isSavingBranding ? 'Salvando...' : 'Salvar marca'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}






        {activeTab === 'campanhas' && (isMaster || hasNavAccess('campanhas')) && (
          <CampanhasTab />
        )}

        {activeTab === 'anuncios' && (isMaster || hasNavAccess('anuncios')) && (
          <AnunciosTab />
        )}

        {activeTab === 'saldos' && (isMaster || hasNavAccess('saldos')) && (
          <SaldosTab />
        )}

        {activeTab === 'acessos' && (isMaster || hasNavAccess('acessos')) && (
          <section style={{ height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ClientAccessesTab
              clients={clients}
            />
          </section>
        )}

        {activeTab === 'editorial' && (isMaster || hasNavAccess('editorial')) && (
          <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <EditorialCalendar
              clients={clients}
              isLightMode={isLightAppMode}
            />
          </section>
        )}

        {activeTab === 'editorial-dash' && (isMaster || hasNavAccess('editorial-dash')) && (
          <section style={{ padding: '16px 20px', height: '100%', boxSizing: 'border-box' }}>
            <EditorialCalendar
              clients={clients}
              isLightMode={isLightAppMode}
              defaultView="dash"
            />
          </section>
        )}

        {activeTab === 'editorial-plans' && (isMaster || hasNavAccess('editorial-plans')) && (
          <section style={{ padding: '16px 20px', height: '100%', boxSizing: 'border-box' }}>
            <EditorialCalendar
              clients={clients}
              isLightMode={isLightAppMode}
              defaultView="plans"
            />
          </section>
        )}

        {activeTab === 'pac-dash' && (isMaster || hasNavAccess('pac-dash')) && (
          <section style={{ padding: '16px 20px', height: '100%', boxSizing: 'border-box' }}>
            <PACCalendar
              clients={clients}
              isLightMode={isLightAppMode}
              defaultView="dash"
            />
          </section>
        )}

        {activeTab === 'pac-calendario' && (isMaster || hasNavAccess('pac-calendario')) && (
          <section style={{ padding: '16px 20px', height: '100%', boxSizing: 'border-box' }}>
            <PACCalendar
              clients={clients}
              isLightMode={isLightAppMode}
              defaultView="calendario"
            />
          </section>
        )}

        {activeTab === 'pac-tipos' && (isMaster || hasNavAccess('pac-tipos')) && (
          <section style={{ padding: '16px 20px', height: '100%', boxSizing: 'border-box' }}>
            <PACCalendar
              clients={clients}
              isLightMode={isLightAppMode}
              defaultView="tipos"
            />
          </section>
        )}

        {activeTab === 'relatorios' && (isMaster || hasNavAccess('relatorios')) && (
          <section style={{ padding: '24px' }}>
            <ReportsTab clients={clients} />
          </section>
        )}

        {activeTab === 'relatorio-manual' && (isMaster || hasNavAccess('relatorio-manual')) && (
          <section style={{ padding: '24px' }}>
            <ManualReportTab clients={clients} />
          </section>
        )}

        {activeTab === 'clientes' && (
          <ClientesTab />
        )}

        {activeTab === 'produtos' && canManageClients && (
          <ProdutosTab />
        )}



        {activeTab === 'usuarios' && canAccessTeamTab && (
          <UsuariosTab />
        )}

        {activeTab === 'apresentacao' && (
          <ApresentacaoTab />
        )}

        {metaSecondaryResultDrilldown && activeMetaSecondaryResultGroup && activeMetaSecondaryResultInsights && typeof document !== 'undefined' && createPortal(
          <div className="modal-overlay" onClick={() => setMetaSecondaryResultDrilldown(null)}>
            <div className="modal-card glass-panel meta-secondary-result-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Conversões extras de {activeMetaSecondaryResultGroup.title.toLowerCase()}</h3>
                  <p>Leitura informativa das campanhas desse objetivo no período atual. Esses números não entram no card principal e não puxam gasto adicional.</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setMetaSecondaryResultDrilldown(null)} aria-label="Fechar conversões extras">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div className="meta-secondary-result-summary glass-item">
                <strong>{formatNumber(activeMetaSecondaryResultInsights.campaignCount)}</strong>
                <span>Campanha(s) desse objetivo no recorte selecionado</span>
              </div>

              {activeMetaSecondaryResultInsights.items.length ? (
                <div className="meta-secondary-result-list">
                  {activeMetaSecondaryResultInsights.items.map((item) => (
                    <div key={`${activeMetaSecondaryResultGroup.key}-${item.key}`} className="meta-secondary-result-item glass-item">
                      <div>
                        <strong>{item.label}</strong>
                        <span>Resultado paralelo gerado por campanhas de {activeMetaSecondaryResultGroup.title.toLowerCase()}</span>
                      </div>
                      <b>{formatNumber(item.value)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ranking-empty">Nenhum resultado extra apareceu nesse grupo no período selecionado.</div>
              )}
            </div>
          </div>,
          document.body
        )}

        {metaResultDrilldown && activeMetaResultDrilldownConfig && typeof document !== 'undefined' && createPortal(
          <div className="modal-overlay meta-result-overlay" onClick={() => setMetaResultDrilldown(null)}>
            <div className="modal-card modal-card-wide glass-panel meta-result-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{activeMetaResultDrilldownConfig.title}</h3>
                  <p>{activeMetaResultDrilldownConfig.description}</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setMetaResultDrilldown(null)} aria-label="Fechar comparativo de resultado">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div className="meta-result-toolbar">
                <div className="meta-result-periods">
                  {META_RESULT_PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`meta-result-period-btn ${metaResultGrouping === option.value ? 'active' : ''}`}
                      onClick={() => setMetaResultGrouping(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <span className="meta-result-toolbar-note">
                  Agrupando por {META_RESULT_PERIOD_OPTIONS.find((option) => option.value === metaResultGrouping)?.label.toLowerCase() || 'semana'}.
                </span>
              </div>

              {metaResultComparisonSummary ? (
                <div className="meta-result-summary">
                  <div className="monday-drilldown-stat glass-item">
                    <span>{activeMetaResultDrilldownConfig.resultLabel}</span>
                    <strong>{formatNumber(metaResultComparisonSummary.totalResults)}</strong>
                  </div>
                  <div className="monday-drilldown-stat glass-item">
                    <span>{activeMetaResultDrilldownConfig.costLabel}</span>
                    <strong>{formatCurrency(metaResultComparisonSummary.averageCost)}</strong>
                  </div>
                  <div className="monday-drilldown-stat glass-item">
                    <span>Investimento</span>
                    <strong>{formatCurrency(metaResultComparisonSummary.totalSpend)}</strong>
                  </div>
                </div>
              ) : null}

              {metaResultComparisonSeries.length ? (
                <div className="glass-item meta-result-chart-shell">
                  <div className="meta-result-chart-head">
                    <div className="meta-result-legend">
                      <span className="legend-item">
                        <span className="dot" style={{ background: activeMetaResultDrilldownConfig.resultTone, boxShadow: `0 0 8px ${activeMetaResultDrilldownConfig.resultTone}` }}></span>
                        {activeMetaResultDrilldownConfig.resultLabel}
                      </span>
                      <span className="legend-item">
                        <span className="dot" style={{ background: activeMetaResultDrilldownConfig.costTone, boxShadow: `0 0 8px ${activeMetaResultDrilldownConfig.costTone}` }}></span>
                        {activeMetaResultDrilldownConfig.costLabel}
                      </span>
                    </div>
                  </div>
                  <div className="canvas-wrapper meta-result-chart-wrapper">
                    <Line data={metaResultComparisonChartData} options={metaResultComparisonChartOptions} />
                  </div>
                </div>
              ) : (
                <div className="ranking-empty">Sem histórico suficiente para montar esse comparativo no período atual.</div>
              )}
            </div>
          </div>,
          document.body
        )}

        {adsOverviewPreviewItem && typeof document !== 'undefined' && createPortal(
          <div className="modal-overlay meta-ranking-detail-overlay" onClick={() => setAdsOverviewPreviewItem(null)}>
            <div className="modal-card glass-panel meta-ranking-detail-modal ads-overview-preview-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{adsOverviewPreviewItem.label}</h3>
                  <p>{adsOverviewPreviewItem.clientName} • Preview real do anúncio quando disponível.</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setAdsOverviewPreviewItem(null)} aria-label="Fechar preview do anúncio">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div className="meta-ranking-detail-content">
                <aside className="glass-item meta-ranking-detail-sidebar">
                  <span className="meta-ranking-detail-kicker">Resumo do anúncio</span>
                  <h4>{adsOverviewPreviewItem.resultLabel || 'Resultados'}</h4>
                  <div className="meta-ranking-detail-stats">
                    <span>
                      <small>{adsOverviewPreviewItem.resultLabel || 'Resultados'}</small>
                      <strong>{formatNumber(getMetaBreakdownResultValue(adsOverviewPreviewItem, adsOverviewPreviewItem.resultMetricKey || 'totalConversions'))}</strong>
                    </span>
                    <span>
                      <small>Custo</small>
                      <strong>{getMetaBreakdownAverageCost(adsOverviewPreviewItem, adsOverviewPreviewItem.resultMetricKey || 'totalConversions') > 0 ? formatCurrency(getMetaBreakdownAverageCost(adsOverviewPreviewItem, adsOverviewPreviewItem.resultMetricKey || 'totalConversions')) : '-'}</strong>
                    </span>
                    <span>
                      <small>Investimento</small>
                      <strong>{formatCurrency(adsOverviewPreviewItem.spend || 0)}</strong>
                    </span>
                    <span>
                      <small>Cliques</small>
                      <strong>{formatNumber(adsOverviewPreviewItem.clicks || 0)}</strong>
                    </span>
                    <span>
                      <small>Impressões</small>
                      <strong>{formatNumber(adsOverviewPreviewItem.impressions || 0)}</strong>
                    </span>
                  </div>
                </aside>

                <div className="glass-item meta-ranking-detail-panel">
                  <div className="meta-ranking-detail-head">
                    <span className="meta-ranking-detail-kicker">Criativo real</span>
                    <h4>Visualização do anúncio</h4>
                    <p>Use este preview para conferir imagem, descrição e vídeos quando a Meta disponibilizar reprodução.</p>
                  </div>

                  <div className="meta-ranking-preview-frame">
                    {adsOverviewPreviewLoading ? (
                      <div className="meta-ranking-preview-fallback">
                        <i className="bx bx-loader-alt bx-spin"></i>
                        <span>Carregando preview real...</span>
                      </div>
                    ) : adsOverviewPreview?.previewHtml && !/expired|The requested preview has expired/i.test(adsOverviewPreview.previewHtml) ? (
                      <iframe
                        title={`Preview de ${adsOverviewPreviewItem.label}`}
                        srcDoc={adsOverviewPreview.previewHtml}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                    ) : (adsOverviewPreview?.imageUrl || adsOverviewPreviewItem.imageUrl) ? (
                      <img src={adsOverviewPreview?.imageUrl || adsOverviewPreviewItem.imageUrl} alt={adsOverviewPreviewItem.label} />
                    ) : (
                      <div className="meta-ranking-preview-fallback">
                        <i className="bx bx-image-alt"></i>
                        <span>Preview indisponível</span>
                      </div>
                    )}
                  </div>
                  {adsOverviewPreviewError ? (
                    <p className="meta-ranking-preview-error">{adsOverviewPreviewError}</p>
                  ) : null}
                  {adsOverviewPreview?.description ? (
                    <div className="meta-ranking-creative-description">
                      <span>Texto do anúncio</span>
                      <p>{adsOverviewPreview.description}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {metaRankingDrilldown && activeMetaRankingDrilldownConfig && activeMetaRankingDrilldownItem && typeof document !== 'undefined' && createPortal(
          <div className="modal-overlay meta-ranking-overlay" onClick={() => setMetaRankingDrilldown(null)}>
            <div className="modal-card modal-card-wide glass-panel meta-ranking-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{activeMetaRankingDrilldownConfig.title}</h3>
                  <p>{activeMetaRankingDrilldownConfig.detailDescription}</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setMetaRankingDrilldown(null)} aria-label="Fechar detalhamento do ranking">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div className={`meta-ranking-body ${isCreativeRankingDrilldown ? 'meta-ranking-body-creative' : ''}`}>
                {isCreativeRankingDrilldown ? (
                  <div className="meta-ranking-creative-main">
                    <div className="glass-item meta-ranking-chart-shell meta-ranking-period-shell">
                      <div className="meta-result-chart-head">
                        <div>
                          <strong>Resultado no período selecionado</strong>
                          <p className="chart-subtitle">Leitura isolada do criativo com base no filtro atual, sem comparar com os demais itens do ranking.</p>
                        </div>
                      </div>
                      {metaRankingDrilldownSummary ? (
                        <div className="meta-ranking-period-grid">
                          <div className="conversion-stat">
                            <span>{activeMetaRankingDrilldownConfig.resultLabel}</span>
                            <strong>{formatNumber(metaRankingDrilldownSummary.conversions)}</strong>
                          </div>
                          <div className="conversion-stat">
                            <span>{activeMetaRankingDrilldownConfig.costLabel}</span>
                            <strong>{formatCurrency(metaRankingDrilldownSummary.avgCost)}</strong>
                          </div>
                          <div className="conversion-stat">
                            <span>Investimento</span>
                            <strong>{formatCurrency(metaRankingDrilldownSummary.spendValue)}</strong>
                          </div>
                          <div className="conversion-stat">
                            <span>Cliques</span>
                            <strong>{formatNumber(metaRankingDrilldownSummary.clicksValue)}</strong>
                          </div>
                          <div className="conversion-stat">
                            <span>Impressões</span>
                            <strong>{formatNumber(metaRankingDrilldownSummary.impressionsValue)}</strong>
                          </div>
                          <div className="conversion-stat">
                            <span>Taxa de conversão</span>
                            <strong>{formatPercent(metaRankingDrilldownSummary.conversionRateValue)}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="ranking-empty">Sem base suficiente para montar a leitura desse criativo no período.</div>
                      )}
                      <div className="meta-ranking-inline-note">
                        <strong>{formatCurrency(activeMetaRankingDrilldownItem.spend || 0)}</strong> investidos para gerar{' '}
                        <strong>{formatNumber(getMetaBreakdownResultValue(activeMetaRankingDrilldownItem, activeMetaRankingDrilldownConfig?.resultMetricKey))}</strong> {activeMetaRankingDrilldownConfig?.resultLabel?.toLowerCase() || 'resultados'} nesse criativo
                        {metaRankingDrilldownSummary?.impressionsValue
                          ? `, com ${formatNumber(metaRankingDrilldownSummary.impressionsValue)} impressões dentro do recorte selecionado.`
                          : ' dentro do recorte selecionado.'}
                      </div>
                    </div>

                    <div className="glass-item meta-ranking-chart-shell">
                      <div className="meta-result-chart-head">
                        <div>
                          <strong>Resultado diario do criativo</strong>
                          <p className="chart-subtitle">Eixo X por dia, com conversões, custo por conversão e investimento do próprio criativo dentro do período filtrado.</p>
                        </div>
                        <div className="meta-result-legend">
                          <span className="legend-item">
                            <span className="dot" style={{ background: activeMetaRankingDrilldownConfig.resultTone, boxShadow: `0 0 8px ${activeMetaRankingDrilldownConfig.resultTone}` }}></span>
                            Conversões
                          </span>
                          <span className="legend-item">
                            <span className="dot" style={{ background: activeMetaRankingDrilldownConfig.costTone, boxShadow: `0 0 8px ${activeMetaRankingDrilldownConfig.costTone}` }}></span>
                            Custo por conversão
                          </span>
                          <span className="legend-item">
                            <span className="dot" style={{ background: META_RANKING_SPEND_TONE, boxShadow: `0 0 8px ${META_RANKING_SPEND_TONE}` }}></span>
                            Investimento
                          </span>
                        </div>
                      </div>
                      {metaRankingDetailDailyLoading ? (
                        <div className="ranking-empty">Carregando evolução diária do criativo...</div>
                      ) : metaRankingDetailDailyError ? (
                        <div className="ranking-empty">{metaRankingDetailDailyError}</div>
                      ) : metaRankingComparisonChartData ? (
                        <div className="canvas-wrapper meta-ranking-chart-wrapper">
                          <Bar data={metaRankingComparisonChartData} options={metaRankingComparisonChartOptions} />
                        </div>
                      ) : (
                        <div className="ranking-empty">Sem histórico diário suficiente para montar a evolução desse criativo.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-item meta-ranking-chart-shell">
                    <div className="meta-result-chart-head">
                      <div>
                        <strong>Evolução diária do item selecionado</strong>
                        <p className="chart-subtitle">Eixo X por dia, com volume de resultados, custo por resultado e investimento do item escolhido dentro do período filtrado.</p>
                      </div>
                      <div className="meta-result-legend">
                        <span className="legend-item">
                          <span className="dot" style={{ background: activeMetaRankingDrilldownConfig.resultTone, boxShadow: `0 0 8px ${activeMetaRankingDrilldownConfig.resultTone}` }}></span>
                          {activeMetaRankingDrilldownConfig.resultLabel}
                        </span>
                        <span className="legend-item">
                          <span className="dot" style={{ background: activeMetaRankingDrilldownConfig.costTone, boxShadow: `0 0 8px ${activeMetaRankingDrilldownConfig.costTone}` }}></span>
                          {activeMetaRankingDrilldownConfig.costLabel}
                        </span>
                        <span className="legend-item">
                          <span className="dot" style={{ background: META_RANKING_SPEND_TONE, boxShadow: `0 0 8px ${META_RANKING_SPEND_TONE}` }}></span>
                          Investimento
                        </span>
                      </div>
                    </div>
                    {metaRankingDetailDailyLoading ? (
                      <div className="ranking-empty">Carregando evolução diária do item selecionado...</div>
                    ) : metaRankingDetailDailyError ? (
                      <div className="ranking-empty">{metaRankingDetailDailyError}</div>
                    ) : metaRankingComparisonChartData ? (
                      <div className="canvas-wrapper meta-ranking-chart-wrapper">
                        <Bar data={metaRankingComparisonChartData} options={metaRankingComparisonChartOptions} />
                      </div>
                    ) : (
                      <div className="ranking-empty">Sem histórico diário suficiente para montar a evolução desse item.</div>
                    )}
                  </div>
                )}

                <div className="glass-item meta-ranking-detail-panel">
                  <div className="meta-ranking-detail-head">
                    <span className="meta-ranking-detail-kicker">{activeMetaRankingDrilldownConfig.previewKicker}</span>
                    <h4>{activeMetaRankingDrilldownItem.label}</h4>
                    <p>{isCreativeRankingDrilldown ? 'Preview real retornado pela Meta para conferir a peça, ler o texto e reproduzir vídeos disponíveis.' : activeMetaRankingDrilldownConfig.description}</p>
                  </div>

                  {metaRankingDrilldown.type === 'creatives' ? (
                    <>
                      <div className="meta-ranking-preview-frame">
                        {metaCreativePreviewLoading ? (
                          <div className="meta-ranking-preview-fallback">
                            <i className="bx bx-loader-alt bx-spin"></i>
                            <span>Carregando preview real...</span>
                          </div>
                        ) : metaCreativePreview?.previewHtml && !/expired|The requested preview has expired/i.test(metaCreativePreview.previewHtml) ? (
                          <iframe
                            title={`Preview de ${activeMetaRankingDrilldownItem.label}`}
                            srcDoc={metaCreativePreview.previewHtml}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                            allow="autoplay; encrypted-media; picture-in-picture"
                          />
                        ) : (metaCreativePreview?.imageUrl || activeMetaRankingDrilldownItem.imageUrl) ? (
                          <img src={metaCreativePreview?.imageUrl || activeMetaRankingDrilldownItem.imageUrl} alt={activeMetaRankingDrilldownItem.label} />
                        ) : (
                          <div className="meta-ranking-preview-fallback">
                            <i className="bx bx-image-alt"></i>
                            <span>Preview indisponível</span>
                          </div>
                        )}
                      </div>
                      {metaCreativePreviewError ? (
                        <p className="meta-ranking-preview-error">{metaCreativePreviewError}</p>
                      ) : null}
                      {metaCreativePreview?.description ? (
                        <div className="meta-ranking-creative-description">
                          <span>Texto do anúncio</span>
                          <p>{metaCreativePreview.description}</p>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {metaRankingDrilldownSummary && !isCreativeRankingDrilldown ? (
                    <div className="meta-ranking-detail-stats">
                      <div className="conversion-stat">
                        <span>{activeMetaRankingDrilldownConfig.resultLabel}</span>
                        <strong>{formatNumber(metaRankingDrilldownSummary.conversions)}</strong>
                      </div>
                      <div className="conversion-stat">
                        <span>{activeMetaRankingDrilldownConfig.costLabel}</span>
                        <strong>{formatCurrency(metaRankingDrilldownSummary.avgCost)}</strong>
                      </div>
                      <div className="conversion-stat">
                        <span>Cliques</span>
                        <strong>{formatNumber(metaRankingDrilldownSummary.clicksValue)}</strong>
                      </div>
                      <div className="conversion-stat">
                        <span>Taxa de conversão</span>
                        <strong>{formatPercent(metaRankingDrilldownSummary.conversionRateValue)}</strong>
                      </div>
                    </div>
                  ) : null}

                  {!isCreativeRankingDrilldown ? (
                    <div className="meta-ranking-inline-note">
                      <strong>{formatCurrency(activeMetaRankingDrilldownItem.spend || 0)}</strong> investidos para gerar{' '}
                      <strong>{formatNumber(getMetaBreakdownResultValue(activeMetaRankingDrilldownItem, activeMetaRankingDrilldownConfig?.resultMetricKey))}</strong> {activeMetaRankingDrilldownConfig?.resultLabel?.toLowerCase() || 'resultados'} nesse item.
                      {metaRankingDrilldownSummary?.impressionsValue
                        ? ` Foram ${formatNumber(metaRankingDrilldownSummary.impressionsValue)} impressões no período analisado.`
                        : ''}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {mondayMetricDrilldown && typeof document !== 'undefined' && createPortal(
          <div className="modal-overlay monday-drilldown-overlay" onClick={() => setMondayMetricDrilldown(null)}>
            <div className="modal-card glass-panel monday-drilldown-popup" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>{mondayMetricDrilldown.title}</h3>
                  <p>{mondayMetricDrilldown.description}</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setMondayMetricDrilldown(null)} aria-label="Fechar detalhamento do Monday">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              {mondayMetricDrilldown.items?.length ? (
                <div className="monday-drilldown-body">
                  <div className="monday-drilldown-summary">
                    <div className="monday-drilldown-stat glass-item">
                      <span>Demandas</span>
                      <strong>{formatNumber(mondayMetricDrilldown.items.length)}</strong>
                    </div>
                    <div className="monday-drilldown-stat glass-item">
                      <span>Atrasadas</span>
                      <strong>{formatNumber(mondayMetricDrilldown.items.filter((task) => task.isOverdue).length)}</strong>
                    </div>
                    <div className="monday-drilldown-stat glass-item">
                      <span>Bloqueadas</span>
                      <strong>{formatNumber(mondayMetricDrilldown.items.filter((task) => task.isBlocked).length)}</strong>
                    </div>
                    <div className="monday-drilldown-stat glass-item">
                      <span>Sem responsável</span>
                      <strong>{formatNumber(mondayMetricDrilldown.items.filter((task) => task.isUnassigned).length)}</strong>
                    </div>
                  </div>

                  <div className="monday-drilldown-mode glass-item">
                    {mondayOwnerFilter === 'all'
                      ? 'Agrupado por responsável para facilitar cobrança, priorização e tomada de decisão por pessoa.'
                      : `Lista priorizada para ${selectedMondayOwnerLabel}, ordenada por urgência e tempo de atraso.`}
                  </div>

                  <div className="monday-user-groups">
                    {mondayDrilldownOwnerGroups.map((group) => (
                      (() => {
                        const isExpanded = Boolean(expandedMondayGroups[group.key])
                        const previewTasks = group.items.slice(0, 3)
                        const topTask = group.items[0] || null

                        return (
                          <section key={group.key} className={`monday-user-group glass-item ${isExpanded ? 'monday-user-group-expanded' : 'monday-user-group-collapsed'}`}>
                            <button
                              type="button"
                              className="monday-user-group-toggle"
                              onClick={() => setExpandedMondayGroups((current) => ({
                                ...current,
                                [group.key]: !current[group.key],
                              }))}
                              aria-expanded={isExpanded}
                            >
                              <div className="monday-user-group-head">
                                <div>
                                  <h4>{group.owner}</h4>
                                  <p>{formatNumber(group.items.length)} demanda(s) dessa métrica em ordem da mais urgente/atrasada para a menos crítica.</p>
                                </div>
                                <div className="monday-user-group-metrics">
                                  <div className="monday-user-group-metric">
                                    <span>Atrasadas</span>
                                    <strong>{formatNumber(group.overdueCount)}</strong>
                                  </div>
                                  <div className="monday-user-group-metric">
                                    <span>Bloqueadas</span>
                                    <strong>{formatNumber(group.blockedCount)}</strong>
                                  </div>
                                  <div className="monday-user-group-metric">
                                    <span>Vencem logo</span>
                                    <strong>{formatNumber(group.dueSoonCount)}</strong>
                                  </div>
                                </div>
                              </div>

                              <div className="monday-user-group-summary">
                                <div className="monday-user-group-summary-copy">
                                  <span>
                                    {topTask
                                      ? `Mais crítica agora: ${topTask.name}${topTask.daysOverdue ? ` · ${formatNumber(topTask.daysOverdue)} dia(s) de atraso` : topTask.isDueSoon ? ' · vence logo' : ''}`
                                      : 'Sem demanda prioritária no recorte.'}
                                  </span>
                                  {previewTasks.length ? (
                                    <div className="monday-user-group-preview">
                                      {previewTasks.map((task) => (
                                        <span key={`${group.key}-preview-${task.id}`} className="monday-user-group-preview-item">
                                          {task.name}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                                <span className="monday-user-group-action">
                                  {isExpanded ? 'Fechar tarefas' : 'Ver tarefas'}
                                  <i className={`bx ${isExpanded ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                                </span>
                              </div>
                            </button>

                            {isExpanded ? (
                              <div className="monday-user-table-wrap">
                                <table className="monday-user-task-table">
                                  <thead>
                                    <tr>
                                      <th>Demanda</th>
                                      <th>Urgência</th>
                                      <th>Status</th>
                                      <th>Prazo</th>
                                      <th>Atraso</th>
                                      <th>Tempo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.items.map((task) => {
                                      const urgency = getMondayTaskUrgency(task)

                                      return (
                                        <tr key={`${group.key}-${task.id}`}>
                                          <td className="monday-user-task-main monday-user-col-main">
                                            <strong>{task.name}</strong>
                                            <span>{task.boardName || '-'}{task.groupLabel ? ` · ${task.groupLabel}` : ''}</span>
                                          </td>
                                          <td className="monday-user-col-urgency">{urgency.label}</td>
                                          <td className="monday-user-col-status">{task.statusLabel || 'Sem status'}</td>
                                          <td className="monday-user-col-date">{task.dueDate ? formatShortDate(task.dueDate) : '-'}</td>
                                          <td className="monday-user-col-overdue">
                                            <div className="monday-overdue-stack">
                                              <span className="monday-overdue-value">
                                                {task.daysOverdue
                                                  ? `${formatNumber(task.daysOverdue)} dia(s)`
                                                  : task.isDueSoon
                                                    ? 'Vence logo'
                                                    : 'No prazo'}
                                              </span>
                                              {task.isOverdue && <span className="monday-task-chip danger">Atrasada</span>}
                                              {!task.isOverdue && task.isDueSoon && <span className="monday-task-chip info">Vence logo</span>}
                                            </div>
                                          </td>
                                          <td className="monday-user-col-time">{formatDurationHours(task.trackedSeconds || 0)}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : null}
                          </section>
                        )
                      })()
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ranking-empty">Nenhuma demanda encontrada para esse recorte.</div>
              )}
            </div>
          </div>,
          document.body
        )}
      </main>




      {/* CPR Benchmark Panel */}
      {showCprPanel && (
        <div className="modal-overlay cpr-modal-overlay" onClick={() => setShowCprPanel(false)} style={{ zIndex: 9999 }}>
          <div className="cpr-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="cpr-modal-header">
              <div className="cpr-modal-header-glow" />
              <div>
                <span className="cpr-modal-kicker">Performance</span>
                <h3 className="cpr-modal-title">Metas de CPR</h3>
                <p className="cpr-modal-sub">Defina o CPR alvo de cada cliente e as faixas de tolerância para sinalização.</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowCprPanel(false)}><i className="bx bx-x"></i></button>
            </div>

            {/* Thresholds */}
            <div className="cpr-modal-thresholds">
              <div className="cpr-threshold-band cpr-band-green">
                <div className="cpr-band-header">
                  <span className="cpr-band-dot" style={{ background: '#22c55e' }} />
                  <span>Verde</span>
                  <span className="cpr-band-desc">até % acima da meta</span>
                </div>
                <div className="cpr-band-input-row">
                  <input
                    type="number" min="0" max="100" step="1"
                    value={draftCprSettings.green_threshold}
                    onChange={(e) => setDraftCprSettings((s) => ({ ...s, green_threshold: Number(e.target.value) }))}
                    className="cpr-threshold-input"
                  />
                  <span className="cpr-band-unit">%</span>
                </div>
              </div>
              <div className="cpr-threshold-band cpr-band-yellow">
                <div className="cpr-band-header">
                  <span className="cpr-band-dot" style={{ background: '#f59e0b' }} />
                  <span>Amarelo</span>
                  <span className="cpr-band-desc">até % acima da meta</span>
                </div>
                <div className="cpr-band-input-row">
                  <input
                    type="number" min="0" max="200" step="1"
                    value={draftCprSettings.yellow_threshold}
                    onChange={(e) => setDraftCprSettings((s) => ({ ...s, yellow_threshold: Number(e.target.value) }))}
                    className="cpr-threshold-input"
                  />
                  <span className="cpr-band-unit">%</span>
                </div>
              </div>
              <div className="cpr-threshold-band cpr-band-red">
                <div className="cpr-band-header">
                  <span className="cpr-band-dot" style={{ background: '#ef4444' }} />
                  <span>Vermelho</span>
                  <span className="cpr-band-desc">acima de {draftCprSettings.yellow_threshold}%</span>
                </div>
                <div className="cpr-band-input-row">
                  <span className="cpr-band-auto">Automático</span>
                </div>
              </div>
            </div>

            {/* Client list */}
            <div className="cpr-modal-list">
              <div className="cpr-list-header">
                <span>Cliente</span>
                <span>CPR Meta</span>
                <span>Faixas</span>
              </div>
              {(clients || []).filter((c) => {
                const st = String(c?.status || '').trim().toLowerCase()
                return c?.id && st !== 'churn' && st !== 'pausado'
              }).map((client) => {
                const bench = draftCprBenchmarks[client.id]
                const hasBench = bench > 0
                return (
                  <div key={client.id} className={'cpr-client-row' + (hasBench ? ' has-bench' : '')}>
                    <div className="cpr-client-identity">
                      {client.logoUrl
                        ? <img src={client.logoUrl} alt="" className="cpr-client-logo" />
                        : <span className="cpr-client-avatar" style={{ background: client.dashboardAccentColor || '#26c281' }}>{(client.name || '?')[0]}</span>
                      }
                      <span className="cpr-client-name">{client.name}</span>
                    </div>
                    <div className="cpr-client-input-wrap">
                      <span className="cpr-currency">R$</span>
                      <input
                        type="number" min="0" step="0.01"
                        placeholder="—"
                        value={draftCprBenchmarks[client.id] ?? ''}
                        onChange={(e) => setDraftCprBenchmarks((prev) => ({ ...prev, [client.id]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                        className="cpr-client-input"
                      />
                    </div>
                    <div className="cpr-client-bands">
                      {hasBench ? (
                        <>
                          <span className="cpr-mini-band green">≤ R${(bench * (1 + draftCprSettings.green_threshold / 100)).toFixed(2)}</span>
                          <span className="cpr-mini-band yellow">≤ R${(bench * (1 + draftCprSettings.yellow_threshold / 100)).toFixed(2)}</span>
                        </>
                      ) : <span className="cpr-mini-band empty">Sem meta</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cpr-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCprPanel(false)}>Cancelar</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={cprSaving}
                onClick={async () => {
                  setCprSaving(true)
                  try {
                    const benchmarks = Object.entries(draftCprBenchmarks)
                      .filter(([, v]) => v !== undefined && v !== '')
                      .map(([client_id, benchmark_cpr]) => ({ client_id, benchmark_cpr: Number(benchmark_cpr) }))
                    await fetch('/api/cpr-benchmarks', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ benchmarks, settings: draftCprSettings }),
                    })
                    const map = {}
                    for (const b of benchmarks) map[b.client_id] = b.benchmark_cpr
                    setCprBenchmarks(map)
                    setCprSettings(draftCprSettings)
                    setShowCprPanel(false)
                  } finally {
                    setCprSaving(false)
                  }
                }}
              >
                <i className={cprSaving ? 'bx bx-loader-alt bx-spin' : 'bx bx-check'}></i>
                {cprSaving ? 'Salvando...' : 'Salvar metas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardContext.Provider>
  )
}
