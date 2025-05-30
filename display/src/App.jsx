import { useEffect, useState } from "react";
import "./App.css";
import "/node_modules/flag-icons/css/flag-icons.min.css";

const competitors = [
  { name: "Competitor A", country: "HU", host: "http://localhost:2345/api/" },
  { name: "Competitor B", country: "CN", host: "http://localhost:2346/api/" },
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
              [competitor.name]: data.value.total,
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
      <div>
        {competitors.map((competitor) => (
          <div key={competitor.name}>
            <span className={`fi fi-${competitor.country.toLowerCase()}`} />
            <span>{competitor.name}</span>
            <span> - </span>
            <span>{coverage[competitor.name] || "Loading..."}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
