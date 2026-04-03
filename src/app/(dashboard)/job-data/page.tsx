import { redirect } from 'next/navigation'
import {
  getCompanyForUser,
  getAppConfig,
  getReportingPeriods,
  getJobs,
  getJobDataEntriesForPeriod,
} from '@/lib/db'
import { getMetricsForPeriodLive } from '@/lib/db-reports'
import { JobDataClient } from './job-data-client'

export default async function JobDataPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const company = await getCompanyForUser()
  if (!company) redirect('/login')

  const [config, reportingPeriods, searchParams] = await Promise.all([
    getAppConfig(company.id),
    getReportingPeriods(company.id),
    props.searchParams,
  ])

  const periodParam = typeof searchParams.period === 'string' ? searchParams.period : undefined
  const currentPeriod = periodParam ?? config.currentPeriod

  const periods = reportingPeriods.map((rp) => rp.period_date)
  if (!periods.includes(currentPeriod)) {
    periods.unshift(currentPeriod)
  }

  const [entries, jobs, metrics] = await Promise.all([
    getJobDataEntriesForPeriod(company.id, currentPeriod),
    getJobs(company.id),
    getMetricsForPeriodLive(company.id, currentPeriod),
  ])

  return (
    <JobDataClient
      entries={entries}
      jobs={jobs}
      metrics={metrics}
      periods={periods}
      currentPeriod={currentPeriod}
      companyName={config.companyName}
    />
  )
}
