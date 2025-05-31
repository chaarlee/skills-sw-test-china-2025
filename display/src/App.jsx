import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import "/node_modules/flag-icons/css/flag-icons.min.css";

const competitors = [
  { name: "John Doe", country: "US", host: "http://localhost:2345/api/" },
  { name: "Jin Jang", country: "CN", host: "http://localhost:2346/api/" },
  { name: "Gipsz Jakab", country: "HU", host: "http://localhost:8080/api/" },
];

function App() {
  const [coverage, setCoverage] = useState({});

  useEffect(() => {
    // get coverage in every seconds
    setInterval(() => {
      competitors.forEach((competitor) => {
        fetch(competitor.host + "coverage")
          .then((response) => response.json())
          .then((data) => {
            setCoverage((prevCoverage) => ({
              ...prevCoverage,
              [competitor.name]: data,
            }));
            console.log(`Coverage for ${competitor.name}:`, data);
          })
          .catch((error) => {
            console.error(
              `Error fetching coverage for ${competitor.name}:`,
              error
            );
          });
      });
    }, 1000);
  }, []);

  return (
    <>
      <div className="w-full h-screen bg-yellow flex flex-col gap-4 p-4">
        {competitors.map((competitor) => (
          <div
            key={competitor.name}
            className="flex justify-between gap-0.5 w-full h-full items-center"
          >
            <div className="flex gap-2 flex-col items-center w-40">
              <span
                className={`fi fi-${competitor.country.toLowerCase()} scale-300`}
              />
              <span className="p-4 text-xl font-bold text-center">
                {competitor.name}
              </span>
            </div>
            {coverage[competitor.name]?.testCases.total.map((testCase) => (
              <div
                title={testCase}
                className={twMerge(
                  "flex gap-1 justify-between grow h-full",
                  coverage[competitor.name]?.covered.includes(testCase)
                    ? "bg-green-400"
                    : "bg-gray-200"
                )}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
