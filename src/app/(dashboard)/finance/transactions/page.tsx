"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportIcon, UsdtIcon } from "../../../../../../public/svg";
import Table from "@/components/shared/table/Table";
import { TableColumn } from "@/components/shared/table/TableHeader";
import { Transaction } from "@/types/finance.types";
import { generateMockTransactions } from "@/lib/mock-data";

const mockTransactions = generateMockTransactions(80);

const transactionColumns: TableColumn[] = [
  { key: "id", header: "Transaction ID" },
  { key: "description", header: "Description" },
  { key: "amount", header: "Amount", align: "center" },
  { key: "asset", header: "Asset", align: "center" },
  { key: "status", header: "Status", align: "center" },
  { key: "timestamp", header: "Timestamp", align: "right" },
];

export default function TransactionsPage() {
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
        return item[column.key] || "-";
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
    <div>
      <div>
        <header className="flex sm:flex-row items-center justify-between px-6 sm:pt-6 pb-1 space-y-1 sm:space-y-2 bg-white sm:border-b sm:border-[#DCE0E5] sm:pb-5 dark:bg-gray-900 dark:border-gray-800">
          <div>
            <p className="text-xs text-[#7F8C9F] font-medium leading-[120%] tracking-[0%] dark:text-gray-400">
              Overview
            </p>
            <h1 className="font-bold text-2xl sm:font-semibold sm:text-[1.75rem] text-text-header dark:text-gray-100">
              Transactions
            </h1>
          </div>
          <Button className="inline-flex items-center justify-center px-4 py-2 h-12 ml-auto md:py-2 bg-[#5E2A8C] text-white font-medium rounded-full hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#5E2A8C] focus:ring-offset-2 transition-colors duration-200 gap-2 whitespace-nowrap dark:bg-purple-600 dark:hover:bg-purple-700">
            <ExportIcon />
            Export
            <div>
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.16125 12.0843L5.84792 10.771L3.70792 8.63096C3.26125 8.17763 3.58125 7.4043 4.22125 7.4043H8.37459L12.1146 7.4043C12.7546 7.4043 13.0746 8.17763 12.6213 8.63096L9.16792 12.0843C8.62125 12.6376 7.71459 12.6376 7.16125 12.0843Z"
                  fill="white"
                />
              </svg>
            </div>
          </Button>
        </header>
      </div>

      <div className="p-4">
        <Table
          data={filteredTransactions}
          columns={transactionColumns}
          search={search}
          setSearch={setSearch}
          showModal={showModal}
          selectedTab="History"
          searchPlaceholder="Search by description..."
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
              : "Your transactions will be displayed here"
          }
          getItemId={(item) => item.id}
        />
      </div>
    </div>
  );
}
