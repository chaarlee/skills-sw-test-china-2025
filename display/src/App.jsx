import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import "/node_modules/flag-icons/css/flag-icons.min.css";

import competitors from "../competitors";

function App() {
  const [coverage, setCoverage] = useState({});

  useEffect(() => {
    // get coverage in every seconds
    setInterval(() => {
      competitors.forEach((competitor) => {
        fetch(competitor.host + "coverage?pwd=123")
          .then((response) => response.json())
          .then((data) => {
            setCoverage((prevCoverage) => ({
              ...prevCoverage,
              [competitor.name]: data,
            }));
            // console.log(`Coverage for ${competitor.name}:`, data);
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
      <div className="w-full h-screen bg-gray-100 flex flex-col gap-2 p-2">
        {competitors.map((competitor) => (
          <div
            key={competitor.name}
            className="flex justify-between gap-0.5 w-full h-full items-center border-2 border-gray-400 p-2 rounded-lg shadow-lg bg-gray-100"
          >
            <div className="flex gap-2 flex-col items-center w-48 h-full justify-center">
              <div className="h-10 flex items-center">
                <span
                  className={`fi fi-${competitor.iso.toLowerCase()} scale-200`}
                />
              </div>
              <span className="text-xs uppercase">{competitor.country}</span>
              <span className="text-lg font-bold text-center uppercase">
                {competitor.name}
              </span>
            </div>
            {coverage[competitor.name]?.testCases.total.map((testCase) => (
              <div
                key={`tc-${competitor.name}-${testCase}`}
                title={testCase}
                className={twMerge(
                  "flex gap-1 justify-between grow h-full",
                  "cursor-pointer",
                  "animate duration-2000",
                  coverage[competitor.name]?.covered.includes(testCase)
                    ? "bg-green-400"
                    : "bg-gray-300"
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
