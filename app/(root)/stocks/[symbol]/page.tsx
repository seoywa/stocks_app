import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import { BASELINE_WIDGET_CONFIG, CANDLE_CHART_WIDGET_CONFIG, COMPANY_FINANCIALS_WIDGET_CONFIG, COMPANY_PROFILE_WIDGET_CONFIG, SYMBOL_INFO_WIDGET_CONFIG, TECHNICAL_ANALYSIS_WIDGET_CONFIG } from "@/lib/constants";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import React from "react";

const StockDetails = async ({ params }: StockDetailsPageProps) => {
  const { symbol } = await params;
  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

  // Get session and check if stock is in watchlist
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  let isInWatchlist = false;

  if (session?.user?.email) {
    const watchlistSymbols = await getWatchlistSymbolsByEmail(session.user.email);
    isInWatchlist = watchlistSymbols.includes(symbol.toUpperCase());
  }

  return (
    <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* LEFT SIDE */}
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={170}
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            height={600}
            className="custom-chart"
          />
          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            height={600}
            className="custom-chart"
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <WatchlistButton symbol={symbol.toUpperCase()} company={symbol.toUpperCase()} isInWatchlist={isInWatchlist}/>
          </div>

          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={464}
          />

        </div>
      </section>
    </div>
  );
};

export default StockDetails;
