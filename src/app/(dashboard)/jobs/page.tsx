import { getCompanyForUser, getJobs, getCustomers, getMunicipalities } from "@/lib/db"
import { redirect } from "next/navigation"
import { JobsClient } from "./jobs-client"

export default async function JobsPage() {
  const company = await getCompanyForUser()
  if (!company) redirect("/login")

  const [jobs, customers, municipalities] = await Promise.all([
    getJobs(company.id),
    getCustomers(company.id),
    getMunicipalities(),
  ])

  return (
    <JobsClient
      jobs={jobs}
      customers={customers}
      municipalities={municipalities}
    />
  )
}
