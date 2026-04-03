import { getCompanyForUser, getCustomers } from "@/lib/db"
import { CustomersClient } from "./customers-client"

export default async function CustomersPage() {
  const company = await getCompanyForUser()
  const customers = company ? await getCustomers(company.id) : []

  return <CustomersClient customers={customers} />
}
