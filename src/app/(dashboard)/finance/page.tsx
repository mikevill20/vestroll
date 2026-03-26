"use client";
import { motion } from "framer-motion";

import { useState } from "react";
import { MOCK_ASSETS, generateMockTransactions } from "@/lib/mock-data";
import { BalanceSection } from "@/components/features/finance/balance-section";
import { AssetsGrid } from "@/components/features/finance/assets-grid";
import Table from "@/components/shared/table/Table";
import { TableColumn } from "@/components/shared/table/TableHeader";
import { Transaction } from "@/types/finance.types";
import { UsdtIcon } from "@/../public/svg";

const mockTransactions = generateMockTransactions(80);

const transactionColumns: TableColumn[] = [
  { key: "id", header: "Transaction ID" },
  { key: "description", header: "Description" },
  { key: "amount", header: "Amount", align: "center" },
  { key: "asset", header: "Asset", align: "center" },
  { key: "status", header: "Status", align: "center" },
  { key: "timestamp", header: "Timestamp", align: "right" },
];

export default function FinancePage() {
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredTransactions = mockTransactions.filter((tx) =>
    [tx.id, tx.description, tx.amount, tx.status]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(search.toLowerCase())),
  );

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "Pending":
        return "border-[#E79A23] bg-[#FEF7EB] text-[#E79A23]";
      case "Failed":
        return "border-[#C64242] bg-[#FEECEC] text-[#C64242]";
      case "Successful":
        return "border-[#26902B] bg-[#EDFEEC] text-[#26902B]";
      default:
        return "";
    }
  };

  const renderTransactionCell = (item: Transaction, column: TableColumn) => {
    switch (column.key) {
      case "id":
        return (
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {item.id}
          </p>
        );
      case "description":
        return (
          <div className="text-text-header font-medium dark:text-white">
            {item.description}
          </div>
        );
      case "amount":
        return (
          <div className="text-text-header font-semibold dark:text-white">
            {item.amount}
          </div>
        );
      case "asset":
        return (
          <div className="flex items-center font-medium gap-1 py-1.5 px-3 border border-border-primary bg-fill-background rounded-full w-fit mx-auto dark:border-gray-700 dark:bg-gray-800">
            <UsdtIcon />
            <span className="text-text-header dark:text-white">
              {item.asset}
            </span>
          </div>
        );
      case "status":
        return (
          <span
            className={`px-2 py-1 rounded-full text-sm font-semibold border ${getStatusBadge(item.status)}`}
          >
            {item.status}
          </span>
        );
      case "timestamp":
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {item.timestamp}
          </span>
        );
      default:
        return (item[column.key as keyof Transaction] as React.ReactNode) || "-";
    }
  };

  const renderMobileCell = (item: Transaction) => (
    <div className="flex gap-4 justify-between">
      <div className="space-y-2 flex-1 min-w-0">
        <p className="truncate font-semibold text-gray-500 dark:text-gray-400">
          {item.id}
        </p>
        <span className="flex items-center gap-2">
          <p className="text-xs font-medium text-gray-300 dark:text-gray-500">
            {item.amount}
          </p>
          <div className="w-px self-stretch bg-gray-150 dark:bg-gray-700" />
          <div className="flex items-center font-medium gap-1">
            <UsdtIcon />
            <span className="text-gray-600 text-sm font-medium dark:text-gray-400">
              {item.asset}
            </span>
          </div>
        </span>
      </div>
      <div className="space-y-2 shrink-0 flex flex-col items-end justify-between">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.status)}`}
        >
          {item.status}
        </span>
        <p className="text-xs font-medium text-gray-400">{item.timestamp}</p>
      </div>
    </div>
  );

  const handleSelectItem = (id: string, checked: boolean) =>
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );

  const handleSelectAll = (checked: boolean) =>
    setSelectedItems(
      checked ? filteredTransactions.map((_, i) => String(i)) : [],
    );

  const showModal = () => console.log("Show filter modal");

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <header className="flex sm:flex-row items-center justify-between px-6 sm:pt-6 pb-1 space-y-1 sm:space-y-2 bg-white sm:border-b sm:border-[#DCE0E5] sm:pb-5 dark:bg-gray-900 dark:border-gray-800">
            <div>
              <p className="text-xs text-[#7F8C9F] font-medium leading-[120%] tracking-[0%] dark:text-gray-400">
                Overview
              </p>
              <h1 className="font-bold text-2xl sm:font-semibold sm:text-[1.75rem] text-text-header dark:text-gray-100">
                Finance
              </h1>
            </div>
          </header>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-4"
        >
          {/* Balance Section */}
          <div className="flex flex-col md:flex-row w-full gap-4 md:gap-6 mb-2">
            <BalanceSection balance="$5,050.00" change="-0.0051% ($0.99)" />
            <BalanceSection balance="$5,050.00" change="-0.0051% ($0.99)" />
          </div>

          {/* Assets Grid */}
          <AssetsGrid assets={MOCK_ASSETS} />

          {/* Transactions Table */}
          <div className="mt-6">
            <Table
              data={filteredTransactions}
              columns={transactionColumns}
              search={search}
              setSearch={setSearch}
              showModal={showModal}
              selectedTab="Transactions"
              searchPlaceholder="Search transactions..."
              showSearch={false}
              seeAllHref="/app/finance/transactions"
              selectedItems={selectedItems}
              onSelectItem={handleSelectItem}
              onSelectAll={handleSelectAll}
              renderCell={renderTransactionCell}
              renderMobileCell={renderMobileCell}
              showPagination={true}
              itemsPerPage={10}
              showResultsPerPage={true}
              emptyTitle={
                search ? "No transactions found" : "No transactions yet"
              }
              emptyDescription={
                search
                  ? `No transactions match "${search}". Try adjusting your search.`
                  : "Your transactions will appear here"
              }
              getItemId={(item) => item.id}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
