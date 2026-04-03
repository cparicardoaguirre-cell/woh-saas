"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Props ───────────────────────────────────────────────────────────────────

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  searchColumn?: string
  toolbar?: React.ReactNode
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchColumn,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pageSize, setPageSize] = React.useState(25)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter: searchColumn ? undefined : globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: searchColumn ? undefined : setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  // Keep page size in sync
  React.useEffect(() => {
    table.setPageSize(pageSize)
  }, [pageSize, table])

  // Determine the search value and handler based on mode
  const searchValue = searchColumn
    ? (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
    : globalFilter

  const handleSearchChange = React.useCallback(
    (value: string) => {
      if (searchColumn) {
        table.getColumn(searchColumn)?.setFilterValue(value)
      } else {
        setGlobalFilter(value)
      }
    },
    [searchColumn, table]
  )

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalRows = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-4">
      {/* Toolbar: search + actions */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground transition-colors -ml-1 px-1 py-0.5 rounded"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="size-3.5 text-foreground" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="size-3.5 text-foreground" />
                        ) : (
                          <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: row count + pagination */}
      <div className="flex items-center justify-between gap-4">
        {/* Row count */}
        <div className="text-sm text-muted-foreground">
          {totalRows} row{totalRows !== 1 ? "s" : ""} total
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-4">
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => setPageSize(Number(val))}
            >
              <SelectTrigger className="w-[70px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page indicator */}
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount || 1}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <span className="text-xs font-medium">1</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <span className="text-xs font-medium">{pageCount || 1}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
