import { getCompanyForUser, getChangeOrders, getJobs } from "@/lib/db"
import { ChangeOrdersClient } from "./change-orders-client"

export default async function ChangeOrdersPage() {
  const company = await getCompanyForUser()
  const [changeOrders, jobs] = company
    ? await Promise.all([getChangeOrders(company.id), getJobs(company.id)])
    : [[], []]

  return <ChangeOrdersClient changeOrders={changeOrders} jobs={jobs} />
}
