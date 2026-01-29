import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants"

const SAMPLE_WATCHLIST_DATA = [
  {
    company: "Apple Inc.",
    symbol: "AAPL",
    price: "$189.95",
    change: "+2.34%",
    marketCap: "$2.97T",
    peRatio: "32.5",
    alert: "—",
    action: "—",
  },
  {
    company: "Microsoft Corporation",
    symbol: "MSFT",
    price: "$378.91",
    change: "+1.65%",
    marketCap: "$2.81T",
    peRatio: "35.2",
    alert: "—",
    action: "—",
  },
  {
    company: "Google/Alphabet",
    symbol: "GOOGL",
    price: "$140.23",
    change: "+0.98%",
    marketCap: "$1.83T",
    peRatio: "25.4",
    alert: "—",
    action: "—",
  },
  {
    company: "Tesla Inc.",
    symbol: "TSLA",
    price: "$242.84",
    change: "-1.23%",
    marketCap: "$768.9B",
    peRatio: "67.8",
    alert: "—",
    action: "—",
  },
  {
    company: "Amazon.com Inc.",
    symbol: "AMZN",
    price: "$185.47",
    change: "+3.12%",
    marketCap: "$1.92T",
    peRatio: "58.3",
    alert: "—",
    action: "—",
  },
]

export default function WatchlistTable() {
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
        {SAMPLE_WATCHLIST_DATA.map((row, idx) => (
          <TableRow key={idx} className="table-row">
            <TableCell className="table-cell">{row.company}</TableCell>
            <TableCell className="table-cell">{row.symbol}</TableCell>
            <TableCell className="table-cell">{row.price}</TableCell>
            <TableCell className="table-cell">{row.change}</TableCell>
            <TableCell className="table-cell">{row.marketCap}</TableCell>
            <TableCell className="table-cell">{row.peRatio}</TableCell>
            <TableCell className="table-cell">{row.alert}</TableCell>
            <TableCell className="table-cell">{row.action}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
