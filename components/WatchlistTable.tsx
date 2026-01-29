"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants"

interface WatchlistTableProps {
  data: StockWithData[]
}

export default function WatchlistTable({ data }: WatchlistTableProps) {
  const router = useRouter();

  const getChangeClassName = (changeFormatted?: string): string => {
    if (!changeFormatted || changeFormatted === '—') return 'table-cell';
    return changeFormatted.startsWith('+') ? 'table-cell change-positive' : 'table-cell change-negative';
  };

  const handleRowClick = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
  };

  return (
    <Table className="watchlist-table">
      <TableHeader>
        <TableRow className="table-header-row">
          {WATCHLIST_TABLE_HEADER.map((header) => (
            <TableHead key={header} className="table-header">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow 
            key={idx} 
            className="table-row"
            onClick={() => handleRowClick(row.symbol)}
          >
            <TableCell className="table-cell">{row.company}</TableCell>
            <TableCell className="table-cell">{row.symbol}</TableCell>
            <TableCell className="table-cell">{row.priceFormatted}</TableCell>
            <TableCell className={getChangeClassName(row.changeFormatted)}>{row.changeFormatted}</TableCell>
            <TableCell className="table-cell">{row.marketCap}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
