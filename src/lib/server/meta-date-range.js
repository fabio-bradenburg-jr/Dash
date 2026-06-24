const META_REPORT_TIMEZONE = 'America/Sao_Paulo'

function getTimeZoneDateParts(date = new Date(), timeZone = META_REPORT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const parts = formatter.formatToParts(date)

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value || 0),
    month: Number(parts.find((part) => part.type === 'month')?.value || 1),
    day: Number(parts.find((part) => part.type === 'day')?.value || 1),
  }
}

function createUtcDateFromParts({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day))
}

function shiftUtcDays(date, amount) {
  const shiftedDate = new Date(date)
  shiftedDate.setUTCDate(shiftedDate.getUTCDate() + amount)
  return shiftedDate
}

function formatUtcDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function resolveMetaDateSelection(datePreset, since, until) {
  if (datePreset === 'custom' && since && until) {
    return { mode: 'time_range', since, until }
  }

  const todayParts = getTimeZoneDateParts()
  const todayDate  = createUtcDateFromParts(todayParts)
  const yesterday  = formatUtcDate(shiftUtcDays(todayDate, -1))

  if (datePreset === 'last_7d') {
    return {
      mode: 'time_range',
      since: formatUtcDate(shiftUtcDays(todayDate, -7)),
      until: yesterday,
    }
  }

  if (datePreset === 'last_14d') {
    return {
      mode: 'time_range',
      since: formatUtcDate(shiftUtcDays(todayDate, -14)),
      until: yesterday,
    }
  }

  if (datePreset === 'last_30d') {
    return {
      mode: 'time_range',
      since: formatUtcDate(shiftUtcDays(todayDate, -30)),
      until: yesterday,
    }
  }

  if (datePreset === 'this_month') {
    const firstOfMonth = createUtcDateFromParts({ year: todayParts.year, month: todayParts.month, day: 1 })
    return {
      mode: 'time_range',
      since: formatUtcDate(firstOfMonth),
      until: formatUtcDate(todayDate),
    }
  }

  return {
    mode: 'date_preset',
    datePreset,
  }
}

export function buildMetaInsightsFilterExpression(datePreset, since, until) {
  const resolvedDateSelection = resolveMetaDateSelection(datePreset, since, until)

  if (resolvedDateSelection.mode === 'time_range') {
    return `insights.time_range({"since":"${resolvedDateSelection.since}","until":"${resolvedDateSelection.until}"})`
  }

  return `insights.date_preset(${resolvedDateSelection.datePreset})`
}
