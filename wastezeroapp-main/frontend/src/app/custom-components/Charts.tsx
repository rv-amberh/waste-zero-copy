import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const barData = [
  { month: "Jan", donations: 30 },
  { month: "Feb", donations: 45 },
  { month: "Mar", donations: 25 },
  { month: "Apr", donations: 60 },
];

const countyData = [
  { name: "Oakland", value: 65 },
  { name: "San Francisco", value: 45 },
];

const COLORS = ["#593241", "#A9CBAE", "#64748B", "#E2E8F0"];

const Charts = () => {
  return (
    <div className="flex flex-row gap-6  items-center justify-center p-2">
      {/* Bar Chart */}
      <div className="w-1/2  flex-col flex justify-center">
        <h2 className="text-xs text-[#32594A] text-center font-semibold mb-1">
          Donations Per Month
        </h2>
        <ResponsiveContainer className="" width="100%" height={150}>
          <BarChart data={barData} className="relative right-4 mt-4 bottom-2">
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 8 }} />
            <Tooltip />
            <Bar dataKey="donations" fill="#A9CBAE" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="w-1/2  flex-col flex justify-center">
        <h2 className="text-xs  text-[#32594A] font-semibold mb-1">
          Food Saved by County
        </h2>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={countyData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={50}
            >
              {countyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
